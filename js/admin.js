/* ============================================
   ADMIN - Admin Panel Management
   ============================================ */

const AdminPanel = (() => {
    let panel, overlay, userList, closeBtn, searchInput;
    let currentSearch = '';

    function getFilteredUsers() {
        const users = Auth.getAllUsers();
        if (!currentSearch) return users;
        const q = currentSearch.toLowerCase();
        return users.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.provider && u.provider.toLowerCase().includes(q)) ||
            u.role.toLowerCase().includes(q)
        );
    }

    function renderUserList() {
        const users = getFilteredUsers();
        const allUsers = Auth.getAllUsers();
        const currentUser = Auth.getCurrentUser();

        // Stats header
        const totalUsers = allUsers.length;
        const adminCount = allUsers.filter(u => u.role === 'admin').length;

        let html = `
            <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
                <div style="flex:1; min-width:100px; padding:12px; background:rgba(76,201,240,0.08); border:1px solid rgba(76,201,240,0.15); border-radius:10px; text-align:center;">
                    <div style="font-size:1.4rem; font-weight:800; color:#4cc9f0; font-family:'Outfit',sans-serif;">${totalUsers}</div>
                    <div style="font-size:0.75rem; color:rgba(237,242,244,0.5);">Tổng tài khoản</div>
                </div>
                <div style="flex:1; min-width:100px; padding:12px; background:rgba(255,215,0,0.08); border:1px solid rgba(255,215,0,0.15); border-radius:10px; text-align:center;">
                    <div style="font-size:1.4rem; font-weight:800; color:#ffd700; font-family:'Outfit',sans-serif;">${adminCount}</div>
                    <div style="font-size:0.75rem; color:rgba(237,242,244,0.5);">Admin</div>
                </div>
                <div style="flex:1; min-width:100px; padding:12px; background:rgba(6,214,160,0.08); border:1px solid rgba(6,214,160,0.15); border-radius:10px; text-align:center;">
                    <div style="font-size:1.4rem; font-weight:800; color:#06d6a0; font-family:'Outfit',sans-serif;">${totalUsers - adminCount}</div>
                    <div style="font-size:0.75rem; color:rgba(237,242,244,0.5);">User</div>
                </div>
            </div>
        `;

        if (users.length === 0) {
            html += `<div style="text-align:center; padding:32px; color:rgba(237,242,244,0.4); font-style:italic;">
                Không tìm thấy tài khoản nào phù hợp
            </div>`;
            userList.innerHTML = html;
            return;
        }

        html += users.map(u => {
            const isCurrentUser = u.username === currentUser.username;
            const isMainAdmin = u.username === 'admin';
            const roleClass = u.role === 'admin' ? 'role-admin' : 'role-user';
            const roleText = u.role === 'admin' ? '🛡️ Admin' : '👤 User';
            const avatarClass = u.role === 'admin' ? 'is-admin' : '';
            const avatarEmoji = u.provider === 'google' ? '🔵' : u.provider === 'facebook' ? '🟦' : (u.role === 'admin' ? '👑' : '👤');
            const spinsDisplay = u.role === 'admin' ? '∞' : u.spins;

            return `
                <div class="admin-user-card" data-username="${u.username}">
                    <div class="admin-user-avatar ${avatarClass}">${avatarEmoji}</div>
                    <div class="admin-user-info">
                        <span class="admin-user-name">
                            ${u.username}
                            ${isCurrentUser ? ' <small style="color:var(--accent)">(bạn)</small>' : ''}
                            ${u.provider ? ` <small style="color:var(--text-muted)">(${u.provider})</small>` : ''}
                        </span>
                        <span class="admin-user-email">${u.email}</span>
                    </div>
                    <div class="admin-user-actions">
                        <div class="admin-spins-display">🎫 ${spinsDisplay}</div>
                        ${!isMainAdmin ? `
                            <button class="btn admin-role-btn ${roleClass}" onclick="AdminPanel.toggleRole('${u.username}')" title="Đổi quyền">
                                ${roleText}
                            </button>
                        ` : `
                            <button class="btn admin-role-btn role-admin" disabled title="Admin gốc">
                                🛡️ Admin gốc
                            </button>
                        `}
                        ${u.role !== 'admin' ? `
                            <div class="admin-spin-control">
                                <input type="number" class="admin-spin-input" id="spin-input-${u.username}" min="1" value="1" placeholder="1">
                                <button class="btn admin-add-spin-btn" onclick="AdminPanel.addSpins('${u.username}')" title="Thêm lượt quay">
                                    +🎫
                                </button>
                            </div>
                        ` : ''}
                        ${!isMainAdmin ? `
                            <button class="btn admin-delete-btn" onclick="AdminPanel.confirmDelete('${u.username}')" title="Xoá tài khoản">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        userList.innerHTML = html;
    }

    function showDeleteConfirm(username) {
        // Remove existing confirm if any
        const existing = document.getElementById('deleteConfirmModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'deleteConfirmModal';
        modal.style.cssText = `
            position: fixed; inset: 0; z-index: 10001;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
            padding: 20px; animation: fadeIn 0.2s ease;
        `;
        modal.innerHTML = `
            <div style="
                background: #1a1a35; padding: 32px; border-radius: 16px;
                border: 1px solid rgba(239,71,111,0.3);
                max-width: 380px; width: 100%; text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                animation: resultPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            ">
                <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                <h3 style="font-family:'Outfit',sans-serif; font-size:1.2rem; margin-bottom:8px; color:#edf2f4;">
                    Xác nhận xoá tài khoản
                </h3>
                <p style="color:rgba(237,242,244,0.6); font-size:0.9rem; margin-bottom:20px;">
                    Bạn có chắc muốn xoá tài khoản <strong style="color:#ef476f;">${username}</strong>?
                    <br><small>Hành động này không thể hoàn tác!</small>
                </p>
                <div style="display:flex; gap:10px;">
                    <button id="deleteConfirmCancel" style="
                        flex:1; padding:11px; background:rgba(255,255,255,0.05);
                        border:1px solid rgba(255,255,255,0.1); border-radius:10px;
                        color:#edf2f4; font-family:'Inter',sans-serif; font-size:0.9rem;
                        cursor:pointer;
                    ">Hủy</button>
                    <button id="deleteConfirmOk" style="
                        flex:1; padding:11px; background:linear-gradient(135deg,#ef476f,#c9184a);
                        border:none; border-radius:10px; color:#fff;
                        font-family:'Outfit',sans-serif; font-weight:700; font-size:0.9rem;
                        cursor:pointer;
                    ">Xoá tài khoản</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#deleteConfirmCancel').addEventListener('click', () => {
            modal.remove();
            SoundManager.click();
        });

        modal.querySelector('#deleteConfirmOk').addEventListener('click', () => {
            const success = Auth.deleteUser(username);
            modal.remove();
            if (success) {
                SoundManager.fanfare();
                renderUserList();
                if (typeof App !== 'undefined') App.refreshUI();
            } else {
                SoundManager.error();
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                SoundManager.click();
            }
        });
    }

    return {
        init() {
            panel = document.getElementById('adminPanel');
            overlay = document.getElementById('adminOverlay');
            userList = document.getElementById('adminUserList');
            closeBtn = document.getElementById('closeAdminBtn');
            searchInput = document.getElementById('adminSearchInput');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
            if (overlay) {
                overlay.addEventListener('click', () => this.close());
            }
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    currentSearch = e.target.value;
                    renderUserList();
                });
            }
        },

        open() {
            if (!Auth.isAdmin()) return;
            currentSearch = '';
            if (searchInput) searchInput.value = '';
            renderUserList();
            panel.classList.add('open');
            SoundManager.click();
            // Focus search after animation
            setTimeout(() => { if (searchInput) searchInput.focus(); }, 400);
        },

        close() {
            panel.classList.remove('open');
        },

        toggleRole(username) {
            if (!Auth.isAdmin()) return;
            const users = Auth.getAllUsers();
            const user = users.find(u => u.username === username);
            if (!user) return;
            const newRole = user.role === 'admin' ? 'user' : 'admin';
            Auth.setUserRole(username, newRole);
            renderUserList();
            SoundManager.click();
            if (typeof App !== 'undefined') App.refreshUI();
        },

        addSpins(username) {
            if (!Auth.isAdmin()) return;
            const input = document.getElementById(`spin-input-${username}`);
            const count = parseInt(input?.value || '1');
            if (isNaN(count) || count <= 0) return;
            Auth.addSpinsToUser(username, count);
            renderUserList();
            SoundManager.click();
            if (typeof App !== 'undefined') App.refreshUI();
        },

        confirmDelete(username) {
            if (!Auth.isAdmin()) return;
            SoundManager.click();
            showDeleteConfirm(username);
        }
    };
})();
