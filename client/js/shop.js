// js/shop.js - render all products as a grid with gender filters

(function(){
    let products = []; // Will be populated from API
    const root = document.getElementById('shop-root');
    if(!root) return;

    const filterAllBtn = document.getElementById('filter-all');
    const filterMaleBtn = document.getElementById('filter-male');
    const filterFemaleBtn = document.getElementById('filter-female');
    const filterUnisexBtn = document.getElementById('filter-unisex');

    let currentFilter = 'all'; // all | male | female | unisex

    // Fetch products from API
    async function loadProducts(){
        try{
            const resp = await fetch('/api/products');
            const data = await resp.json();
            if(data.success && Array.isArray(data.data)){
                products = data.data;
                setActiveFilter(filterAllBtn);
                renderProducts('all');
            } else {
                showToast('Lỗi tải danh sách sản phẩm');
            }
        }catch(err){
            console.error('Error loading products:', err);
            showToast('Lỗi kết nối tới server');
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
            return currency + price.toFixed(2);
        }catch(e){ return currency + price.toFixed(2); }
    }

    // small utility to escape HTML when injecting text values
    function escapeHtml(str){
        if(!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function renderProducts(filter){
        const list = products.filter(p => {
            if(!filter || filter === 'all') return true;
            if(filter === 'male') return p.gender === 'male';
            if(filter === 'female') return p.gender === 'female';
            if(filter === 'unisex') return p.gender === 'unisex';
            return true;
        });

        // update visible count
        try{
            const countEl = document.getElementById('product-count');
            if(countEl) countEl.textContent = `Hiển thị ${list.length} sản phẩm`;
        }catch(e){}

        if(list.length === 0){
            root.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-state-icon">👟</div><h3>Không có sản phẩm</h3><p>Hãy chọn danh mục khác để tìm sản phẩm bạn cần</p></div>';
            return;
        }

        root.innerHTML = list.map(p => {
            const thumb = (Array.isArray(p.images) && p.images.length) ? p.images[0] : (p.img || '');
            const brand = p.brand || '';
            const title = p.title || p.title_vi || p.name;
            const description = (p.description_vi || '').substring(0, 80);
            return `
            <div class="shoes-card product-card" data-id="${p.id}">
                <div class="product-image-container">
                    <img src="${thumb}" alt="${escapeHtml(title)}" data-first="${thumb}" />
                </div>
                <div class="product-info">
                    ${brand ? `<div class="product-brand">${escapeHtml(brand)}</div>` : ''}
                    <h3>${escapeHtml(title)}</h3>
                    ${description ? `<p class="product-description">${escapeHtml(description)}</p>` : ''}
                    <div class="product-price">${formatPrice(p.price, p.currency)}</div>
                    <div class="product-actions">
                        <button class="add-to-cart-btn add-to-cart" data-id="${p.id}">
                            <i class="fa fa-shopping-cart"></i> Thêm vào giỏ
                        </button>
                        <a href="product.html?id=${p.id}" class="detail-link">
                            <i class="fa fa-eye"></i> Chi tiết
                        </a>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        attachCardBehaviors();
    }

    function attachCardBehaviors(){
        // attach add-to-cart handlers for quick add
        const addButtons = root.querySelectorAll('.add-to-cart');
        addButtons.forEach(btn => btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            const qty = 1;
            const product = products.find(p => p.id === id);
            quickAddToCart(id, qty);
            // update badge if available
            if(window.fsCart && typeof window.fsCart.updateCartBadge === 'function'){
                window.fsCart.updateCartBadge();
            }
            // show a more specific toast including product name and quantity
            const name = (product && (product.title || product.title_vi || product.name)) ? (product.title || product.title_vi || product.name) : 'sản phẩm';
            const message = `Bạn đã thêm ${qty} ${name} vào giỏ hàng`;
            // show inline toast near the clicked button and a fallback global toast
            showInlineToast(btn, message);
            // also show the floating toast for visibility on small screens
            showToast(message);
        }));

        // product card hover: swap image to second image if available
        const cards = root.querySelectorAll('.product-card');
        cards.forEach(card => {
            const id = parseInt(card.getAttribute('data-id'), 10);
            const prod = products.find(p => p.id === id);
            if(!prod) return;
            const imgEl = card.querySelector('img');
            if(Array.isArray(prod.images) && prod.images.length > 1 && imgEl){
                const hoverSrc = prod.images[1];
                card.addEventListener('mouseenter', () => { imgEl.src = hoverSrc; });
                card.addEventListener('mouseleave', () => { imgEl.src = prod.images[0]; });
            }
        });
    }

    function getCart(){
        try{ return JSON.parse(localStorage.getItem('fs_cart')||'[]'); }catch(e){ return []; }
    }

    function saveCart(cart){ localStorage.setItem('fs_cart', JSON.stringify(cart)); }

    function quickAddToCart(id, qty){
        const product = products.find(p=>p.id===id);
        if(!product) return;
        const cart = getCart();
        const existing = cart.find(i => i.id === id && !i.size);
        const chosenTitle = product.title || product.title_vi || product.name;
        if(existing) existing.qty += qty; else cart.push({ id:id, qty:qty, size:null, title: chosenTitle, price:product.price, currency:product.currency });
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
        setTimeout(()=>{ toast.style.transition='opacity .4s'; toast.style.opacity='0'; setTimeout(()=>toast.remove(),400); }, 1400);
    }

    // show a small inline toast near a clicked element (used for "Thêm" buttons)
    function showInlineToast(anchorEl, text){
        if(!anchorEl) { showToast(text); return; }
        const rect = anchorEl.getBoundingClientRect();
        const box = document.createElement('div');
        box.textContent = text;
        box.style.position = 'fixed';
        // position above the button, centered
        box.style.left = (rect.left + rect.width/2) + 'px';
        box.style.top = (rect.top - 8) + 'px';
        box.style.transform = 'translate(-50%, -100%)';
        box.style.background = 'rgba(0,0,0,0.85)';
        box.style.color = '#fff';
        box.style.padding = '.6rem .9rem';
        box.style.borderRadius = '6px';
        box.style.zIndex = 99999;
        box.style.pointerEvents = 'none';
        document.body.appendChild(box);
        // animate and remove
        setTimeout(()=>{
            box.style.transition = 'opacity .35s, top .35s';
            box.style.opacity = '0';
            box.style.top = (rect.top - 28) + 'px';
            setTimeout(()=> box.remove(), 350);
        }, 1200);
    }

    function setActiveFilter(btn){
        [filterAllBtn, filterMaleBtn, filterFemaleBtn, filterUnisexBtn].forEach(b => b && b.classList.remove('active'));
        btn && btn.classList.add('active');
    }

    filterAllBtn && filterAllBtn.addEventListener('click', () => { currentFilter='all'; setActiveFilter(filterAllBtn); renderProducts('all'); });
    filterMaleBtn && filterMaleBtn.addEventListener('click', () => { currentFilter='male'; setActiveFilter(filterMaleBtn); renderProducts('male'); });
    filterFemaleBtn && filterFemaleBtn.addEventListener('click', () => { currentFilter='female'; setActiveFilter(filterFemaleBtn); renderProducts('female'); });
    filterUnisexBtn && filterUnisexBtn.addEventListener('click', () => { currentFilter='unisex'; setActiveFilter(filterUnisexBtn); renderProducts('unisex'); });

    // initialize - load products from API
    loadProducts();
})();
