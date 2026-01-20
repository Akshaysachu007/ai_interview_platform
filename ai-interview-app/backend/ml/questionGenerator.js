// Custom AI Question Generator
// Generates interview questions using trained model and dataset

import { trainingDataset, questionTemplates, conceptGraph } from './trainingData.js';
import difficultyPredictor from './difficultyPredictor.js';

class QuestionGenerator {
  constructor() {
    this.dataset = trainingDataset;
    this.templates = questionTemplates;
    this.conceptGraph = conceptGraph;
    this.generatedQuestions = new Map(); // Cache to avoid duplicates
  }

  /**
   * Main method to generate interview questions
   * @param {Object} params - Generation parameters
   * @returns {Array} Generated questions
   */
  generateQuestions(params) {
    const {
      stream,
      topic = null,
      difficulty = null,
      count = 5,
      avoidDuplicates = true,
      context = {}
    } = params;

    console.log(`🎯 Generating ${count} questions for ${stream} (${difficulty || 'auto-predicted'})`);

    const questions = [];
    let attempts = 0;
    const maxAttempts = count * 5; // Allow multiple attempts to avoid duplicates

    while (questions.length < count && attempts < maxAttempts) {
      attempts++;

      try {
        // Predict difficulty if not provided
        let targetDifficulty = difficulty;
        
        if (!targetDifficulty) {
          // Auto-predict based on stream and topic
          const prediction = difficultyPredictor.predictDifficulty({
            stream,
            topic: topic || 'General',
            questionText: `Generate a ${stream} question about ${topic || 'general concepts'}`,
            context
          });
          targetDifficulty = prediction.difficulty;
          console.log(`   📊 ML Predicted Difficulty: ${targetDifficulty} (${prediction.confidence}% confidence)`);
        }

        // Generate question using different strategies
        const strategy = this.selectGenerationStrategy(questions.length);
        const question = this.generateByStrategy(
          stream,
          topic,
          targetDifficulty,
          strategy,
          context
        );

        // Validate and add question
        if (question && this.validateQuestion(question, questions, avoidDuplicates)) {
          // Predict actual difficulty of generated question
          const difficultyCheck = difficultyPredictor.predictDifficulty({
            stream,
            topic: question.category || topic,
            questionText: question.question,
            context
          });

          question.predictedDifficulty = difficultyCheck.difficulty;
          question.difficultyScore = difficultyCheck.score;
          question.confidence = difficultyCheck.confidence;
          question.mlGenerated = true;
          question.generationStrategy = strategy;

          questions.push(question);
          
          console.log(`   ✅ Generated: ${question.question.substring(0, 60)}...`);
          console.log(`      ML Difficulty Check: ${difficultyCheck.difficulty} (score: ${difficultyCheck.score})`);
        }
      } catch (error) {
        console.error(`   ❌ Error generating question: ${error.message}`);
      }
    }

    if (questions.length < count) {
      console.warn(`   ⚠️ Only generated ${questions.length}/${count} questions after ${attempts} attempts`);
    }

    return questions;
  }

  /**
   * Select generation strategy based on position
   */
  selectGenerationStrategy(position) {
    const strategies = [
      'template-based',
      'concept-based',
      'example-based',
      'hybrid'
    ];
    
    // Rotate through strategies for diversity
    return strategies[position % strategies.length];
  }

  /**
   * Generate question using selected strategy
   */
  generateByStrategy(stream, topic, difficulty, strategy, context) {
    switch (strategy) {
      case 'template-based':
        return this.generateFromTemplate(stream, topic, difficulty);
      
      case 'concept-based':
        return this.generateFromConcepts(stream, topic, difficulty);
      
      case 'example-based':
        return this.generateFromExamples(stream, topic, difficulty);
      
      case 'hybrid':
        return this.generateHybrid(stream, topic, difficulty, context);
      
      default:
        return this.generateFromTemplate(stream, topic, difficulty);
    }
  }

