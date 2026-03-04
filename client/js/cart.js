// js/cart.js - cart helpers and cart page renderer
(function(){
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

    function getCart(){
        try{ return JSON.parse(localStorage.getItem('fs_cart')||'[]'); }catch(e){ return []; }
    }

    function saveCart(cart){ localStorage.setItem('fs_cart', JSON.stringify(cart)); }

    function updateCartBadge(){
        const count = getCart().reduce((s,i)=>s + (i.qty||0), 0);
        document.querySelectorAll('#cart-count').forEach(e => e.textContent = count);
    }

    function formatPrice(price, currency){
        try{
            if(currency === 'VND') return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        }catch(e){}
        return (currency||'') + (price||0);
    }


    // ============================ RENDER CART PAGE ============================
    function renderCartPage(rootId){
        const root = document.getElementById(rootId||'cart-root');
        if(!root) return;

        const cart = getCart();
        if(cart.length===0){
            root.innerHTML = `
                <div class="empty-cart">
                    <h2>Giỏ hàng trống</h2>
                    <a href="shop.html" class="back-shopping-btn">
                        <i class="fa fa-arrow-left"></i> Quay lại cửa hàng
                    </a>
                </div>
            `;
            updateCartBadge();
            return;
        }

        const cartItemsHtml = cart.map(item => {
            const p = allProducts.find(pp => pp._id == item.id || pp.id == item.id) || {};
            const subtotal = (item.qty||0) * (item.price||0);

            return `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-info">
                        <h3>${p.title_vi || p.title || item.title || ""}</h3>
                        <div>Kích cỡ: <strong>${item.size||'-'}</strong></div>
                        <div>${formatPrice(item.price, 'VND')}</div>
                    </div>

                    <div class="cart-item-controls">
                        <button class="qty-decrease" data-id="${item.id}">−</button>
                        <span>${item.qty}</span>
                        <button class="qty-increase" data-id="${item.id}">+</button>

                        <strong>${formatPrice(subtotal, "VND")}</strong>

                        <button class="remove-item" data-id="${item.id}">
                            <i class="fa fa-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const subtotal = cart.reduce((s,i)=> s + i.price * i.qty, 0);
        const shipping = subtotal > 500000 ? 0 : 50000;
        const total = subtotal + shipping;

        root.innerHTML = `
            <div class="cart-container">
                <div class="cart-items-section">
                    ${cartItemsHtml}
                </div>

                <div class="cart-summary-box">

                    <div class="summary-row">
                        <span>Tạm tính:</span>
                        <span>${formatPrice(subtotal, "VND")}</span>
                    </div>

                    <div class="summary-row">
                        <span>Vận chuyển:</span>
                        <span>${shipping === 0 ? "Miễn phí" : formatPrice(shipping, "VND")}</span>
                    </div>

                    <div class="summary-total">
                        <span>Tổng cộng:</span>
                        <span>${formatPrice(total, "VND")}</span>
                    </div>

                    <button id="checkout" class="checkout-btn">
                        Thanh toán
                    </button>

                    <button id="clear-cart" class="clear-cart-btn">
                        Xóa toàn bộ
                    </button>
                </div>
            </div>
        `;


        // ============================ HANDLERS ============================

        document.querySelectorAll('.qty-decrease').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const cart = getCart();
                const found = cart.find(i => i.id == id);
                if(found && found.qty > 1){
                    found.qty--;
                    saveCart(cart);
                    renderCartPage(rootId);
                }
            };
        });

        document.querySelectorAll('.qty-increase').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const cart = getCart();
                const found = cart.find(i => i.id == id);
                if(found){
                    found.qty++;
                    saveCart(cart);
                    renderCartPage(rootId);
                }
            };
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const newCart = getCart().filter(i => i.id != id);
                saveCart(newCart);
                renderCartPage(rootId);
            };
        });


        // CLEAR CART
        document.getElementById("clear-cart").onclick = () => {
            if(confirm("Xóa toàn bộ sản phẩm?")){
                saveCart([]);
                renderCartPage(rootId);
            }
        };


        // ============================ CHECKOUT ============================
document.getElementById("checkout").onclick = async () => {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Giỏ hàng trống!");
        return;
    }

    // Tính tổng tiền
    const subtotal = cart.reduce((s, i) => s + (i.qty * i.price), 0);
    const shipping = subtotal > 500000 ? 0 : 50000;
    const amount = subtotal + shipping;

    // Build items gửi lên server
    const items = cart.map(i => ({
        id: i.id,
        qty: i.qty,
        price: i.price,
        size: i.size
    }));

    try {
        const res = await fetch("/api/pay/zalopay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount,
                items,
                userId: localStorage.getItem("userId") || ""
            })
        });

        const data = await res.json();

        console.log("ZLP RES:", data);

        if (!data.success) {
            alert("Lỗi tạo đơn thanh toán: " + (data.message || ""));
            return;
        }

        const url = data.payUrl || data.order_url || data.data?.order_url;

        if (!url) {
            alert("Không tìm thấy URL thanh toán của ZaloPay.");
            return;
        }

        // Chuyển hướng sang ZaloPay
        window.location.href = url;

    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi gửi yêu cầu thanh toán.");
    }
};



        updateCartBadge();
    }


    // Expose
    window.fsCart = {
        renderCartPage,
        loadProducts,
        getCart,
        saveCart,
        updateCartBadge
    };


    // Auto-load
    window.addEventListener("DOMContentLoaded", () => {
        loadProducts().then(updateCartBadge);
    });

})();
