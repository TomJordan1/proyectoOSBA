/**
 * Main Script
 * Initializes the application, handles resize, UI events, and the main animation loop.
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('kanny-canvas');
    const ctx = canvas.getContext('2d');
    
    // UI Elements
    const btnAfk = document.getElementById('btn-afk');
    const btnNormal = document.getElementById('btn-normal');
    const btnErratic = document.getElementById('btn-erratic');
    const btnBreak = document.getElementById('btn-break');
    const btnAuto = document.getElementById('btn-auto');
    
    const stateButtons = [btnAfk, btnNormal, btnErratic, btnBreak];
    
    // Resize handler
    function resizeCanvas() {
        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        // We also need to tell Kanny the logical size
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        
        // Save logical size as custom properties for easy access in Kanny
        canvas.logicalWidth = window.innerWidth;
        canvas.logicalHeight = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Initialize Kanny
    const kanny = new Kanny(canvas);
    // Modify kanny rendering to use logical size
    kanny.render = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.centerX = this.canvas.logicalWidth / 2;
        this.centerY = this.canvas.logicalHeight / 2 + Math.sin(this.time * 0.03) * this.currentParams.floatAmp;
        
        this.drawBody();
        this.particleSystem.updateAndDraw(
            this.ctx, 
            this.centerX, 
            this.centerY, 
            this.currentParams,
            this.baseRadius
        );
        this.drawEyes();
    }
    
    // Main Loop
    function animate() {
        kanny.update();
        kanny.render();
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // UI Logic
    function updateActiveButton(activeBtn) {
        stateButtons.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }
    
    function changeState(state, btn) {
        kanny.setState(state);
        updateActiveButton(btn);
        
        // Handle global body classes for environment changes (e.g. BREAK state darkens screen)
        if (state === 'break') {
            document.body.classList.add('state-break');
        } else {
            document.body.classList.remove('state-break');
        }
    }
    
    btnAfk.addEventListener('click', () => {
        disableAuto();
        changeState('afk', btnAfk);
    });
    
    btnNormal.addEventListener('click', () => {
        disableAuto();
        changeState('normal', btnNormal);
    });
    
    btnErratic.addEventListener('click', () => {
        disableAuto();
        changeState('erratic', btnErratic);
    });
    
    btnBreak.addEventListener('click', () => {
        disableAuto();
        changeState('break', btnBreak);
    });
    
    // Auto Mode Logic
    let autoInterval = null;
    let autoActive = false;
    const autoSequence = [
        { state: 'afk', btn: btnAfk, duration: 4000 },
        { state: 'normal', btn: btnNormal, duration: 4000 },
        { state: 'erratic', btn: btnErratic, duration: 4000 },
        { state: 'break', btn: btnBreak, duration: 3000 }
    ];
    let autoIndex = 0;
    
    function runAutoSequence() {
        if (!autoActive) return;
        
        const step = autoSequence[autoIndex];
        changeState(step.state, step.btn);
        
        autoIndex = (autoIndex + 1) % autoSequence.length;
        
        autoInterval = setTimeout(runAutoSequence, step.duration);
    }
    
    function toggleAuto() {
        autoActive = !autoActive;
        if (autoActive) {
            btnAuto.classList.add('active');
            btnAuto.textContent = 'AUTO: ON';
            autoIndex = 0;
            runAutoSequence();
        } else {
            disableAuto();
        }
    }
    
    function disableAuto() {
        autoActive = false;
        btnAuto.classList.remove('active');
        btnAuto.textContent = 'AUTO: OFF';
        if (autoInterval) {
            clearTimeout(autoInterval);
            autoInterval = null;
        }
    }
    
    btnAuto.addEventListener('click', toggleAuto);
});