  /**
   * Generate question from templates
   */
  generateFromTemplate(stream, topic, difficulty) {
    const templates = this.templates[difficulty] || this.templates['Medium'];
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Get relevant concepts for the stream/topic
    const concepts = this.getRelevantConcepts(stream, topic, difficulty);
    
    if (concepts.length === 0) {
      return null;
    }

    // Fill template with concepts
    let question = template;
    
    if (question.includes('{concept}') || question.includes('{concept1}')) {
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      question = question.replace('{concept}', concept);
      question = question.replace('{concept1}', concept);
    }

    if (question.includes('{concept2}') && concepts.length > 1) {
      const concept2 = concepts.filter(c => c !== concepts[0])[0];
      question = question.replace('{concept2}', concept2);
    }

    if (question.includes('{problem}')) {
      const problems = this.getProblemScenarios(stream, difficulty);
      const problem = problems[Math.floor(Math.random() * problems.length)];
      question = question.replace('{problem}', problem);
    }

    if (question.includes('{system}')) {
      const systems = ['caching system', 'distributed database', 'API gateway', 'message queue', 'load balancer', 'microservice', 'content delivery network'];
      question = question.replace('{system}', systems[Math.floor(Math.random() * systems.length)]);
    }

    if (question.includes('{constraint}')) {
      const constraints = ['high throughput', 'low latency', 'limited memory', 'scalability', 'fault tolerance', 'high availability', 'data consistency'];
      question = question.replace('{constraint}', constraints[Math.floor(Math.random() * constraints.length)]);
    }

    // Apply paraphrasing to template-generated question
    question = this.paraphraseQuestion(question, difficulty);

    return {
      question,
      category: topic || this.categorizeConcepts(concepts),
      generatedAt: new Date(),
      difficulty,
      source: 'template-based'
    };
  }

  /**
   * Generate question from concept relationships
   */
  generateFromConcepts(stream, topic, difficulty) {
    const concepts = this.getRelevantConcepts(stream, topic, difficulty);
    
    if (concepts.length === 0) return null;

    const primaryConcept = concepts[Math.floor(Math.random() * concepts.length)];
    const conceptInfo = this.conceptGraph[primaryConcept.toLowerCase()];

    if (!conceptInfo) {
      // Fallback to simple question
      return {
        question: `Explain ${primaryConcept} and its applications in ${stream}.`,
        category: topic || primaryConcept,
        generatedAt: new Date(),
        difficulty,
        source: 'concept-based'
      };
    }

    // Generate based on concept relationships
    let question;
    
    if (difficulty === 'Easy' && conceptInfo.prerequisite && conceptInfo.prerequisite.length > 0) {
      const variations = [
        `What are the prerequisites to understand ${primaryConcept}? Explain ${conceptInfo.prerequisite[0]}.`,
        `Before learning ${primaryConcept}, what foundational knowledge is needed? Describe ${conceptInfo.prerequisite[0]}.`,
        `What basic concepts should one know before studying ${primaryConcept}? Discuss ${conceptInfo.prerequisite[0]}.`
      ];
      question = variations[Math.floor(Math.random() * variations.length)];
    } else if (difficulty === 'Medium' && conceptInfo.related && conceptInfo.related.length > 0) {
      const related = conceptInfo.related[Math.floor(Math.random() * conceptInfo.related.length)];
      const variations = [
        `Compare ${primaryConcept} with ${related}. How do they differ in implementation and use cases?`,
        `What are the key differences between ${primaryConcept} and ${related}? Explain their respective use cases.`,
        `Contrast ${primaryConcept} and ${related}. When would you choose one over the other?`,
        `How does ${primaryConcept} compare to ${related} in terms of implementation and practical applications?`
      ];
      question = variations[Math.floor(Math.random() * variations.length)];
    } else if (difficulty === 'Hard' && conceptInfo.advanced && conceptInfo.advanced.length > 0) {
      const advanced = conceptInfo.advanced[Math.floor(Math.random() * conceptInfo.advanced.length)];
      const variations = [
        `Design a solution using ${advanced}. How does it improve upon basic ${primaryConcept}?`,
        `Architect a system leveraging ${advanced}. What advantages does it provide over traditional ${primaryConcept}?`,
        `Create an implementation using ${advanced}. How does this enhance the capabilities of ${primaryConcept}?`,
        `Propose a design utilizing ${advanced}. In what ways does it optimize ${primaryConcept}?`
      ];
      question = variations[Math.floor(Math.random() * variations.length)];
    } else {
      const variations = [
        `Explain ${primaryConcept} in detail and provide a practical example from ${stream}.`,
        `Describe ${primaryConcept} comprehensively. Include a real-world example from ${stream}.`,
        `What is ${primaryConcept}? Elaborate with practical applications in ${stream}.`,
        `Detail ${primaryConcept} and illustrate with an example from ${stream}.`
      ];
      question = variations[Math.floor(Math.random() * variations.length)];
    }

    // Apply additional paraphrasing
    question = this.paraphraseQuestion(question, difficulty);

    return {
      question,
      category: topic || primaryConcept,
      generatedAt: new Date(),
      difficulty,
      source: 'concept-based'
    };
  }

