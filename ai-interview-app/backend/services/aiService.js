// Real AI service using OpenAI GPT-4 for intelligent interview system
// Enhanced with custom ML-based question generation
import OpenAI from 'openai';
import dotenv from 'dotenv';
import questionGenerator from '../ml/questionGenerator.js';
import difficultyPredictor from '../ml/difficultyPredictor.js';
// import ResumeParserService from './resumeParserService.js'; // Removed - using simple Python parser instead

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

  // =====================================================================
  // ADVANCED HR TECH INTEGRATION ENGINE
  // Role: Manage the lifecycle of job applications by processing resumes,
  //       managing notifications, and scoring candidates against job descriptions
  // =====================================================================

  /**
   * Task 1: Data Extraction & Profile Building
   * Parse resume to extract personal details, professional data, and skills
   * @param {String} resumeText - Raw text extracted from resume
   * @returns {Object} Structured candidate profile data
   */
  static async parseResumeAndBuildProfile(resumeText) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 TASK 1: DATA EXTRACTION & PROFILE BUILDING');
    console.log(`${'='.repeat(60)}\n`);

    const systemPrompt = `Role: You are an Advanced HR Tech Integration Engine. Your goal is to manage the lifecycle of a job application by processing resumes, managing notifications, and scoring candidates against job descriptions (JD).

Task: Data Extraction & Profile Building
When a candidate uploads a resume, parse the document to:
1. Extract Personal Details: Full Name, Email, Phone Number, LinkedIn URL, and Location.
2. Extract Professional Data: Work Experience (Company, Role, Duration), Education, and Certifications.
3. Identify Skills: Categorize into Hard Skills (Technical) and Soft Skills.

Output Format: Return a structured JSON object to populate the candidate's profile. Use this exact schema:
{
  "personalDetails": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "linkedinUrl": "string",
    "location": "string"
  },
  "workExperience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "year": "string"
    }
  ],
  "certifications": ["string"],
  "skills": {
    "hardSkills": ["string"],
    "softSkills": ["string"]
  }
}

Be thorough and extract all available information. If information is not found, use null or empty arrays.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this resume and extract all information:\n\n${resumeText}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const extractedData = JSON.parse(response.choices[0].message.content);
      
      console.log('✅ Successfully extracted candidate profile data');
      console.log(`   Name: ${extractedData.personalDetails?.fullName}`);
      console.log(`   Hard Skills: ${extractedData.skills?.hardSkills?.length || 0}`);
      console.log(`   Soft Skills: ${extractedData.skills?.softSkills?.length || 0}`);
      console.log(`   Experience: ${extractedData.workExperience?.length || 0} positions`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        success: true,
        data: extractedData
      };

    } catch (error) {
      console.error('❌ Error parsing resume:', error.message);
      
      // Fallback: return error since we're using simple Python parser now
      console.log('⚠️ Resume parsing failed - use /resume/parse endpoint with simple parser\n');
      
      return {
        success: false,
        error: error.message,
        hint: 'Use the /api/candidates/resume/parse endpoint with simple Python-based extraction'
      };
    }
  }

  /**
   * Basic fallback extraction when OpenAI is unavailable
   */
  static basicResumeExtraction(resumeText) {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g;
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;

    const emails = resumeText.match(emailRegex) || [];
    const phones = resumeText.match(phoneRegex) || [];
    const linkedin = resumeText.match(linkedinRegex) || [];

    // Extract skills (common technical keywords)
    const techSkills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'Docker', 'SQL', 
                        'MongoDB', 'Git', 'TypeScript', 'CSS', 'HTML', 'REST', 'API'];
    const foundSkills = techSkills.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      personalDetails: {
        fullName: null,
        email: emails[0] || null,
        phone: phones[0] || null,
        linkedinUrl: linkedin[0] || null,
        location: null
      },
      workExperience: [],
      education: [],
      certifications: [],
      skills: {
        hardSkills: foundSkills,
        softSkills: []
      }
    };
  }

  /**
   * Task 2: Smart Notification Logic
   * Compare candidate skills with job requirements and calculate match percentage
   * @param {Array} candidateSkills - Array of candidate's skills
   * @param {Array} requiredSkills - Array of job required skills
   * @returns {Object} Match analysis with percentage and recommendation
   */
  static calculateSkillMatch(candidateSkills, requiredSkills) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🎯 TASK 2: SMART NOTIFICATION LOGIC');
    console.log(`${'='.repeat(60)}\n`);

    if (!requiredSkills || requiredSkills.length === 0) {
      return { matchPercentage: 0, shouldNotify: false, matchedSkills: [], missingSkills: [] };
    }

    // Normalize skills to lowercase for comparison
    const candidateSkillsLower = (candidateSkills || []).map(s => s.toLowerCase().trim());
    const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase().trim());

    // Find matched skills
    const matchedSkills = requiredSkillsLower.filter(skill => 
      candidateSkillsLower.some(cSkill => 
        cSkill.includes(skill) || skill.includes(cSkill)
      )
    );

    // Find missing skills
    const missingSkills = requiredSkillsLower.filter(skill => 
      !matchedSkills.includes(skill)
    );

    // Calculate match percentage
    const matchPercentage = (matchedSkills.length / requiredSkillsLower.length) * 100;

    // Threshold for notification is 60%
    const shouldNotify = matchPercentage >= 60;

    console.log(`   Match Percentage: ${matchPercentage.toFixed(1)}%`);
    console.log(`   Matched Skills: ${matchedSkills.length}/${requiredSkillsLower.length}`);
    console.log(`   Should Notify: ${shouldNotify ? '✅ YES' : '❌ NO'}`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      matchPercentage: Math.round(matchPercentage),
      shouldNotify,
      matchedSkills,
      missingSkills,
      totalRequired: requiredSkillsLower.length,
      totalMatched: matchedSkills.length
    };
  }

  /**
   * Task 3: Validation & Resume Scoring
   * Score candidate's resume against specific job description
   * @param {Object} candidateProfile - Extracted candidate profile
   * @param {Object} jobDescription - Job requirements and description
   * @returns {Object} Score and gap analysis
   */
  static async scoreResumeAgainstJD(candidateProfile, jobDescription) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TASK 3: VALIDATION & RESUME SCORING');
    console.log(`${'='.repeat(60)}\n`);

    const systemPrompt = `Role: You are an Advanced HR Tech Integration Engine specialized in resume validation and scoring.

