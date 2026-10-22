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
//   Firebase RTDB FIREBASE_DB_URL  +  FIREBASE_SERVICE_ACCOUNT (service-account JSON, recommended)
//                                 or FIREBASE_DB_SECRET (legacy database secret)
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
const TABLE = 'bot_kv';   // Supabase table name
// Firebase: data lives under this node. Make it a long RANDOM string (FIREBASE_DB_PATH) when you
// connect without a secret/service account — see the rules in the setup notes.
const FB_NODE = (process.env.FIREBASE_DB_PATH || 'bot_kv').trim().replace(/^\/+|\/+$/g, '');
const ME = crypto.randomBytes(6).toString('hex');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ---------------- Firebase service-account login (no extra npm package) ----------------
function loadServiceAccount(raw) {
  if (!raw || !String(raw).trim()) return null;
  let txt = String(raw).trim();
  try { return validateSA(JSON.parse(txt)); } catch (e) { /* maybe base64 */ }
  try { return validateSA(JSON.parse(Buffer.from(txt, 'base64').toString('utf8'))); } catch (e) {}
  console.error('⚠️ [storage] FIREBASE_SERVICE_ACCOUNT is not valid JSON (paste the whole downloaded .json file content).');
  return null;
}
function validateSA(o) {
  if (!o || !o.client_email || !o.private_key) throw new Error('bad service account');
  return o;
}
const b64u = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
async function fetchAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const unsigned = b64u({ alg: 'RS256', typ: 'JWT' }) + '.' + b64u({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: tokenUri, iat: now, exp: now + 3600
  });
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const body = 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(unsigned + '.' + sig);
  const r = await axios.post(tokenUri, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 });
  return { token: r.data.access_token, exp: Date.now() + (r.data.expires_in || 3600) * 1000 };
}

// ---- Firebase auth: service account (recommended) or legacy database secret ----
const b64url = (x) => Buffer.from(x).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
function loadServiceAccount() {
  let raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '';
  try {
    if (!raw && b64) raw = Buffer.from(b64.trim(), 'base64').toString('utf8');
    if (!raw) return null;
    const sa = JSON.parse(raw.trim());
    if (!sa.client_email || !sa.private_key) throw new Error('missing client_email / private_key');
    sa.private_key = String(sa.private_key).replace(/\\n/g, '\n');
    return sa;
  } catch (e) {
    console.error('💾 [storage] FIREBASE_SERVICE_ACCOUNT is not valid JSON:', e.message);
    return null;
  }
}

function makeFirebaseAuth(secret) {
  const sa = loadServiceAccount();
  if (!sa) return async () => (secret ? { auth: secret } : {});
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  let token = null, exp = 0, inflight = null;
  async function refresh() {
    const now = Math.floor(Date.now() / 1000);
    const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = b64url(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
      aud: tokenUri, iat: now, exp: now + 3600
    }));
    const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claim}`).sign(sa.private_key);
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${head}.${claim}.${b64url(sig)}`
    }).toString();
    const r = await axios.post(tokenUri, body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 });
    token = r.data.access_token;
    exp = Date.now() + (r.data.expires_in || 3600) * 1000;
  }
  return async () => {
    if (!token || Date.now() > exp - 120000) {
      inflight = inflight || refresh().finally(() => { inflight = null; });
      await inflight;
    }
    return { access_token: token };
  };
}

// ---------------- provider adapters ----------------
function makeRemote() {
  const want = (process.env.STORAGE_PROVIDER || '').toLowerCase();
  // accept "https://xxxx.supabase.co", ".../rest/v1" or ".../rest/v1/" — all work
  const sbUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '').replace(/\/+$/, '');
  const sbKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '').trim();
  const fbUrl = (process.env.FIREBASE_DB_URL || '').replace(/\/+$/, '');
  const fbSecret = process.env.FIREBASE_DB_SECRET || '';

  if ((want === 'supabase' || !want) && sbUrl && sbKey) {
    // Legacy JWT keys (eyJ...) go in both headers; new-style keys (sb_secret_...) only in `apikey`.
    const headers = { apikey: sbKey, 'Content-Type': 'application/json' };
    if (sbKey.startsWith('eyJ')) headers.Authorization = `Bearer ${sbKey}`;
    if (sbKey.startsWith('sb_publishable_')) console.warn('⚠️ [storage] SUPABASE key is a PUBLISHABLE (public) key — it cannot write to a protected table. Use the SECRET key (sb_secret_...) or the legacy service_role key.');
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
    const auth = makeFirebaseAuth(fbSecret);
    if (!fbSecret && !process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT_B64 && FB_NODE === 'bot_kv') {
      console.warn('⚠️ [storage] Firebase without a secret/service account and with the DEFAULT path "bot_kv" is guessable. Set FIREBASE_DB_PATH to a long random string and lock the rules to that path only.');
    }
    return {
      name: 'Firebase RTDB',
      async get(key) {
        const r = await axios.get(`${fbUrl}/${FB_NODE}/${key}.json`, { params: await auth(), timeout: 20000 });
        return typeof r.data === 'string' ? r.data : null;
      },
      async set(key, value) {
        // store the JSON text as a JSON *string* so arrays/empty objects survive exactly
        await axios.put(`${fbUrl}/${FB_NODE}/${key}.json`, JSON.stringify(value), {
          params: await auth(), headers: { 'Content-Type': 'application/json' }, timeout: 30000, maxBodyLength: Infinity
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

function safeErrorDetail(error) {
  // Axios errors may have a response object without a data body. Never let
  // error reporting throw and hide the original Firebase/network failure.
  if (!error) return 'Unknown error';
  const response = error.response;
  if (response) {
    let body = '';
    try {
      const data = response.data;
      if (data == null) body = '';
      else if (typeof data === 'string') body = data;
      else body = JSON.stringify(data) || '';
    } catch (_) {
      body = '[response body could not be serialized]';
    }
    return `${response.status || 'HTTP error'}${body ? ` ${body.slice(0, 200)}` : ''}`;
  }
  return error.message || String(error);
}

async function retry(fn, label) {
  let last;
  for (let i = 0; i < CFG.initRetries; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      console.error(`💾 [storage] ${label} failed (try ${i + 1}/${CFG.initRetries}):`, safeErrorDetail(e));
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