  /**
   * Generate question from training examples
   */
  generateFromExamples(stream, topic, difficulty) {
    // Get similar examples from training data
    const streamData = this.dataset[stream];
    if (!streamData) return null;

    const allExamples = [];
    
    Object.keys(streamData).forEach(topicKey => {
      if (streamData[topicKey][difficulty]) {
        allExamples.push(...streamData[topicKey][difficulty]);
      }
    });

    if (allExamples.length === 0) return null;

    // Select a random example
    const example = allExamples[Math.floor(Math.random() * allExamples.length)];

    // Create variation of the example
    const variation = this.createVariation(example, stream, difficulty);

    return {
      question: variation,
      category: topic || example.concepts[0],
      generatedAt: new Date(),
      difficulty,
      source: 'example-based',
      originalConcepts: example.concepts
    };
  }

  /**
   * Create variation of existing question
   */
  createVariation(example, stream, difficulty) {
    let question = example.question;

    // Enhanced paraphrasing with more natural variations
    const paraphrasingRules = [
      // Question starter variations
      { from: /^Explain /i, to: ['Describe ', 'Elaborate on ', 'Discuss ', 'Detail '][Math.floor(Math.random() * 4)] },
      { from: /^What is /i, to: ['Define ', 'Explain what ', 'Describe what ', 'What do you understand by '][Math.floor(Math.random() * 4)] },
      { from: /^How does /i, to: ['In what way does ', 'Explain how ', 'Describe the mechanism of how ', 'What is the process by which '][Math.floor(Math.random() * 4)] },
      { from: /^Why /i, to: ['For what reason ', 'Explain why ', 'What are the reasons that ', 'What causes '][Math.floor(Math.random() * 4)] },
      { from: /^Describe /i, to: ['Explain ', 'Outline ', 'Detail ', 'Discuss '][Math.floor(Math.random() * 4)] },
      
      // Mid-question phrase variations
      { from: / and its applications/i, to: [' and how it is applied', ' and where it can be used', ' along with its practical uses', ' and its real-world implementations'][Math.floor(Math.random() * 4)] },
      { from: / in detail/i, to: [' comprehensively', ' thoroughly', ' in depth', ' with examples'][Math.floor(Math.random() * 4)] },
      { from: / the difference between/i, to: [' how ', ' the distinctions between', ' what distinguishes', ' the contrast between'][Math.floor(Math.random() * 4)] },
      
      // Technical term variations
      { from: /algorithm/i, to: ['approach', 'method', 'technique', 'algorithm'][Math.floor(Math.random() * 4)] },
      { from: /implement/i, to: ['develop', 'build', 'create', 'implement'][Math.floor(Math.random() * 4)] },
      { from: /optimize/i, to: ['improve', 'enhance', 'optimize', 'refine'][Math.floor(Math.random() * 4)] },
    ];

    // Apply random paraphrasing rules
    const numRulesToApply = Math.floor(Math.random() * 3) + 1; // Apply 1-3 rules
    const shuffledRules = paraphrasingRules.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numRulesToApply && i < shuffledRules.length; i++) {
      const rule = shuffledRules[i];
      if (rule.from.test(question)) {
        question = question.replace(rule.from, rule.to);
      }
    }

