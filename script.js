// Main application controller
class VisualNeuralApp {
    constructor() {
        this.canvas = document.getElementById('neuralCanvas');
        this.particleCanvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particleCtx = this.particleCanvas.getContext('2d');
        
        this.neuralNetwork = null;
        this.particleSystem = null;
        
        this.iteration = 0;
        this.loss = 0;
        this.accuracy = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        
        this.isTraining = true;
        this.animationSpeed = 5;
        this.particleIntensity = 150;
        this.connectionVisibility = 80;
        this.currentTheme = 'neural';
        
        this.themes = {
            neural: { bg: ['#0f0c29', '#302b63', '#24243e'], neuron: '#86a8e7', connection: '#91eae4' },
            synth: { bg: ['#0f0f2d', '#1a1a4a', '#2d1b69'], neuron: '#ff00ff', connection: '#00ffff' },
            fire: { bg: ['#200122', '#6f0000', '#8e0e00'], neuron: '#ff7e5f', connection: '#feb47b' },
            ice: { bg: ['#003973', '#007991', '#00b4db'], neuron: '#00d2ff', connection: '#a8ff78' },
            matrix: { bg: ['#000000', '#003300', '#006600'], neuron: '#00ff00', connection: '#00cc00' }
        };
        
        this.init();
    }
    
    init() {
        // Set canvas dimensions
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
        
        // Initialize systems
        this.neuralNetwork = new NeuralNetwork(
            this.canvas.width, 
            this.canvas.height,
            this.themes[this.currentTheme]
        );
        
        this.particleSystem = new ParticleSystem(
            this.particleCanvas.width,
            this.particleCanvas.height
        );
        
        // Setup controls
        this.setupControls();
        
        // Start animation loop
        this.animate();
        
        // Start stats update
        this.updateStats();
    }
    
    resizeCanvases() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        this.particleCanvas.width = container.clientWidth;
        this.particleCanvas.height = container.clientHeight;
        
        if (this.neuralNetwork) {
            this.neuralNetwork.updateDimensions(this.canvas.width, this.canvas.height);
        }
        
