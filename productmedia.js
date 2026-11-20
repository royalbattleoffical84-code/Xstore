// ============================================================
// Product photos + files helpers
// ============================================================
// A product can have SEVERAL delivery files and SEVERAL photos.
//   files: [{ id, name, size }]   (plus fileIds[] / fileId kept for older code + old products)
//   imageFileIds: [file_id | url] (plus imageFileId = first)
// Old products that only have `fileId` / `imageUrl` keep working everywhere.

function productFiles(p) {
  if (!p) return [];
  if (Array.isArray(p.files) && p.files.length) return p.files.filter(f => f && f.id).map(f => ({ id: f.id, name: f.name || '', size: f.size || 0 }));
  if (Array.isArray(p.fileIds) && p.fileIds.length) return p.fileIds.filter(Boolean).map(id => ({ id, name: '', size: 0 }));
  if (p.fileId) return [{ id: p.fileId, name: '', size: 0 }];
  return [];
}

function productImages(p) {
  if (!p) return [];
  if (Array.isArray(p.imageFileIds) && p.imageFileIds.length) return p.imageFileIds.filter(Boolean);
  if (Array.isArray(p.imageUrls) && p.imageUrls.length) return p.imageUrls.filter(Boolean);
  if (p.imageFileId) return [p.imageFileId];
  if (p.imageUrl) return [p.imageUrl];
  return [];
}

// fields to store so every reader (old and new) sees the same files
const fileFields = (files) => ({ files, fileIds: files.map(f => f.id), fileId: files[0] ? files[0].id : '' });
const imageFields = (images) => ({ imageFileIds: images.length ? images : null, imageFileId: images[0] || null, imageUrls: null, imageUrl: '' });

const hasDelivery = (p) => !!(p && ((p.deliveryType === 'file' && productFiles(p).length > 0) || (p.deliveryType === 'link' && p.deliveryLink)));

// Sends every file of a product, caption on the first one.
// sender(fileId, extra) -> Promise
async function sendFiles(sender, p, caption) {
  const files = productFiles(p);
  for (let i = 0; i < files.length; i++) {
    await sender(files[i].id, i === 0 && caption ? { caption } : {});
  }
  return files.length;
}

module.exports = { productFiles, productImages, fileFields, imageFields, hasDelivery, sendFiles };
