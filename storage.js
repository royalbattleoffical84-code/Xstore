// ============================================================
// PERSISTENT STORAGE  —  keeps your data safe across Render deploys
// ============================================================
// Render's disk is EPHEMERAL: every deploy / restart / free-plan sleep wipes
// ./data. This module keeps localdb.js working exactly as before (fast local
// JSON files) but mirrors every change to an external database and restores it
// on startup, so products, orders, users and wallets survive.
//
// Pick ONE (set the env vars on Render):
//   Supabase      SUPABASE_URL  +  SUPABASE_SERVICE_KEY   (service_role key)
//   Firebase RTDB FIREBASE_DB_URL  (+ FIREBASE_DB_SECRET)
// Nothing set => data stays local only (and a warning is shown).
//
// Safety design:
//  * Every collection is stored as one JSON *string* (exact round-trip).
//  * On startup we fully RESTORE before the bot/API start serving.
//  * A tiny lock (+heartbeat) makes the OLD instance flush its last writes and
//    stand down before the NEW instance loads data — so a redeploy can never
//    overwrite newer data with older data (and it ends the "409 Conflict").
//  * If the database is configured but unreachable at boot we REFUSE to start
//    (Render retries) rather than run on empty data and overwrite your backup.

const axios = require('axios');
const crypto = require('crypto');

const num = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);
const CFG = {
  heartbeatMs: num(process.env.STORAGE_HEARTBEAT_MS, 4000),
  hbFreshMs: num(process.env.STORAGE_HB_FRESH_MS, 20000),
  releaseWaitMs: num(process.env.STORAGE_RELEASE_WAIT_MS, 25000),
  debounceMs: num(process.env.STORAGE_DEBOUNCE_MS, 1000),
  initRetries: num(process.env.STORAGE_INIT_RETRIES, 6),
  initRetryDelayMs: num(process.env.STORAGE_INIT_RETRY_DELAY_MS, 3000)
};
const TABLE = 'bot_kv';
const ME = crypto.randomBytes(6).toString('hex');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ---------------- provider adapters ----------------
function makeRemote() {
  const want = (process.env.STORAGE_PROVIDER || '').toLowerCase();
  const sbUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
  const fbUrl = (process.env.FIREBASE_DB_URL || '').replace(/\/+$/, '');
  const fbSecret = process.env.FIREBASE_DB_SECRET || '';

  if ((want === 'supabase' || !want) && sbUrl && sbKey) {
    const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json' };
    return {
      name: 'Supabase',
      async get(key) {
        const r = await axios.get(`${sbUrl}/rest/v1/${TABLE}`, { headers, params: { key: `eq.${key}`, select: 'value' }, timeout: 20000 });
        return Array.isArray(r.data) && r.data.length ? r.data[0].value : null;
      },
      async set(key, value) {
        await axios.post(`${sbUrl}/rest/v1/${TABLE}`, { key, value }, {
          headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
          params: { on_conflict: 'key' }, timeout: 30000, maxBodyLength: Infinity
        });
      }
    };
  }

  if ((want === 'firebase' || !want) && fbUrl) {
    const params = fbSecret ? { auth: fbSecret } : {};
    return {
      name: 'Firebase RTDB',
      async get(key) {
        const r = await axios.get(`${fbUrl}/${TABLE}/${key}.json`, { params, timeout: 20000 });
        return typeof r.data === 'string' ? r.data : null;
      },
      async set(key, value) {
        // store the JSON text as a JSON *string* so arrays/empty objects survive exactly
        await axios.put(`${fbUrl}/${TABLE}/${key}.json`, JSON.stringify(value), {
          params, headers: { 'Content-Type': 'application/json' }, timeout: 30000, maxBodyLength: Infinity
        });
      }
    };
  }
  return null;
}

// ---------------- state ----------------
const remote = makeRemote();
let hooks = null;
let enabled = false;
let frozen = false;           // true once another instance has taken over
const dirty = new Set();
let timer = null, pushing = false, failures = 0;
let lastPushAt = 0, lastError = '', hbTimer = null;

const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const log = (...a) => console.log('💾 [storage]', ...a);

async function retry(fn, label) {
  let last;
  for (let i = 0; i < CFG.initRetries; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      console.error(`💾 [storage] ${label} failed (try ${i + 1}/${CFG.initRetries}):`, e.response ? `${e.response.status} ${JSON.stringify(e.response.data).slice(0, 200)}` : e.message);
      if (i < CFG.initRetries - 1) await wait(CFG.initRetryDelayMs);
    }
  }
  throw last;
}

// ---------------- pushing local -> remote ----------------
function notifyWrite(key) {
  if (!enabled || frozen) return;
  dirty.add(key);
  schedule(CFG.debounceMs);
}

function schedule(delay) {
  if (timer || frozen) return;
  timer = setTimeout(() => { timer = null; runPush().catch(() => {}); }, delay);
}