        if (this.particleSystem) {
            this.particleSystem.updateDimensions(this.particleCanvas.width, this.particleCanvas.height);
        }
    }
    
    setupControls() {
        // Complexity slider
        const complexitySlider = document.getElementById('complexity-slider');
        const complexityValue = document.getElementById('complexity-value');
        
        complexitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            complexityValue.textContent = value;
            this.neuralNetwork.setComplexity(value);
            this.updateArchitectureDisplay();
        });
        
        // Learning rate slider
        const learningRateSlider = document.getElementById('learning-rate-slider');
        const learningRateValue = document.getElementById('learning-rate-value');
        
        learningRateSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            learningRateValue.textContent = value.toFixed(3);
            this.neuralNetwork.setLearningRate(value);
        });
        
        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            speedValue.textContent = this.animationSpeed;
        });
        
        // Particle slider
        const particleSlider = document.getElementById('particle-slider');
        const particleValue = document.getElementById('particle-value');
        
        particleSlider.addEventListener('input', (e) => {
            this.particleIntensity = parseInt(e.target.value);
            particleValue.textContent = this.particleIntensity;
            this.particleSystem.setIntensity(this.particleIntensity);
        });
        
        // Connection visibility slider
        const connectionSlider = document.getElementById('connection-slider');
        const connectionValue = document.getElementById('connection-value');
        
        connectionSlider.addEventListener('input', (e) => {
            this.connectionVisibility = parseInt(e.target.value);
            connectionValue.textContent = `${this.connectionVisibility}%`;
        });
        
        // Activation function dropdown
        const activationSelect = document.getElementById('activation-select');
        activationSelect.addEventListener('change', (e) => {
            this.neuralNetwork.setActivationFunction(e.target.value);
        });
        
        // Theme dropdown
        const themeSelect = document.getElementById('theme-select');
        themeSelect.addEventListener('change', (e) => {
            this.currentTheme = e.target.value;
            this.neuralNetwork.setTheme(this.themes[this.currentTheme]);
        });
        
        // Toggle training button
        const toggleTrainingBtn = document.getElementById('toggle-training');
        const trainingStatus = document.getElementById('training-status');
        const statusIndicator = document.querySelector('.status-indicator');
        
        toggleTrainingBtn.addEventListener('click', () => {
            this.isTraining = !this.isTraining;
            
            if (this.isTraining) {
                toggleTrainingBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Training';
                trainingStatus.textContent = 'Training: Active';
                statusIndicator.classList.remove('paused');
                statusIndicator.classList.add('active');
            } else {
                toggleTrainingBtn.innerHTML = '<i class="fas fa-play"></i> Resume Training';
                trainingStatus.textContent = 'Training: Paused';
                statusIndicator.classList.remove('active');
                statusIndicator.classList.add('paused');
            }
        });
        
        // Reset network button
        const resetNetworkBtn = document.getElementById('reset-network');
        resetNetworkBtn.addEventListener('click', () => {
            this.neuralNetwork.reset();
            this.particleSystem.reset();
            this.iteration = 0;
            this.loss = 0;
            this.accuracy = 0;
            this.updateStats();
        });
        
        // Export network button
        const exportNetworkBtn = document.getElementById('export-network');
        exportNetworkBtn.addEventListener('click', () => {
            this.exportNetworkData();
        });
        
        // Update architecture display
        this.updateArchitectureDisplay();
    }
    
    updateArchitectureDisplay() {
        const complexity = parseInt(document.getElementById('complexity-slider').value);
        const inputLayer = document.getElementById('input-layer');
        const hiddenLayers = document.getElementById('hidden-layers');
        const outputLayer = document.getElementById('output-layer');
        
        inputLayer.textContent = `${4 + complexity * 2} neurons`;
        hiddenLayers.textContent = `${complexity} layers`;
        outputLayer.textContent = `${2 + complexity} neurons`;
        
        // Update neuron count in stats
        const neuronCount = document.getElementById('neuron-count');
        const totalNeurons = (4 + complexity * 2) + (complexity * (6 + complexity)) + (2 + complexity);
        neuronCount.textContent = totalNeurons;
    }
    
    animate() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        // Calculate FPS
        this.frameCount++;
        if (currentTime >= this.lastFrameTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
        
        // Clear canvases
        this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particle system
        this.particleSystem.update(deltaTime);
        this.particleSystem.draw(this.particleCtx);
        
        // Update and draw neural network
        if (this.isTraining) {
            this.neuralNetwork.trainStep();
            this.iteration++;
            
            // Update loss and accuracy
            this.loss = this.neuralNetwork.getCurrentLoss();
            this.accuracy = this.neuralNetwork.getCurrentAccuracy();
        }
        
        this.neuralNetwork.draw(this.ctx, this.connectionVisibility);
        
        // Request next frame with speed adjustment
        setTimeout(() => {
            requestAnimationFrame(() => this.animate());
        }, 100 / this.animationSpeed);
    }
    
    updateStats() {
        document.getElementById('iteration-count').textContent = this.iteration;
        document.getElementById('loss-value').textContent = this.loss.toFixed(4);
        document.getElementById('accuracy-value').textContent = `${Math.round(this.accuracy * 100)}%`;
        document.getElementById('fps-counter').textContent = this.fps;
        
        // Update every second
        setTimeout(() => this.updateStats(), 1000);
    }
    
    exportNetworkData() {
        const networkData = {
            iteration: this.iteration,
            loss: this.loss,
            accuracy: this.accuracy,
            complexity: parseInt(document.getElementById('complexity-slider').value),
            learningRate: parseFloat(document.getElementById('learning-rate-slider').value),
            activationFunction: document.getElementById('activation-select').value,
            timestamp: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(networkData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `neural-network-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show notification
        this.showNotification('Network data exported successfully!');
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            border-left: 4px solid #86a8e7;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-check-circle" style="color:#4CAF50;margin-right:10px"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
        
        // Add animation keyframes
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize the app when the page loads
window.addEventListener('load', () => {
    window.app = new VisualNeuralApp();
});
