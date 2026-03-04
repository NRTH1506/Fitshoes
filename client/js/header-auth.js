// Header Authentication Manager
// Manages visibility of profile link and register button based on login status

(function() {
    function checkLoginStatus() {
        // Check if user is logged in
        const currentUser = localStorage.getItem('currentUser');
        const profileLink = document.querySelector('a[href="profile.html"]');
        const loginLink = document.querySelector('.login-btn');
        const registerBtn = document.getElementById('hero-register-btn');
        
        if (!profileLink || !loginLink) {
            return; // Links not found yet
        }

        if (currentUser) {
            // User is logged in
            profileLink.parentElement.style.display = 'block';
            loginLink.parentElement.style.display = 'none';
            if (registerBtn) {
                registerBtn.classList.add('hidden');
            }
        } else {
            // User is not logged in
            profileLink.parentElement.style.display = 'none';
            loginLink.parentElement.style.display = 'block';
            if (registerBtn) {
                registerBtn.classList.remove('hidden');
            }
        }
    }

    // Run on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        checkLoginStatus();
    });

    // Listen for storage changes (when login happens in another tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'currentUser') {
            checkLoginStatus();
        }
    });

    // Expose function globally for manual updates
    window.updateAuthStatus = checkLoginStatus;
})();
