/**
 * Particle System for Kanny
 * Handles the physics, movement, and connections of the internal luminous particles.
 */

class Particle {
    constructor(kannyRadius) {
        // Position relative to Kanny's center
        this.reset(kannyRadius);
        // Randomize initial position everywhere in the sphere
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * kannyRadius;
        this.x = Math.cos(angle) * radius;
        this.y = Math.sin(angle) * radius;
    }

    reset(kannyRadius) {
        // Spawn near the center
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (kannyRadius * 0.5);
        this.x = Math.cos(angle) * radius;
        this.y = Math.sin(angle) * radius;
        
        // Random velocity direction
        const vAngle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(vAngle);
        this.vy = Math.sin(vAngle);
        
        // Visuals
        this.baseRadius = 1.5 + Math.random() * 2.5;
        this.radius = this.baseRadius;
        this.baseAlpha = 0.3 + Math.random() * 0.7;
        this.alpha = this.baseAlpha;
        
        // Z-depth illusion for speed mapping
        this.zDepth = Math.random();

        // Wave mode properties: each particle belongs to a "wave lane"
        this.wavePhase = Math.random() * Math.PI * 2;
        this.waveFreq = 0.8 + Math.random() * 1.2; // Slightly different frequencies
        this.waveLane = (Math.random() - 0.5) * 2; // Normalized lane position (-1 to 1)
        this.waveDir = Math.random() * Math.PI * 2; // Direction angle of the wave path
    }

    update(params, kannyRadius, time, waveTime) {
        // Calculate jitter for chaotic states (ERRATIC)
        let jitterX = 0;
        let jitterY = 0;
        if (params.chaos > 0) {
            jitterX = (Math.random() - 0.5) * params.chaos * 5;
            jitterY = (Math.random() - 0.5) * params.chaos * 5;
        }

        // 1. Calculate base physics depending on state
        if (params.bounceMode > 0.5) {
            // Bounce mode physics (used primarily in ERRATIC)
            const speed = params.particleSpeed * (0.7 + this.zDepth * 0.3);
            
            // Move with jitter
            this.x += this.vx * speed + jitterX * speed;
            this.y += this.vy * speed + jitterY * speed;
            
            // Check collision with sphere boundary
            const dist = Math.hypot(this.x, this.y);
            const boundary = kannyRadius * 0.88;
            
            if (dist >= boundary) {
                // Reflect velocity off the sphere wall
                const nx = -this.x / dist;
                const ny = -this.y / dist;
                const dot = this.vx * nx + this.vy * ny;
                
                this.vx = this.vx - 2 * dot * nx;
                this.vy = this.vy - 2 * dot * ny;
                
                // Push particle back inside
                this.x = (this.x / dist) * boundary * 0.98;
                this.y = (this.y / dist) * boundary * 0.98;
                
                // Add slight randomness on bounce
                this.vx += (Math.random() - 0.5) * 0.3;
                this.vy += (Math.random() - 0.5) * 0.3;
            }
            
            // Keep velocity magnitude consistent
            const currentSpeed = Math.hypot(this.vx, this.vy);
            if (currentSpeed > 0) {
                const targetSpeed = 1.5 + this.zDepth;
                this.vx = (this.vx / currentSpeed) * targetSpeed;
                this.vy = (this.vy / currentSpeed) * targetSpeed;
            }
            
            // Flickering alpha for intensity
            this.alpha = this.baseAlpha * (0.6 + 0.4 * Math.abs(Math.sin(Date.now() * 0.02 * this.zDepth)));
            this.alpha = Math.max(0.3, Math.min(1, this.alpha));
            
        } else {
            // Default physics (used in AFK, BREAK)
            const speedMult = params.particleSpeed * (0.5 + this.zDepth * 0.5);
            
            // Circular orbital movement tendency
            if (params.orbit > 0) {
                const distFromCenter = Math.hypot(this.x, this.y);
                if (distFromCenter > 0) {
                    const nx = this.x / distFromCenter;
                    const ny = this.y / distFromCenter;
                    this.vx += -ny * params.orbit * 0.05;
                    this.vy += nx * params.orbit * 0.05;
                }
            }

            // Dampen velocity to prevent infinite acceleration
            this.vx *= 0.98;
            this.vy *= 0.98;

            // Base wandering
            this.vx += (Math.random() - 0.5) * 0.1;
            this.vy += (Math.random() - 0.5) * 0.1;

            // Normalize base velocity to keep it moving constantly
            const currentSpeed = Math.hypot(this.vx, this.vy);
            if (currentSpeed > 0 && currentSpeed < 0.5) {
                this.vx = (this.vx / currentSpeed) * 0.5;
                this.vy = (this.vy / currentSpeed) * 0.5;
            }

            // Move with jitter
            this.x += (this.vx + jitterX) * speedMult;
            this.y += (this.vy + jitterY) * speedMult;

            // Constrain to sphere (soft bounce)
            const dist = Math.hypot(this.x, this.y);
            const boundary = kannyRadius * 0.9; 
            
            if (dist > boundary) {
                const nx = this.x / dist;
                const ny = this.y / dist;
                
                this.vx -= nx * 0.2 * speedMult;
                this.vy -= ny * 0.2 * speedMult;
                
                if (dist > kannyRadius * 1.1) {
                    this.reset(kannyRadius);
                }
            }

            // Pulse alpha
            this.alpha = this.baseAlpha + params.chaos * 0.3 * Math.sin(Date.now() * 0.01 * this.zDepth);
            this.alpha = Math.max(0.1, Math.min(1, this.alpha));
        }

        // 2. Apply Wave Mode Override (NORMAL)
        // This cleanly blends the calculated physics position towards the wave position,
        // allowing smooth transitions without freezing or flickering the particles.
        if (params.waveMode > 0.001) {
            const waveInfluence = params.waveMode;
            // Use a softer blend curve so it doesn't snap instantly on the first frames
            const blendPower = waveInfluence * waveInfluence;
            
            const progress = waveTime + this.wavePhase;
            
            const along = Math.sin(progress * 0.5) * kannyRadius * 0.75;
            const perpAmt = Math.sin(progress * this.waveFreq + this.waveLane * Math.PI) * kannyRadius * 0.35;
            const laneOffset = this.waveLane * kannyRadius * 0.6;
            
            const dirX = Math.cos(this.waveDir);
            const dirY = Math.sin(this.waveDir);
            const perpX = -dirY;
            const perpY = dirX;
            
            const waveX = along * dirX + (perpAmt + laneOffset) * perpX;
            const waveY = along * dirY + (perpAmt + laneOffset) * perpY;
            
            // Blend between free movement and wave position using softer blend
            this.x = this.x * (1 - blendPower) + waveX * blendPower;
            this.y = this.y * (1 - blendPower) + waveY * blendPower;
            
            // Keep velocity loosely synced so they fly correctly when released
            if (waveInfluence > 0.5) {
                this.vx = (waveX - this.x) * 0.1;
                this.vy = (waveY - this.y) * 0.1;
            }
            
            // Constrain to sphere smoothly instead of hard snapping
            const dist = Math.hypot(this.x, this.y);
            const waveBoundary = kannyRadius * 0.85;
            if (dist > waveBoundary) {
                const overage = dist - waveBoundary;
                this.x -= (this.x / dist) * overage * blendPower;
                this.y -= (this.y / dist) * overage * blendPower;
            }
            
            // Blend alpha gently to avoid flickering
            const targetWaveAlpha = this.baseAlpha * (0.7 + 0.3 * Math.sin(progress * 2));
            this.alpha = this.alpha * (1 - blendPower) + targetWaveAlpha * blendPower;
            this.alpha = Math.max(0.1, Math.min(1, this.alpha));
        }
    }

