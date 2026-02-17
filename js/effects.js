/* ============================================
   EFFECTS - God Tier Visuals
   ============================================ */

// ---- 1. Background Constellations (Base Layer) ----
const ParticleSystem = (() => {
    let canvas, ctx, particles = [], animId;
    let mouse = { x: null, y: null, radius: 150 };
    const COUNT = 60;
    const CONNECT_DISTANCE = 120;

    class Particle {
        constructor(w, h) {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 2 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;
            this.speedX = (Math.random() - 0.5) * 1.5;
            this.speedY = (Math.random() - 0.5) * 1.5;
            this.color = Math.random() > 0.4 ? 'rgba(255, 215, 0,' : 'rgba(208, 0, 0,';
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update(w, h) {
            if (mouse.x != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = forceDirectionX * force * this.density;
                    const directionY = forceDirectionY * force * this.density;
                    this.x -= directionX;
                    this.y -= directionY;
                }
            }
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > w) this.speedX *= -1;
            if (this.y < 0 || this.y > h) this.speedY *= -1;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.fill();
        }
    }

    function initMouseConfig() {
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });
    }

    function connect() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = dx * dx + dy * dy;

                if (distance < CONNECT_DISTANCE * CONNECT_DISTANCE) {
                    let opacityValue = 1 - (distance / (20000));
                    ctx.strokeStyle = 'rgba(255, 215, 0,' + opacityValue * 0.15 + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update(canvas.width, canvas.height);
            p.draw(ctx);
        });
        connect();
        animId = requestAnimationFrame(animate);
    }

    return {
        init(canvasId) {
            canvas = document.getElementById(canvasId);
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            resize();
            initMouseConfig();
            window.addEventListener('resize', resize);
            particles = [];
            for (let i = 0; i < COUNT; i++) {
                particles.push(new Particle(canvas.width, canvas.height));
            }
            animate();
        },
        destroy() { cancelAnimationFrame(animId); }
    };
})();