async function runPush() {
  if (pushing || !enabled) return;
  pushing = true;
  let failed = false;
  try {
    for (const key of [...dirty]) {
      if (frozen) break;
      const raw = hooks.readLocalRaw(key);
      dirty.delete(key);            // delete BEFORE sending: a write during the request re-marks it dirty
      if (raw == null) continue;
      try {
        await remote.set(key, raw);
        lastPushAt = Date.now(); lastError = '';
      } catch (e) {
        failed = true;
        dirty.add(key);
        lastError = e.response ? `${e.response.status}` : e.message;
        console.error(`💾 [storage] push of "${key}" failed:`, lastError);
      }
    }
  } finally { pushing = false; }
  if (failed) { failures++; schedule(Math.min(30000, 2000 * Math.pow(2, Math.min(failures, 4)))); }
  else { failures = 0; if (dirty.size) schedule(CFG.debounceMs); }
}

// push everything pending right now (used on shutdown / hand-over)
async function flush(timeoutMs = 10000) {
  if (!enabled) return true;
  if (timer) { clearTimeout(timer); timer = null; }
  const end = Date.now() + timeoutMs;
  while ((dirty.size || pushing) && Date.now() < end) {
    if (!pushing) { await runPush(); if (dirty.size) await wait(250); }
    else await wait(50);
  }
  return dirty.size === 0;
}

// ---------------- startup ----------------
async function init(opts) {
  hooks = opts;
  if (!remote) {
    console.warn('⚠️⚠️ [storage] NO external database configured — data is stored on Render\'s temporary disk and will be LOST on every deploy/restart. Set SUPABASE_URL + SUPABASE_SERVICE_KEY (or FIREBASE_DB_URL).');
    return { enabled: false };
  }
  log(`Using ${remote.name}. Instance ${ME}`);

  // 1) take the lock, remembering who held it
  const prevLock = parse(await retry(() => remote.get('_lock'), 'read lock'));
  const prevHb = parse(await retry(() => remote.get('_hb'), 'read heartbeat'));
  await retry(() => remote.set('_lock', JSON.stringify({ owner: ME, startedAt: Date.now() })), 'write lock');

  // 2) if a previous instance is alive, let it flush + stand down first
  if (prevLock && prevLock.owner && prevLock.owner !== ME && prevHb && prevHb.owner === prevLock.owner && Date.now() - prevHb.ts < CFG.hbFreshMs) {
    log(`Previous instance ${prevLock.owner} is alive — waiting for it to hand over...`);
    const end = Date.now() + CFG.releaseWaitMs;
    while (Date.now() < end) {
      let rel = null;
      try { rel = parse(await remote.get('_released')); } catch (e) {}
      if (rel && rel.owner === prevLock.owner) { log('Previous instance handed over.'); break; }
      await wait(700);
    }
  }

  // 3) restore every collection from the database (it is the source of truth)
  let restored = 0, seeded = 0;
  for (const key of hooks.keys) {
    const raw = await retry(() => remote.get(key), `restore ${key}`);
    if (raw != null) { hooks.writeLocalRaw(key, raw); restored++; }
    else if (hooks.readLocalRaw(key) != null) { dirty.add(key); seeded++; }   // first run: upload what we already have
  }
  enabled = true;
  log(`Restored ${restored} collection(s) from ${remote.name}${seeded ? `, uploading ${seeded} local one(s)` : ''}.`);
  // First run / migration: make sure what we already had locally is safely uploaded before we start serving
  if (dirty.size) await flush(20000);

  // 4) heartbeat: detect when a newer instance takes over
  hbTimer = setInterval(heartbeat, CFG.heartbeatMs);
  if (hbTimer.unref) hbTimer.unref();
  heartbeat();
  return { enabled: true, restored, seeded };
}

let beating = false;
async function heartbeat() {
  if (beating || frozen || !enabled) return;
  beating = true;
  try {
    const lock = parse(await remote.get('_lock'));
    if (lock && lock.owner && lock.owner !== ME) { await handOver(); return; }
    await remote.set('_hb', JSON.stringify({ owner: ME, ts: Date.now() }));
  } catch (e) { /* transient network error — try again next beat */ }
  finally { beating = false; }
}

// A newer instance (new deploy) took the lock: stop serving, push our last writes, tell it we're done.
async function handOver() {
  if (frozen) return;
  log('A newer instance took over — flushing last changes and standing down.');
  try { if (hooks.onReplaced) await hooks.onReplaced(); } catch (e) {}
  await wait(1500);                 // let in-flight handlers finish
  await flush(12000);
  frozen = true;
  if (hbTimer) clearInterval(hbTimer);
  try { await remote.set('_released', JSON.stringify({ owner: ME, at: Date.now() })); } catch (e) {}
  log('Handed over.');
}

// SIGTERM / SIGINT: push everything and release the lock so the next instance starts instantly
async function shutdown() {
  if (!enabled || frozen) return;
  try {
    await flush(12000);
    frozen = true;
    if (hbTimer) clearInterval(hbTimer);
    await remote.set('_released', JSON.stringify({ owner: ME, at: Date.now() }));
  } catch (e) { console.error('💾 [storage] shutdown flush failed:', e.message); }
}

function status() {
  return {
    enabled, provider: remote ? remote.name : null, instance: ME,
    pending: dirty.size, lastPushAt, lastError, replaced: frozen
  };
}

module.exports = { init, notifyWrite, flush, shutdown, status, ME };
