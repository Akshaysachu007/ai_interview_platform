// Real AI service using OpenAI GPT-4 for intelligent interview system
// Enhanced with custom ML-based question generation
import OpenAI from 'openai';
import dotenv from 'dotenv';
import questionGenerator from '../ml/questionGenerator.js';
import difficultyPredictor from '../ml/difficultyPredictor.js';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

class AIService {
  
  // Fallback question banks (used when API fails or for demo without API key)
  static questionBank = {
    'Computer Science': {
      'Easy': [
        'What is an algorithm? Explain with an example.',
        'What is the difference between a compiler and an interpreter?',
        'Explain what a variable is in programming.',
        'What is the purpose of a loop in programming?',
        'Define what an array is and give an example.'
      ],
      'Medium': [
        'Explain the concept of Object-Oriented Programming and its key principles.',
        'What is the difference between stack and heap memory?',
        'Describe how binary search works and its time complexity.',
        'What are the differences between SQL and NoSQL databases?',
        'Explain what RESTful APIs are and their key principles.'
      ],
      'Hard': [
        'Explain dynamic programming with an example problem.',
        'How does garbage collection work in modern programming languages?',
        'Describe the CAP theorem and its implications in distributed systems.',
        'Explain the difference between synchronous and asynchronous programming with real-world use cases.',
        'What are microservices? Discuss their advantages and challenges.'
      ]
    },
    'Information Technology': {
      'Easy': [
        'What is cloud computing? Name some popular cloud providers.',
        'What is the difference between HTTP and HTTPS?',
        'Explain what an IP address is.',
        'What is a firewall and why is it important?',
        'What does DNS stand for and what is its purpose?'
      ],
      'Medium': [
        'Explain the OSI model and its seven layers.',
        'What is virtualization and how is it used in IT?',
        'Describe different types of network topologies.',
        'What is the difference between symmetric and asymmetric encryption?',
        'Explain what DevOps is and its benefits.'
      ],
      'Hard': [
        'Describe how load balancing works in distributed systems.',
        'Explain containerization and its advantages over traditional virtualization.',
        'What are the security considerations in cloud computing?',
        'Describe a CI/CD pipeline and its components.',
        'Explain how Kubernetes orchestrates containerized applications.'
      ]
    },
    'Data Science': {
      'Easy': [
        'What is the difference between supervised and unsupervised learning?',
        'Define what a dataset is and give examples of structured and unstructured data.',
        'What is data visualization and why is it important?',
        'Explain what mean, median, and mode represent in statistics.',
        'What is a hypothesis in data science?'
      ],
      'Medium': [
        'Explain the bias-variance tradeoff in machine learning.',
        'What is cross-validation and why is it used?',
        'Describe the difference between classification and regression.',
        'What are outliers and how do you handle them?',
        'Explain what feature engineering is and provide examples.'
      ],
      'Hard': [
        'Explain how gradient descent optimization works.',
        'Describe the architecture of a neural network and how backpropagation works.',
        'What is overfitting and what techniques can prevent it?',
        'Explain ensemble methods like Random Forest and Gradient Boosting.',
        'Describe the differences between batch learning and online learning.'
      ]
    },
    'AI/ML': {
      'Easy': [
        'What is Artificial Intelligence and Machine Learning?',
        'Define what a neural network is.',
        'What is the difference between AI, ML, and Deep Learning?',
        'What is training data and testing data?',
        'Explain what an activation function is.'
      ],
      'Medium': [
        'Explain different types of neural networks (CNN, RNN, etc.).',
        'What is transfer learning and when would you use it?',
        'Describe how decision trees work.',
        'What is the difference between precision and recall?',
        'Explain what natural language processing (NLP) is.'
      ],
      'Hard': [
        'Explain the architecture and working of transformers.',
        'How do GANs (Generative Adversarial Networks) work?',
        'Describe reinforcement learning and its key components.',
        'Explain the attention mechanism in neural networks.',
        'What is federated learning and what are its applications?'
      ]
    },
    'Mechanical Engineering': {
      'Easy': [
        'What are the fundamental laws of thermodynamics?',
        'Define what stress and strain mean in materials.',
        'What is the difference between AC and DC motors?',
        'Explain what friction is and its types.',
        'What is the purpose of a bearing in mechanical systems?'
      ],
      'Medium': [
        'Explain the working principle of an internal combustion engine.',
        'What is the difference between brittle and ductile materials?',
        'Describe the heat transfer mechanisms: conduction, convection, and radiation.',
        'What is the Carnot cycle and its significance?',
        'Explain what finite element analysis (FEA) is used for.'
      ],
      'Hard': [
        'Explain the concept of fatigue failure in materials.',
        'Describe the working of a gas turbine engine.',
        'What are the principles of computational fluid dynamics?',
        'Explain the design considerations for pressure vessels.',
        'Describe advanced manufacturing techniques like additive manufacturing.'
      ]
    },
    'Business Management': {
      'Easy': [
        'What is the difference between leadership and management?',
        'Define what SWOT analysis is.',
        'What are the four functions of management?',
        'Explain what organizational culture means.',
        'What is the purpose of a business plan?'
      ],
      'Medium': [
        'Explain different leadership styles and their effectiveness.',
        'What is change management and why is it important?',
        'Describe the product life cycle stages.',
        'What is supply chain management?',
        'Explain the concept of corporate social responsibility.'
      ],
      'Hard': [
        'Describe strategic planning and execution frameworks.',
        'What are the challenges in managing global teams?',
        'Explain business process reengineering and its impact.',
        'Describe different organizational structures and their advantages.',
        'What are the key considerations in mergers and acquisitions?'
      ]
    }
  };

