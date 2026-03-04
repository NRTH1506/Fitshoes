// product.js - render product detail based on ?id= in URL

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Fetch all products from API for related products lookup
let allProducts = [];
async function loadProducts(){
    try{
        const resp = await fetch('/api/products');
        const data = await resp.json();
        if(data.success && Array.isArray(data.data)){
            allProducts = data.data;
        }
    }catch(err){
        console.error('Error loading products:', err);
    }
}

function formatPrice(price, currency = '$'){
    try{
        if(currency === '$'){
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
        }
        if(currency === 'VND' || currency === '₫' || currency === 'đ'){
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        }
        // fallback: number with 2 decimals and currency symbol
        return currency + price.toFixed(2);
    } catch (e) {
        return currency + price.toFixed(2);
    }
}

function renderProduct(product){
    const root = document.getElementById('product-root');
    if(!root) return;

    // Build gallery markup from product.images
    const images = Array.isArray(product.images) && product.images.length ? product.images : [product.img || ''];
    const thumbsHtml = images.map((src, idx) => `
        <img class="thumb ${idx === 0 ? 'active' : ''}" data-src="${src}" src="${src}" data-index="${idx}" alt="${product.title_vi} - ${idx+1}">
    `).join('');

    const mainHtml = `
        <div class="product-detail-container">
            <div class="product-gallery">
                <div class="gallery-main">
                    <img id="main-product-img" src="${images[0]}" alt="${product.title_vi}">
                </div>
                <div class="gallery-thumbs">
                    ${thumbsHtml}
                </div>
            </div>

            <div class="product-info-section">
                <div class="product-header">
                    <h1 class="product-title">${product.title_vi}</h1>
                    <div class="product-pricing">
                        <span class="product-price-current">${formatPrice(product.price, product.currency)}</span>
                        ${product.oldPrice ? `<span class="product-price-old">${formatPrice(product.oldPrice, product.currency)}</span>` : ''}
                    </div>
                    <div class="product-rating">
                        <i class="fa fa-star"></i>
                        <span>4.8 (128 đánh giá)</span>
                    </div>
                </div>

                <p class="product-description">${product.description_vi}</p>

                <div class="size-selection">
                    <div class="size-label">
                        <i class="fa fa-ruler"></i> Chọn kích cỡ
                    </div>
                    <div class="size-buttons">
                        <button class="size-btn" data-size="36">36</button>
                        <button class="size-btn" data-size="37">37</button>
                        <button class="size-btn" data-size="38">38</button>
                        <button class="size-btn" data-size="39">39</button>
                        <button class="size-btn" data-size="40">40</button>
                        <button class="size-btn" data-size="41">41</button>
                        <button class="size-btn" data-size="42">42</button>
                        <button class="size-btn" data-size="43">43</button>
                    </div>
                </div>

                <div class="purchase-section">
                    <div class="quantity-control">
                        <div class="quantity-label">Số lượng</div>
                        <div class="quantity-input-wrapper">
                            <button class="qty-decrease">−</button>
                            <input id="qty-input" type="number" min="1" value="1" readonly>
                            <button class="qty-increase">+</button>
                        </div>
                    </div>
                    <button id="add-to-cart-btn" class="add-to-cart-btn">
                        <i class="fa fa-shopping-cart"></i> Thêm vào giỏ
                    </button>
                </div>

                <a href="shop.html" class="back-link">
                    <i class="fa fa-arrow-left"></i> Quay lại cửa hàng
                </a>
            </div>
        </div>
    `;

    root.innerHTML = mainHtml;

    // wire up interactions
    const sizeBtns = root.querySelectorAll('.size-btn');
    let selectedSize = null;
    sizeBtns.forEach(b => b.addEventListener('click', () => {
        sizeBtns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        selectedSize = b.getAttribute('data-size');
    }));

    // Quantity controls
    const qtyInput = document.getElementById('qty-input');
    const qtyDecreaseBtn = root.querySelector('.qty-decrease');
    const qtyIncreaseBtn = root.querySelector('.qty-increase');

    qtyDecreaseBtn && qtyDecreaseBtn.addEventListener('click', () => {
        const val = Math.max(1, parseInt(qtyInput.value, 10) - 1);
        qtyInput.value = val;
    });

    qtyIncreaseBtn && qtyIncreaseBtn.addEventListener('click', () => {
        qtyInput.value = parseInt(qtyInput.value, 10) + 1;
    });

    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn && addBtn.addEventListener('click', () => {
        const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        if(!selectedSize){
            alert('Vui lòng chọn kích cỡ');
            return;
        }
        addToCart(product.id, qty, selectedSize);
        // update cart badge if helper available
        if(window.fsCart && typeof window.fsCart.updateCartBadge === 'function'){
            window.fsCart.updateCartBadge();
        }
        showToast(`✅ Đã thêm ${product.title_vi} (${qty}) vào giỏ`);
    });

    // thumbnail click: swap main image
    const mainImg = root.querySelector('#main-product-img');
    const thumbsEls = root.querySelectorAll('.thumb');
    thumbsEls.forEach(t => t.addEventListener('click', (e) => {
        const src = t.getAttribute('data-src');
        if(src && mainImg) mainImg.src = src;
        thumbsEls.forEach(x => x.classList.remove('active'));
        t.classList.add('active');
    }));
}