    draw(ctx, centerX, centerY) {
        ctx.beginPath();
        ctx.arc(centerX + this.x, centerY + this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        // Slight glow for particles
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0, 240, 255, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    }
}

class ParticleSystem {
    constructor(count, kannyRadius) {
        this.particles = [];
        this.kannyRadius = kannyRadius;
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(kannyRadius));
        }
    }

    updateAndDraw(ctx, centerX, centerY, params, kannyRadius) {
        this.kannyRadius = kannyRadius;
        this.time = (this.time || 0) + 1;
        this.waveTime = (this.waveTime || 0) + params.particleSpeed * 0.03;
        
        // Update all
        for (const p of this.particles) {
            p.update(params, kannyRadius, this.time, this.waveTime);
        }

        // Draw wave trails in AFK mode
        if (params.waveMode > 0) {
            ctx.lineWidth = 1.5;
            const trailAlpha = 0.3 * params.waveMode;
            
            // Group particles into wave "streams" and draw connecting curves
            // Sort by waveLane to create smooth trails
            const sorted = [...this.particles].sort((a, b) => a.waveDir - b.waveDir);
            
            // Draw trails connecting nearby particles that share similar wave directions
            for (let i = 0; i < sorted.length - 1; i++) {
                const p1 = sorted[i];
                const p2 = sorted[i + 1];
                
                // Only connect particles with similar wave direction
                const dirDiff = Math.abs(p1.waveDir - p2.waveDir);
                if (dirDiff < 0.3) {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.hypot(dx, dy);
                    
                    if (dist < kannyRadius * 0.8 && dist > 5) {
                        const alpha = trailAlpha * (1 - dist / (kannyRadius * 0.8));
                        ctx.beginPath();
                        ctx.moveTo(centerX + p1.x, centerY + p1.y);
                        // Smooth curve through midpoint
                        const midX = (p1.x + p2.x) / 2;
                        const midY = (p1.y + p2.y) / 2;
                        ctx.quadraticCurveTo(
                            centerX + midX + (Math.sin(this.time * 0.02 + i) * 5),
                            centerY + midY + (Math.cos(this.time * 0.02 + i) * 5),
                            centerX + p2.x, 
                            centerY + p2.y
                        );
                        ctx.strokeStyle = `rgba(0, 220, 240, ${alpha})`;
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw connections if threshold is > 0 (Erratic state)
        if (params.connectionThreshold > 0) {
            ctx.lineWidth = 1;
            
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p1 = this.particles[i];
                    const p2 = this.particles[j];
                    
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;
                    
                    const threshSq = params.connectionThreshold * params.connectionThreshold;
                    
                    if (distSq < threshSq) {
                        const dist = Math.sqrt(distSq);
                        // Alpha inversely proportional to distance
                        const alpha = (1 - (dist / params.connectionThreshold)) * 0.6;
                        
                        ctx.beginPath();
                        ctx.moveTo(centerX + p1.x, centerY + p1.y);
                        // Erratic zigzag line effect (neural)
                        if (params.chaos > 0.5 && dist > params.connectionThreshold * 0.3) {
                            const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 20 * params.chaos;
                            const midY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 20 * params.chaos;
                            ctx.lineTo(centerX + midX, centerY + midY);
                        }
                        
                        ctx.lineTo(centerX + p2.x, centerY + p2.y);
                        ctx.strokeStyle = `rgba(150, 240, 255, ${alpha})`;
                        ctx.stroke();
                    }
                }
            }
        }

        // Draw particles
        for (const p of this.particles) {
            p.draw(ctx, centerX, centerY);
        }
    }
}
