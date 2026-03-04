// js/service.js - render service detail based on ?id= in URL

const services = [
    {
        id: 'free-shipping',
        title_vi: 'Miễn phí vận chuyển',
        img: 'assets/images/gift-1.jpg',
        short_vi: 'Nhanh chóng và tiết kiệm — miễn phí giao hàng cho đơn hàng đầu tiên.',
        description_vi: 'Chúng tôi cung cấp miễn phí vận chuyển cho đơn hàng đầu tiên và nhiều chương trình ưu đãi vận chuyển khác. Chính sách áp dụng cho các khu vực được chỉ định. Liên hệ bộ phận chăm sóc khách hàng để biết chi tiết.',
        benefits: [
            'Miễn phí vận chuyển cho đơn hàng đầu tiên',
            'Theo dõi đơn hàng miễn phí',
            'Hỗ trợ đổi trả trong 7 ngày'
        ]
    },
    {
        id: 'add-to-cart',
        title_vi: 'Thêm vào giỏ hàng',
        img: 'assets/images/cart-1.jpg',
        short_vi: 'Lưu sản phẩm yêu thích, thanh toán nhanh và an toàn.',
        description_vi: 'Tính năng giỏ hàng giúp bạn lưu và quản lý sản phẩm trước khi thanh toán. Hệ thống lưu tạm thông tin sản phẩm và kích thước bạn đã chọn, giúp quá trình mua hàng nhanh hơn.',
        benefits: [
            'Lưu sản phẩm yêu thích',
            'Chỉnh sửa số lượng và kích cỡ',
            'Tích hợp mã giảm giá khi thanh toán'
        ]
    },
    {
        id: 'online-shopping',
        title_vi: 'Mua sắm trực tuyến',
        img: 'assets/images/online-shopping.jpg',
        short_vi: 'Mua mọi lúc, mọi nơi — giao diện thân thiện và nhiều khuyến mãi.',
        description_vi: 'Cửa hàng trực tuyến của chúng tôi cho phép bạn tìm kiếm sản phẩm, so sánh giá và nhận khuyến mãi độc quyền. Thanh toán an toàn với nhiều phương thức khác nhau.',
        benefits: [
            'Giao diện thân thiện',
            'Nhiều phương thức thanh toán',
            'Ưu đãi độc quyền cho khách trực tuyến'
        ]
    },
    {
        id: 'fast-delivery',
        title_vi: 'Giao hàng nhanh',
        img: 'assets/images/delivery-1.jpg',
        short_vi: 'Giao hàng nhanh trong khu vực — thời gian thực tế tùy khu vực.',
        description_vi: 'Dịch vụ giao hàng nhanh của chúng tôi hợp tác với đối tác vận chuyển đáng tin cậy để giao đơn hàng tới khách hàng trong thời gian ngắn nhất có thể. Theo dõi trực tiếp trạng thái giao hàng qua hệ thống.',
        benefits: [
            'Giao hàng trong ngày cho khu vực nội thành',
            'Theo dõi trạng thái trực tuyến',
            'Đóng gói cẩn thận, an toàn'
        ]
    }
];

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function renderService(service){
    const root = document.getElementById('service-root');
    if(!root) return;

    root.innerHTML = `
        <div class="service-image">
            <img src="${service.img}" alt="${service.title_vi}">
        </div>
        <div class="service-meta">
            <h2>${service.title_vi}</h2>
            <p style="color:var(--text-color); margin-bottom:1rem;">${service.short_vi}</p>
            <p style="color:var(--text-color); margin-bottom:1.2rem;">${service.description_vi}</p>

            <h4>Lợi ích</h4>
            <ul class="service-benefits">
                ${service.benefits.map(b => `<li>• ${b}</li>`).join('')}
            </ul>

            <div style="margin-top:1.5rem; display:flex; gap:1rem; align-items:center;">
                <a href="index.html#services-section" class="secondary-link">Quay về dịch vụ</a>
                <a href="index.html#shoes-cards-section" class="primary-btn">Mua sắm liên quan</a>
            </div>
        </div>
    `;
}

function renderNotFound(){
    const root = document.getElementById('service-root');
    if(!root) return;
    root.innerHTML = `<div style="padding:3rem; text-align:center;"><h2>Dịch vụ không tồn tại</h2><p>Không tìm thấy dịch vụ theo id đã cho.</p><p><a href="index.html">Quay về trang chủ</a></p></div>`;
}

// entry
const sid = getQueryParam('id');
if(sid){
    const svc = services.find(s => s.id === sid);
    if(svc) renderService(svc);
    else renderNotFound();
} else {
    renderNotFound();
}
