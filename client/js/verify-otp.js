// client/js/verify-otp.js
(function(){
  const API_BASE = '/api';
  const OTP_EXPIRE_TIME = 10 * 60; // 10 minutes in seconds
  const RESEND_COOLDOWN = 60; // 60 seconds cooldown

  function qs(name){
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function showToast(text, isError = false){
    const t = document.createElement('div');
    t.textContent = text;
    t.style.position = 'fixed';
    t.style.right = '2rem';
    t.style.bottom = '2rem';
    t.style.background = isError ? 'rgba(211, 47, 47, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    t.style.color = '#fff';
    t.style.padding = '1rem 1.2rem';
    t.style.borderRadius = '6px';
    t.style.zIndex = 9999;
    t.style.maxWidth = '300px';
    document.body.appendChild(t);
    setTimeout(()=>{ 
      t.style.transition = 'opacity .4s'; 
      t.style.opacity = '0'; 
      setTimeout(() => t.remove(), 400); 
    }, 3000);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function startCountdown() {
    let timeLeft = OTP_EXPIRE_TIME;
    const countdownEl = document.getElementById('countdown');
    const timerEl = document.getElementById('otp-timer');

    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (countdownEl) {
        countdownEl.textContent = formatTime(timeLeft);
      }

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        if (timerEl) {
          timerEl.style.display = 'none';
        }
        // Show expired message
        const errEl = document.getElementById('err-otp');
        if (errEl) {
          errEl.textContent = 'Mã xác thực đã hết hạn. Hãy gửi lại mã.';
          errEl.classList.add('show');
        }
        // Disable submit button
        const submitBtn = document.querySelector('.btn-otp-submit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.5';
        }
      }
    }, 1000);

    // Store interval ID for cleanup if needed
    window.otpCountdownInterval = countdownInterval;
  }

  function startResendCooldown() {
    let cooldownLeft = RESEND_COOLDOWN;
    const resendBtn = document.getElementById('resend-btn');
    const resendCountdown = document.getElementById('resend-countdown');
    const resendNote = document.getElementById('resend-note');

    resendBtn.disabled = true;
    resendNote.style.display = 'block';

    const cooldownInterval = setInterval(() => {
      cooldownLeft--;
      if (resendCountdown) {
        resendCountdown.textContent = cooldownLeft;
      }

      if (cooldownLeft <= 0) {
        clearInterval(cooldownInterval);
        resendBtn.disabled = false;
        resendNote.style.display = 'none';
      }
    }, 1000);

    window.resendCooldownInterval = cooldownInterval;
  }

  document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('otp-form');
    const otpInput = document.getElementById('otp');
    const resendBtn = document.getElementById('resend-btn');
    const emailDisplay = document.getElementById('otp-email-display');
    const errorEl = document.getElementById('err-otp');
    const submitBtn = document.querySelector('.btn-otp-submit');
    
    const email = qs('email') || localStorage.getItem('pendingOtpEmail') || '';
    
    if (email) {
      emailDisplay.textContent = `Mã đã gửi tới: ${email}`;
      localStorage.setItem('pendingOtpEmail', email);
    }

    // Only allow numeric input
    otpInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
    });

    // Auto-submit when 6 digits are entered
    otpInput.addEventListener('input', function(e) {
      if (this.value.length === 6) {
        // Optional: auto-submit after a short delay
        setTimeout(() => {
          form.dispatchEvent(new Event('submit'));
        }, 300);
      }
    });

    // Start main countdown
    startCountdown();

    // Form submit
    form.addEventListener('submit', async function(ev){
      ev.preventDefault();
      
      if (!email) {
        showToast('Email không tìm thấy. Vui lòng đăng ký lại.', true);
        return;
      }

      const code = otpInput.value.trim();
      
      if (!code) {
        errorEl.textContent = 'Nhập mã xác thực';
        errorEl.classList.add('show');
        return;
      }

      if (code.length !== 6) {
        errorEl.textContent = 'Mã xác thực phải có 6 chữ số';
        errorEl.classList.add('show');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      try {
        const resp = await fetch(`${API_BASE}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });

        const data = await resp.json();

        if (!resp.ok || !data.success) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          errorEl.textContent = data && data.message ? data.message : 'Xác thực thất bại. Vui lòng thử lại.';
          errorEl.classList.add('show');
          showToast(data && data.message ? data.message : 'Xác thực thất bại', true);
          return;
        }

        if (data.user) {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          localStorage.setItem('userId', data.user._id);
          localStorage.removeItem('pendingOtpEmail');
          
          // Clear countdown
          if (window.otpCountdownInterval) {
            clearInterval(window.otpCountdownInterval);
          }
          
          showToast('Xác thực thành công! Chuyển hướng...');
          setTimeout(() => window.location.href = 'index2.html', 1000);
        }
      } catch (err) {
        console.error(err);
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        errorEl.textContent = 'Lỗi kết nối server';
        errorEl.classList.add('show');
        showToast('Lỗi kết nối', true);
      }
    });

    // Resend OTP button
    resendBtn.addEventListener('click', async function(ev) {
      ev.preventDefault();

      if (!email) {
        showToast('Email không tìm thấy', true);
        return;
      }

      resendBtn.disabled = true;

      try {
        const resp = await fetch(`${API_BASE}/resend-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await resp.json();

        if (!resp.ok || !data.success) {
          resendBtn.disabled = false;
          showToast(data && data.message ? data.message : 'Gửi lại thất bại', true);
          return;
        }

        // Clear old OTP input
        otpInput.value = '';
        errorEl.textContent = '';
        errorEl.classList.remove('show');
        
        // Reset timer
        if (window.otpCountdownInterval) {
          clearInterval(window.otpCountdownInterval);
        }
        startCountdown();

        // Reset submit button
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';

        showToast('Mã xác thực mới đã được gửi!');

        // Start cooldown for resend button
        startResendCooldown();
      } catch (err) {
        console.error(err);
        resendBtn.disabled = false;
        showToast('Lỗi kết nối', true);
      }
    });

    // Start resend cooldown on initial load
    startResendCooldown();
  });
})();
