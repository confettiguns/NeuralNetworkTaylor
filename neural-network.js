// Neural Network visualization class
class NeuralNetwork {
    constructor(width, height, theme) {
        this.width = width;
        this.height = height;
        this.theme = theme;
        
        this.layers = [];
        this.connections = [];
        
        this.complexity = 4;
        this.learningRate = 0.01;
        this.activationFunction = 'sigmoid';
        
        this.currentLoss = 0.5;
        this.currentAccuracy = 0.2;
        
        this.trainingData = [];
        this.trainingStep = 0;
        
        this.initNetwork();
        this.generateTrainingData();
    }
    
    initNetwork() {
        this.layers = [];
        this.connections = [];
        
        // Create layers based on complexity
        const inputSize = 4 + this.complexity * 2;
        const outputSize = 2 + this.complexity;
        const hiddenLayersCount = this.complexity;
        
        // Calculate neuron positions
        const layerSpacing = this.width / (hiddenLayersCount + 2);
        
        // Input layer
        const inputLayer = [];
        const inputYSpacing = this.height / (inputSize + 1);
        for (let i = 0; i < inputSize; i++) {
            inputLayer.push({
                x: layerSpacing,
                y: inputYSpacing * (i + 1),
                activation: Math.random() * 0.5,
                bias: Math.random() * 0.1,
                value: 0,
                target: 0
            });
        }
        this.layers.push(inputLayer);
        
        // Hidden layers
        for (let l = 0; l < hiddenLayersCount; l++) {
            const layerSize = 6 + this.complexity - Math.floor(l / 2);
            const layer = [];
            const ySpacing = this.height / (layerSize + 1);
            
            for (let i = 0; i < layerSize; i++) {
                layer.push({
                    x: layerSpacing * (l + 2),
                    y: ySpacing * (i + 1),
                    activation: Math.random() * 0.5,
                    bias: Math.random() * 0.1,
                    value: 0,
                    target: 0
                });
            }
            this.layers.push(layer);
        }
        
        // Output layer
        const outputLayer = [];
        const outputYSpacing = this.height / (outputSize + 1);
        for (let i = 0; i < outputSize; i++) {
            outputLayer.push({
                x: layerSpacing * (hiddenLayersCount + 2),
                y: outputYSpacing * (i + 1),
                activation: Math.random() * 0.5,
                bias: Math.random() * 0.1,
                value: 0,
                target: 0
            });
        }
        this.layers.push(outputLayer);
        
        // Create connections between layers
        this.createConnections();
    }
    
    createConnections() {
        this.connections = [];
        
        for (let l = 0; l < this.layers.length - 1; l++) {
            const currentLayer = this.layers[l];
            const nextLayer = this.layers[l + 1];
            
            for (let i = 0; i < currentLayer.length; i++) {
                for (let j = 0; j < nextLayer.length; j++) {
                    this.connections.push({
                        from: currentLayer[i],
                        to: nextLayer[j],
                        weight: Math.random() * 2 - 1,
                        active: false,
                        pulse: 0
                    });
                }
            }
        }
    }
    
    generateTrainingData() {
        this.trainingData = [];
        
        // Generate random training data
        for (let i = 0; i < 100; i++) {
            const input = [];
            for (let j = 0; j < this.layers[0].length; j++) {
                input.push(Math.random());
            }
            
            const output = [];
            for (let j = 0; j < this.layers[this.layers.length - 1].length; j++) {
                output.push(Math.random() > 0.5 ? 1 : 0);
            }
            
            this.trainingData.push({ input, output });
        }
    }
    
    trainStep() {
        // Get current training example
        const dataIndex = this.trainingStep % this.trainingData.length;
        const data = this.trainingData[dataIndex];
        
        // Forward pass
        this.forwardPass(data.input);
        
        // Calculate loss and accuracy
        this.calculateMetrics(data.output);
        
        // Simulate backpropagation (visual effect only)
        this.simulateBackpropagation();
        
        this.trainingStep++;
        
        // Occasionally generate new training data
        if (this.trainingStep % 500 === 0) {
            this.generateTrainingData();
        }
    }
    
    forwardPass(input) {
        // Set input layer values
        for (let i = 0; i < this.layers[0].length && i < input.length; i++) {
            this.layers[0][i].value = input[i];
        }
        
        // Propagate through layers
        for (let l = 1; l < this.layers.length; l++) {
            const currentLayer = this.layers[l];
            const previousLayer = this.layers[l - 1];
            
            for (let i = 0; i < currentLayer.length; i++) {
                let sum = currentLayer[i].bias;
                
                // Find connections from previous layer
                for (let j = 0; j < previousLayer.length; j++) {
                    // Find the connection
                    const connection = this.connections.find(conn => 
                        conn.from === previousLayer[j] && conn.to === currentLayer[i]
                    );
                    
                    if (connection) {
                        sum += previousLayer[j].value * connection.weight;
                        
                        // Animate connection
                        connection.active = true;
                        connection.pulse = 1.0;
                    }
                }
                
                // Apply activation function
                currentLayer[i].value = this.applyActivation(sum);
                currentLayer[i].activation = Math.abs(currentLayer[i].value);
            }
        }
    }
    
