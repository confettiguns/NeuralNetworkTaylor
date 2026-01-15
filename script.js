class NeuralNetwork {
    constructor(layers, activation = 'sigmoid') {
        this.layers = layers;
        this.activation = activation;
        this.weights = [];
        this.biases = [];
        this.initializeWeights();
    }

    initializeWeights() {
        for (let i = 0; i < this.layers.length - 1; i++) {
            const rows = this.layers[i + 1];
            const cols = this.layers[i];
            const weightMatrix = Array(rows).fill().map(() => 
                Array(cols).fill().map(() => (Math.random() * 2 - 1) * Math.sqrt(2 / cols))
            );
            const biasVector = Array(rows).fill().map(() => Math.random() * 0.1);
            
            this.weights.push(weightMatrix);
            this.biases.push(biasVector);
        }
    }

    activate(x) {
        switch(this.activation) {
            case 'relu':
                return Math.max(0, x);
            case 'tanh':
                return Math.tanh(x);
            case 'sigmoid':
            default:
                return 1 / (1 + Math.exp(-x));
        }
    }

    activateDerivative(x) {
        switch(this.activation) {
            case 'relu':
                return x > 0 ? 1 : 0;
            case 'tanh':
                return 1 - x * x;
            case 'sigmoid':
            default:
                const sig = this.activate(x);
                return sig * (1 - sig);
        }
    }

    forward(input) {
        let current = input;
        const activations = [current];
        const zValues = [];

        for (let i = 0; i < this.weights.length; i++) {
            const z = [];
            const next = [];

            for (let j = 0; j < this.weights[i].length; j++) {
                let sum = 0;
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    sum += this.weights[i][j][k] * current[k];
                }
                sum += this.biases[i][j];
                z.push(sum);
                next.push(this.activate(sum));
            }

            zValues.push(z);
            activations.push(next);
            current = next;
        }

        return { output: current, activations, zValues };
    }

    train(data, labels, epochs = 1000, learningRate = 0.1) {
        const losses = [];
        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;
            
            for (let d = 0; d < data.length; d++) {
                const { output, activations, zValues } = this.forward(data[d]);
                
                // Calculate loss (MSE)
                let loss = 0;
                const errors = output.map((pred, i) => {
                    const error = pred - labels[d][i];
                    loss += error * error;
                    return error;
                });
                totalLoss += loss / output.length;

                // Backpropagation
                let delta = errors.map((error, i) => error * this.activateDerivative(zValues[zValues.length - 1][i]));
                
                // Update weights and biases
                for (let l = this.weights.length - 1; l >= 0; l--) {
                    const newWeights = JSON.parse(JSON.stringify(this.weights[l]));
                    const newBiases = JSON.parse(JSON.stringify(this.biases[l]));
                    
                    for (let i = 0; i < this.weights[l].length; i++) {
                        for (let j = 0; j < this.weights[l][i].length; j++) {
                            newWeights[i][j] -= learningRate * delta[i] * activations[l][j];
                        }
                        newBiases[i] -= learningRate * delta[i];
                    }
                    
                    this.weights[l] = newWeights;
                    this.biases[l] = newBiases;
                    
                    if (l > 0) {
                        const newDelta = Array(this.weights[l-1].length).fill(0);
                        for (let i = 0; i < this.weights[l-1].length; i++) {
                            let sum = 0;
                            for (let j = 0; j < this.weights[l].length; j++) {
                                sum += this.weights[l][j][i] * delta[j];
                            }
                            newDelta[i] = sum * this.activateDerivative(zValues[l-1][i]);
                        }
                        delta = newDelta;
                    }
                }
            }
            
            losses.push(totalLoss / data.length);
            
            // Update UI every 10 epochs
            if (epoch % 10 === 0) {
                updateTrainingStats(epoch, epochs, losses[losses.length - 1]);
                updateLossChart(losses);
                drawNetwork();
            }
        }
        
        return losses;
    }
}