    // Apply transformations based on difficulty
    const contextEnhancements = [
      // Add context for medium/hard questions
      (q) => {
        if (difficulty === 'Medium') {
          const additions = [
            ' Include practical examples in your answer.',
            ' Support your answer with real-world scenarios.',
            ' Provide concrete examples to illustrate your points.',
            ' Give examples from industry practices.'
          ];
          return q + additions[Math.floor(Math.random() * additions.length)];
        }
        return q;
      },
      
      // Make hard questions more challenging
      (q) => {
        if (difficulty === 'Hard') {
          const hardEnhancements = [
            ' Consider edge cases and optimization techniques.',
            ' Discuss trade-offs and design considerations.',
            ' Include performance analysis and scalability aspects.',
            ' Address potential challenges and best practices.'
          ];
          return q.replace(/\?$/, '?') + hardEnhancements[Math.floor(Math.random() * hardEnhancements.length)];
        }
        return q;
      },
      
      // Add comparison elements for medium/hard
      (q) => {
        if (example.concepts && example.concepts.length > 1 && (difficulty === 'Medium' || difficulty === 'Hard')) {
          const comparisons = [
            ` Compare this with ${example.concepts[1]}.`,
            ` How does this differ from ${example.concepts[1]}?`,
            ` Contrast it with ${example.concepts[1]}.`,
            ` What advantages does it have over ${example.concepts[1]}?`
          ];
          return q.replace(/\.$/, '') + comparisons[Math.floor(Math.random() * comparisons.length)];
        }
        return q;
      },
      
      // Add scenario-based context
      (q) => {
        if (difficulty !== 'Easy' && Math.random() > 0.5) {
          const scenarios = [
            ' in a large-scale application',
            ' in a production environment',
            ' when dealing with high traffic',
            ' in a distributed system',
            ' for enterprise applications'
          ];
          return q.replace(/\?$/, scenarios[Math.floor(Math.random() * scenarios.length)] + '?');
        }
        return q;
      }
    ];

