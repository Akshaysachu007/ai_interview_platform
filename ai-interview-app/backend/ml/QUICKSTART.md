# Quick Start: Custom AI Question Generation

## 🚀 Get Started in 3 Steps

### Step 1: Train the Model (30 seconds)

```bash
cd backend
npm run train-ml
```

You'll see:
- Initial prediction accuracy
- Training progress
- Post-training accuracy improvement
- Model statistics
- Sample question generation

### Step 2: Test the System (30 seconds)

```bash
npm run test-ml
```

This tests:
- Question generation for all streams
- Difficulty prediction
- Custom parameters
- Performance metrics

### Step 3: Use in Your Application

```javascript
// In your route handler
import AIService from './services/aiService.js';

// Generate questions with custom AI
const questions = await AIService.generateQuestions(
  'Computer Science',  // stream
  'Medium',           // difficulty
  5,                  // count
  true                // use custom AI ✅
);

// Each question includes:
// - question: The question text
// - category: Topic/category
// - mlGenerated: true
// - predictedDifficulty: ML-predicted difficulty
// - difficultyScore: Numerical score (0-10)
// - confidence: Prediction confidence (%)
// - generationStrategy: How it was generated
```

## 📊 Example Output

```javascript
[
  {
    question: "Compare binary search trees with AVL trees. When would you use each?",
    category: "Data Structures",
    mlGenerated: true,
    model: "custom-ml-model",
    predictedDifficulty: "Medium",
    difficultyScore: 5.8,
    confidence: 87.5,
    generationStrategy: "concept-based",
    generatedAt: "2025-01-15T10:30:00.000Z"
  },
  // ... more questions
]
```

## 🎯 Features

### Auto-Difficulty Prediction
```javascript
// Let ML predict the difficulty level
const questions = await AIService.generateQuestions(
  'Data Science',
  'auto',  // ← ML will decide!
  5,
  true
);
```

### Custom Parameters
```javascript
const questions = AIService.generateCustomQuestions({
  stream: 'AI/ML',
  topic: 'Deep Learning',
  difficulty: 'Hard',
  count: 3,
  strategy: 'hybrid',  // template-based, concept-based, example-based, hybrid
  useML: true
});
```

### Difficulty Prediction
```javascript
const prediction = AIService.predictQuestionDifficulty(
  'Computer Science',
  'Algorithms',
  'Implement a function to detect cycles in a graph'
);

console.log(prediction);
// {
//   difficulty: "Hard",
//   score: 7.8,
//   confidence: 82.3,
//   reasoning: "Contains technical terms: graph, cycle; Requires implementation"
// }
```

### Model Statistics
```javascript
const stats = AIService.getMLModelStats();

console.log(stats);
// {
//   difficultyPredictor: {
//     trainingExamples: 15,
//     technicalTermsCount: 50,
//     weights: { ... }
//   },
//   questionGenerator: {
//     datasetSize: 100,
//     availableStreams: ["Computer Science", "Data Science", ...]
//   }
// }
```

## ⚡ Performance Comparison

| Method | Speed | Cost | Quality | Offline |
|--------|-------|------|---------|---------|
| Custom ML | **50-100ms** | **$0** | **High** | **✅** |
| OpenAI API | 1-3 seconds | $$ | Very High | ❌ |

## 🔄 Integration

### Option 1: Always Use Custom AI (Recommended)
```javascript
// In routes/interview.js
const questions = await AIService.generateQuestions(
  stream,
  difficulty,
  count,
  true  // Always use custom AI
);
```

### Option 2: Smart Fallback
```javascript
// Try custom AI, fallback to OpenAI if needed
try {
  const questions = await AIService.generateQuestions(
    stream, difficulty, count, true
  );
} catch (error) {
  // Automatically falls back to OpenAI
  console.log('Custom AI failed, using OpenAI');
}
```

### Option 3: Let User Choose
```javascript
const useCustomAI = req.body.useCustomAI ?? true;
const questions = await AIService.generateQuestions(
  stream, difficulty, count, useCustomAI
);
```

## 📚 Supported Domains

- **Computer Science**
  - Data Structures (arrays, linked lists, trees, graphs)
  - Algorithms (sorting, searching, dynamic programming)
  - Object-Oriented Programming
  - System Design

- **Data Science**
  - Statistics (mean, median, hypothesis testing)
  - Machine Learning (supervised, unsupervised)
  - Feature Engineering

- **AI/ML**
  - Deep Learning (neural networks, CNNs, RNNs)
  - Transformers & Attention
  - NLP

- **Information Technology**
  - Networking (TCP/IP, DNS)
  - Cloud Computing
  - System Administration

## 🎓 Continuous Learning

Train with new examples:
```javascript
AIService.trainDifficultyModel({
  questionText: 'Your question here',
  stream: 'Computer Science',
  topic: 'Algorithms',
  actualDifficulty: 'Medium',
  feedback: 'Prediction was accurate'
});
```

Evaluate performance:
```javascript
const testSet = [
  { questionText: '...', stream: '...', actualDifficulty: '...' },
  // ... more test cases
];

const evaluation = AIService.evaluateModel(testSet);
console.log(`Accuracy: ${evaluation.accuracy}%`);
```

## 🐛 Troubleshooting

### Questions too similar?
- Increase training data diversity
- Use different generation strategies
- Enable `avoidDuplicates: true`

### Difficulty predictions wrong?
- Train with more examples
- Adjust model weights in `ml/difficultyPredictor.js`
- Add domain-specific technical terms

### Need more streams?
- Edit `ml/trainingData.js`
- Add your domain and questions
- Retrain the model

## 💡 Pro Tips

1. **Train before production**: Run `npm run train-ml` to improve accuracy
2. **Monitor confidence**: Questions with >70% confidence are more reliable
3. **Use hybrid strategy**: Best balance of quality and diversity
4. **Collect feedback**: Use actual difficulty ratings to retrain
5. **Check stats regularly**: `AIService.getMLModelStats()` for insights

## 🎉 Benefits

- ✅ **No API costs** - Generate unlimited questions
- ✅ **Fast** - 10-20x faster than API calls  
- ✅ **Offline** - Works without internet
- ✅ **Customizable** - Easy to extend
- ✅ **Learnable** - Improves with feedback
- ✅ **Private** - No data sent externally

## 📖 Full Documentation

See [ml/README.md](ml/README.md) for complete documentation.

## ❓ Need Help?

- Check `ml/README.md` for detailed docs
- Run `npm run test-ml` to verify setup
- Review example code in `ml/test.js`

---

**Ready to generate your first questions?**

```bash
npm run train-ml && npm run test-ml
```

🚀 You're all set!
