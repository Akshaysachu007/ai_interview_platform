// API endpoint testing script for custom ML question generation
// Run this to test the API endpoints with the custom AI

import AIService from '../services/aiService.js';

console.log('\n' + '='.repeat(70));
console.log('🧪 API ENDPOINT TESTING - CUSTOM ML QUESTION GENERATION');
console.log('='.repeat(70) + '\n');

async function testQuestionGeneration() {
  const testCases = [
    {
      name: 'Test 1: Computer Science - Easy',
      stream: 'Computer Science',
      difficulty: 'Easy',
      count: 5,
      useCustomAI: true
    },
    {
      name: 'Test 2: Data Science - Medium',
      stream: 'Data Science',
      difficulty: 'Medium',
      count: 5,
      useCustomAI: true
    },
    {
      name: 'Test 3: AI/ML - Hard',
      stream: 'AI/ML',
      difficulty: 'Hard',
      count: 5,
      useCustomAI: true
    },
    {
      name: 'Test 4: Auto-predict Difficulty',
      stream: 'Information Technology',
      difficulty: 'auto',
      count: 3,
      useCustomAI: true
    },
    {
      name: 'Test 5: OpenAI Fallback',
      stream: 'Computer Science',
      difficulty: 'Medium',
      count: 3,
      useCustomAI: false
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 ${testCase.name}`);
    console.log('='.repeat(70));
    console.log(`   Stream: ${testCase.stream}`);
    console.log(`   Difficulty: ${testCase.difficulty}`);
    console.log(`   Count: ${testCase.count}`);
    console.log(`   Use Custom AI: ${testCase.useCustomAI}`);
    console.log('-'.repeat(70) + '\n');

    try {
      const startTime = Date.now();
      
      const questions = await AIService.generateQuestions(
        testCase.stream,
        testCase.difficulty,
        testCase.count,
        testCase.useCustomAI
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`\n✅ Generated ${questions.length} questions in ${duration}ms\n`);

      questions.forEach((q, index) => {
        console.log(`${index + 1}. ${q.question}`);
        console.log(`   Category: ${q.category}`);
        console.log(`   Model: ${q.model}`);
        
        if (q.mlGenerated) {
          console.log(`   ML Difficulty: ${q.predictedDifficulty} (score: ${q.difficultyScore})`);
          console.log(`   Confidence: ${q.confidence}%`);
          console.log(`   Strategy: ${q.generationStrategy}`);
        }
        
        console.log('');
      });

      console.log(`⏱️  Performance: ${(duration / questions.length).toFixed(2)}ms per question`);

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      console.error(error.stack);
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL TESTS COMPLETE');
  console.log('='.repeat(70) + '\n');
}

async function testMLModelStats() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 ML MODEL STATISTICS');
  console.log('='.repeat(70) + '\n');

  const stats = AIService.getMLModelStats();

  console.log('🤖 Difficulty Predictor:');
  console.log(`   Training Examples: ${stats.difficultyPredictor.trainingExamples}`);
  console.log(`   Technical Terms: ${stats.difficultyPredictor.technicalTermsCount}`);
  console.log(`   Last Trained: ${stats.difficultyPredictor.lastTrained || 'Never'}`);
  console.log('\n   Weights:');
  Object.entries(stats.difficultyPredictor.weights).forEach(([key, value]) => {
    console.log(`      ${key}: ${(value * 100).toFixed(1)}%`);
  });

  console.log('\n🎯 Question Generator:');
  console.log(`   Dataset Size: ${stats.questionGenerator.datasetSize} questions`);
  console.log(`   Available Streams: ${stats.questionGenerator.availableStreams.length}`);
  console.log(`   Available Templates: ${stats.questionGenerator.availableTemplates}`);
  console.log(`   Total Generated: ${stats.questionGenerator.totalGenerated}`);

  console.log('\n' + '='.repeat(70) + '\n');
}

async function testDifficultyPrediction() {
  console.log('\n' + '='.repeat(70));
  console.log('🔮 DIFFICULTY PREDICTION TESTING');
  console.log('='.repeat(70) + '\n');

  const testQuestions = [
    {
      stream: 'Computer Science',
      topic: 'Data Structures',
      question: 'What is an array?'
    },
    {
      stream: 'Computer Science',
      topic: 'Algorithms',
      question: 'Implement binary search and analyze its time complexity.'
    },
    {
      stream: 'AI/ML',
      topic: 'Deep Learning',
      question: 'Design a neural network architecture for image segmentation using U-Net with skip connections.'
    },
    {
      stream: 'Data Science',
      topic: 'Statistics',
      question: 'Explain Bayesian inference and compare it with frequentist approaches.'
    }
  ];

  testQuestions.forEach((test, index) => {
    console.log(`${index + 1}. "${test.question}"`);
    
    const prediction = AIService.predictQuestionDifficulty(
      test.stream,
      test.topic,
      test.question
    );

    console.log(`   Predicted Difficulty: ${prediction.difficulty}`);
    console.log(`   Difficulty Score: ${prediction.score}/10`);
    console.log(`   Confidence: ${prediction.confidence}%`);
    console.log(`   Reasoning: ${prediction.reasoning}`);
    console.log('');
  });

  console.log('='.repeat(70) + '\n');
}

async function testCustomQuestionGeneration() {
  console.log('\n' + '='.repeat(70));
  console.log('⚙️  CUSTOM QUESTION GENERATION PARAMETERS');
  console.log('='.repeat(70) + '\n');

  const customParams = {
    stream: 'Computer Science',
    topic: 'Data Structures',
    difficulty: 'Medium',
    count: 3,
    strategy: 'hybrid',
    useML: true
  };

  console.log('Parameters:');
  console.log(`   Stream: ${customParams.stream}`);
  console.log(`   Topic: ${customParams.topic}`);
  console.log(`   Difficulty: ${customParams.difficulty}`);
  console.log(`   Count: ${customParams.count}`);
  console.log(`   Strategy: ${customParams.strategy}`);
  console.log('\n' + '-'.repeat(70) + '\n');

  const questions = AIService.generateCustomQuestions(customParams);

  questions.forEach((q, index) => {
    console.log(`${index + 1}. ${q.question}`);
    console.log(`   Category: ${q.category}`);
    console.log(`   Strategy: ${q.generationStrategy}`);
    console.log(`   Difficulty: ${q.predictedDifficulty} (${q.difficultyScore}/10)`);
    console.log('');
  });

  console.log('='.repeat(70) + '\n');
}

// Run all tests
async function runAllTests() {
  try {
    await testMLModelStats();
    await testDifficultyPrediction();
    await testCustomQuestionGeneration();
    await testQuestionGeneration();

    console.log('🎉 ALL TESTS PASSED! 🎉\n');
    console.log('💡 Your custom AI is ready to generate interview questions!');
    console.log('   Use it in your application by setting useCustomAI=true\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runAllTests();
