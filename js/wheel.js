/* ============================================
   WHEEL - Premium Casino-Style Canvas Spinning Wheel
   Gold borders, LED lights, metallic depth
   ============================================ */

const Wheel = (() => {
    let canvas, ctx;
    let currentAngle = 0;
    let spinning = false;
    let onSpinComplete = null;
    let frameCount = 0;

    const SEGMENTS = [
        { label: '1k', color: '#e63946', value: '1k' },
        { label: '2k', color: '#f77f00', value: '2k' },
        { label: '5k', color: '#fcbf49', value: '5k' },
        { label: '10k', color: '#06d6a0', value: '10k' },
        { label: '20k', color: '#118ab2', value: '20k' },
        { label: '50k', color: '#7209b7', value: '50k' },
        { label: '100k', color: '#f72585', value: '100k' },
        { label: '200k', color: '#4cc9f0', value: '200k' },
        { label: '500k', color: '#ffd700', value: '500k' },
        { label: 'CMNM', fullLabel: 'Chúc mừng\nnăm mới', color: '#ef476f', value: 'Chúc mừng năm mới' }
    ];

    const PROBS = {
        admin: [1, 1, 1, 10, 10, 21, 20, 20, 10, 6],
        user: [10, 20, 20, 21, 10, 10, 0.0001, 0.0001, 0.0001, 8.9997]
    };

    const SEG_COUNT = SEGMENTS.length;
    const ARC = (2 * Math.PI) / SEG_COUNT;

    // ---- Premium Draw ----
    function drawWheel() {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) - 18; // Leave room for outer rim
        frameCount++;

        ctx.clearRect(0, 0, w, h);
        ctx.save();

        // === 1. OUTER METALLIC GOLD RIM ===
        const rimWidth = 14;
        const outerR = radius + rimWidth;

        // Outer bezel shadow
        ctx.beginPath();
        ctx.arc(cx, cy, outerR + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();

        // Gold rim
        const rimGrad = ctx.createRadialGradient(cx, cy, radius, cx, cy, outerR + 2);
        rimGrad.addColorStop(0, '#B8860B');
        rimGrad.addColorStop(0.2, '#FFD700');
        rimGrad.addColorStop(0.5, '#FFF8DC');
        rimGrad.addColorStop(0.7, '#FFD700');
        rimGrad.addColorStop(1, '#8B6508');
        ctx.beginPath();
        ctx.arc(cx, cy, outerR + 2, 0, Math.PI * 2);
        ctx.fillStyle = rimGrad;
        ctx.fill();

        // Inner edge of rim
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a14';
        ctx.fill();

        // === 2. LED LIGHTS ON RIM ===
        const lightCount = 24;
        const lightR = (radius + outerR) / 2;
        for (let i = 0; i < lightCount; i++) {
            const angle = (i / lightCount) * Math.PI * 2;
            const lx = cx + Math.cos(angle) * lightR;
            const ly = cy + Math.sin(angle) * lightR;
            const isOn = (Math.floor(frameCount / 15) + i) % 3 !== 0;

            ctx.beginPath();
            ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);

            if (isOn) {
                const lightColor = i % 2 === 0 ? '#FFD700' : '#FF4444';
                ctx.fillStyle = lightColor;
                ctx.shadowColor = lightColor;
                ctx.shadowBlur = 10;
            } else {
                ctx.fillStyle = 'rgba(100,80,40,0.4)';
                ctx.shadowBlur = 0;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // === 3. SEGMENTS ===
        for (let i = 0; i < SEG_COUNT; i++) {
            const startAngle = currentAngle + i * ARC;
            const endAngle = startAngle + ARC;
            const midAngle = startAngle + ARC / 2;

            // Segment fill with richer gradient
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius - 2, startAngle, endAngle);
            ctx.closePath();

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, lightenColor(SEGMENTS[i].color, 40));
            grad.addColorStop(0.3, lightenColor(SEGMENTS[i].color, 15));
            grad.addColorStop(0.7, SEGMENTS[i].color);
            grad.addColorStop(1, darkenColor(SEGMENTS[i].color, 30));
            ctx.fillStyle = grad;
            ctx.fill();

            // Segment divider lines (gold)
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            const ex = cx + Math.cos(startAngle) * (radius - 2);
            const ey = cy + Math.sin(startAngle) * (radius - 2);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // === Text with better styling ===
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(midAngle);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textDist = radius * 0.64;
            const seg = SEGMENTS[i];

            // Text shadow
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            if (seg.fullLabel) {
                const lines = seg.fullLabel.split('\n');
                ctx.font = `bold ${radius * 0.065}px 'Outfit', sans-serif`;
                ctx.fillStyle = '#fff';
                lines.forEach((line, li) => {
                    ctx.fillText(line, textDist, (li - (lines.length - 1) / 2) * (radius * 0.085));
                });
            } else {
                ctx.font = `900 ${radius * 0.1}px 'Outfit', sans-serif`;
                ctx.fillStyle = '#fff';
                // Gold outline for text
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 3;
                ctx.strokeText(seg.label, textDist, 0);
                ctx.fillText(seg.label, textDist, 0);
            }
            ctx.restore();
        }

        // === 4. INNER CIRCLE (Premium Hub) ===
        // Dark inner circle
        const innerR = radius * 0.19;
        const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
        hubGrad.addColorStop(0, '#2a2a3e');
        hubGrad.addColorStop(0.5, '#16162a');
        hubGrad.addColorStop(1, '#0a0a14');
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = hubGrad;
        ctx.fill();

        // Inner gold ring
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Outer ring glow
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    function lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
        const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(2.55 * percent));
        const b = Math.min(255, (num & 0xFF) + Math.round(2.55 * percent));
        return `rgb(${r},${g},${b})`;
    }

    function darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
        const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(2.55 * percent));
        const b = Math.max(0, (num & 0xFF) - Math.round(2.55 * percent));
        return `rgb(${r},${g},${b})`;
    }

    function weightedRandom(role) {
        const probs = PROBS[role] || PROBS.user;
        const total = probs.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < probs.length; i++) {
            rand -= probs[i];
            if (rand <= 0) return i;
        }
        return probs.length - 1;
    }

    function spin(role, callback) {
        if (spinning) return;
        spinning = true;
        onSpinComplete = callback;

        const winIndex = weightedRandom(role);

        const targetSegAngle = winIndex * ARC + ARC / 2;
        const pointerAngle = -Math.PI / 2;
        const targetAngle = -(targetSegAngle - pointerAngle);

        const fullRotations = (6 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
        const finalAngle = currentAngle + fullRotations + (targetAngle - currentAngle % (2 * Math.PI));
        const totalRotation = finalAngle - currentAngle;

        const duration = 5000 + Math.random() * 2000;
        const startTime = performance.now();
        const startAngle = currentAngle;
        let lastTickAngle = startAngle;

        // Play start sound
        SoundManager.click();

        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function animateFrame(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuart(progress);

            currentAngle = startAngle + totalRotation * eased;

            // Tick sound when crossing segment boundary
            const angleDiff = Math.abs(currentAngle - lastTickAngle);
            if (angleDiff > ARC * 0.8) {
                SoundManager.tick();
                lastTickAngle = currentAngle;
            }

            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animateFrame);
            } else {
                spinning = false;
                const result = SEGMENTS[winIndex];
                // Play win sound
                if (result.value === '500k' || result.value === '200k' || result.value === '100k') {
                    SoundManager.bigWin();
                } else {
                    SoundManager.fanfare();
                }
                if (onSpinComplete) {
                    onSpinComplete(result);
                }
            }
        }

        requestAnimationFrame(animateFrame);
    }

    // LED light animation loop (when not spinning)
    let idleAnimId = null;
    function startIdleAnimation() {
        function idleLoop() {
            if (!spinning) {
                drawWheel();
            }
            idleAnimId = requestAnimationFrame(idleLoop);
        }
        idleLoop();
    }

    return {
        init(canvasId) {
            canvas = document.getElementById(canvasId);
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            drawWheel();
            startIdleAnimation();
        },

        spin(role, callback) {
            spin(role, callback);
        },

        isSpinning() {
            return spinning;
        },

        getSegments() {
            return SEGMENTS;
        },

        draw() {
            drawWheel();
        }
    };
})();
