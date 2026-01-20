// Training script for custom ML model
// Run this to train the difficulty predictor and test question generation

import difficultyPredictor from './difficultyPredictor.js';
import questionGenerator from './questionGenerator.js';
import { trainingDataset } from './trainingData.js';

console.log('\n' + '='.repeat(70));
console.log('🎓 AI INTERVIEW PLATFORM - ML MODEL TRAINING');
console.log('='.repeat(70) + '\n');

// Training data for difficulty predictor
const trainingExamples = [
  // Easy examples
  {
    questionText: 'What is an array?',
    stream: 'Computer Science',
    topic: 'Data Structures',
    actualDifficulty: 'Easy'
  },
  {
    questionText: 'Explain what a variable is in programming.',
    stream: 'Computer Science',
    topic: 'Programming Basics',
    actualDifficulty: 'Easy'
  },
  {
    questionText: 'What is the difference between supervised and unsupervised learning?',
    stream: 'Data Science',
    topic: 'Machine Learning',
    actualDifficulty: 'Easy'
  },

  // Medium examples
  {
    questionText: 'Implement binary search on a sorted array and explain its time complexity.',
    stream: 'Computer Science',
    topic: 'Algorithms',
    actualDifficulty: 'Medium'
  },
  {
    questionText: 'Compare binary search trees with AVL trees. When would you use each?',
    stream: 'Computer Science',
    topic: 'Data Structures',
    actualDifficulty: 'Medium'
  },
  {
    questionText: 'Explain the bias-variance tradeoff in machine learning models.',
    stream: 'Data Science',
    topic: 'Machine Learning',
    actualDifficulty: 'Medium'
  },

  // Hard examples
  {
    questionText: 'Design an LRU cache with O(1) operations using hash map and doubly linked list.',
    stream: 'Computer Science',
    topic: 'Data Structures',
    actualDifficulty: 'Hard'
  },
  {
    questionText: 'Explain the transformer architecture and attention mechanism in deep learning.',
    stream: 'AI/ML',
    topic: 'Deep Learning',
    actualDifficulty: 'Hard'
  },
  {
    questionText: 'Design a scalable distributed system with load balancing and fault tolerance.',
    stream: 'Information Technology',
    topic: 'System Design',
    actualDifficulty: 'Hard'
  }
];

// Test data for evaluation
const testSet = [
  {
    questionText: 'What is a stack and how does it work?',
    stream: 'Computer Science',
    topic: 'Data Structures',
    actualDifficulty: 'Easy'
  },
  {
    questionText: 'Implement merge sort and analyze its complexity.',
    stream: 'Computer Science',
    topic: 'Algorithms',
    actualDifficulty: 'Medium'
  },
  {
    questionText: 'Design a recommendation system using collaborative filtering.',
    stream: 'Data Science',
    topic: 'Machine Learning',
    actualDifficulty: 'Hard'
  },
  {
    questionText: 'Explain what polymorphism is with examples.',
    stream: 'Computer Science',
    topic: 'OOP',
    actualDifficulty: 'Medium'
  },
  {
    questionText: 'What is the difference between TCP and UDP?',
    stream: 'Information Technology',
    topic: 'Networking',
    actualDifficulty: 'Easy'
  }
];

// Step 1: Test initial predictions
console.log('📊 STEP 1: Initial Model Predictions\n');
console.log('-'.repeat(70));

testSet.forEach((test, index) => {
  const prediction = difficultyPredictor.predictDifficulty({
    stream: test.stream,
    topic: test.topic,
    questionText: test.questionText
  });

  const isCorrect = prediction.difficulty === test.actualDifficulty;
  const emoji = isCorrect ? '✅' : '❌';

  console.log(`\n${index + 1}. ${test.questionText.substring(0, 60)}...`);
  console.log(`   Actual: ${test.actualDifficulty} | Predicted: ${prediction.difficulty} | Score: ${prediction.score} ${emoji}`);
  console.log(`   Confidence: ${prediction.confidence}%`);
  console.log(`   Reasoning: ${prediction.reasoning}`);
});

// Calculate initial accuracy
let correctPredictions = testSet.filter((test, index) => {
  const prediction = difficultyPredictor.predictDifficulty({
    stream: test.stream,
    topic: test.topic,
    questionText: test.questionText
  });
  return prediction.difficulty === test.actualDifficulty;
}).length;

const initialAccuracy = (correctPredictions / testSet.length) * 100;
console.log(`\n${'='.repeat(70)}`);
console.log(`📊 Initial Accuracy: ${initialAccuracy.toFixed(1)}% (${correctPredictions}/${testSet.length})`);
console.log('='.repeat(70) + '\n');