Task: Validation & Resume Scoring
Compare the Candidate's Resume against the specific Job Description (JD) provided by the recruiter.

Scoring Criteria:
1. Keyword Match (40 points): Presence of essential tools and technologies
2. Experience Relevance (30 points): Years of experience in similar roles
3. Educational Alignment (20 points): Degree requirements
4. Overall Fit (10 points): Cultural and soft skills alignment

Output Format: Return a JSON object with this schema:
{
  "overallScore": 85,
  "breakdown": {
    "keywordMatch": 38,
    "experienceRelevance": 25,
    "educationalAlignment": 15,
    "overallFit": 7
  },
  "gapAnalysis": [
    "Missing experience in AWS cloud services",
    "Recommendation: Obtain AWS certification",
    "Strong match in React and Node.js"
  ],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendation": "Highly Recommended | Recommended | Consider | Not Recommended"
}

Be objective and provide actionable feedback.`;

    try {
      const prompt = `
Candidate Profile:
${JSON.stringify(candidateProfile, null, 2)}

Job Description:
${JSON.stringify(jobDescription, null, 2)}

Score this candidate against the job requirements and provide detailed gap analysis.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const scoringResult = JSON.parse(response.choices[0].message.content);
      
      console.log(`✅ Resume Scoring Complete`);
      console.log(`   Overall Score: ${scoringResult.overallScore}/100`);
      console.log(`   Recommendation: ${scoringResult.recommendation}`);
      console.log(`   Gap Analysis Points: ${scoringResult.gapAnalysis?.length || 0}`);
      console.log(`${'='.repeat(60)}\n`);

      return {
        success: true,
        ...scoringResult
      };

    } catch (error) {
      console.error('❌ Error scoring resume:', error.message);
      
      // Fallback scoring
      return this.basicResumeScoring(candidateProfile, jobDescription);
    }
  }

  /**
   * Basic fallback scoring when OpenAI is unavailable
   */
  static basicResumeScoring(candidateProfile, jobDescription) {
    const candidateSkills = [
      ...(candidateProfile.skills?.hardSkills || []),
      ...(candidateProfile.skills?.softSkills || [])
    ];

    const requiredSkills = jobDescription.requiredSkills || [];
    const matchResult = this.calculateSkillMatch(candidateSkills, requiredSkills);

    // Simple scoring based on skill match
    const keywordScore = Math.round((matchResult.matchPercentage / 100) * 40);
    const experienceScore = candidateProfile.workExperience?.length >= 2 ? 20 : 10;
    const educationScore = candidateProfile.education?.length > 0 ? 15 : 5;
    const overallScore = keywordScore + experienceScore + educationScore + 5;

    const gapAnalysis = matchResult.missingSkills.map(skill => 
      `You are missing experience in ${skill}`
    );

    return {
      success: true,
      overallScore: Math.min(100, overallScore),
      breakdown: {
        keywordMatch: keywordScore,
        experienceRelevance: experienceScore,
        educationalAlignment: educationScore,
        overallFit: 5
      },
      gapAnalysis,
      strengths: matchResult.matchedSkills.map(s => `Strong in ${s}`),
      weaknesses: matchResult.missingSkills.slice(0, 5),
      recommendation: overallScore >= 70 ? 'Recommended' : 
                      overallScore >= 50 ? 'Consider' : 'Not Recommended'
    };
  }

  /**
   * Enhanced notification generator that includes skill match information
   * @param {Object} interview - Interview/Job posting
   * @param {Object} candidate - Candidate profile
   * @returns {Object} Notification message with match details
   */
  static generateSmartNotification(interview, candidate) {
    const candidateSkills = candidate.skills || [];
    const requiredSkills = interview.requiredSkills || [];
    
    const matchResult = this.calculateSkillMatch(candidateSkills, requiredSkills);

    if (!matchResult.shouldNotify) {
      return null; // Don't generate notification if below threshold
    }

    return {
      title: `🎯 ${matchResult.matchPercentage}% Match - ${interview.title || interview.stream}`,
      message: `An interview application is available that matches your skill set: ${interview.title || interview.stream} at ${interview.company || 'Company'}. You match ${matchResult.totalMatched}/${matchResult.totalRequired} required skills.`,
      matchPercentage: matchResult.matchPercentage,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      shouldApply: true
    };
  }

  /**
   * =====================================================================
   * ENHANCED AI EVALUATION ENGINE
   * Analyzes interview performance with timing, tone, and quality metrics
   * =====================================================================
   */
  
  /**
   * Enhanced Interview Evaluation with Timing & Tone Analysis
   * @param {Object} interviewData - Complete interview data
   * @returns {Object} Comprehensive evaluation with recommendations
   */
  static async evaluateInterviewComprehensive(interviewData) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎯 ENHANCED AI EVALUATION ENGINE - START');
    console.log(`${'='.repeat(80)}\n`);

    const { questions, malpractices, duration, jobDescription, stream, difficulty } = interviewData;
    
    // Step 1: Analyze Timing Metrics
    console.log('⏱️  STEP 1: Analyzing Timing & Response Speed...');
    const timingAnalysis = this.analyzeTimingMetrics(questions);
    console.log(`   Average Answer Time: ${timingAnalysis.averageAnswerTime}s`);
    console.log(`   Response Consistency: ${timingAnalysis.responseConsistency}`);
    console.log(`   Pace Analysis: ${timingAnalysis.paceAnalysis}\n`);

    // Step 2: Analyze Answer Quality
    console.log('📊 STEP 2: Analyzing Answer Quality...');
    const qualityAnalysis = await this.analyzeAnswerQuality(questions, jobDescription, stream, difficulty);
    console.log(`   Overall Quality Score: ${qualityAnalysis.overallQualityScore}/100`);
    console.log(`   Technical Accuracy: ${qualityAnalysis.technicalAccuracyScore}/100`);
    console.log(`   Relevance Score: ${qualityAnalysis.relevanceScore}/100\n`);

    // Step 3: Analyze Tone & Communication
    console.log('🎤 STEP 3: Analyzing Tone & Communication...');
    const toneAnalysis = await this.analyzeToneAndCommunication(questions);
    console.log(`   Professionalism: ${toneAnalysis.professionalism}/100`);
    console.log(`   Confidence: ${toneAnalysis.confidence}/100`);
    console.log(`   Overall Tone: ${toneAnalysis.overallTone}\n`);

    // Step 4: Calculate Comprehensive Score
    console.log('🎯 STEP 4: Calculating Comprehensive Score...');
    const comprehensiveScore = this.calculateEnhancedScore({
      timingAnalysis,
      qualityAnalysis,
      toneAnalysis,
      malpractices
    });
    console.log(`   Final Score: ${comprehensiveScore.finalScore}/100`);
    console.log(`   Recommendation: ${comprehensiveScore.recommendation}\n`);

    // Step 5: Generate Detailed Feedback
    console.log('💡 STEP 5: Generating Detailed Feedback...');
    const feedback = this.generateDetailedFeedback({
      timingAnalysis,
      qualityAnalysis,
      toneAnalysis,
      comprehensiveScore,
      malpractices
    });
    console.log(`   Pros: ${feedback.pros.length}`);
    console.log(`   Cons: ${feedback.cons.length}`);
    console.log(`   Improvement Suggestions: ${feedback.improvementSuggestions.length}\n`);

    console.log(`${'='.repeat(80)}`);
    console.log('✅ ENHANCED AI EVALUATION COMPLETE');
    console.log(`${'='.repeat(80)}\n`);

    return {
      enhancedEvaluation: {
        ...timingAnalysis,
        toneAnalysis,
        answerDepthScore: qualityAnalysis.depthScore,
        technicalAccuracyScore: qualityAnalysis.technicalAccuracyScore,
        relevanceScore: qualityAnalysis.relevanceScore,
        completenessScore: qualityAnalysis.completenessScore,
        overallQualityScore: qualityAnalysis.overallQualityScore,
        comparedToAverage: comprehensiveScore.comparedToAverage,
        percentileRank: comprehensiveScore.percentileRank,
        detailedFeedback: feedback.detailedFeedback,
        improvementSuggestions: feedback.improvementSuggestions,
        evaluatedAt: new Date()
      },
      score: comprehensiveScore.finalScore,
      recommendation: comprehensiveScore.recommendation,
      pros: feedback.pros,
      cons: feedback.cons,
      overallAssessment: feedback.overallAssessment,
      aiConfidenceLevel: comprehensiveScore.confidenceLevel
    };
  }

  /**
   * Analyze timing metrics for all answers
   */
  static analyzeTimingMetrics(questions) {
    const answeredQuestions = questions.filter(q => q.answer && q.answerDuration);
    
    if (answeredQuestions.length === 0) {
      return {
        averageAnswerTime: 0,
        totalThinkingTime: 0,
        responseConsistency: 'No Data',
        paceAnalysis: 'No Data'
      };
    }

    const durations = answeredQuestions.map(q => q.answerDuration);
    const averageAnswerTime = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const totalThinkingTime = durations.reduce((a, b) => a + b, 0);

    // Calculate standard deviation for consistency
    const variance = durations.reduce((sum, dur) => sum + Math.pow(dur - averageAnswerTime, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / averageAnswerTime) * 100;

    let responseConsistency;
    if (coefficientOfVariation < 25) responseConsistency = 'Consistent';
    else if (coefficientOfVariation < 50) responseConsistency = 'Variable';
    else responseConsistency = 'Inconsistent';

    // Analyze pace
    let paceAnalysis;
    if (averageAnswerTime < 30) paceAnalysis = 'Rushed';
    else if (averageAnswerTime < 90) paceAnalysis = 'Well-paced';
    else paceAnalysis = 'Slow';

    return {
      averageAnswerTime,
      totalThinkingTime,
      responseConsistency,
      paceAnalysis
    };
  }

  /**
   * Analyze answer quality using AI
   */
  static async analyzeAnswerQuality(questions, jobDescription, stream, difficulty) {
    const answeredQuestions = questions.filter(q => q.answer);
    
    if (answeredQuestions.length === 0) {
      return {
        overallQualityScore: 0,
        technicalAccuracyScore: 0,
        relevanceScore: 0,
        completenessScore: 0,
        depthScore: 0
      };
    }

    // Check if OpenAI API is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('⚠️ OpenAI API not configured. Using heuristic evaluation.');
      return this.analyzeAnswerQualityHeuristic(answeredQuestions);
    }

    try {
      const prompt = `Evaluate the quality of these interview answers for a ${stream} position at ${difficulty} level.

Job Context: ${jobDescription || 'General technical interview'}

Questions and Answers:
${answeredQuestions.map((q, i) => `
Q${i + 1}: ${q.question}
A${i + 1}: ${q.answer}
`).join('\n')}

Analyze and score each aspect (0-100):
1. Technical Accuracy: Are the answers technically correct?
2. Relevance: Do answers address the questions asked?
3. Completeness: Are answers thorough and complete?
4. Depth: Do answers show deep understanding?
5. Overall Quality: Overall assessment of answer quality

Respond in JSON format:
{
  "technicalAccuracyScore": 0-100,
  "relevanceScore": 0-100,
  "completenessScore": 0-100,
  "depthScore": 0-100,
  "overallQualityScore": 0-100,
  "reasoning": "Brief explanation"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert technical interviewer. Evaluate answer quality objectively. Return only valid JSON."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('❌ AI Quality Analysis Error:', error.message);
      return this.analyzeAnswerQualityHeuristic(answeredQuestions);
    }
  }

  /**
   * Heuristic-based quality analysis (fallback)
   */
  static analyzeAnswerQualityHeuristic(questions) {
    const scores = questions.map(q => {
      const wordCount = q.answer.split(/\s+/).length;
      const charCount = q.answer.length;
      
      // Score based on answer length and structure
      let score = 0;
      if (wordCount >= 50 && wordCount <= 300) score += 40;
      else if (wordCount >= 30) score += 25;
      else if (wordCount >= 15) score += 15;
      
      // Check for technical terms
      if (/\b(algorithm|system|design|implement|optimize|structure|process|function)\b/i.test(q.answer)) {
        score += 20;
      }
      
      // Check for examples
      if (/\b(example|instance|such as|for example|like)\b/i.test(q.answer)) {
        score += 15;
      }
      
      // Check for explanation markers
      if (/\b(because|therefore|thus|since|as a result)\b/i.test(q.answer)) {
        score += 15;
      }
      
      // Penalize very short or very long answers
      if (wordCount < 10) score -= 20;
      if (wordCount > 500) score -= 10;
      
      return Math.min(100, Math.max(0, score));
    });

    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return {
      technicalAccuracyScore: avgScore,
      relevanceScore: avgScore,
      completenessScore: avgScore - 5,
      depthScore: avgScore - 10,
      overallQualityScore: avgScore
    };
  }

  /**
   * Analyze tone and communication style
   */
  static async analyzeToneAndCommunication(questions) {
    const answeredQuestions = questions.filter(q => q.answer);
    
    if (answeredQuestions.length === 0) {
      return {
        professionalism: 0,
        confidence: 0,
        clarity: 0,
        articulation: 0,
        overallTone: 'No Data'
      };
    }

    // Heuristic analysis (can be enhanced with AI)
    const allAnswers = answeredQuestions.map(q => q.answer).join(' ');
    
    // Professionalism: Check for professional language
    let professionalism = 70;
    if (/\b(um|uh|like|basically|kinda|sorta|yeah)\b/gi.test(allAnswers)) {
      professionalism -= 15;
    }
    if (/\b(please|thank you|certainly|indeed|furthermore)\b/gi.test(allAnswers)) {
      professionalism += 15;
    }

    // Confidence: Check for confident language
    let confidence = 65;
    if (/\b(I think|maybe|perhaps|probably|might|could be)\b/gi.test(allAnswers)) {
      confidence -= 10;
    }
    if (/\b(definitely|certainly|clearly|obviously|absolutely)\b/gi.test(allAnswers)) {
      confidence += 20;
    }

    // Clarity: Check sentence structure
    const avgSentenceLength = allAnswers.split(/[.!?]/).length / answeredQuestions.length;
    let clarity = 70;
    if (avgSentenceLength > 5 && avgSentenceLength < 15) clarity += 20;
    if (avgSentenceLength > 20) clarity -= 15;

    // Articulation: Check vocabulary diversity
    const words = allAnswers.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyRichness = (uniqueWords.size / words.length) * 100;
    let articulation = Math.min(90, Math.round(vocabularyRichness * 2));

    // Overall tone
    const avgTone = (professionalism + confidence + clarity + articulation) / 4;
    let overallTone;
    if (avgTone >= 80) overallTone = 'Excellent';
    else if (avgTone >= 65) overallTone = 'Good';
    else if (avgTone >= 50) overallTone = 'Average';
    else overallTone = 'Poor';

    return {
      professionalism: Math.min(100, Math.max(0, professionalism)),
      confidence: Math.min(100, Math.max(0, confidence)),
      clarity: Math.min(100, Math.max(0, clarity)),
      articulation: Math.min(100, Math.max(0, articulation)),
      overallTone
    };
  }

  /**
   * Calculate enhanced comprehensive score
   */
  static calculateEnhancedScore({ timingAnalysis, qualityAnalysis, toneAnalysis, malpractices }) {
    // Base score from quality (50%)
    let finalScore = qualityAnalysis.overallQualityScore * 0.5;

    // Tone contribution (20%)
    const avgTone = (toneAnalysis.professionalism + toneAnalysis.confidence + 
                     toneAnalysis.clarity + toneAnalysis.articulation) / 4;
    finalScore += avgTone * 0.2;

    // Timing contribution (10%)
    let timingScore = 70;
    if (timingAnalysis.paceAnalysis === 'Well-paced') timingScore = 90;
    else if (timingAnalysis.paceAnalysis === 'Rushed') timingScore = 60;
    else timingScore = 70;
    
    if (timingAnalysis.responseConsistency === 'Consistent') timingScore += 10;
    finalScore += Math.min(100, timingScore) * 0.1;

    // Integrity (20%) - deduct for malpractices
    let integrityScore = 100;
    const deductions = {
      'tab_switch': 5,
      'multiple_voice': 15,
      'ai_generated_answer': 20,
      'face_not_detected': 10,
      'multiple_faces': 15
    };

    malpractices.forEach(m => {
      const deduction = deductions[m.type] || 10;
      if (m.severity === 'high') integrityScore -= deduction * 1.5;
      else if (m.severity === 'medium') integrityScore -= deduction;
      else integrityScore -= deduction * 0.5;
    });
    integrityScore = Math.max(0, integrityScore);
    finalScore += integrityScore * 0.2;

    finalScore = Math.round(Math.min(100, Math.max(0, finalScore)));

    // Determine recommendation
    let recommendation;
    if (finalScore >= 85 && integrityScore >= 90) recommendation = 'Strong Hire';
    else if (finalScore >= 70 && integrityScore >= 80) recommendation = 'Hire';
    else if (finalScore >= 55) recommendation = 'Maybe';
    else recommendation = 'No Hire';

    // Determine compared to average (simplified)
    let comparedToAverage;
    if (finalScore >= 75) comparedToAverage = 'Above Average';
    else if (finalScore >= 55) comparedToAverage = 'Average';
    else comparedToAverage = 'Below Average';

    // Calculate percentile (simplified estimation)
    const percentileRank = Math.min(99, Math.round(finalScore * 0.9));

    return {
      finalScore,
      recommendation,
      comparedToAverage,
      percentileRank,
      confidenceLevel: Math.round((finalScore / 100) * 85 + 15) // 15-100
    };
  }

  /**
   * Generate detailed feedback
   */
  static generateDetailedFeedback({ timingAnalysis, qualityAnalysis, toneAnalysis, comprehensiveScore, malpractices }) {
    const pros = [];
    const cons = [];
    const improvementSuggestions = [];
    const feedbackItems = [];

    // Analyze strengths
    if (qualityAnalysis.overallQualityScore >= 80) {
      pros.push('Demonstrated strong technical knowledge with comprehensive answers');
      feedbackItems.push('Excellent answer quality showing deep understanding of concepts');
    }
    
    if (toneAnalysis.professionalism >= 80) {
      pros.push('Maintained professional communication throughout the interview');
      feedbackItems.push('Professional tone and language usage');
    }
    
    if (timingAnalysis.paceAnalysis === 'Well-paced') {
      pros.push('Well-paced responses showing thoughtful consideration');
      feedbackItems.push('Good time management with appropriate response lengths');
    }
    
    if (malpractices.length === 0) {
      pros.push('Perfect integrity with no violations detected');
      feedbackItems.push('Maintained complete focus and integrity throughout');
    }

    // Ensure exactly 3 pros
    if (pros.length < 3) {
      if (toneAnalysis.confidence >= 70) {
        pros.push('Displayed confidence in technical knowledge and explanations');
      }
      if (timingAnalysis.responseConsistency === 'Consistent') {
        pros.push('Consistent response pattern showing reliable performance');
      }
      if (qualityAnalysis.technicalAccuracyScore >= 70) {
        pros.push('Technically accurate answers demonstrating solid foundation');
      }
    }

    // Analyze weaknesses
    if (qualityAnalysis.completenessScore < 60) {
      cons.push('Some answers lacked completeness and could be more detailed');
      improvementSuggestions.push('Provide more comprehensive answers with examples and explanations');
    }
    
    if (timingAnalysis.paceAnalysis === 'Rushed') {
      cons.push('Responses appeared rushed, may benefit from more thoughtful consideration');
      improvementSuggestions.push('Take more time to think through answers before responding');
    } else if (timingAnalysis.paceAnalysis === 'Slow') {
      cons.push('Response time was slower than average, affecting overall pace');
      improvementSuggestions.push('Work on time management to provide timely responses');
    }
    
    if (toneAnalysis.clarity < 65) {
      cons.push('Communication clarity could be improved for better understanding');
      improvementSuggestions.push('Structure answers more clearly with logical flow');
    }
    
    if (malpractices.length > 0) {
      cons.push(`Interview integrity affected by ${malpractices.length} violation(s)`);
      improvementSuggestions.push('Maintain focus on the interview window to avoid integrity issues');
    }

    // Ensure exactly 2 cons
    if (cons.length < 2) {
      if (qualityAnalysis.depthScore < 70) {
        cons.push('Answer depth could be enhanced with more detailed explanations');
      }
      if (toneAnalysis.confidence < 65) {
        cons.push('Could demonstrate more confidence in responses');
      }
    }

    // Limit to exactly 3 pros and 2 cons
    const finalPros = pros.slice(0, 3);
    const finalCons = cons.slice(0, 2);

    // Overall assessment
    const overallAssessment = `Candidate scored ${comprehensiveScore.finalScore}/100 overall. ` +
      `Performance was ${comprehensiveScore.comparedToAverage.toLowerCase()} ` +
      `(${comprehensiveScore.percentileRank}th percentile). ` +
      `${comprehensiveScore.recommendation === 'Strong Hire' || comprehensiveScore.recommendation === 'Hire' 
        ? 'Shows strong potential and recommended for hiring consideration.' 
        : comprehensiveScore.recommendation === 'Maybe' 
        ? 'Shows potential but has areas needing improvement.' 
        : 'Significant improvement needed to meet hiring standards.'}`;

    return {
      pros: finalPros,
      cons: finalCons,
      improvementSuggestions: improvementSuggestions.slice(0, 5),
      detailedFeedback: feedbackItems,
      overallAssessment
    };
  }
}

export default AIService;
