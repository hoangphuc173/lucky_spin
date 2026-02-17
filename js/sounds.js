/* ============================================
   SOUNDS - Festive Tet Theme + YouTube BGM
   Web Audio API SFX + YouTube Background Music
   ============================================ */

const SoundManager = (() => {
    let audioCtx = null;
    let enabled = true;

    // YouTube Player State
    let ytPlayer = null;
    let isYtReady = false;
    let bgmEnabled = false;
    const PLAYLIST = [
        '3_g2un5M350',
        '5Q6XyTw2y5c',
        'mb4dJc3f7yA',
        'OrDbh5rPZAg',
        'V9j8jE_7j4Q'
    ];
    let currentTrackIndex = 0;

    // ---- Web Audio Context ----
    function getCtx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                // Global Unlock (Resume AudioContext) on first interaction
                const unlockAudio = () => {
                    if (audioCtx && audioCtx.state === 'suspended') {
                        audioCtx.resume().then(() => {
                            // Play silent buffer to warm up
                            const buffer = audioCtx.createBuffer(1, 1, 22050);
                            const source = audioCtx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioCtx.destination);
                            source.start(0);
                        });
                    }
                    document.removeEventListener('click', unlockAudio);
                    document.removeEventListener('touchstart', unlockAudio);
                };
                document.addEventListener('click', unlockAudio);
                document.addEventListener('touchstart', unlockAudio);
            } catch (e) {
                console.error("Web Audio API not supported", e);
            }
        }
        return audioCtx;
    }

    // Helper: play a tone with envelope
    function playTone(freq, duration, type = 'sine', volume = 0.3, detune = 0) {
        if (!enabled) return;
        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) { /* silent fail */ }
    }

    // Helper: play a chord
    function playChord(freqs, duration, type = 'sine', volume = 0.15) {
        freqs.forEach((f, i) => {
            setTimeout(() => playTone(f, duration, type, volume), i * 30);
        });
    }

    // Helper: play noise burst (for impacts)
    function playNoise(duration = 0.1, volume = 0.15) {
        if (!enabled) return;
        try {
            const ctx = getCtx();
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.value = volume;
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch (e) { /* silent fail */ }
    }

    // ---- YouTube BGM ----
    function initYouTube() {
        if (window.YT) return;
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = function () {
            ytPlayer = new YT.Player('player', {
                height: '1',
                width: '1',
                playerVars: {
                    'playsinline': 1,
                    'controls': 0,
                    'loop': 0,
                    'autoplay': 1,
                    'mute': 0
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': onPlayerError
                }
            });
        };
    }

    function onPlayerReady(event) {
        console.log("YouTube Player Ready");
        isYtReady = true;
        event.target.setVolume(50);
        event.target.loadPlaylist(PLAYLIST, currentTrackIndex);
        event.target.setLoop(true);
        if (!bgmEnabled) {
            event.target.pauseVideo();
        }
    }

    function onPlayerStateChange(event) { }
    function onPlayerError(event) {
        console.error("YouTube Player Error:", event.data);
    }

    initYouTube();

    // ===== PUBLIC API =====
    return {
        // --- SFX: Click (short crisp tap) ---
        click() {
            playTone(800, 0.08, 'square', 0.12);
            playTone(1200, 0.05, 'sine', 0.08);
        },

        // --- SFX: Tick (wheel crossing segment) ---
        tick() {
            playTone(1400 + Math.random() * 200, 0.04, 'square', 0.1);
        },

        // --- SFX: Fanfare (small win celebration) ---
        fanfare() {
            const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
            notes.forEach((freq, i) => {
                setTimeout(() => playTone(freq, 0.3, 'triangle', 0.2), i * 100);
            });
            // Shimmer
            setTimeout(() => playChord([1047, 1319, 1568], 0.5, 'sine', 0.08), 400);
        },

        // --- SFX: Big Win (epic celebration) ---
        bigWin() {
            // Rising arpeggio
            const notes = [262, 330, 392, 523, 659, 784, 1047, 1319];
            notes.forEach((freq, i) => {
                setTimeout(() => playTone(freq, 0.4, 'triangle', 0.15), i * 80);
            });
            // Shimmering chord
            setTimeout(() => {
                playChord([1047, 1319, 1568, 2093], 1.0, 'sine', 0.1);
            }, 700);
            // Impact
            setTimeout(() => {
                playNoise(0.15, 0.2);
                playTone(100, 0.3, 'sine', 0.25);
            }, 650);
        },

        // --- SFX: Error (descending tone) ---
        error() {
            playTone(400, 0.15, 'square', 0.15);
            setTimeout(() => playTone(300, 0.2, 'square', 0.12), 100);
        },

        // --- BGM Controls ---
        toggle() {
            enabled = !enabled;
            if (isYtReady && ytPlayer && ytPlayer.setVolume) {
                ytPlayer.setVolume(enabled ? 50 : 0);
            }
            return enabled;
        },

        toggleBGM() {
            bgmEnabled = !bgmEnabled;
            if (isYtReady && ytPlayer && ytPlayer.playVideo) {
                if (bgmEnabled) {
                    ytPlayer.playVideo();
                } else {
                    ytPlayer.pauseVideo();
                }
            }
            return bgmEnabled;
        },

        nextTrack() {
            if (isYtReady && ytPlayer && ytPlayer.nextVideo) {
                ytPlayer.nextVideo();
                return true;
            }
            return false;
        },

        isBGMEnabled() {
            return bgmEnabled;
        }
    };
})();