// ---- 2. Falling Blossoms (Mai/Dao) ----
const BlossomSystem = (() => {
    let canvas, ctx, petals = [], animId;
    const COUNT = 60; // Denser for Tet atmosphere

    class Petal {
        constructor(w, h) {
            this.x = Math.random() * w;
            this.y = Math.random() * h - h;
            this.w = window.innerWidth;
            this.h = window.innerHeight;
            this.size = Math.random() * 10 + 5;
            this.speedY = Math.random() * 1 + 0.5;
            this.speedX = Math.random() * 2 - 1;
            this.angle = Math.random() * 360;
            this.spin = Math.random() * 2 - 1;
            // Pink (Dao) or Yellow (Mai)
            this.type = Math.random() > 0.5 ? 'dao' : 'mai';
            this.color = this.type === 'dao' ? 'rgba(255, 183, 197,' : 'rgba(255, 223, 0,';
        }

        update() {
            this.y += this.speedY;
            this.x += Math.sin(this.angle * 0.01) + this.speedX * 0.5;
            this.angle += this.spin;

            if (this.y > this.h) {
                this.y = -20;
                this.x = Math.random() * this.w;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.fillStyle = this.color + '0.8)';
            ctx.beginPath();
            // Simple petal shape
            ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function animate() {
        // We don't clear here, relying on ParticleSystem to clear the shared canvas 
        // OR we create a separate loop if using same canvas context.
        // Assuming this runs on 'particleCanvas' contexts would clash.
        // Strategy: Run INDEPENDENTLY on `confettiCanvas` or a new layer.
        // For simplicity, let's inject into the main loop or use a separate canvas.
        // Current implementation: Use `confettiCanvas` for overlay effects.
    }

    // We will merge this into a Unified Overlay System to avoid multiple render loops clearing each other.
})();


// ---- UNIFIED OVERLAY SYSTEM (Blossoms + Confetti + Coins + Dragon) ----
const OverlayEffects = (() => {
    let canvas, ctx, animId;
    let blossoms = [];
    let confetti = [];
    let coins = [];
    let trail = [];
    let mouse = { x: -100, y: -100 };

    // --- CLASSES ---
    class Blossom {
        constructor() {
            this.reset();
            this.y = Math.random() * window.innerHeight; // Start scattered
        }
        reset() {
            this.x = Math.random() * window.innerWidth;
            this.y = -20;
            this.size = Math.random() * 8 + 5;
            this.speedY = Math.random() * 1 + 0.5;
            this.sway = Math.random() * 0.05 + 0.01;
            this.p = 0; // phase
            this.type = Math.random() > 0.5 ? '#ff9aa2' : '#ffff00'; // Pink/Yellow
            this.rotation = Math.random() * 360;
            this.rotSpeed = Math.random() * 2 - 1;
        }
        update() {
            this.y += this.speedY;
            this.p += this.sway;
            this.x += Math.cos(this.p);
            this.rotation += this.rotSpeed;
            if (this.y > window.innerHeight) this.reset();
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.type;
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.type;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class GoldCoin {
        constructor() {
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * -500 - 50;
            this.size = Math.random() * 15 + 10;
            this.speedY = Math.random() * 5 + 3;
            this.rotation = Math.random() * 360;
            this.rotSpeed = Math.random() * 10 - 5;
        }
        update() {
            this.y += this.speedY;
            this.rotation += this.rotSpeed;
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);

            // Outer Coin
            ctx.fillStyle = '#ffd700'; // Gold
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Inner Shine
            ctx.fillStyle = '#ffecb3';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Square hole (Asian coin style)
            ctx.fillStyle = '#b8860b';
            ctx.fillRect(-this.size * 0.25, -this.size * 0.25, this.size * 0.5, this.size * 0.5);

            ctx.restore();
        }
    }

    class DragonSpark {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 5 + 2;
            this.life = 1.0;
            this.decay = Math.random() * 0.03 + 0.02;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.color = Math.random() > 0.5 ? '#ff0000' : '#ffd700';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            this.size *= 0.95;
        }
        draw(ctx) {
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    class Confetti {
        constructor() {
            this.x = window.innerWidth / 2;
            this.y = window.innerHeight / 2;
            this.vx = (Math.random() - 0.5) * 20;
            this.vy = (Math.random() - 0.5) * 20;
            this.gravity = 0.1;
            this.drag = 0.96;
            this.size = Math.random() * 10 + 5;
            this.color = ['#d00000', '#ffba08', '#ffffff'][Math.floor(Math.random() * 3)];
            this.rotation = Math.random() * 360;
            this.life = 1.0;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            this.vx *= this.drag;
            this.vy *= this.drag;
            this.rotation += 5;
            this.life -= 0.005;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    function initEvents() {
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            // Create trail
            for (let i = 0; i < 2; i++) {
                trail.push(new DragonSpark(mouse.x, mouse.y));
            }
        });
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Re-init blossoms for coverage
            blossoms = [];
            for (let i = 0; i < 30; i++) blossoms.push(new Blossom());
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Blossoms (Always active)
        blossoms.forEach(b => {
            b.update();
            b.draw(ctx);
        });

        // 2. Dragon Trail
        for (let i = trail.length - 1; i >= 0; i--) {
            trail[i].update();
            trail[i].draw(ctx);
            if (trail[i].life <= 0) trail.splice(i, 1);
        }

        // 3. Confetti
        for (let i = confetti.length - 1; i >= 0; i--) {
            confetti[i].update();
            confetti[i].draw(ctx);
            if (confetti[i].life <= 0) confetti.splice(i, 1);
        }

        // 4. Coin Rain
        for (let i = coins.length - 1; i >= 0; i--) {
            coins[i].update();
            coins[i].draw(ctx);
            if (coins[i].y > canvas.height) coins.splice(i, 1);
        }

        animId = requestAnimationFrame(animate);
    }

    return {
        init(canvasId) {
            canvas = document.getElementById(canvasId);
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            initEvents();

            // Init Blossoms
            for (let i = 0; i < 30; i++) blossoms.push(new Blossom());

            animate();
        },

        fireConfetti() {
            for (let i = 0; i < 150; i++) confetti.push(new Confetti());
        },

        rainCoins() {
            for (let i = 0; i < 50; i++) coins.push(new GoldCoin());
            // Sustain rain for a bit
            let rainInterval = setInterval(() => {
                for (let i = 0; i < 5; i++) coins.push(new GoldCoin());
            }, 100);
            setTimeout(() => clearInterval(rainInterval), 2000);
        },

        // New Fireworks Effect
        fireworks() {
            const colors = ['#ff0000', '#ffd700', '#ffffff', '#00ff00', '#0000ff'];
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2);
            for (let i = 0; i < 50; i++) {
                const particle = new DragonSpark(x, y);
                particle.color = colors[Math.floor(Math.random() * colors.length)];
                particle.vx = (Math.random() - 0.5) * 10;
                particle.vy = (Math.random() - 0.5) * 10;
                particle.life = 2.0;
                particle.decay = 0.03;
                trail.push(particle);
            }
        }
    };
})();

// Expose legacy names for compatibility
const ConfettiSystem = {
    init: (id) => OverlayEffects.init(id),
    fire: () => OverlayEffects.fireConfetti(),
    rainCoins: () => OverlayEffects.rainCoins(),
    fireworks: () => OverlayEffects.fireworks()
};
