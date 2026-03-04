(function(){
  'use strict';
  const API_BASE = '/api'; // use API route prefix

  function $(id){ return document.getElementById(id); }

  function showMsg(text, isError){
    const m = $('formMsg');
    if(!m) return;
    m.textContent = text || '';
    m.style.color = isError ? '#b00' : '#070';
  }

  function parseImages(input){
    if(!input) return [];
    return String(input).split(',').map(s=>s.trim()).filter(Boolean);
  }

  // Basic HTML escape to avoid injecting raw values into templates
  function escapeHtml(str){
    if(!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  async function loadProducts(){
    const list = $('productList');
    if(!list) return;
    list.innerHTML = 'Đang tải...';
    try{
      const res = await fetch('/api/products');
      const j = await res.json();
      if(!res.ok || !j.success) throw new Error(j.message || 'Không thể lấy danh sách');
      const items = Array.isArray(j.data) ? j.data : [];
      list.innerHTML = items.map(p=>{
        const img = (p.images && p.images.length) ? p.images[0] : 'assets/images/shoes-1.png';
        const title = p.title_vi || p.title || p.name || '';
        const brand = p.brand || '';
        const id = p._id || p.id || '';
        return `<div style="border:1px solid #eee;padding:8px;border-radius:6px;text-align:center">
          <img src="${img}" style="width:100%;height:120px;object-fit:cover"/>
          <div style="margin-top:8px;font-weight:600">${title}</div>
          <div style="color:#666;font-size:0.9rem;margin-top:4px">${brand ? 'Thương hiệu: ' + escapeHtml(brand) : ''}</div>
          <button data-id="${id}" class="btn-delete" style="margin-top:8px;background:#b00;color:#fff;border:0;padding:6px 12px;border-radius:4px;cursor:pointer">Xóa</button>
        </div>`;
      }).join('') || '<div style="color:#666">Chưa có sản phẩm</div>';
      // Attach delete handlers
      list.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function(){
          const id = btn.getAttribute('data-id');
          if(!id) return;
          if(!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
          try{
            const resp = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            const j = await resp.json();
            if(!resp.ok || !j.success) throw new Error(j.message || 'Xóa thất bại');
            showMsg('Xóa sản phẩm thành công');
            await loadProducts();
          }catch(err){
            showMsg(err.message || 'Lỗi khi xóa sản phẩm', true);
          }
        });
      });
    }catch(err){
      console.error(err);
      list.innerHTML = '<div style="color:#b00">Không thể tải sản phẩm</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    const form = $('addProductForm');
    if(!form){ console.warn('admin.js: form #addProductForm not found'); return; }

    form.addEventListener('submit', async function(ev){
      ev.preventDefault();
      showMsg('');

      const name = $('name').value.trim();
      const priceVal = $('price').value;
      const price = priceVal !== '' ? Number(priceVal) : NaN;
      // stock and category removed from UI; use defaults on server if needed
      const description = $('description').value.trim();
      const images = parseImages($('images').value);
      const gender = $('gender').value || 'unisex';
      const brand = (document.getElementById('brand') && document.getElementById('brand').value) ? document.getElementById('brand').value.trim() : '';

      if(!name) return showMsg('Tên sản phẩm là bắt buộc', true);
      if(!Number.isFinite(price)) return showMsg('Giá không hợp lệ', true);

      // server expects title_vi + description_vi for localized fields
      const payload = { title_vi: name, price, description_vi: description, images, gender, brand };

      try{
        // If you want to protect this endpoint, the server checks header 'x-admin-key'
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        // In production set ADMIN_KEY and include this header in the request (or adjust auth strategy)
        if (window.ADMIN_KEY) headers['x-admin-key'] = window.ADMIN_KEY;

        const resp = await fetch(`${API_BASE}/products/add`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        // Defensive: if server returned HTML (content-type contains text/html) log body so we can debug.
        const ct = (resp.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('application/json')) {
          const text = await resp.text();
          console.error('Server returned non-JSON response for add product:', text);
          throw new Error('Server returned unexpected response');
        }

        const j = await resp.json();
        if(!resp.ok || !j.success) throw new Error(j.message || 'Thêm thất bại');
        showMsg('Thêm sản phẩm thành công');
        form.reset();
        await loadProducts();
      }catch(err){
        console.error('Add product error', err);
        showMsg(err.message || 'Lỗi kết nối', true);
      }
    });

    loadProducts();
  });
})();