  // ENHANCED: Generate questions using custom ML model or OpenAI
  static async generateQuestions(stream, difficulty, count = 5, useCustomAI = true) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 QUESTION GENERATION REQUEST`);
    console.log(`   Stream: ${stream}`);
    console.log(`   Difficulty: ${difficulty}`);
    console.log(`   Count: ${count}`);
    console.log(`   Use Custom AI: ${useCustomAI}`);
    console.log(`${'='.repeat(60)}\n`);

    // Try custom ML-based generation first if enabled
    if (useCustomAI) {
      try {
        console.log('🤖 Using Custom ML-Based Question Generator...');
        
        // Use ML to predict difficulty if not specified
        let targetDifficulty = difficulty;
        if (!difficulty || difficulty === 'auto') {
          const prediction = difficultyPredictor.predictDifficulty({
            stream,
            topic: 'General',
            questionText: `Generate ${stream} questions`
          });
          targetDifficulty = prediction.difficulty;
          console.log(`   📊 ML Predicted Difficulty: ${targetDifficulty}`);
          console.log(`   📊 Confidence: ${prediction.confidence}%`);
          console.log(`   📊 Reasoning: ${prediction.reasoning}\n`);
        }

        // Generate questions using custom AI
        const questions = questionGenerator.generateQuestions({
          stream,
          topic: null,
          difficulty: targetDifficulty,
          count,
          avoidDuplicates: true
        });

        if (questions && questions.length > 0) {
          console.log(`\n✅ Successfully generated ${questions.length} questions using Custom ML AI`);
          console.log(`${'='.repeat(60)}\n`);
          
          // Format questions for the application
          return questions.map((q, index) => ({
            question: q.question,
            generatedAt: q.generatedAt,
            category: q.category,
            aiGenerated: true,
            mlGenerated: true,
            model: 'custom-ml-model',
            predictedDifficulty: q.predictedDifficulty,
            difficultyScore: q.difficultyScore,
            confidence: q.confidence,
            generationStrategy: q.generationStrategy
          }));
        }

        console.log('⚠️ Custom AI generation failed, falling back to OpenAI...\n');
      } catch (error) {
        console.error('❌ Custom ML Error:', error.message);
        console.log('Falling back to OpenAI API...\n');
      }
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('⚠️ OpenAI API key not configured. Using fallback question bank.');
      return this.generateFallbackQuestions(stream, difficulty, count);
    }

    try {
      console.log(`🤖 Generating ${count} questions using OpenAI GPT-4...`);
      
      // Get ML prediction for better prompt
      const mlPrediction = difficultyPredictor.predictDifficulty({
        stream,
        topic: 'General',
        questionText: `Generate ${stream} questions at ${difficulty} level`
      });

      // IMPROVED: Better prompt structure with ML insights
      const prompt = `You are an AI system assisting a machine learning-based interview platform.

The machine learning model has classified the difficulty level as: ${difficulty}

Based on the following parameters, generate interview questions:
- Computer Science Domain: ${stream}
- Topic Focus: General
- Target Difficulty: ${difficulty}
- ML Confidence: ${mlPrediction.confidence}%
- ML Reasoning: ${mlPrediction.reasoning}

Guidelines:
- Align complexity with ML-predicted difficulty (${difficulty}).
- Use professional interview language.
- Emphasize reasoning over memorization.
- Avoid direct repetition from training data.
- Easy: Test basic concepts and fundamentals
- Medium: Test practical application and problem-solving
- Hard: Test advanced concepts, system design, and optimization

Generate exactly ${count} interview questions.

Respond ONLY with a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Your first question here?",
      "category": "Relevant category"
    },
    {
      "question": "Your second question here?",
      "category": "Relevant category"
    }
  ]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert technical interviewer. Generate high-quality interview questions. Respond ONLY with valid JSON, no markdown, no explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;
      console.log('📝 Raw API Response:', responseText.substring(0, 200) + '...');
      
      let questions;
      
      try {
        const parsed = JSON.parse(responseText);
        console.log('✅ Successfully parsed JSON');
        
        // FIXED: Better extraction logic
        if (Array.isArray(parsed)) {
          questions = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        } else {
          // Try to find array in response
          const values = Object.values(parsed);
          const arrayValue = values.find(v => Array.isArray(v));
          questions = arrayValue || [];
        }

        console.log(`📊 Extracted ${questions.length} questions from response`);

        if (!questions || questions.length === 0) {
          console.warn('⚠️ No questions found in API response, using fallback');
          return this.generateFallbackQuestions(stream, difficulty, count);
        }

      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
        console.error('Response was:', responseText);
        return this.generateFallbackQuestions(stream, difficulty, count);
      }

      // FIXED: Validate and format questions with better error handling
      const formattedQuestions = questions
        .slice(0, count)
        .map((q, index) => {
          // Handle both string and object formats
          const questionText = typeof q === 'string' ? q : (q.question || q.text || `Generated question ${index + 1}`);
          const category = typeof q === 'object' ? (q.category || this.categorizeQuestion(questionText)) : this.categorizeQuestion(questionText);
          
          return {
            question: questionText,
            generatedAt: new Date(),
            category: category,
            aiGenerated: true,
            model: 'gpt-4o-mini'
          };
        })
        .filter(q => q.question && q.question.length > 10); // Filter out invalid questions

      if (formattedQuestions.length === 0) {
        console.warn('⚠️ No valid questions after formatting, using fallback');
        return this.generateFallbackQuestions(stream, difficulty, count);
      }

      console.log(`✅ Successfully generated ${formattedQuestions.length} AI questions`);
      formattedQuestions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.question.substring(0, 60)}...`);
      });

      return formattedQuestions;

    } catch (error) {
      console.error('❌ OpenAI API Error:', error.message);
      if (error.response) {
        console.error('API Response:', error.response.status, error.response.data);
      }
      
      console.log('Using fallback question bank...');
      return this.generateFallbackQuestions(stream, difficulty, count);
    }
  }

  // Fallback method using predefined questions
  static generateFallbackQuestions(stream, difficulty, count = 5) {
    const questions = this.questionBank[stream]?.[difficulty] || [];
    
    if (questions.length === 0) {
      // Ultimate fallback
      return Array(count).fill(null).map((_, i) => ({
        question: `Question ${i + 1} for ${stream} (${difficulty} level): Explain a key concept in your field.`,
        generatedAt: new Date(),
        category: 'General',
        aiGenerated: false
      }));
    }

    // Shuffle and select questions
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map(q => ({
      question: q,
      generatedAt: new Date(),
      category: this.categorizeQuestion(q),
      aiGenerated: false
    }));
  }

  // Categorize question based on keywords
  static categorizeQuestion(question) {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('algorithm') || lowerQ.includes('code') || lowerQ.includes('program')) {
      return 'Programming';
    } else if (lowerQ.includes('database') || lowerQ.includes('sql')) {
      return 'Database';
    } else if (lowerQ.includes('network') || lowerQ.includes('protocol')) {
      return 'Networking';
    } else if (lowerQ.includes('machine learning') || lowerQ.includes('ai') || lowerQ.includes('neural')) {
      return 'AI/ML';
    } else if (lowerQ.includes('data')) {
      return 'Data Science';
    }
    return 'Theory';
  }

  // Detect if answer is AI-generated using REAL AI
  static async detectAIGeneratedAnswer(answer) {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('⚠️ OpenAI API key not configured. Using pattern-based detection.');
      return this.detectAIGeneratedAnswerFallback(answer);
    }

    try {
      console.log('🤖 Analyzing answer with real AI detection...');

      const prompt = `Analyze the following interview answer and determine if it was likely written by an AI or a human.

