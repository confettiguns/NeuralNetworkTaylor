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
