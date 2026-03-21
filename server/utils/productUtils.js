const fs = require('fs');
const path = require('path');

function normalizeImages(images) {
  if (Array.isArray(images)) {
    return images.map(String).map((image) => image.trim()).filter(Boolean);
  }

  if (typeof images === 'string') {
    return images.split(',').map((image) => image.trim()).filter(Boolean);
  }

  if (images) {
    return [String(images).trim()].filter(Boolean);
  }

  return [];
}

function buildProductPayload(body) {
  const title = String(body?.title || body?.title_vi || '').trim();
  const titleVi = String(body?.title_vi || body?.title || '').trim();
  const price = Number(body?.price);
  const oldPrice = body?.oldPrice === undefined || body?.oldPrice === null || body?.oldPrice === ''
    ? undefined
    : Number(body.oldPrice);

  if (!title || !titleVi) {
    return { error: 'ThiÃ¡ÂºÂ¿u thÃƒÂ´ng tin sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m' };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { error: 'GiÃƒÂ¡ sÃ¡ÂºÂ£n phÃ¡ÂºÂ©m khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡' };
  }

  if (oldPrice !== undefined && (!Number.isFinite(oldPrice) || oldPrice < 0)) {
    return { error: 'GiÃƒÂ¡ cÃ¡Â»Â§ khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡' };
  }

  return {
    payload: {
      title,
      title_vi: titleVi,
      price,
      oldPrice,
      currency: String(body?.currency || 'VND').trim() || 'VND',
      brand: String(body?.brand || '').trim(),
      description_vi: String(body?.description_vi || '').trim(),
      images: normalizeImages(body?.images),
      gender: ['male', 'female', 'unisex'].includes(body?.gender) ? body.gender : 'unisex'
    }
  };
}

function loadStaticProducts(baseDir) {
  try {
    const raw = fs.readFileSync(path.join(baseDir, 'static-products.json'), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('KhÃ´ng thá»ƒ load static-products.json', e && e.message);
    return [];
  }
}

module.exports = {
  normalizeImages,
  buildProductPayload,
  loadStaticProducts
};
