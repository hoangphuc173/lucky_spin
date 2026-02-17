/* ============================================
   FIREBASE AUTH - Real Google/Facebook OAuth
   Uses signInWithPopup (called directly from click)
   ============================================ */

const FirebaseAuth = (() => {
    let auth = null;
    let googleProvider = null;
    let facebookProvider = null;
    let initialized = false;

    return {
        init() {
            if (!FIREBASE_CONFIGURED) {
                console.warn('[FirebaseAuth] Firebase chưa được cấu hình.');
                return false;
            }

            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                auth = firebase.auth();

                googleProvider = new firebase.auth.GoogleAuthProvider();
                googleProvider.addScope('email');
                googleProvider.addScope('profile');

                facebookProvider = new firebase.auth.FacebookAuthProvider();
                facebookProvider.addScope('email');
                facebookProvider.addScope('public_profile');

                auth.languageCode = 'vi';
                initialized = true;
                console.log('[FirebaseAuth] Initialized successfully');
                return true;
            } catch (err) {
                console.error('[FirebaseAuth] Init error:', err);
                return false;
            }
        },

        isConfigured() {
            return FIREBASE_CONFIGURED && initialized;
        },

        // Returns a promise - MUST be called directly from click handler
        // Do NOT call SoundManager or create DOM before this!
        async loginWithGoogle() {
            if (!initialized) throw new Error('Firebase chưa khởi tạo');
            const result = await auth.signInWithPopup(googleProvider);
            return result.user;
        },

        async loginWithFacebook() {
            if (!initialized) throw new Error('Firebase chưa khởi tạo');
            const result = await auth.signInWithPopup(facebookProvider);
            return result.user;
        },

        async signOut() {
            if (auth) {
                try { await auth.signOut(); } catch (e) { /* ignore */ }
            }
        },

        getCurrentFirebaseUser() {
            return auth ? auth.currentUser : null;
        }
    };
})();
