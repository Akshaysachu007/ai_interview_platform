// ML Model for predicting interview question difficulty
// This implements a simple but effective difficulty classification system

class DifficultyPredictor {
  constructor() {
    // Trained weights for difficulty prediction
    this.weights = {
      keywordComplexity: 0.25,
      conceptDepth: 0.30,
      technicalTerms: 0.20,
      implementationRequired: 0.15,
      multipleConceptsRequired: 0.10
    };

    // Technical term database with complexity scores
    this.technicalTerms = {
      // Basic terms (1-2 points)
      'variable': 1, 'function': 1, 'loop': 1, 'array': 1, 'string': 1,
      'class': 2, 'object': 2, 'method': 2, 'parameter': 1,
      
      // Intermediate terms (3-5 points)
      'algorithm': 3, 'complexity': 3, 'recursion': 4, 'pointer': 4,
      'inheritance': 3, 'polymorphism': 4, 'abstraction': 3,
      'hash map': 4, 'binary search': 3, 'merge sort': 4,
      'linked list': 3, 'stack': 3, 'queue': 3, 'tree': 4,
      
      // Advanced terms (6-10 points)
      'dynamic programming': 8, 'graph': 6, 'backtracking': 7,
      'greedy algorithm': 6, 'divide and conquer': 6,
      'transformer': 9, 'attention mechanism': 8, 'backpropagation': 7,
      'gradient descent': 7, 'neural network': 6,
      'distributed system': 8, 'load balancing': 7, 'consensus': 9,
      'CAP theorem': 8, 'microservices': 7,
      'serialization': 6, 'concurrency': 7, 'thread': 6,
      'mutex': 7, 'deadlock': 7, 'race condition': 7
    };

    // Complexity indicators
    this.complexityIndicators = {
      design: ['design', 'architect', 'build', 'create', 'implement'],
      analysis: ['analyze', 'compare', 'evaluate', 'tradeoff', 'optimize'],
      implementation: ['code', 'write', 'implement', 'develop', 'program'],
      explanation: ['explain', 'describe', 'what is', 'how does', 'define']
    };

    // Training history (for continuous learning)
    this.trainingHistory = [];
  }

  /**
   * Predict difficulty level for a question based on multiple factors
   * @param {Object} params - Question parameters
   * @returns {Object} Predicted difficulty and confidence
   */
  predictDifficulty(params) {
    const { stream, topic, questionText, context = {} } = params;

    // Extract features from the question
    const features = this.extractFeatures(questionText, stream, topic);

    // Calculate difficulty score
    const score = this.calculateDifficultyScore(features);

    // Map score to difficulty level
    const difficulty = this.mapScoreToDifficulty(score);

    // Calculate confidence based on feature clarity
    const confidence = this.calculateConfidence(features);

    return {
      difficulty,
      score: parseFloat(score.toFixed(2)),
      confidence: parseFloat((confidence * 100).toFixed(1)),
      features,
      reasoning: this.explainPrediction(features, difficulty)
    };
  }

  /**
   * Extract relevant features from question text
   */
  extractFeatures(questionText, stream, topic) {
    const text = questionText.toLowerCase();
    const words = text.split(/\s+/);

    // 1. Technical term complexity
    let technicalScore = 0;
    let technicalTermsFound = [];
    
    for (const [term, score] of Object.entries(this.technicalTerms)) {
      if (text.includes(term.toLowerCase())) {
        technicalScore += score;
        technicalTermsFound.push(term);
      }
    }

    // 2. Question type (determines expected depth)
    let questionType = 'explanation';
    let typeScore = 2; // default for explanation
    
    for (const [type, keywords] of Object.entries(this.complexityIndicators)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        questionType = type;
        typeScore = {
          explanation: 2,
          implementation: 5,
          analysis: 6,
          design: 8
        }[type];
        break;
      }
    }

    // 3. Concept depth (multiple concepts = higher difficulty)
    const conceptCount = technicalTermsFound.length;
    const conceptDepthScore = Math.min(conceptCount * 1.5, 10);

    // 4. Implementation requirements
    const requiresImplementation = /implement|write|code|develop|build|create/.test(text);
    const implementationScore = requiresImplementation ? 5 : 0;

    // 5. Multiple concepts integration
    const requiresIntegration = conceptCount >= 3;
    const integrationScore = requiresIntegration ? 3 : 0;

    // 6. Advanced keywords
    const advancedKeywords = [
      'optimize', 'scalable', 'distributed', 'concurrent',
      'architecture', 'tradeoff', 'complexity analysis',
      'time complexity', 'space complexity', 'big o'
    ];
    const advancedCount = advancedKeywords.filter(kw => text.includes(kw)).length;
    const advancedScore = advancedCount * 2;

