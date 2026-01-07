// client/js/register.js

(function(){
    // Use relative URLs since server serves frontend
    const API_BASE = '/api';

    function $ (id){ return document.getElementById(id); }
    
    // Hàm hiển thị thông báo toast
    function showToast(text){
        const t = document.createElement('div');
        t.textContent = text;
        t.style.position = 'fixed';
        t.style.right = '2rem';
        t.style.bottom = '2rem';
        t.style.background = 'rgba(0,0,0,0.8)';
        t.style.color = '#fff';
        t.style.padding = '1rem 1.2rem';
        t.style.borderRadius = '6px';
        t.style.zIndex = 9999;
        document.body.appendChild(t);
        // Fade out và remove
        setTimeout(()=>{ 
            t.style.transition='opacity .4s'; 
            t.style.opacity='0'; 
            setTimeout(()=>t.remove(),400); 
        }, 1600);
    }

    function validateEmail(email){
        return /\S+@\S+\.\S+/.test(email);
    }

    document.addEventListener('DOMContentLoaded', function(){
        const form = $('register-form');
        if(!form) return;

        form.addEventListener('submit', async function(ev){
            ev.preventDefault();
            
            // Xóa lỗi cũ
            ['err-name','err-email','err-password','err-confirm','err-phone','err-gender','err-address'].forEach(id=>{ const e=$(id); if(e) e.textContent=''; });

            const name = $('name').value.trim();
            // --- BIẾN EMAIL ĐÃ ĐƯỢC KHAI BÁO TẠI ĐÂY ---
            const email = $('email').value.trim().toLowerCase(); 
            const password = $('password').value;
            const confirm = $('confirm').value;
            const phone = $('phone').value.trim();
            const gender = $('gender').value.trim();
            const address = $('address').value.trim();

            // --- Client-side Validation ---
            let ok = true;
            if(name.length < 2){ $('err-name').textContent = 'Vui lòng nhập họ tên hợp lệ'; ok=false; }
            if(!validateEmail(email)){ $('err-email').textContent = 'Email không hợp lệ'; ok=false; }
            if(password.length < 6){ $('err-password').textContent = 'Mật khẩu cần ít nhất 6 ký tự'; ok=false; }
            if(password !== confirm){ $('err-confirm').textContent = 'Mật khẩu không khớp'; ok=false; }
            if(!/^0\d{9,10}$/.test(phone)){ $('err-phone').textContent = 'Số điện thoại không hợp lệ (10-11 chữ số)'; ok=false; }
            if(!gender){ $('err-gender').textContent = 'Vui lòng chọn giới tính'; ok=false; }
            if(address.length < 5){ $('err-address').textContent = 'Địa chỉ phải ít nhất 5 ký tự'; ok=false; }
            if(!ok) return;
            // -----------------------------

            try {
                // Use relative API endpoint
                const resp = await fetch(`${API_BASE}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone, gender, address })
                });
                
                const data = await resp.json();
                
                // --- Server Response Handling ---
                if(!resp.ok){
                    let errorMessage = 'Đăng ký thất bại';

                    if(data && data.message){
                        errorMessage = data.message;
                        // Xử lý lỗi đặc biệt: Email đã tồn tại (Status 409)
                        if(resp.status === 409) {
                            $('err-email').textContent = errorMessage;
                            return; // Dừng lại sau khi hiển thị lỗi tại trường email
                        }
                    }
                    
                    showToast(errorMessage);
                    return;
                }

                // Đăng ký thành công (Status 201)
                showToast('Đăng ký thành công! Kiểm tra email để xác thực.');
                
                // --- SỬA LỖI TẠI ĐÂY: XÓA DÒNG KHAI BÁO LẠI 'const email' ---
                // Chỉ cần dùng biến 'email' đã có ở trên đầu hàm
                
                setTimeout(()=>{ 
                    window.location.href = `verify-otp.html?email=${encodeURIComponent(email)}`; 
                }, 1200); 
                
            } catch (err) {
                console.error('Lỗi kết nối network/server:', err);
                showToast('Lỗi kết nối tới server');
            }
        });
    });
})();