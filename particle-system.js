// Particle system for background effects
class ParticleSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        this.particles = [];
        this.intensity = 150;
        this.maxParticles = 500;
        
        this.gravity = 0.1;
        this.wind = 0.01;
        this.time = 0;
        
        this.colorThemes = {
            neural: ['#86a8e7', '#91eae4', '#ff7e5f', '#feb47b'],
            synth: ['#ff00ff', '#00ffff', '#ffff00', '#ff7700'],
            fire: ['#ff7e5f', '#feb47b', '#ff0000', '#ff5500'],
            ice: ['#00d2ff', '#a8ff78', '#00b4db', '#ffffff'],
            matrix: ['#00ff00', '#00cc00', '#009900', '#006600']
        };
        
        this.currentTheme = 'neural';
        
        this.initParticles();
    }
    
    initParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.intensity; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        const themeColors = this.colorThemes[this.currentTheme];
        const color = themeColors[Math.floor(Math.random() * themeColors.length)];
        
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: Math.random() * 3 + 1,
            color: color,
            opacity: Math.random() * 0.5 + 0.1,
            life: Math.random() * 100 + 50,
            maxLife: 150,
            type: Math.random() > 0.7 ? 'spark' : 'regular',
            trail: []
        };
    }
    
    update(deltaTime) {
        this.time += deltaTime / 1000;
        
        // Update wind with some variation
        this.wind = Math.sin(this.time * 0.5) * 0.02;
        
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Apply forces
            p.vx += this.wind + (Math.random() - 0.5) * 0.1;
            p.vy += this.gravity;
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Store trail for spark particles
            if (p.type === 'spark') {
                p.trail.push({x: p.x, y: p.y});
                if (p.trail.length > 5) {
                    p.trail.shift();
                }
            }
            
            // Bounce off walls
            if (p.x < 0 || p.x > this.width) {
                p.vx *= -0.8;
                p.x = Math.max(0, Math.min(this.width, p.x));
            }
            
            if (p.y < 0 || p.y > this.height) {
                p.vy *= -0.8;
                p.y = Math.max(0, Math.min(this.height, p.y));
            }
            
            // Decrease life
            p.life--;
            p.opacity = (p.life / p.maxLife) * 0.6;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Add new particles if below intensity
        while (this.particles.length < Math.min(this.intensity, this.maxParticles)) {
            this.particles.push(this.createParticle());
        }
        
        // Occasionally add burst of particles
        if (Math.random() < 0.05 && this.particles.length < this.maxParticles * 0.8) {
            this.addParticleBurst();
        }
    }
    
    addParticleBurst() {
        const burstCount = Math.floor(Math.random() * 20) + 10;
        const burstX = Math.random() * this.width;
        const burstY = Math.random() * this.height;
        
        for (let i = 0; i < burstCount; i++) {
            const p = this.createParticle();
            p.x = burstX;
            p.y = burstY;
            p.vx = (Math.random() - 0.5) * 8;
            p.vy = (Math.random() - 0.5) * 8;
            p.life = Math.random() * 30 + 20;
            p.maxLife = 50;
            p.type = 'spark';
            p.radius = Math.random() * 2 + 1;
            p.opacity = 0.8;
            
            this.particles.push(p);
        }
    }
    
    draw(ctx) {
        // Draw particle trails first
        for (const p of this.particles) {
            if (p.type === 'spark' && p.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                
                for (let i = 1; i < p.trail.length; i++) {
                    ctx.lineTo(p.trail[i].x, p.trail[i].y);
                }
                
                const gradient = ctx.createLinearGradient(
                    p.trail[0].x, p.trail[0].y,
                    p.trail[p.trail.length - 1].x, p.trail[p.trail.length - 1].y
                );
                
                gradient.addColorStop(0, this.hexToRgba(p.color, p.opacity));
                gradient.addColorStop(1, this.hexToRgba(p.color, 0));
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = p.radius * 0.5;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        }
        
        // Draw particles
        for (const p of this.particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            
            // Create radial gradient for glow
            const gradient = ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.radius * 2
            );
            
            if (p.type === 'spark') {
                gradient.addColorStop(0, this.hexToRgba('#ffffff', p.opacity));
                gradient.addColorStop(0.5, this.hexToRgba(p.color, p.opacity * 0.7));
                gradient.addColorStop(1, this.hexToRgba(p.color, 0));
            } else {
                gradient.addColorStop(0, this.hexToRgba(p.color, p.opacity));
                gradient.addColorStop(1, this.hexToRgba(p.color, 0));
            }
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Draw inner circle for spark particles
            if (p.type === 'spark') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = this.hexToRgba('#ffffff', p.opacity);
                ctx.fill();
            }
        }
        
        // Draw connection lines between close particles
        this.drawParticleConnections(ctx);
    }
    
    drawParticleConnections(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Draw line if particles are close enough
                if (distance < 100) {
                    const opacity = (1 - distance / 100) * 0.1 * 
                                   Math.min(p1.opacity, p2.opacity);
                    
                    if (opacity > 0.01) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        
                        // Create gradient line
                        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                        gradient.addColorStop(0, this.hexToRgba(p1.color, opacity));
                        gradient.addColorStop(1, this.hexToRgba(p2.color, opacity));
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    setIntensity(value) {
        this.intensity = value;
        
        // Remove particles if intensity decreased
        while (this.particles.length > this.intensity) {
            this.particles.pop();
        }
    }
    
    updateDimensions(width, height) {
        this.width = width;
        this.height = height;
    }
    
    reset() {
        this.initParticles();
    }
}