Answer to analyze:
"${answer}"

Consider these factors:
1. Language patterns typical of AI (overly formal, perfect grammar, structured lists)
2. Generic phrases common in AI responses
3. Lack of personal experience or specific examples
4. Overly comprehensive or textbook-like responses
5. Use of phrases like "Certainly", "Furthermore", "In conclusion", etc.

Respond with a JSON object:
{
  "isAiGenerated": true/false,
  "confidence": 0-100 (percentage),
  "reasoning": "brief explanation",
  "indicators": ["list", "of", "specific", "indicators", "found"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at detecting AI-generated text. Analyze the given text and determine if it was written by AI or a human. Be thorough and accurate. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      const analysis = JSON.parse(response);

      console.log(`✅ AI Detection: ${analysis.isAiGenerated ? 'AI-GENERATED' : 'HUMAN'} (${analysis.confidence}% confidence)`);

      return {
        isAiGenerated: analysis.isAiGenerated,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        indicators: analysis.indicators || [],
        detectionMethod: 'openai-gpt4'
      };

    } catch (error) {
      console.error('❌ OpenAI AI Detection Error:', error.message);
      
      // Fallback to pattern-based detection
      console.log('Using pattern-based detection...');
      return this.detectAIGeneratedAnswerFallback(answer);
    }
  }

  // Fallback AI detection using pattern matching
  static detectAIGeneratedAnswerFallback(answer) {
    // Simulate AI detection with pattern matching
    const aiIndicators = [
      /^(as an ai|i'm an ai|i am an artificial)/i,
      /^(certainly|sure|of course),?\s+(here|i)/i,
      /(in conclusion|to summarize|in summary),/i,
      /\d+\.\s+.*\n\d+\.\s+/g, // Numbered lists
      /^(here's|here is) (a|an|the)/i,
      /(it's worth noting|it is important to note)/i,
      /(various|numerous) (factors|aspects|elements)/i
    ];

    let indicatorCount = 0;
    let confidence = 0;

    // Check for AI patterns
    aiIndicators.forEach(pattern => {
      if (pattern.test(answer)) {
        indicatorCount++;
      }
    });

    // Check for perfect grammar and structure (simplified)
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = answer.length / Math.max(sentences.length, 1);
    
    // Check for overly formal language
    const formalWords = ['furthermore', 'moreover', 'consequently', 'nevertheless', 'accordingly'];
    const formalCount = formalWords.filter(word => 
      answer.toLowerCase().includes(word)
    ).length;

    // Calculate confidence score
    if (indicatorCount >= 2) confidence += 40;
    else if (indicatorCount === 1) confidence += 20;

    if (avgSentenceLength > 100 && avgSentenceLength < 150) confidence += 20;
    if (formalCount >= 2) confidence += 20;
    if (sentences.length >= 3 && answer.length > 200) confidence += 20;

    const isAiGenerated = confidence >= 50;

    return {
      isAiGenerated,
      confidence,
      indicators: {
        patternMatches: indicatorCount,
        formalLanguage: formalCount,
        averageSentenceLength: Math.round(avgSentenceLength)
      },
      detectionMethod: 'pattern-based-fallback'
    };
  }

  // Simulate voice analysis for multiple speakers
  static analyzeVoice(audioFeatures) {
    // In production, integrate with voice recognition API
    // This simulates detection based on voice characteristics
    
    const { pitch, frequency, duration } = audioFeatures;
    
    // Simulate voice fingerprint analysis
    const voiceChangeProbability = Math.random();
    const hasMultipleVoices = voiceChangeProbability > 0.7;
    
    return {
      multipleVoicesDetected: hasMultipleVoices,
      confidence: Math.round(voiceChangeProbability * 100),
      numberOfSpeakers: hasMultipleVoices ? Math.floor(Math.random() * 2) + 2 : 1,
      details: hasMultipleVoices 
        ? 'Significant voice characteristic changes detected'
        : 'Consistent voice pattern throughout'
    };
  }

  // Analyze face detection data
  static analyzeFaceDetection(faceData) {
    const { facesDetected, timestamp, imageData } = faceData;
    
    let issue = null;
    let severity = 'low';
    let details = '';

    if (facesDetected === 0) {
      issue = 'face_not_detected';
      severity = 'high';
      details = 'No face detected in video feed - candidate may not be visible';
    } else if (facesDetected > 1) {
      issue = 'multiple_faces';
      severity = 'high';
      details = `Multiple faces detected (${facesDetected}) - unauthorized person(s) may be present`;
    } else {
      // Exactly 1 face detected - all good
      details = 'Single face detected - monitoring normal';
    }

    return {
      hasIssue: issue !== null,
      type: issue,
      severity,
      facesCount: facesDetected,
      timestamp,
      details,
      isValid: facesDetected === 1 // Only 1 face is valid
    };
  }

  // Score the interview based on answers and malpractices
  static calculateScore(answers, malpractices) {
    let baseScore = 100;
    
    // Deduct points for malpractices
    const deductions = {
      'tab_switch': 5,
      'multiple_voice': 15,
      'ai_generated_answer': 20,
      'face_not_detected': 10,
      'multiple_faces': 15
    };

    malpractices.forEach(m => {
      if (m.severity === 'high') {
        baseScore -= (deductions[m.type] || 10) * 1.5;
      } else if (m.severity === 'medium') {
        baseScore -= (deductions[m.type] || 10);
      } else {
        baseScore -= (deductions[m.type] || 10) * 0.5;
      }
    });

    // Ensure score doesn't go below 0
    return Math.max(0, Math.round(baseScore));
  }

  // NEW: Get ML model statistics
  static getMLModelStats() {
    return {
      difficultyPredictor: difficultyPredictor.getModelStats(),
      questionGenerator: questionGenerator.getStats()
    };
  }

  // NEW: Train the difficulty predictor with feedback
  static trainDifficultyModel(trainingData) {
    console.log('🎓 Training difficulty predictor...');
    const result = difficultyPredictor.train(trainingData);
    console.log('✅ Training complete:', result);
    return result;
  }

  // NEW: Evaluate model performance
  static evaluateModel(testSet) {
    console.log('📊 Evaluating model performance...');
    const evaluation = difficultyPredictor.evaluate(testSet);
    console.log('✅ Evaluation complete:', evaluation.summary);
    return evaluation;
  }

  // NEW: Predict difficulty for custom question
  static predictQuestionDifficulty(stream, topic, questionText) {
    return difficultyPredictor.predictDifficulty({
      stream,
      topic,
      questionText
    });
  }

  // NEW: Generate questions with specific parameters
  static generateCustomQuestions(params) {
    const {
      stream,
      topic = null,
      difficulty = null,
      count = 5,
      strategy = null,
      useML = true
    } = params;

    if (useML) {
      return questionGenerator.generateQuestions({
        stream,
        topic,
        difficulty,
        count,
        avoidDuplicates: true,
        context: { strategy }
      });
    } else {
      return this.generateFallbackQuestions(stream, difficulty, count);
    }
  }
}

export default AIService;
