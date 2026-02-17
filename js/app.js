/* ============================================
   APP LOGIC - Main Controller
   ============================================ */

// ===== MOUSE PARALLAX TRACKING =====
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    document.documentElement.style.setProperty('--mouse-x', x);
    document.documentElement.style.setProperty('--mouse-y', y);
});

// ===== NOTIFICATION SYSTEM =====
const NotificationSystem = (() => {
    let container = null;

    function createContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    return {
        show(message, type = 'info') {
            createContainer();

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;

            let icon = 'ℹ️';
            if (type === 'success') icon = '✅';
            if (type === 'error') icon = '⚠️';

            toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <div class="toast-content">${message}</div>
            `;

            container.appendChild(toast);

            // Sound effect
            if (type === 'error') SoundManager.error();
            else if (type === 'success') SoundManager.click();

            // Remove after delay
            setTimeout(() => {
                toast.classList.add('hiding');
                toast.addEventListener('animationend', () => {
                    if (toast.parentElement) {
                        toast.parentElement.removeChild(toast);
                    }
                });
            }, 3000);
        }
    };
})();

const App = (() => {
    // DOM Elements
    const elements = {};

    function cacheDom() {
        elements.authView = document.getElementById('authView');
        elements.wheelView = document.getElementById('wheelView');
        elements.adminPanel = document.getElementById('adminPanel');

        // Auth elements
        elements.googleLogin = document.getElementById('googleLogin');
        elements.authError = document.getElementById('authError');

        // Main UI elements
        elements.userAvatar = document.getElementById('userAvatar');
        elements.userName = document.getElementById('userName');
        elements.userRole = document.getElementById('userRole');
        elements.spinsCount = document.getElementById('spinsCount');
        elements.logoutBtn = document.getElementById('logoutBtn');
        elements.adminPanelBtn = document.getElementById('adminPanelBtn');
        elements.musicToggleBtn = document.getElementById('musicToggleBtn'); // New
        elements.nextTrackBtn = document.getElementById('nextTrackBtn'); // New
        elements.historyList = document.getElementById('historyList'); // New

        // Wheel & Result elements
        elements.spinBtn = document.getElementById('spinBtn');
        elements.spinHint = document.getElementById('spinHint');
        elements.resultModal = document.getElementById('resultModal');
        elements.resultTitle = document.getElementById('resultTitle');
        elements.resultPrize = document.getElementById('resultPrize');
        elements.resultMessage = document.getElementById('resultMessage');
        elements.closeResultBtn = document.getElementById('closeResultBtn');
        elements.resultEmoji = document.getElementById('resultEmoji');
        elements.wheelLights = document.getElementById('wheelLights');

        // Admin elements
        elements.closeAdminBtn = document.getElementById('closeAdminBtn');
        elements.adminOverlay = document.getElementById('adminOverlay');
        elements.adminSearchInput = document.getElementById('adminSearchInput');
        elements.adminUserList = document.getElementById('adminUserList');
    }

    // ===== VIEW NAVIGATION =====
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        if (elements.authError) elements.authError.classList.remove('show');
    }

    function enterWheelView() {
        showView('wheelView');
        updateUserInfo();
        renderHistory(); // Load history
        Wheel.draw(); // Ensure wheel is drawn

        // Welcome sound
        setTimeout(() => SoundManager.fanfare(), 500);
    }

    function updateUserInfo() {
        const user = Auth.getCurrentUser();
        if (user) {
            if (elements.userName) elements.userName.textContent = user.username;
            if (elements.userRole) {
                elements.userRole.textContent = user.role === 'admin' ? 'Admin' : 'Member';
                elements.userRole.className = `user-role ${user.role}`;
            }
            if (elements.spinsCount) elements.spinsCount.textContent = user.spins;

            // Show/Hide Admin Button
            if (elements.adminPanelBtn) {
                if (user.role === 'admin') {
                    elements.adminPanelBtn.style.display = 'flex';
                    // Reload admin list if panel is open
                    if (elements.adminPanel && elements.adminPanel.classList.contains('active')) {
                        AdminPanel.renderUserList();
                    }
                } else {
                    elements.adminPanelBtn.style.display = 'none';
                }
            }

            // Avatar logic
            if (elements.userAvatar) {
                if (user.photoURL) {
                    elements.userAvatar.innerHTML = `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;">`;
                } else {
                    elements.userAvatar.textContent = '👤';
                }
            }
        }
    }

    function renderHistory() {
        if (!elements.historyList) return;

        const history = Auth.getHistory();
        elements.historyList.innerHTML = '';

        if (history.length === 0) {
            elements.historyList.innerHTML = '<p class="history-empty">Chưa có lịch sử quay</p>';
            return;
        }

        history.forEach(item => {
            const time = new Date(item.time).toLocaleTimeString('vi-VN', {
                hour: '2-digit', minute: '2-digit'
            });
            const div = document.createElement('div');
            div.className = 'history-item';

            // Highlight big wins
            const val = parseInt(item.prize);
            if (!isNaN(val) && val >= 100) div.classList.add('big-win');
            if (item.prize.includes('Chúc mừng')) div.classList.add('big-win');

            div.innerHTML = `
                <span class="history-prize">${item.prize}</span>
                <span class="history-time">${time}</span>
            `;
            elements.historyList.appendChild(div);
        });
    }

    // ===== AUTH HANDLERS =====
    function handleGoogleLogin() {
        if (FirebaseAuth.isConfigured()) {
            const popupPromise = FirebaseAuth.loginWithGoogle();
            handleFirebasePopupResult(popupPromise, 'google');
            return;
        }
        SoundManager.click();
        handleSimulatedSocialLogin('google');
    }

    async function handleFirebasePopupResult(popupPromise, provider) {
        try {
            const user = await popupPromise;
            const result = Auth.socialLogin(
                provider,
                user.email || user.uid + '@' + provider + '.com',
                user.displayName || 'User'
            );
            if (result.success) {
                NotificationSystem.show(`Đăng nhập thành công! Xin chào ${result.user.username}`, 'success');
                enterWheelView();
            } else {
                showAuthError(result.message);
                SoundManager.error();
            }
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                console.error('[Firebase] Login error:', error.code, error.message);
                showAuthError(error.message || 'Đăng nhập thất bại.');
            }
            SoundManager.error();
        }
    }

    function handleSimulatedSocialLogin(provider) {
        const result = Auth.socialLogin(provider, 'test@google.com', 'Test User');
        if (result.success) {
            NotificationSystem.show('Đăng nhập (Test) thành công!', 'success');
            enterWheelView();
        }
    }

    function showAuthError(message) {
        if (elements.authError) {
            elements.authError.textContent = message;
            elements.authError.classList.add('show');
            const card = document.querySelector('.auth-card');
            if (card) {
                card.style.animation = 'none';
                card.offsetHeight;
                card.style.animation = 'shake 0.5s ease';
            }
        }
        NotificationSystem.show(message, 'error');
    }

    function handleLogout() {
        SoundManager.click();
        Auth.logout();
        FirebaseAuth.signOut();
        showView('authView');
        NotificationSystem.show('Đã đăng xuất thành công', 'info');
    }

    // ===== WHEEL ACTIONS =====
    function handleSpin() {
        const spins = Auth.getSpins();
        if (spins <= 0) {
            SoundManager.error();
            NotificationSystem.show('Bạn đã hết lượt quay! Hay xin Admin thêm lượt nhé.', 'error');
            return;
        }

        SoundManager.click();
        elements.spinBtn.disabled = true;
        elements.spinHint.style.opacity = '0';

        if (Auth.useOneSpin()) {
            updateUserInfo();
            const user = Auth.getCurrentUser();

            Wheel.spin(user.role, (result) => {
                // Add to history
                Auth.addHistory(result.value);
                renderHistory();

                // Show result
                setTimeout(() => showResult(result), 500);
                elements.spinBtn.disabled = false;
                elements.spinHint.style.opacity = '1';
            });
        } else {
            elements.spinBtn.disabled = false;
        }
    }

    function showResult(result) {
        elements.resultTitle.textContent = result.value === 'Chúc mừng năm mới' ? 'Chúc Mừng!' : 'Trúng Thưởng!';
        elements.resultPrize.innerHTML = `<span class="gradient-text">${result.value}</span>`;

        if (result.value === 'Chúc mừng năm mới') {
            elements.resultMessage.textContent = 'Chúc bạn một năm mới An Khang Thịnh Vượng!';
            elements.resultEmoji.textContent = '🎆';
            SoundManager.bigWin();
            NotificationSystem.show('Chúc Mừng Năm Mới! 🎆', 'success');
            ConfettiSystem.rainCoins();
            ConfettiSystem.fireworks(); // Add Fireworks
            MascotSystem.celebrate(); // Mascot Dance
            document.body.classList.add('shake-impact'); // Screen Shake
        } else {
            const val = parseInt(result.value);
            if (val >= 100) {
                elements.resultMessage.textContent = 'Bạn quá may mắn! Giải thưởng cực lớn!';
                elements.resultEmoji.textContent = '💰';
                SoundManager.bigWin();
                NotificationSystem.show(`Trúng lớn: ${result.value}! 💰`, 'success');
                ConfettiSystem.rainCoins();
                ConfettiSystem.fireworks(); // Add Fireworks
                MascotSystem.celebrate(); // Mascot Dance
                document.body.classList.add('shake-impact'); // Screen Shake
            } else {
                elements.resultMessage.textContent = 'Bạn đã nhận được phần quà may mắn!';
                elements.resultEmoji.textContent = '🎉';
                SoundManager.fanfare();
                NotificationSystem.show(`Chúc mừng: ${result.value} 🎉`, 'success');
                ConfettiSystem.fire(); // Standard Confetti
                MascotSystem.cheer(); // Mascot Cheer
            }
        }

        setTimeout(() => document.body.classList.remove('shake-impact'), 1000); // Remove shake

        elements.resultModal.classList.add('open');
    }

    // ===== MASCOT SYSTEM =====
    const MascotSystem = (() => {
        let mascotEl;

        function init() {
            mascotEl = document.getElementById('mascot');
            if (!mascotEl) return;
            // Idle animation
            setInterval(() => {
                if (!mascotEl.classList.contains('celebrating')) {
                    mascotEl.style.transform = `translateY(${Math.sin(Date.now() / 500) * 5}px)`;
                }
            }, 50);
        }

        return {
            init,
            cheer() {
                if (!mascotEl) return;
                // mascotEl.textContent = '👏'; // Don't replace SVG
                mascotEl.classList.add('cheering');
                setTimeout(() => {
                    mascotEl.classList.remove('cheering');
                    // mascotEl.textContent = '🎅'; // Don't replace SVG
                }, 2000);
            },
            celebrate() {
                if (!mascotEl) return;
                // mascotEl.textContent = '💃'; // Don't replace SVG
                mascotEl.classList.add('celebrating');
                mascotEl.style.animation = 'bounce 0.5s infinite';
                setTimeout(() => {
                    mascotEl.classList.remove('celebrating');
                    mascotEl.style.animation = '';
                    // mascotEl.textContent = '🎅'; // Don't replace SVG
                }, 4000);
            }
        };
    })();

    function initParallax() {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            document.body.style.setProperty('--mouse-x', x);
            document.body.style.setProperty('--mouse-y', y);
        });
    }

    function closeResultModal() {
        // SoundManager.click(); // SFX Disabled
        elements.resultModal.classList.remove('open');
    }

    function handleMusicToggle() {
        // SoundManager.click(); // SFX Disabled
        const isPlaying = SoundManager.toggleBGM();
        elements.musicToggleBtn.textContent = isPlaying ? '🎵' : '🔇';
        if (isPlaying) {
            NotificationSystem.show('Đã bật nhạc Tết! 🌸', 'success');
        } else {
            NotificationSystem.show('Đã tắt nhạc', 'info');
        }
    }

    function handleNextTrack() {
        if (SoundManager.nextTrack()) {
            NotificationSystem.show('Đang chuyển bài... 🎵', 'success');
            // Ensure button shows playing state
            if (!SoundManager.isBGMEnabled()) {
                SoundManager.toggleBGM(); // Auto turn on if off
                elements.musicToggleBtn.textContent = '🎵';
            }
        }
    }

    // Public API
    return {
        init() {
            cacheDom();
            Auth.init();
            FirebaseAuth.init();
            AdminPanel.init();
            Wheel.init('wheelCanvas');
            ParticleSystem.init('particleCanvas');
            ConfettiSystem.init('confettiCanvas');
            MascotSystem.init();
            initParallax();

            if (Auth.isLoggedIn()) {
                enterWheelView();
            }

            if (elements.googleLogin) elements.googleLogin.addEventListener('click', handleGoogleLogin);
            if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);
            if (elements.spinBtn) elements.spinBtn.addEventListener('click', handleSpin);
            if (elements.closeResultBtn) elements.closeResultBtn.addEventListener('click', closeResultModal);

            if (elements.musicToggleBtn) {
                elements.musicToggleBtn.addEventListener('click', handleMusicToggle);
            }
            if (elements.nextTrackBtn) {
                elements.nextTrackBtn.addEventListener('click', handleNextTrack);
            }

            if (elements.adminPanelBtn) {
                elements.adminPanelBtn.addEventListener('click', () => {
                    AdminPanel.open();
                });
            }

            // Admin close listeners are handled within AdminPanel.init() logic
            // providing AdminPanel.init() was called.

            if (elements.adminSearchInput) {
                elements.adminSearchInput.addEventListener('input', (e) => {
                    AdminPanel.handleSearch(e.target.value);
                });
            }

            window.addEventListener('spinUpdate', () => {
                updateUserInfo();
            });
        },
        updateUserInfo,
        showNotification: NotificationSystem.show
    };
})();

document.addEventListener('DOMContentLoaded', App.init);
