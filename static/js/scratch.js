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
        this.currentCategory = null;
        this.categories = [];
        this.particles = [];
        this.audioContext = null;
        this.scratchSound = null;
        this.revealSound = null;
        this.userGuess = '';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initAudio();
        this.loadCategories();
        this.animate();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not supported:', e);
        }
    }

    createScratchSound() {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        gainNode.gain.value = 0.1;
        
        whiteNoise.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        whiteNoise.start();
        return { oscillator: whiteNoise, gainNode };
    }

    createRevealSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }

    setupCanvas() {
        const card = document.getElementById('scratchCard');
        this.canvas.width = card.offsetWidth;
        this.canvas.height = card.offsetHeight;
        
        this.drawScratchLayer();
    }

    drawScratchLayer() {
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('Canvas dimensions are zero, cannot draw scratch layer');
            return;
        }
        
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
        document.getElementById('backToTheme').addEventListener('click', () => this.backToTheme());
        document.getElementById('guessInput').addEventListener('input', (e) => this.userGuess = e.target.value);
        document.getElementById('shareBtn').addEventListener('click', () => this.showShareModal());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadPoster());
        document.getElementById('closeShareBtn').addEventListener('click', () => this.closeShareModal());
        document.getElementById('submitBtn').addEventListener('click', () => this.showSubmitModal());
        document.getElementById('closeSubmitBtn').addEventListener('click', () => this.closeSubmitModal());
        document.getElementById('submitForm').addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/categories');
            this.categories = await response.json();
            this.displayThemeCards();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    displayThemeCards() {
        const themeGrid = document.getElementById('themeGrid');
        themeGrid.innerHTML = '';

        const themeIcons = {
            '马年特辑': '🐎',
            '打工人日常': '💼',
            '地狱笑话': '😂',
            '趣味生活': '🌟',
            '动物世界': '🐾'
        };

        this.categories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'theme-card';
            card.innerHTML = `
                <div class="theme-icon">${themeIcons[category] || '🎯'}</div>
                <div class="theme-name">${category}</div>
            `;
            card.addEventListener('click', () => this.selectCategory(category));
            themeGrid.appendChild(card);
        });
    }

    selectCategory(category) {
        this.currentCategory = category;
        document.getElementById('themeHall').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        
        setTimeout(() => {
            this.setupCanvas();
            this.loadRiddle();
        }, 100);
    }

    backToTheme() {
        this.currentCategory = null;
        document.getElementById('gameArea').style.display = 'none';
        document.getElementById('themeHall').style.display = 'block';
    }

    showShareModal() {
        const shareModal = document.getElementById('shareModal');
        this.generatePoster();
        shareModal.classList.add('active');
    }

    closeShareModal() {
        const shareModal = document.getElementById('shareModal');
        shareModal.classList.remove('active');
    }

    generatePoster() {
        const posterContainer = document.getElementById('posterContainer');
        posterContainer.innerHTML = `
            <div class="poster-question">${this.currentRiddle.question}</div>
            <div class="poster-answer">${this.currentRiddle.answer}</div>
            <div class="poster-footer">
                <p>谐音梗刮刮乐</p>
                <p>快来挑战你的脑洞！</p>
            </div>
        `;
    }

    downloadPoster() {
        // 创建一个canvas元素用于生成海报图片
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // 绘制渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 300, 400);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 400);

        // 绘制内容
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 绘制问题
        const questionLines = this.wrapText(this.currentRiddle.question, 260, 16);
        questionLines.forEach((line, index) => {
            ctx.fillText(line, 150, 100 + index * 25);
        });

        // 绘制答案
        ctx.font = 'bold 20px Arial';
        const answerLines = this.wrapText(this.currentRiddle.answer, 260, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(20, 180, 260, 100);
        ctx.fillStyle = '#667eea';
        answerLines.forEach((line, index) => {
            ctx.fillText(line, 150, 230 + index * 30);
        });

        // 绘制页脚
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('谐音梗刮刮乐', 150, 350);
        ctx.fillText('快来挑战你的脑洞！', 150, 370);

        // 转换为图片并下载
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'punny-poster.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    wrapText(text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = `${fontSize}px Arial`;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    showSubmitModal() {
        const submitModal = document.getElementById('submitModal');
        submitModal.classList.add('active');
    }

    closeSubmitModal() {
        const submitModal = document.getElementById('submitModal');
        submitModal.classList.remove('active');
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const question = document.getElementById('submitQuestion').value;
        const answer = document.getElementById('submitAnswer').value;
        const hint = document.getElementById('submitHint').value;
        const category = document.getElementById('submitCategory').value;
        
        try {
            const response = await fetch('/api/submit-riddle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question,
                    answer,
                    hint,
                    category
                })
            });
            
            const result = await response.json();
            
            // 显示提交成功的提示
            alert(result.message || '提交成功！等待审核。');
            
            // 清空表单
            document.getElementById('submitForm').reset();
            this.closeSubmitModal();
        } catch (error) {
            console.error('Failed to submit riddle:', error);
            alert('提交失败，请稍后重试。');
        }
    }

    createParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                size: Math.random() * 5 + 2,
                speedX: Math.random() * 6 - 3,
                speedY: Math.random() * -5 - 2,
                color: `rgba(${Math.random() * 150 + 100}, ${Math.random() * 150 + 100}, ${Math.random() * 150 + 100}, 0.8)`,
                life: 1,
                decay: Math.random() * 0.03 + 0.01
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.particles.length === 0) return;
        if (this.canvas.width === 0 || this.canvas.height === 0) return;
        
        // 绘制粒子
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += 0.2;
            p.life -= p.decay;
            p.size *= 0.98;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        this.ctx.restore();
    }

    startDrawing(e) {
        if (this.isCompleted) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        
        // 开始刮擦音效
        if (!this.scratchSound && this.audioContext) {
            this.scratchSound = this.createScratchSound();
        }
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
        
        // 创建粒子效果
        this.createParticles(x, y);
        
        this.lastX = x;
        this.lastY = y;
        
        this.checkProgress();
    }

    stopDrawing() {
        this.isDrawing = false;
        
        // 停止刮擦音效
        if (this.scratchSound) {
            this.scratchSound.oscillator.stop();
            this.scratchSound = null;
        }
    }

    checkProgress() {
        if (this.isCompleted) return;
        
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('Canvas dimensions are zero, cannot check progress');
            return;
        }
        
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
        
        // 停止刮擦音效
        if (this.scratchSound) {
            this.scratchSound.oscillator.stop();
            this.scratchSound = null;
        }
        
        // 播放答案揭晓音效
        this.createRevealSound();
        
        setTimeout(() => {
            this.showModal();
        }, 500);
    }

    getEvaluation() {
        if (!this.userGuess) {
            return { text: '你没有猜哦！', icon: '🤔' };
        }

        const answer = this.currentRiddle.answer.toLowerCase();
        const guess = this.userGuess.toLowerCase();

        // 检查是否完全匹配
        if (guess === answer) {
            return { text: '神算子！完全正确！', icon: '🧠' };
        }

        // 检查是否部分匹配
        if (answer.includes(guess) || guess.includes(answer)) {
            return { text: '就差一点！接近正确答案了！', icon: '💡' };
        }

        // 检查是否有共同的关键词
        const answerWords = answer.replace(/[()（）]/g, '').split(/\s+/);
        const guessWords = guess.split(/\s+/);
        const commonWords = answerWords.filter(word => guessWords.some(guessWord => 
            word.includes(guessWord) || guessWord.includes(word)
        ));

        if (commonWords.length > 0) {
            return { text: '有点头绪！继续加油！', icon: '👍' };
        }

        // 完全不匹配
        return { text: '脑洞大开！下次再来！', icon: '😂' };
    }

    showModal() {
        const modal = document.getElementById('successModal');
        const evaluation = this.getEvaluation();
        
        // 更新模态框内容
        modal.querySelector('.modal-icon').textContent = evaluation.icon;
        modal.querySelector('.modal-title').textContent = evaluation.text;
        modal.querySelector('.modal-text').textContent = `答案：${this.currentRiddle.answer}`;
        
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('successModal');
        modal.classList.remove('active');
        
        document.getElementById('nextBtn').disabled = false;
    }

    reset() {
        this.isCompleted = false;
        this.userGuess = '';
        
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.setupCanvas();
        }
        
        this.drawScratchLayer();
        this.updateProgressBar(0);
        document.getElementById('nextBtn').disabled = true;
        document.getElementById('guessInput').value = '';
    }

    async loadRiddle() {
        try {
            let url = '/api/riddle';
            if (this.currentCategory) {
                url = `/api/riddle/${encodeURIComponent(this.currentCategory)}`;
            }
            const response = await fetch(url);
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