function getCart(){
    try{
        return JSON.parse(localStorage.getItem('fs_cart')||'[]');
    }catch(e){return []}
}

function saveCart(cart){
    localStorage.setItem('fs_cart', JSON.stringify(cart));
}

function addToCart(id, qty, size){
    const product = allProducts.find(p => p.id === id || p._id === id);
    if(!product) return;
    const cart = getCart();
    const existing = cart.find(i => (i.id === id || i.id === product._id) && i.size === size);
    if(existing){ existing.qty += qty; }
    else { cart.push({ id: product._id || id, qty: qty, size: size || null, title: product.title_vi, price: product.price, currency: product.currency }); }
    saveCart(cart);
}

function showToast(text){
    const toast = document.createElement('div');
    toast.textContent = text;
    toast.style.position = 'fixed';
    toast.style.right = '2rem';
    toast.style.bottom = '2rem';
    toast.style.background = 'rgba(0,0,0,0.8)';
    toast.style.color = '#fff';
    toast.style.padding = '1rem 1.2rem';
    toast.style.borderRadius = '6px';
    toast.style.zIndex = 9999;
    document.body.appendChild(toast);
    setTimeout(()=>{ toast.style.transition='opacity .4s'; toast.style.opacity='0'; setTimeout(()=>toast.remove(),400); }, 1800);
}

function renderNotFound(){
    const root = document.getElementById('product-root');
    if(!root) return;
    root.innerHTML = `
        <div style="text-align:center; padding:4rem 2rem; background:#fff; border-radius:1.2rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
            <div style="font-size:3.5rem; margin-bottom:1rem;">😟</div>
            <h2 style="color:#153356; font-size:1.8rem; margin-bottom:0.5rem;">Sản phẩm không tồn tại</h2>
            <p style="color:#666; margin-bottom:2rem;">Không tìm thấy sản phẩm theo id đã cho.</p>
            <a href="shop.html" style="display:inline-block; padding:0.9rem 2rem; background:linear-gradient(135deg, #667eea, #764ba2); color:#fff; text-decoration:none; border-radius:0.8rem; font-weight:600; transition:all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform='none'; this.style.boxShadow='none';">
                <i class="fa fa-arrow-left"></i> Quay lại cửa hàng
            </a>
        </div>
    `;
}

function renderProductsGrid(list){
    const root = document.getElementById('product-root');
    if(!root) return;
    root.innerHTML = '<div class="d-grid grid-4-columns products-grid">' + list.map(p => {
        const thumb = (Array.isArray(p.images) && p.images.length) ? p.images[0] : (p.img||'');
        return `
            <div class="shoes-card product-card">
                <a href="product.html?id=${p.id}" style="color:inherit; text-decoration:none; display:block;">
                    <img src="${thumb}" alt="${p.title_vi}">
                    <h3>${p.title_vi}</h3>
                    <h4 class="product-price">${formatPrice(p.price, p.currency)} <span class="product-old">${formatPrice(p.oldPrice, p.currency)}</span></h4>
                </a>
            </div>
        `;
    }).join('') + '</div>';
}

function renderRelated(product){
    const related = allProducts.filter(p => (p.id !== product.id && p._id !== product._id) && p.gender === product.gender).slice(0,6);
    if(!related.length) return;
    const root = document.getElementById('product-root');
    if(!root) return;
    const container = document.createElement('div');
    container.className = 'related-products-section';
    const relatedHtml = related.map(p => {
        const thumb = (Array.isArray(p.images) && p.images.length) ? p.images[0] : (p.img||'');
        return `
            <div class="product-card">
                <a href="product.html?id=${p.id || p._id}" style="color:inherit; text-decoration:none; display:block;">
                    <div class="product-card-image">
                        <img src="${thumb}" alt="${p.title_vi}">
                    </div>
                    <div class="product-card-info">
                        <h4 class="product-card-title">${p.title_vi}</h4>
                        <div class="product-card-price">${formatPrice(p.price, p.currency)}</div>
                    </div>
                </a>
            </div>
        `;
    }).join('');
    container.innerHTML = `
        <h3>Sản phẩm liên quan</h3>
        <div class="products-grid">
            ${relatedHtml}
        </div>
    `;
    root.appendChild(container);
}

// entry - fetch products and display product detail
(async function(){
    await loadProducts();
    
    const idParam = getQueryParam('id');
    if(idParam){
        // Try to find product by numeric id or MongoDB ObjectId
        let product = allProducts.find(p => p.id === parseInt(idParam, 10) || String(p._id) === String(idParam));
        
        // If not found locally, try fetching from API by ID
        if(!product){
            try{
                const resp = await fetch(`/api/products/${idParam}`);
                const data = await resp.json();
                if(data.success && data.data) product = data.data;
            }catch(err){ console.error('Error fetching product:', err); }
        }
        
        if(product){
            renderProduct(product);
            // show related products below
            renderRelated(product);
        } else {
            renderNotFound();
        }
    } else {
        // if no id provided, show full product grid so product.html can act like a product listing as well
        renderProductsGrid(allProducts);
    }
})();

