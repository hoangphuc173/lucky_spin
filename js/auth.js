/* ============================================
   AUTH - Authentication & User Management
   ============================================ */

const Auth = (() => {
    const USERS_KEY = 'vqmm_users';
    const SESSION_KEY = 'vqmm_session';

    // Initialize with admin account + fix corrupted data
    function initUsers() {
        let users = getUsers();
        let dirty = false;

        if (!users.find(u => u.username === 'admin')) {
            users.push({
                username: 'admin',
                email: 'admin@vqmm.com',
                password: 'admin123',
                role: 'admin',
                spins: 999999,
                createdAt: new Date().toISOString()
            });
            dirty = true;
        }

        // Auto-fix: user-role accounts should never have 999999 spins (old bug)
        users.forEach(u => {
            if (u.role === 'user' && u.spins >= 999999) {
                u.spins = (typeof u._savedSpins === 'number') ? u._savedSpins : 1;
                delete u._savedSpins;
                dirty = true;
            }
        });

        if (dirty) saveUsers(users);
    }

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem(SESSION_KEY));
        } catch {
            return null;
        }
    }

    function setSession(user) {
        const session = {
            username: user.username,
            email: user.email,
            role: user.role,
            spins: user.spins
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    // Refresh session from stored users (for spins update etc.)
    function refreshSession() {
        const session = getSession();
        if (!session) return null;
        const users = getUsers();
        const user = users.find(u => u.username === session.username);
        if (user) {
            setSession(user);
            return {
                username: user.username,
                email: user.email,
                role: user.role,
                spins: user.role === 'admin' ? 999999 : user.spins
            };
        }
        return null;
    }

    return {
        init() {
            initUsers();
        },

        register(username, email, password) {
            username = username.trim();
            email = email.trim();
            if (!username || !email || !password) {
                return { success: false, message: 'Vui lòng điền đầy đủ thông tin!' };
            }
            if (username.length < 3) {
                return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' };
            }
            if (password.length < 4) {
                return { success: false, message: 'Mật khẩu phải có ít nhất 4 ký tự!' };
            }
            const users = getUsers();
            if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
                return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
            }
            if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                return { success: false, message: 'Email đã được sử dụng!' };
            }
            const newUser = {
                username,
                email,
                password,
                role: 'user',
                spins: 1,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            saveUsers(users);
            setSession(newUser);
            return { success: true, user: newUser };
        },

        login(username, password) {
            username = username.trim();
            if (!username || !password) {
                return { success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu!' };
            }
            const users = getUsers();
            const user = users.find(u =>
                u.username.toLowerCase() === username.toLowerCase()
            );
            if (!user) {
                return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng!' };
            }
            // Social accounts can't login with password
            if (user.provider && user.password === null) {
                return { success: false, message: `Tài khoản này dùng đăng nhập ${user.provider}. Vui lòng dùng nút ${user.provider} để đăng nhập.` };
            }
            if (user.password !== password) {
                return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng!' };
            }
            setSession(user);
            return { success: true, user };
        },

        socialLogin(provider, email, displayName) {
            email = (email || '').trim().toLowerCase();
            displayName = (displayName || '').trim();

            const ROOT_ADMIN_EMAIL = 'phucml456@gmail.com';

            if (!email) {
                return { success: false, message: 'Vui lòng nhập email!' };
            }
            if (!displayName || displayName.length < 2) {
                return { success: false, message: 'Vui lòng nhập tên hiển thị (ít nhất 2 ký tự)!' };
            }

            const users = getUsers();
            const isRootAdmin = email === ROOT_ADMIN_EMAIL;

            // Check if this social account already exists (returning user)
            const existingUser = users.find(u =>
                u.provider === provider && u.email.toLowerCase() === email
            );

            if (existingUser) {
                // FORCE ROOT ADMIN ROLE update if needed
                if (isRootAdmin && existingUser.role !== 'admin') {
                    existingUser.role = 'admin';
                    existingUser.spins = 999999;
                    saveUsers(users);
                }

                // Returning user — log them back in
                setSession(existingUser);
                return { success: true, user: existingUser, returning: true };
            }

            // Check if email is already used by a non-social account
            const emailTaken = users.find(u => u.email.toLowerCase() === email && !u.provider);
            if (emailTaken) {
                return { success: false, message: 'Email này đã được dùng cho tài khoản thường. Hãy đăng nhập bằng mật khẩu.' };
            }

            // Create new social account
            const username = `${displayName.replace(/\s+/g, '_')}_${provider}`;
            // Ensure unique username
            let finalUsername = username;
            let counter = 1;
            while (users.find(u => u.username.toLowerCase() === finalUsername.toLowerCase())) {
                finalUsername = `${username}_${counter}`;
                counter++;
            }

            const newUser = {
                username: finalUsername,
                email,
                password: null, // social accounts have no password
                role: isRootAdmin ? 'admin' : 'user',
                spins: isRootAdmin ? 999999 : 1, // unlimited for root admin
                provider,
                displayName,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            saveUsers(users);
            setSession(newUser);
            return { success: true, user: newUser, returning: false };
        },

        logout() {
            clearSession();
        },

        getCurrentUser() {
            return refreshSession();
        },

        isLoggedIn() {
            return !!getSession();
        },

        isAdmin() {
            const session = getSession();
            return session && session.role === 'admin';
        },

        getSpins() {
            const user = refreshSession();
            if (!user) return 0;
            if (user.role === 'admin') return 999999;
            return user.spins || 0;
        },

        useOneSpin() {
            const session = getSession();
            if (!session) return false;
            if (session.role === 'admin') return true; // admin unlimited
            const users = getUsers();
            const userIdx = users.findIndex(u => u.username === session.username);
            if (userIdx === -1) return false;
            if (users[userIdx].spins <= 0) return false;
            users[userIdx].spins--;
            saveUsers(users);
            setSession(users[userIdx]);
            return true;
        },

        // Admin functions
        getAllUsers() {
            return getUsers().map(u => ({
                username: u.username,
                email: u.email,
                role: u.role,
                spins: u.spins,
                provider: u.provider || null,
                createdAt: u.createdAt
            }));
        },

        setUserRole(username, newRole) {
            if (username === 'admin' && newRole !== 'admin') return false; // can't demote main admin
            const users = getUsers();
            const user = users.find(u => u.username === username);
            if (!user) return false;

            if (newRole === 'admin' && user.role !== 'admin') {
                // Promoting to admin — save original spins before overwriting
                user._savedSpins = user.spins;
                user.spins = 999999;
            } else if (newRole === 'user' && user.role === 'admin') {
                // Demoting to user — restore saved spins (or default to 0)
                user.spins = (typeof user._savedSpins === 'number') ? user._savedSpins : 0;
                delete user._savedSpins;
            }

            user.role = newRole;
            saveUsers(users);
            return true;
        },

        addSpinsToUser(username, count) {
            count = parseInt(count);
            if (isNaN(count) || count <= 0) return false;
            const users = getUsers();
            const user = users.find(u => u.username === username);
            if (!user) return false;
            user.spins = (user.spins || 0) + count;
            saveUsers(users);
            return true;
        },

        addHistory(prizeName) {
            const session = getSession();
            if (!session) return false;

            const users = getUsers();
            const user = users.find(u => u.username === session.username);

            if (user) {
                if (!user.history) user.history = [];

                const record = {
                    prize: prizeName,
                    time: new Date().toISOString()
                };

                // Add to beginning, keep max 20
                user.history.unshift(record);
                if (user.history.length > 20) user.history.pop();

                saveUsers(users);
                return true;
            }
            return false;
        },

        getHistory() {
            const user = refreshSession(); // Helper ensures we get fresh data from localStorage
            if (user && user.username) {
                // We need to fetch from full user list because session might not have history
                const users = getUsers();
                const fullUser = users.find(u => u.username === user.username);
                return fullUser ? (fullUser.history || []) : [];
            }
            return [];
        },

        deleteUser(username) {
            if (username === 'admin') return false; // can't delete main admin
            const users = getUsers();
            const idx = users.findIndex(u => u.username === username);
            if (idx === -1) return false;
            users.splice(idx, 1);
            saveUsers(users);
            // If deleting the currently logged-in user, clear session
            const session = getSession();
            if (session && session.username === username) {
                clearSession();
            }
            return true;
        }
    };
})();