// Global variables
let neuralNetwork = null;
let lossChart = null;
let dataChart = null;
let isTraining = false;
const lossHistory = [];

// DOM Elements
const networkCanvas = document.getElementById('networkCanvasElement');
const ctx = networkCanvas.getContext('2d');
const lossChartCtx = document.getElementById('lossChart');
const dataChartCtx = document.getElementById('dataChart');

// Initialize
function init() {
    setupEventListeners();
    setupCharts();
    createDefaultNetwork();
    drawNetwork();
}

function setupEventListeners() {
    document.getElementById('createNetwork').addEventListener('click', createNetwork);
    document.getElementById('trainNetwork').addEventListener('click', trainNetwork);
    document.getElementById('resetNetwork').addEventListener('click', resetNetwork);
    document.getElementById('predictBtn').addEventListener('click', makePrediction);
    document.getElementById('learningRate').addEventListener('input', updateLearningRateValue);
    
    // Resize canvas on window resize
    window.addEventListener('resize', resizeCanvas);
}

function setupCharts() {
    // Loss Chart
    lossChart = new Chart(lossChartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Training Loss',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Loss'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Epoch'
                    }
                }
            }
        }
    });

    // Data Chart
    dataChart = new Chart(dataChartCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Training Data',
                data: [],
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Input 1'
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Input 2'
                    }
                }
            }
        }
    });

    // Generate sample data
    updateDataChart();
}

function updateLearningRateValue() {
    const lr = document.getElementById('learningRate').value;
    document.getElementById('lrValue').textContent = lr;
}

function createDefaultNetwork() {
    const layers = [3, 4, 2];
    const activation = 'sigmoid';
    neuralNetwork = new NeuralNetwork(layers, activation);
}