    applyActivation(x) {
        switch (this.activationFunction) {
            case 'relu':
                return Math.max(0, x);
            case 'tanh':
                return Math.tanh(x);
            case 'leakyRelu':
                return x > 0 ? x : 0.01 * x;
            case 'sigmoid':
            default:
                return 1 / (1 + Math.exp(-x));
        }
    }
    
    calculateMetrics(target) {
        const outputLayer = this.layers[this.layers.length - 1];
        let loss = 0;
        let correct = 0;
        
        for (let i = 0; i < outputLayer.length && i < target.length; i++) {
            const error = target[i] - outputLayer[i].value;
            loss += error * error;
            
            if (Math.abs(outputLayer[i].value - target[i]) < 0.3) {
                correct++;
            }
            
            outputLayer[i].target = target[i];
        }
        
        this.currentLoss = loss / outputLayer.length;
        this.currentAccuracy = correct / outputLayer.length;
    }
    
    simulateBackpropagation() {
        // Simulate weight updates with some randomness
        for (const connection of this.connections) {
            if (connection.active) {
                // Simulate weight adjustment
                const adjustment = (Math.random() - 0.5) * this.learningRate;
                connection.weight += adjustment;
                
                // Keep weights in reasonable range
                connection.weight = Math.max(-2, Math.min(2, connection.weight));
            }
            
            // Fade connection pulse
            if (connection.pulse > 0) {
                connection.pulse -= 0.05;
                if (connection.pulse < 0) connection.pulse = 0;
            }
            
            connection.active = false;
        }
        
        // Update biases
        for (const layer of this.layers) {
            for (const neuron of layer) {
                neuron.bias += (Math.random() - 0.5) * this.learningRate * 0.1;
            }
        }
    }
    
    draw(ctx, connectionVisibility) {
        // Draw connections
        for (const connection of this.connections) {
            this.drawConnection(ctx, connection, connectionVisibility);
        }
        
        // Draw neurons
        for (const layer of this.layers) {
            for (const neuron of layer) {
                this.drawNeuron(ctx, neuron);
            }
        }
    }
    
    drawConnection(ctx, connection, visibility) {
        const from = connection.from;
        const to = connection.to;
        
        // Calculate opacity based on weight and pulse
        const weight = Math.abs(connection.weight);
        const pulse = connection.pulse;
        const baseOpacity = (visibility / 100) * 0.3;
        const opacity = baseOpacity + weight * 0.3 + pulse * 0.4;
        
        // Color based on weight
        let color;
        if (connection.weight > 0) {
            color = this.theme.connection;
        } else {
            color = '#ff7e5f'; // Negative weights in orange
        }
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        
        // Create gradient along the line
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, this.hexToRgba(color, opacity * 0.7));
        gradient.addColorStop(1, this.hexToRgba(color, opacity));
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.5 + weight * 2 + pulse * 2;
        ctx.stroke();
        
        // Draw pulse effect if active
        if (pulse > 0) {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = this.hexToRgba('#ffffff', pulse * 0.5);
            ctx.lineWidth = 1 + pulse * 3;
            ctx.stroke();
        }
    }
    
    drawNeuron(ctx, neuron) {
        const radius = 8 + neuron.activation * 12;
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
            neuron.x, neuron.y, radius * 0.5,
            neuron.x, neuron.y, radius * 2
        );
        gradient.addColorStop(0, this.hexToRgba(this.theme.neuron, 0.8));
        gradient.addColorStop(1, this.hexToRgba(this.theme.neuron, 0));
        
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw neuron body
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, radius, 0, Math.PI * 2);
        
        // Create gradient fill
        const neuronGradient = ctx.createRadialGradient(
            neuron.x - radius/3, neuron.y - radius/3, 0,
            neuron.x, neuron.y, radius
        );
        neuronGradient.addColorStop(0, this.hexToRgba('#ffffff', 0.8));
        neuronGradient.addColorStop(1, this.theme.neuron);
        
        ctx.fillStyle = neuronGradient;
        ctx.fill();
        
        // Draw neuron border
        ctx.strokeStyle = this.hexToRgba('#ffffff', 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw activation indicator
        if (neuron.activation > 0.3) {
            ctx.beginPath();
            ctx.arc(neuron.x, neuron.y, radius * 0.7, 0, Math.PI * 2 * neuron.activation);
            ctx.strokeStyle = this.hexToRgba('#ffffff', 0.8);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    setComplexity(value) {
        this.complexity = value;
        this.initNetwork();
        this.generateTrainingData();
    }
    
    setLearningRate(value) {
        this.learningRate = value;
    }
    
    setActivationFunction(func) {
        this.activationFunction = func;
    }
    
    setTheme(theme) {
        this.theme = theme;
    }
    
    updateDimensions(width, height) {
        this.width = width;
        this.height = height;
        this.initNetwork();
    }
    
    getCurrentLoss() {
        return this.currentLoss;
    }
    
    getCurrentAccuracy() {
        return this.currentAccuracy;
    }
    
    reset() {
        this.initNetwork();
        this.generateTrainingData();
        this.trainingStep = 0;
        this.currentLoss = 0.5;
        this.currentAccuracy = 0.2;
    }
}
