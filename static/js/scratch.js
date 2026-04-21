class ScratchCard {
    constructor() {
        this.canvas = document.getElementById('scratchCanvas');
        this.ctx = this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.scratchThreshold = 0.6;
        this.isCompleted = false;
        this.currentRiddle = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.bindEvents();
        this.loadRiddle();
    }

    setupCanvas() {
        const card = document.getElementById('scratchCard');
        this.canvas.width = card.offsetWidth;
        this.canvas.height = card.offsetHeight;
        
        this.drawScratchLayer();
    }

    drawScratchLayer() {
        this.ctx.globalCompositeOperation = 'source-over';
        
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#c0c0c0');
        gradient.addColorStop(0.5, '#a0a0a0');
        gradient.addColorStop(1, '#808080');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('刮开有奖', this.canvas.width / 2, this.canvas.height / 2);
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });

        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextRiddle());
        document.getElementById('confirmBtn').addEventListener('click', () => this.closeModal());
    }

    startDrawing(e) {
        if (this.isCompleted) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }

    draw(e) {
        if (!this.isDrawing || this.isCompleted) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        
        this.lastX = x;
        this.lastY = y;
        
        this.checkProgress();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    checkProgress() {
        if (this.isCompleted) return;
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;
        let transparentPixels = 0;
        const totalPixels = pixels.length / 4;
        
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }
        
        const percentage = transparentPixels / totalPixels;
        this.updateProgressBar(percentage);
        
        if (percentage >= this.scratchThreshold) {
            this.completeScratch();
        }
    }

    updateProgressBar(percentage) {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        
        const percent = Math.round(percentage * 100);
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    }

    completeScratch() {
        if (this.isCompleted) return;
        
        this.isCompleted = true;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateProgressBar(1);
        
        setTimeout(() => {
            this.showModal();
        }, 500);
    }

    showModal() {
        const modal = document.getElementById('successModal');
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('successModal');
        modal.classList.remove('active');
        
        document.getElementById('nextBtn').disabled = false;
    }

    reset() {
        this.isCompleted = false;
        this.drawScratchLayer();
        this.updateProgressBar(0);
        document.getElementById('nextBtn').disabled = true;
    }

    async loadRiddle() {
        try {
            const response = await fetch('/api/riddle');
            const riddle = await response.json();
            this.currentRiddle = riddle;
            this.displayRiddle(riddle);
        } catch (error) {
            console.error('Failed to load riddle:', error);
        }
    }

    displayRiddle(riddle) {
        document.getElementById('questionText').textContent = riddle.question;
        document.getElementById('answerText').textContent = riddle.answer;
    }

    nextRiddle() {
        this.reset();
        this.loadRiddle();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ScratchCard();
});
