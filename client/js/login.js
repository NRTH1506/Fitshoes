// client/js/login.js

(function(){
    // Use relative URLs since server serves frontend
    const API_BASE = '/api';
    // Lấy GOOGLE_CLIENT_ID từ biến toàn cục (do login.html định nghĩa)
    const GOOGLE_CLIENT_ID = (window.GOOGLE_CLIENT_ID || '').trim();

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
        setTimeout(()=>{ t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 1400);
    }

    document.addEventListener('DOMContentLoaded', function(){
        const form = $('login-form'); 
        if(!form) return;

        form.addEventListener('submit', async function(ev){
            ev.preventDefault();
            
            // Xóa lỗi cũ
            $('err-email').textContent = '';
            $('err-password').textContent = '';

            const email = $('email').value.trim().toLowerCase();
            const password = $('password').value || '';
            
            // Client-side Validation
            if(!email){ $('err-email').textContent='Vui lòng nhập email'; return; }
            if(!password){ $('err-password').textContent='Vui lòng nhập mật khẩu'; return; }

            try {
                // Use relative API endpoint
                const resp = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await resp.json();
                
                // --- Server Response Handling ---
                if(!resp.ok || !data.success){ 
                    let errorMessage = 'Đăng nhập thất bại';
                    if(data && data.message) errorMessage = data.message;
                    
                    // Hiển thị lỗi chung
                    $('err-password').textContent = errorMessage; 
                    return;
                }
                
                // Xử lý OTP: Chuyển hướng đến trang OTP
                if (data.needOtp) {
                    const e = encodeURIComponent(data.email || '');
                    window.location.href = `verify-otp.html?email=${e}`;
                    return;
                }

                // ======================================================
                // [QUAN TRỌNG] LƯU USER ID ĐỂ MUA HÀNG SAU NÀY
                // ======================================================
                if (data.user) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    // Lưu riêng ID để dễ lấy
                    const uid = data.user.id || data.user._id; 
                        if (uid) {
                            localStorage.setItem('userId', uid); // Lưu cái uid tìm được
                                 }
                }

                showToast('Đăng nhập thành công!');
                setTimeout(()=>{ window.location.href = 'index2.html'; }, 700); 
                
            } catch (err) {
                console.error('Lỗi kết nối network/server:', err);
                showToast('Lỗi kết nối tới server');
            }
        });
        
        // --- Google Identity Services (GSI) integration ---
        function handleCredentialResponse(response){
            const idToken = response && response.credential;
            if(!idToken){ showToast('Google login failed'); return; }

            (async function(){
                try{
                    const resp = await fetch(`${API_BASE}/login-google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ credential: idToken })
                    });
                    const data = await resp.json();
                    
                    if(!resp.ok || !data.success){
                        showToast(data && data.message ? data.message : 'Đăng nhập Google thất bại');
                        return;
                    }

                    // Xử lý OTP cho Google login
                    if (data.needOtp) {
                        const e = encodeURIComponent(data.email || '');
                        window.location.href = `verify-otp.html?email=${e}`;
                        return;
                    }

                    // [QUAN TRỌNG] Lưu thông tin user Google
                    if (data.user) {
                        localStorage.setItem('currentUser', JSON.stringify(data.user));
                        if(data.user._id) localStorage.setItem('userId', data.user._id);
                    }
                    
                    showToast('Đăng nhập bằng Google thành công');
                    setTimeout(()=>{ window.location.href = 'index2.html'; }, 700);
                }catch(err){
                    console.error('Google login error', err);
                    showToast('Lỗi kết nối server');
                }
            })();
        }

        // Expose global callback for GSI
        window.handleCredentialResponse = handleCredentialResponse;

        // Initialize Google Button
        function initGoogleWhenReady(){
            const note = document.getElementById('google-note');
            if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.indexOf('REPLACE') !== -1) {
                if(note) note.textContent = 'Nút Google tạm ẩn — hãy cấu hình GOOGLE_CLIENT_ID.';
                return;
            }

            let attempts = 0;
            const maxAttempts = 20;
            const poll = setInterval(() => {
                attempts++;
                if (window.google && google.accounts && google.accounts.id) {
                    clearInterval(poll);
                    try{
                        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
                        google.accounts.id.renderButton(document.getElementById('google-signin'), { theme: 'outline', size: 'large' });
                        if(note) note.style.display = 'none';
                    }catch(e){
                        console.error('Error initializing Google Sign-In:', e);
                        if(note) note.textContent = 'Không thể khởi tạo Google Sign-In.';
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    if(note) note.textContent = 'Không tải được thư viện Google.';
                }
            }, 100);
        }

        initGoogleWhenReady();
    });
})();