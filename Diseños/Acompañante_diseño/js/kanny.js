/**
 * Kanny Class
 * Represents the digital pet. Manages state machine, smooth transitions (Lerp),
 * rendering of the sphere, eyes, and coordinates the particle system.
 */

class Kanny {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.baseRadius = 150; // Kanny's core size
        this.centerX = 0;
        this.centerY = 0;
        
        this.particleSystem = new ParticleSystem(50, this.baseRadius);
        
        this.time = 0;
        this.wobblePhase = 0;
        
        // Define all possible states and their physical/visual parameters
        this.states = {
            afk: {
                particleSpeed: 0.8,
                chaos: 0,
                orbit: 1.5,
                glow: 15,
                wobbleAmt: 2,
                wobbleSpeed: 0.02,
                connectionThreshold: 0,
                waveMode: 0,
                bounceMode: 0,
                eyeSep: 30,
                eyeScale: 2.0,
                eyeTilt: 0,
                floatAmp: 10,
                colorR: 0, colorG: 200, colorB: 220
            },
            normal: {
                particleSpeed: 0.4,
                chaos: 0,
                orbit: 0,
                glow: 25,
                wobbleAmt: 3,
                wobbleSpeed: 0.05,
                connectionThreshold: 0,
                waveMode: 1.0,
                bounceMode: 0,
                eyeSep: 35,
                eyeScale: 2.2,
                eyeTilt: 0,
                floatAmp: 5,
                colorR: 0, colorG: 240, colorB: 255
            },
            erratic: {
                particleSpeed: 3.5,
                chaos: 1.0,
                orbit: 0,
                glow: 60,
                wobbleAmt: 25,
                wobbleSpeed: 0.2,
                connectionThreshold: 90,
                waveMode: 0,
                bounceMode: 1.0,
                eyeSep: 45,
                eyeScale: 2.8,
                eyeTilt: 0.2, // slight crazy tilt
                floatAmp: 2,
                colorR: 50, colorG: 255, colorB: 255
            },
            break: {
                particleSpeed: 0.1,
                chaos: 0,
                orbit: 0.05,
                glow: 5,
                wobbleAmt: 0,
                wobbleSpeed: 0,
                connectionThreshold: 0,
                waveMode: 0,
                bounceMode: 0,
                eyeSep: 22,
                eyeScale: 0.5, // "closed/sleepy" eyes
                eyeTilt: 0,
                floatAmp: 15,
                colorR: 0, colorG: 100, colorB: 120
            }
        };

        this.currentStateName = 'afk';
        this.targetParams = { ...this.states[this.currentStateName] };
        this.currentParams = { ...this.states[this.currentStateName] };
        
        // Ensure starting at 0 for color interpolations just in case
    }

    setState(stateName) {
        if (this.states[stateName]) {
            this.currentStateName = stateName;
            this.targetParams = { ...this.states[stateName] };
        }
    }

    // Helper for linear interpolation
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    update() {
        this.time++;
        this.wobblePhase += this.currentParams.wobbleSpeed;
        
        // Easing speed. Lower = smoother/slower transitions
        const easing = 0.03; 

        // Lerp all parameters towards the target state
        for (const key in this.targetParams) {
            this.currentParams[key] = this.lerp(
                this.currentParams[key], 
                this.targetParams[key], 
                easing
            );
            
            // Snap to target to prevent asymptotic floating
            if (Math.abs(this.currentParams[key] - this.targetParams[key]) < 0.005) {
                this.currentParams[key] = this.targetParams[key];
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.centerX = this.canvas.width / 2;
        // Apply floating animation
        this.centerY = this.canvas.height / 2 + Math.sin(this.time * 0.03) * this.currentParams.floatAmp;

        this.drawBody();
        
        // Update and draw particles inside Kanny
        // Pass current interpolated parameters to particle system
        this.particleSystem.updateAndDraw(
            this.ctx, 
            this.centerX, 
            this.centerY, 
            this.currentParams,
            this.baseRadius
        );

        this.drawEyes();
    }

    drawBody() {
        const p = this.currentParams;
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(this.centerX, this.centerY);

        // Draw organic wobbly sphere using a path
        ctx.beginPath();
        const segments = 30; // smooth enough
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Calculate wobble based on state chaos and time
            let currentRadius = this.baseRadius;
            if (p.wobbleAmt > 0) {
                // Combine sine waves for organic deformation, using accumulated phase
                const wave1 = Math.sin(angle * 3 + this.wobblePhase);
                const wave2 = Math.cos(angle * 5 - this.wobblePhase * 1.5);
                const wave3 = Math.sin(angle * 2 + this.wobblePhase * 2);
                const totalWave = (wave1 + wave2 + wave3) / 3;
                
                currentRadius += totalWave * p.wobbleAmt;
            }

            const x = Math.cos(angle) * currentRadius;
            const y = Math.sin(angle) * currentRadius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        // Create Glass Effect
        const grad = ctx.createRadialGradient(
            -this.baseRadius * 0.3, -this.baseRadius * 0.3, this.baseRadius * 0.1,
            0, 0, this.baseRadius * 1.1
        );
        
        // Convert RGB parameters to CSS strings
        const r = Math.round(p.colorR);
        const g = Math.round(p.colorG);
        const b = Math.round(p.colorB);
        
        grad.addColorStop(0, `rgba(255, 255, 255, 0.4)`); // Highlight top left
        grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.2)`);
        grad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.1)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.4)`); // Edge darkening/reflection

        ctx.fillStyle = grad;
        
        // Add outer glow
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.shadowBlur = p.glow;
        
        ctx.fill();

        // Inner glowing border for glass refraction
        ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    drawEyes() {
        const p = this.currentParams;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        
        // Subtle tracking/parallax: eyes move slightly towards the direction of wobble
        const lookX = Math.sin(this.time * 0.05) * p.wobbleAmt * 0.2;
        const lookY = Math.cos(this.time * 0.04) * p.wobbleAmt * 0.2;
        
        ctx.rotate(p.eyeTilt);

        // Left Eye
        ctx.beginPath();
        ctx.arc(-p.eyeSep + lookX, lookY, 10 * p.eyeScale, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 14;
        ctx.fill();

        // Right Eye
        ctx.beginPath();
        ctx.arc(p.eyeSep + lookX, lookY, 10 * p.eyeScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