    // Apply 1-2 random context enhancements
    const numEnhancements = Math.floor(Math.random() * 2) + 1;
    const shuffledEnhancements = contextEnhancements.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numEnhancements && i < shuffledEnhancements.length; i++) {
      question = shuffledEnhancements[i](question);
    }

    // Final cleanup: ensure proper punctuation
    question = question.trim();
    if (!question.endsWith('?') && !question.endsWith('.')) {
      question += '?';
    }

    return question;
  }

  /**
   * Paraphrase question to make it more natural and unique
   * Separate method for better reusability
   */
  paraphraseQuestion(question, difficulty) {
    // Simple paraphrasing rules for quick variations
    const quickParaphrases = [
      { from: /^Explain how /i, to: ['Describe the process of how ', 'Walk through how ', 'Detail the mechanism by which ', 'Explain the way '][Math.floor(Math.random() * 4)] },
      { from: /^What are /i, to: ['Enumerate ', 'List and explain ', 'Identify ', 'What do you consider to be '][Math.floor(Math.random() * 4)] },
      { from: /^Describe the /i, to: ['Explain the ', 'Outline the ', 'Detail the ', 'Discuss the '][Math.floor(Math.random() * 4)] },
      { from: / benefits /i, to: [' advantages ', ' pros ', ' positive aspects ', ' benefits '][Math.floor(Math.random() * 4)] },
      { from: / drawbacks /i, to: [' disadvantages ', ' cons ', ' limitations ', ' drawbacks '][Math.floor(Math.random() * 4)] },
      { from: / implement /i, to: [' build ', ' create ', ' develop ', ' implement '][Math.floor(Math.random() * 4)] },
    ];

    // Apply one random quick paraphrase if applicable
    const applicableRules = quickParaphrases.filter(rule => rule.from.test(question));
    if (applicableRules.length > 0) {
      const rule = applicableRules[Math.floor(Math.random() * applicableRules.length)];
      question = question.replace(rule.from, rule.to);
    }

    // Add variety to question endings
    if (difficulty === 'Medium' && Math.random() > 0.6) {
      const endings = [
        ' Explain with examples.',
        ' Provide a detailed explanation.',
        ' Include use cases in your answer.',
        ' Support your answer with examples.'
      ];
      question = question.replace(/\?$/, '?') + endings[Math.floor(Math.random() * endings.length)];
    }

    return question.trim();
  }

  /**
   * Hybrid generation combining multiple strategies
   */
  generateHybrid(stream, topic, difficulty, context) {
    // Use ML-based prediction to guide generation
    const prediction = difficultyPredictor.predictDifficulty({
      stream,
      topic: topic || 'General',
      questionText: `Generate advanced question about ${topic || stream}`,
      context
    });

    // Select strategy based on prediction
    if (prediction.confidence > 70) {
      return this.generateFromConcepts(stream, topic, difficulty);
    } else {
      return this.generateFromTemplate(stream, topic, difficulty);
    }
  }

  /**
   * Get relevant concepts for stream/topic
   */
  getRelevantConcepts(stream, topic, difficulty) {
    const streamData = this.dataset[stream];
    if (!streamData) return [];

    const concepts = new Set();

    // Extract concepts from training data
    Object.keys(streamData).forEach(topicKey => {
      if (!topic || topicKey.toLowerCase().includes(topic.toLowerCase())) {
        const examples = streamData[topicKey][difficulty] || [];
        examples.forEach(ex => {
          if (ex.concepts) {
            ex.concepts.forEach(c => concepts.add(c));
          }
        });
      }
    });

    return Array.from(concepts);
  }

  /**
   * Get problem scenarios for stream
   */
  getProblemScenarios(stream, difficulty) {
    const scenarios = {
      'Computer Science': [
        'finding duplicates in an array',
        'reversing a linked list',
        'implementing a cache',
        'detecting cycles in a graph',
        'scheduling tasks efficiently'
      ],
      'Data Science': [
        'handling imbalanced datasets',
        'reducing model overfitting',
        'selecting optimal features',
        'improving model accuracy',
        'handling missing data'
      ],
      'AI/ML': [
        'training a neural network',
        'implementing attention mechanism',
        'optimizing model inference',
        'handling vanishing gradients',
        'improving model generalization'
      ]
    };

    return scenarios[stream] || ['solving a complex problem'];
  }

  /**
   * Categorize concepts into a topic
   */
  categorizeConcepts(concepts) {
    if (concepts.length === 0) return 'General';

    const categories = {
      'Data Structures': ['array', 'linked list', 'tree', 'graph', 'hash', 'stack', 'queue'],
      'Algorithms': ['sort', 'search', 'dynamic programming', 'greedy', 'recursion'],
      'Machine Learning': ['neural', 'model', 'training', 'classification', 'regression'],
      'Systems': ['distributed', 'scalable', 'concurrent', 'load balancing']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (concepts.some(c => keywords.some(kw => c.toLowerCase().includes(kw)))) {
        return category;
      }
    }

    return concepts[0];
  }

  /**
   * Validate generated question
   */
  validateQuestion(question, existingQuestions, avoidDuplicates) {
    if (!question || !question.question) return false;
    
    // Check minimum length
    if (question.question.length < 20) return false;

    // Check for duplicates
    if (avoidDuplicates) {
      const questionLower = question.question.toLowerCase();
      
      // Check exact duplicates
      if (existingQuestions.some(q => q.question.toLowerCase() === questionLower)) {
        return false;
      }

      // Check similar questions (using simple similarity)
      if (existingQuestions.some(q => {
        const similarity = this.calculateSimilarity(q.question, question.question);
        return similarity > 0.8; // 80% similar
      })) {
        return false;
      }
    }

    // Check if question makes sense (has question mark or is complete)
    const hasQuestionMark = question.question.includes('?');
    const isImperative = /^(explain|describe|implement|design|compare|what|how|why)/i.test(question.question);
    
    return hasQuestionMark || isImperative;
  }

  /**
   * Calculate similarity between two questions
   */
  calculateSimilarity(q1, q2) {
    const words1 = new Set(q1.toLowerCase().split(/\s+/));
    const words2 = new Set(q2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get generation statistics
   */
  getStats() {
    return {
      totalGenerated: this.generatedQuestions.size,
      datasetSize: Object.keys(this.dataset).reduce((sum, stream) => {
        return sum + Object.keys(this.dataset[stream]).reduce((topicSum, topic) => {
          return topicSum + Object.keys(this.dataset[stream][topic]).reduce((diffSum, diff) => {
            return diffSum + this.dataset[stream][topic][diff].length;
          }, 0);
        }, 0);
      }, 0),
      availableStreams: Object.keys(this.dataset),
      availableTemplates: Object.keys(this.templates).reduce((sum, diff) => {
        return sum + this.templates[diff].length;
      }, 0)
    };
  }
}

// Singleton instance
const questionGenerator = new QuestionGenerator();

export default questionGenerator;