    return {
      technicalScore,
      technicalTermsFound,
      questionType,
      typeScore,
      conceptDepthScore,
      implementationScore,
      integrationScore,
      advancedScore,
      wordCount: words.length,
      conceptCount
    };
  }

  /**
   * Calculate overall difficulty score using weighted features
   */
  calculateDifficultyScore(features) {
    const {
      technicalScore,
      typeScore,
      conceptDepthScore,
      implementationScore,
      integrationScore,
      advancedScore
    } = features;

    // Weighted sum of all features
    const score = 
      (technicalScore * this.weights.technicalTerms) +
      (conceptDepthScore * this.weights.conceptDepth) +
      (typeScore * this.weights.keywordComplexity) +
      (implementationScore * this.weights.implementationRequired) +
      (integrationScore * this.weights.multipleConceptsRequired) +
      (advancedScore * 0.15);

    // Normalize to 0-10 scale
    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Map numerical score to difficulty level
   */
  mapScoreToDifficulty(score) {
    if (score <= 3.0) return 'Easy';
    if (score <= 6.5) return 'Medium';
    return 'Hard';
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(features) {
    const {
      technicalTermsFound,
      conceptCount,
      questionType
    } = features;

    // Higher confidence when:
    // 1. Clear technical terms are present
    // 2. Question type is clearly identifiable
    // 3. Concept count is reasonable (not too few or too many)

    let confidence = 0.5; // base confidence

    if (technicalTermsFound.length > 0) confidence += 0.2;
    if (technicalTermsFound.length >= 2) confidence += 0.1;
    if (questionType !== 'explanation') confidence += 0.1;
    if (conceptCount >= 1 && conceptCount <= 5) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Explain why this difficulty was predicted
   */
  explainPrediction(features, difficulty) {
    const reasons = [];

    if (features.technicalTermsFound.length > 0) {
      reasons.push(`Contains technical terms: ${features.technicalTermsFound.slice(0, 3).join(', ')}`);
    }

    if (features.questionType === 'design' || features.questionType === 'analysis') {
      reasons.push(`Requires ${features.questionType} thinking`);
    }

    if (features.conceptCount >= 3) {
      reasons.push(`Integrates multiple concepts (${features.conceptCount})`);
    }

    if (features.implementationScore > 0) {
      reasons.push('Requires implementation/coding');
    }

    if (features.advancedScore > 0) {
      reasons.push('Contains advanced concepts or optimization requirements');
    }

    if (reasons.length === 0) {
      reasons.push('Basic conceptual question with minimal technical depth');
    }

    return reasons.join('; ');
  }

  /**
   * Train the model with feedback (for continuous improvement)
   */
  train(trainingExample) {
    const {
      questionText,
      stream,
      topic,
      actualDifficulty,
      feedback
    } = trainingExample;

    // Extract features
    const features = this.extractFeatures(questionText, stream, topic);
    const predictedScore = this.calculateDifficultyScore(features);
    const predictedDifficulty = this.mapScoreToDifficulty(predictedScore);

    // Calculate error
    const difficultyScores = { 'Easy': 2, 'Medium': 5, 'Hard': 8 };
    const actualScore = difficultyScores[actualDifficulty];
    const error = actualScore - predictedScore;

    // Store training example
    this.trainingHistory.push({
      questionText,
      features,
      predictedDifficulty,
      actualDifficulty,
      error,
      feedback,
      timestamp: new Date()
    });

    // Simple weight adjustment (gradient descent-like update)
    const learningRate = 0.01;
    
    if (Math.abs(error) > 1.5) { // Only adjust if error is significant
      // Adjust weights based on which features were most prominent
      const totalFeatureValue = 
        features.technicalScore + 
        features.conceptDepthScore + 
        features.typeScore + 
        features.implementationScore + 
        features.integrationScore;

      if (totalFeatureValue > 0) {
        this.weights.technicalTerms += learningRate * error * (features.technicalScore / totalFeatureValue);
        this.weights.conceptDepth += learningRate * error * (features.conceptDepthScore / totalFeatureValue);
        this.weights.keywordComplexity += learningRate * error * (features.typeScore / totalFeatureValue);
        this.weights.implementationRequired += learningRate * error * (features.implementationScore / totalFeatureValue);
        this.weights.multipleConceptsRequired += learningRate * error * (features.integrationScore / totalFeatureValue);
      }

      // Normalize weights to sum to 1
      const weightSum = Object.values(this.weights).reduce((a, b) => a + b, 0);
      for (const key in this.weights) {
        this.weights[key] /= weightSum;
      }
    }

    return {
      error,
      weightsAdjusted: Math.abs(error) > 1.5,
      newWeights: { ...this.weights }
    };
  }

  /**
   * Evaluate model performance on test set
   */
  evaluate(testSet) {
    let correct = 0;
    let total = testSet.length;
    const errors = [];

    testSet.forEach(test => {
      const prediction = this.predictDifficulty({
        stream: test.stream,
        topic: test.topic,
        questionText: test.questionText
      });

      if (prediction.difficulty === test.actualDifficulty) {
        correct++;
      } else {
        errors.push({
          question: test.questionText,
          predicted: prediction.difficulty,
          actual: test.actualDifficulty,
          score: prediction.score
        });
      }
    });

    const accuracy = (correct / total) * 100;

    return {
      accuracy: parseFloat(accuracy.toFixed(2)),
      correct,
      total,
      errors: errors.slice(0, 10), // Show first 10 errors
      summary: `Model achieved ${accuracy.toFixed(1)}% accuracy on ${total} test examples`
    };
  }

  /**
   * Get model statistics
   */
  getModelStats() {
    return {
      weights: this.weights,
      trainingExamples: this.trainingHistory.length,
      lastTrained: this.trainingHistory.length > 0 
        ? this.trainingHistory[this.trainingHistory.length - 1].timestamp
        : null,
      technicalTermsCount: Object.keys(this.technicalTerms).length
    };
  }
}

// Singleton instance
const difficultyPredictor = new DifficultyPredictor();

export default difficultyPredictor;