// Step 2: Train the model
console.log('🎓 STEP 2: Training the Model\n');
console.log('-'.repeat(70));

trainingExamples.forEach((example, index) => {
  console.log(`\nTraining ${index + 1}/${trainingExamples.length}: ${example.questionText.substring(0, 50)}...`);
  
  const result = difficultyPredictor.train(example);
  
  if (result.weightsAdjusted) {
    console.log(`   ⚙️  Weights adjusted (error: ${result.error.toFixed(2)})`);
  } else {
    console.log(`   ✓  Prediction accurate (error: ${result.error.toFixed(2)})`);
  }
});

console.log(`\n${'='.repeat(70)}`);
console.log('✅ Training Complete!');
console.log('='.repeat(70) + '\n');

// Step 3: Evaluate after training
console.log('📊 STEP 3: Post-Training Evaluation\n');
console.log('-'.repeat(70));

const evaluation = difficultyPredictor.evaluate(testSet);

console.log(`\n✅ ${evaluation.summary}`);
console.log(`   Correct: ${evaluation.correct}/${evaluation.total}`);
console.log(`   Accuracy: ${evaluation.accuracy}%`);

if (evaluation.errors.length > 0) {
  console.log('\n❌ Incorrect Predictions:');
  evaluation.errors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${error.question.substring(0, 50)}...`);
    console.log(`      Predicted: ${error.predicted} | Actual: ${error.actual} | Score: ${error.score}`);
  });
}

console.log(`\n${'='.repeat(70)}`);
console.log(`📈 Accuracy Improvement: ${initialAccuracy.toFixed(1)}% → ${evaluation.accuracy}%`);
console.log('='.repeat(70) + '\n');

// Step 4: Display model statistics
console.log('📊 STEP 4: Model Statistics\n');
console.log('-'.repeat(70));

const stats = difficultyPredictor.getModelStats();
console.log('\n🔧 Model Weights:');
Object.entries(stats.weights).forEach(([key, value]) => {
  const bar = '█'.repeat(Math.round(value * 50));
  console.log(`   ${key.padEnd(30)} ${bar} ${(value * 100).toFixed(1)}%`);
});

console.log(`\n📚 Training Examples: ${stats.trainingExamples}`);
console.log(`📖 Technical Terms: ${stats.technicalTermsCount}`);
console.log(`🕐 Last Trained: ${stats.lastTrained ? stats.lastTrained.toLocaleString() : 'Never'}`);

console.log('\n' + '='.repeat(70) + '\n');

// Step 5: Test question generation
console.log('🎯 STEP 5: Testing Question Generation\n');
console.log('-'.repeat(70));

const testStreams = [
  { stream: 'Computer Science', difficulty: 'Easy', count: 3 },
  { stream: 'Data Science', difficulty: 'Medium', count: 3 },
  { stream: 'AI/ML', difficulty: 'Hard', count: 3 }
];

testStreams.forEach(test => {
  console.log(`\n📝 Generating ${test.count} ${test.difficulty} questions for ${test.stream}:`);
  console.log('-'.repeat(70));
  
  const questions = questionGenerator.generateQuestions({
    stream: test.stream,
    difficulty: test.difficulty,
    count: test.count,
    avoidDuplicates: true
  });

  questions.forEach((q, index) => {
    console.log(`\n${index + 1}. ${q.question}`);
    console.log(`   Category: ${q.category}`);
    console.log(`   Strategy: ${q.generationStrategy}`);
    console.log(`   ML Predicted: ${q.predictedDifficulty} (score: ${q.difficultyScore}, confidence: ${q.confidence}%)`);
  });
});

console.log('\n' + '='.repeat(70));

// Step 6: Question generator statistics
console.log('\n📊 STEP 6: Question Generator Statistics\n');
console.log('-'.repeat(70));

const genStats = questionGenerator.getStats();
console.log(`\n📚 Dataset Size: ${genStats.datasetSize} questions`);
console.log(`🎯 Available Streams: ${genStats.availableStreams.join(', ')}`);
console.log(`📋 Available Templates: ${genStats.availableTemplates}`);
console.log(`✅ Total Generated: ${genStats.totalGenerated}`);

console.log('\n' + '='.repeat(70));
console.log('🎉 TRAINING AND EVALUATION COMPLETE!');
console.log('='.repeat(70) + '\n');

console.log('💡 Next Steps:');
console.log('   1. Use AIService.generateQuestions() with useCustomAI=true');
console.log('   2. Monitor question quality and collect feedback');
console.log('   3. Retrain model with production data');
console.log('   4. Fine-tune weights for better accuracy\n');