function createNetwork() {
    if (isTraining) {
        alert('Please wait for training to complete!');
        return;
    }
    
    const layersInput = document.getElementById('layers').value;
    const activation = document.getElementById('activation').value;
    
    try {
        const layers = layersInput.split(',').map(num => parseInt(num.trim()));
        
        if (layers.length < 2) {
            throw new Error('At least 2 layers required (input and output)');
        }
        
        if (layers.some(num => num <= 0 || isNaN(num))) {
            throw new Error('All layer sizes must be positive numbers');
        }
        
        neuralNetwork = new NeuralNetwork(layers, activation);
        drawNetwork();
        
        // Reset training stats
        resetTrainingStats();
        
        alert(`Network created with architecture: ${layers.join(' → ')}`);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

function trainNetwork() {
    if (!neuralNetwork) {
        alert('Please create a network first!');
        return;
    }
    
    if (isTraining) {
        alert('Training already in progress!');
        return;
    }
    
    isTraining = true;
    
    // Generate training data
    const trainingData = [];
    const trainingLabels = [];
    
    // Create XOR-like problem
    for (let i = 0; i < 100; i++) {
        const x1 = Math.random();
        const x2 = Math.random();
        const x3 = Math.random();
        
        trainingData.push([x1, x2, x3]);
        
        // Complex pattern for classification
        const label1 = (x1 > 0.5 && x2 < 0.5) || (x1 < 0.5 && x2 > 0.5) ? 0.9 : 0.1;
        const label2 = (x1 + x2 + x3) / 3;
        
        trainingLabels.push([label1, label2]);
    }
    
    const epochs = parseInt(document.getElementById('epochs').value);
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    
    // Update data chart
    updateDataChart(trainingData);
    
    // Train in batches to keep UI responsive
    let currentEpoch = 0;
    const batchSize = 10;
    
    function trainBatch() {
        if (currentEpoch >= epochs) {
            isTraining = false;
            alert('Training completed!');
            return;
        }
        
        const endEpoch = Math.min(currentEpoch + batchSize, epochs);
        const losses = neuralNetwork.train(
            trainingData.slice(0, 20), // Use subset for faster training
            trainingLabels.slice(0, 20),
            batchSize,
            learningRate
        );
        
        lossHistory.push(...losses);
        currentEpoch = endEpoch;
        
        // Update UI
        updateTrainingStats(currentEpoch, epochs, losses[losses.length - 1]);
        updateLossChart(lossHistory);
        
        // Continue training
        setTimeout(trainBatch, 50);
    }
    
    trainBatch();
}

function resetNetwork() {
    if (isTraining) {
        alert('Please wait for training to complete!');
        return;
    }
    
    neuralNetwork = null;
    lossHistory.length = 0;
    resetTrainingStats();
    lossChart.data.labels = [];
    lossChart.data.datasets[0].data = [];
    lossChart.update();
    createDefaultNetwork();
    drawNetwork();
}

function makePrediction() {
    if (!neuralNetwork) {
        alert('Please create a network first!');
        return;
    }
    
    const inputStr = document.getElementById('testInput').value;
    
    try {
        const input = inputStr.split(',').map(num => parseFloat(num.trim()));
        
        if (input.length !== neuralNetwork.layers[0]) {
            throw new Error(`Input must have ${neuralNetwork.layers[0]} values`);
        }
        
        if (input.some(num => isNaN(num))) {
            throw new Error('All input values must be numbers');
        }
        
        const result = neuralNetwork.forward(input);
        const output = result.output.map(num => num.toFixed(4));
        
        document.getElementById('predictionOutput').textContent = `[${output.join(', ')}]`;
        
        // Visualize the prediction
        visualizePrediction(input, result);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

function updateTrainingStats(currentEpoch, totalEpochs, loss) {
    document.getElementById('currentLoss').textContent = loss.toFixed(4);
    document.getElementById('epoch').textContent = `${currentEpoch}/${totalEpochs}`;
    
    // Simulate accuracy
    const accuracy = Math.max(0, 100 - (loss * 100)).toFixed(1);
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

function resetTrainingStats() {
    document.getElementById('currentLoss').textContent = '0.0000';
    document.getElementById('accuracy').textContent = '0%';
    document.getElementById('epoch').textContent = '0/0';
}

function updateLossChart(losses) {
    lossChart.data.labels = losses.map((_, i) => i + 1);
    lossChart.data.datasets[0].data = losses;
    lossChart.update();
}

function updateDataChart(data = null) {
    if (!data) {
        // Generate sample data
        data = Array.from({length: 50}, () => [Math.random(), Math.random()]);
    }
    
    dataChart.data.datasets[0].data = data.map(point => ({
        x: point[0],
        y: point[1]
    }));
    dataChart.update();
}

function drawNetwork() {
    if (!neuralNetwork) return;
    
    resizeCanvas();
    
    ctx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
    
    const layerSizes = neuralNetwork.layers;
    const maxLayerSize = Math.max(...layerSizes);
    const layerSpacing = networkCanvas.width / (layerSizes.length + 1);
    const neuronSpacing = networkCanvas.height / (maxLayerSize + 1);
    
    // Draw connections
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
    ctx.lineWidth = 1;
    
    for (let layer = 0; layer < layerSizes.length - 1; layer++) {
        const currentLayerSize = layerSizes[layer];
        const nextLayerSize = layerSizes[layer + 1];
        
        for (let i = 0; i < currentLayerSize; i++) {
            const x1 = (layer + 1) * layerSpacing;
            const y1 = (i + 1) * neuronSpacing;
            
            for (let j = 0; j < nextLayerSize; j++) {
                const x2 = (layer + 2) * layerSpacing;
                const y2 = (j + 1) * neuronSpacing;
                
                // Weight-based line width
                const weight = neuralNetwork.weights[layer]?.[j]?.[i] || 0;
                ctx.lineWidth = Math.abs(weight) * 3 + 0.5;
                ctx.strokeStyle = weight > 0 ? 
                    `rgba(46, 204, 113, ${0.2 + Math.abs(weight)})` : 
                    `rgba(231, 76, 60, ${0.2 + Math.abs(weight)})`;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }
    
    // Draw neurons
    for (let layer = 0; layer < layerSizes.length; layer++) {
        const layerSize = layerSizes[layer];
        
        for (let i = 0; i < layerSize; i++) {
            const x = (layer + 1) * layerSpacing;
            const y = (i + 1) * neuronSpacing;
            
            // Neuron circle
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            
            // Color based on layer
            let gradient;
            if (layer === 0) {
                gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
                gradient.addColorStop(0, '#3498db');
                gradient.addColorStop(1, '#2980b9');
            } else if (layer === layerSizes.length - 1) {
                gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
                gradient.addColorStop(0, '#e74c3c');
                gradient.addColorStop(1, '#c0392b');
            } else {
                gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
                gradient.addColorStop(0, '#2ecc71');
                gradient.addColorStop(1, '#27ae60');
            }
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Neuron border
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#2c3e50';
            ctx.stroke();
            
            // Neuron label
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${layer === 0 ? 'I' : layer === layerSizes.length - 1 ? 'O' : 'H'}${i+1}`, x, y);
        }
    }
    
    // Draw layer labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    
    for (let layer = 0; layer < layerSizes.length; layer++) {
        const x = (layer + 1) * layerSpacing;
        const layerName = layer === 0 ? 'Input Layer' : 
                         layer === layerSizes.length - 1 ? 'Output Layer' : 
                         `Hidden Layer ${layer}`;
        
        ctx.fillText(layerName, x, 30);
        ctx.fillText(`${layerSizes[layer]} neurons`, x, 50);
    }
}

function visualizePrediction(input, result) {
    if (!neuralNetwork) return;
    
    // Animate the forward pass
    const activations = result.activations;
    const layerSizes = neuralNetwork.layers;
    const maxLayerSize = Math.max(...layerSizes);
    const layerSpacing = networkCanvas.width / (layerSizes.length + 1);
    const neuronSpacing = networkCanvas.height / (maxLayerSize + 1);
    
    // Draw network with activations
    function drawWithActivations(frame) {
        ctx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
        
        // Draw connections
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.lineWidth = 1;
        
        for (let layer = 0; layer < layerSizes.length - 1; layer++) {
            const currentLayerSize = layerSizes[layer];
            const nextLayerSize = layerSizes[layer + 1];
            
            for (let i = 0; i < currentLayerSize; i++) {
                const x1 = (layer + 1) * layerSpacing;
                const y1 = (i + 1) * neuronSpacing;
                
                for (let j = 0; j < nextLayerSize; j++) {
                    const x2 = (layer + 2) * layerSpacing;
                    const y2 = (j + 1) * neuronSpacing;
                    
                    const weight = neuralNetwork.weights[layer]?.[j]?.[i] || 0;
                    ctx.lineWidth = Math.abs(weight) * 3 + 0.5;
                    ctx.strokeStyle = weight > 0 ? 
                        `rgba(46, 204, 113, ${0.2 + Math.abs(weight)})` : 
                        `rgba(231, 76, 60, ${0.2 + Math.abs(weight)})`;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        }
        
        // Draw neurons with activation levels
        for (let layer = 0; layer < layerSizes.length; layer++) {
            const layerSize = layerSizes[layer];
            
            for (let i = 0; i < layerSize; i++) {
                const x = (layer + 1) * layerSpacing;
                const y = (i + 1) * neuronSpacing;
                const activation = activations[layer][i];
                
                // Neuron activation glow
                const radius = 20 + activation * 10;
                const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
                
                if (layer === 0) {
                    glow.addColorStop(0, 'rgba(52, 152, 219, 0.8)');
                    glow.addColorStop(1, 'rgba(52, 152, 219, 0.1)');
                } else if (layer === layerSizes.length - 1) {
                    glow.addColorStop(0, 'rgba(231, 76, 60, 0.8)');
                    glow.addColorStop(1, 'rgba(231, 76, 60, 0.1)');
                } else {
                    glow.addColorStop(0, 'rgba(46,
