// Master AI Prompt Service - Enterprise-Grade Interview System
// Implements: Question Generation, Scoring Rubric, Sentiment Analysis
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * MASTER PROMPT SERVICE
 * Implements all three tasks from the master prompt:
 * TASK 1: Resume Parsing (handled by resumeParserService.js)
 * TASK 2: Contextual Question Generation with JD awareness
 * TASK 3: Scoring Rubric (Post-Interview Analysis)
 */
class MasterPromptService {

  /**
   * TASK 2: Contextual Question Generation
   * Generates interview questions based on JD, candidate skills, and recruiter's count
   * 70% questions focus on JD + Candidate Skills intersection
   * 30% questions are behavioral/situational based on JD
   * 
   * @param {Object} params - Generation parameters
   * @param {string} params.jobDescription - Full job description
   * @param {Array} params.candidateSkills - Candidate's extracted skills
   * @param {number} params.questionCount - Number of questions to generate (from recruiter)
   * @param {string} params.stream - Technical stream/domain
   * @param {string} params.difficulty - Difficulty level
   * @returns {Promise<Array>} Generated questions
   */
  static async generateContextualQuestions({
    jobDescription,
    candidateSkills = [],
    questionCount = 5,
    stream = 'Computer Science',
    difficulty = 'Medium'
  }) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📝 TASK 2: CONTEXTUAL QUESTION GENERATION');
    console.log(`${'='.repeat(80)}`);
    console.log(`   Job Description Length: ${jobDescription?.length || 0} chars`);
    console.log(`   Candidate Skills: ${candidateSkills.length}`);
    console.log(`   Question Count: ${questionCount}`);
    console.log(`   Stream: ${stream}`);
    console.log(`   Difficulty: ${difficulty}`);
    console.log(`${'='.repeat(80)}\n`);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('⚠️ OpenAI API key not configured. Using fallback questions.');
      return this.generateFallbackQuestions(stream, difficulty, questionCount);
    }

    try {
      // Calculate question distribution
      const technicalCount = Math.ceil(questionCount * 0.7); // 70% technical
      const behavioralCount = questionCount - technicalCount; // 30% behavioral

      const systemPrompt = `### SYSTEM ROLE
You are an expert Technical Recruiter and AI Talent Scout. Your goal is to bridge the gap between Job Descriptions (JD) and Candidate Resumes with high precision.

### TASK 2: Contextual Question Generation
- Inputs: Job Description, Candidate Skills, Question Count
- Goal: Generate {question_count} interview questions that are highly relevant to BOTH the job requirements and the candidate's skill set.

### CONSTRAINTS:
- 70% of questions MUST focus on the intersection of JD requirements and Candidate Skills
- 30% MUST be behavioral/situational questions based on the JD
- Difficulty Level: ${difficulty}
- Stream: ${stream}

### QUESTION QUALITY GUIDELINES:
- Technical Questions: Focus on practical application, not just theory
- Behavioral Questions: Use STAR method (Situation, Task, Action, Result)
- Avoid generic questions - make them specific to the JD and candidate profile
- Questions should assess both depth and breadth of knowledge
- Include real-world scenarios when possible

### OUTPUT FORMAT:
Return ONLY a JSON object with this schema:
{
  "questions": [
    {
      "question": "string",
      "type": "technical|behavioral",
      "category": "string (e.g., System Design, Problem Solving)",
      "relevanceScore": 0-100,
      "targetSkills": ["string"],
      "difficulty": "Easy|Medium|Hard"
    }
  ]
}`;

      const userPrompt = `Generate exactly ${questionCount} interview questions based on:

JOB DESCRIPTION:
${jobDescription}

CANDIDATE SKILLS:
${candidateSkills.join(', ')}

REQUIREMENTS:
- Generate ${technicalCount} technical questions (70%) focusing on skills intersection
- Generate ${behavioralCount} behavioral questions (30%) based on JD requirements
- Total questions: ${questionCount}
- Difficulty: ${difficulty}
- Stream: ${stream}

Return the questions in the specified JSON format.`;

      console.log('🤖 Generating contextual questions...\n');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;
      const parsed = JSON.parse(responseText);

      let questions = parsed.questions || [];

      // Ensure we have exactly the requested number of questions
      questions = questions.slice(0, questionCount);

      console.log(`✅ Generated ${questions.length} contextual questions`);
      console.log(`   Technical: ${questions.filter(q => q.type === 'technical').length}`);
      console.log(`   Behavioral: ${questions.filter(q => q.type === 'behavioral').length}`);
      console.log(`${'='.repeat(80)}\n`);

      return questions.map((q, index) => ({
        question: q.question,
        type: q.type || 'technical',
        category: q.category || stream,
        relevanceScore: q.relevanceScore || 80,
        targetSkills: q.targetSkills || [],
        difficulty: q.difficulty || difficulty,
        generatedAt: new Date(),
        isAiGenerated: true,
        jdAware: true,
        questionIndex: index + 1
      }));

    } catch (error) {
      console.error('❌ Question generation error:', error.message);
      return this.generateFallbackQuestions(stream, difficulty, questionCount);
    }
  }

  /**
   * TASK 3: Scoring Rubric (Post-Interview)
   * Analyzes candidate's transcript against JD and provides match score
   * Provides 3 Pros and 2 Cons with justification
   * 
   * @param {Object} params - Scoring parameters
   * @param {string} params.candidateTranscript - Full interview transcript
   * @param {string} params.jobDescription - Job description
   * @param {Array} params.questions - Questions that were asked
   * @param {Object} params.candidateProfile - Candidate profile
   * @returns {Promise<Object>} Scoring result with match score and analysis
   */
  static async scoreInterviewTranscript({
    candidateTranscript,
    jobDescription,
    questions = [],
    candidateProfile = {}
  }) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 TASK 3: SCORING RUBRIC (Post-Interview)');
    console.log(`${'='.repeat(80)}`);
    console.log(`   Transcript Length: ${candidateTranscript?.length || 0} chars`);
    console.log(`   Questions Count: ${questions.length}`);
    console.log(`   JD Length: ${jobDescription?.length || 0} chars`);
    console.log(`${'='.repeat(80)}\n`);

    if (!candidateTranscript || candidateTranscript.length < 50) {
      throw new Error('Candidate transcript is too short or empty');
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('⚠️ OpenAI API key not configured. Using fallback scoring.');
      return this.fallbackScoring(candidateTranscript, questions);
    }

    try {
      const systemPrompt = `### SYSTEM ROLE
You are an expert Technical Recruiter and AI Talent Scout. Your goal is to provide precise, objective evaluation of interview performance.

### TASK 3: Scoring Rubric (Post-Interview)
- Analyze the candidate's transcript against the JD
- Provide a "Match Score" from 0-100
- Justification: Provide exactly 3 Pros and exactly 2 Cons

### SCORING CRITERIA (Total: 100 points):
1. Technical Accuracy (40 points): Correctness of technical answers
2. Depth of Knowledge (20 points): Understanding of concepts, not just memorization
3. Communication Skills (15 points): Clarity, articulation, structure
4. Problem-Solving Approach (15 points): Logical thinking, methodology
5. JD Alignment (10 points): Relevance to job requirements

### OUTPUT FORMAT:
Return ONLY a JSON object with this schema:
{
  "matchScore": 0-100,
  "breakdown": {
    "technicalAccuracy": 0-40,
    "depthOfKnowledge": 0-20,
    "communicationSkills": 0-15,
    "problemSolving": 0-15,
    "jdAlignment": 0-10
  },
  "pros": ["string", "string", "string"],
  "cons": ["string", "string"],
  "overallAssessment": "string",
  "recommendation": "Strong Hire|Hire|Maybe|No Hire",
  "confidenceLevel": 0-100
}

IMPORTANT:
- Be objective and evidence-based
- Provide EXACTLY 3 pros and EXACTLY 2 cons
- Include specific examples from the transcript
- Compare performance against JD requirements`;

      const userPrompt = `Evaluate the following interview performance:

JOB DESCRIPTION:
${jobDescription}

QUESTIONS ASKED:
${questions.map((q, i) => `${i + 1}. ${q.question || q}`).join('\n')}

CANDIDATE TRANSCRIPT:
${candidateTranscript}

CANDIDATE PROFILE:
- Name: ${candidateProfile.name || 'N/A'}
- Experience: ${candidateProfile.yearsOfExperience || 'N/A'} years
- Skills: ${candidateProfile.skills?.hardSkills?.join(', ') || 'N/A'}

Provide comprehensive scoring and analysis.`;

      console.log('🤖 Analyzing interview performance...\n');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use full GPT-4 for better analysis
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for consistent scoring
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0].message.content;
      const scoringResult = JSON.parse(responseText);

      // Validate scoring result
      const finalScore = {
        matchScore: Math.min(100, Math.max(0, scoringResult.matchScore || 0)),
        breakdown: scoringResult.breakdown || {},
        pros: (scoringResult.pros || []).slice(0, 3), // Ensure exactly 3 pros
        cons: (scoringResult.cons || []).slice(0, 2), // Ensure exactly 2 cons
        overallAssessment: scoringResult.overallAssessment || 'No assessment provided',
        recommendation: scoringResult.recommendation || 'Maybe',
        confidenceLevel: scoringResult.confidenceLevel || 70,
        scoredAt: new Date(),
        aiGenerated: true
      };

      console.log(`✅ Scoring Complete`);
      console.log(`   Match Score: ${finalScore.matchScore}/100`);
      console.log(`   Recommendation: ${finalScore.recommendation}`);
      console.log(`   Confidence: ${finalScore.confidenceLevel}%`);
      console.log(`   Pros: ${finalScore.pros.length}, Cons: ${finalScore.cons.length}`);
      console.log(`${'='.repeat(80)}\n`);

      return finalScore;

    } catch (error) {
      console.error('❌ Scoring error:', error.message);
      return this.fallbackScoring(candidateTranscript, questions);
    }
  }

  /**
   * PREMIUM FEATURE: Sentiment & Soft Skill Analysis
   * Analyzes confidence, pace, filler words, and communication patterns
   * 
   * @param {string} transcript - Interview transcript
   * @param {Array} timestamps - Optional timestamps for pace analysis
   * @returns {Promise<Object>} Sentiment and soft skill analysis
   */
  static async analyzeSentimentAndSoftSkills(transcript, timestamps = []) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎭 PREMIUM FEATURE: SENTIMENT & SOFT SKILL ANALYSIS');
    console.log(`${'='.repeat(80)}\n`);

    if (!transcript || transcript.length < 50) {
      throw new Error('Transcript too short for analysis');
    }

    try {
      // Basic analysis - filler words count
      const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'basically', 'actually'];
      let fillerCount = 0;
      const transcriptLower = transcript.toLowerCase();
      
      fillerWords.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = transcriptLower.match(regex);
        fillerCount += matches ? matches.length : 0;
      });

      const wordCount = transcript.split(/\s+/).length;
      const fillerWordPercentage = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;

      // Check if OpenAI API key is configured for deep analysis
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.warn('⚠️ Using basic sentiment analysis (no API key)');
        
        return {
          confidence: fillerWordPercentage < 2 ? 'High' : fillerWordPercentage < 5 ? 'Medium' : 'Low',
          communicationClarity: fillerWordPercentage < 3 ? 'Clear' : 'Needs Improvement',
          fillerWordCount: fillerCount,
          fillerWordPercentage: Math.round(fillerWordPercentage * 100) / 100,
          wordCount,
          analysisMethod: 'basic'
        };
      }

      const systemPrompt = `You are an expert in communication analysis and soft skill evaluation. Analyze the interview transcript for:

1. CONFIDENCE LEVEL: High/Medium/Low based on language patterns, certainty, and assertiveness
2. PACE: Fast/Moderate/Slow based on response patterns
3. COMMUNICATION CLARITY: Clear/Moderate/Unclear based on articulation and structure
4. SOFT SKILLS:
   - Problem-solving approach
   - Adaptability
   - Teamwork indicators
   - Leadership potential
   - Enthusiasm and motivation

Return ONLY a JSON object:
{
  "confidence": "High|Medium|Low",
  "confidenceScore": 0-100,
  "pace": "Fast|Moderate|Slow",
  "communicationClarity": "Clear|Moderate|Unclear",
  "softSkills": {
    "problemSolving": 0-100,
    "adaptability": 0-100,
    "teamwork": 0-100,
    "leadership": 0-100,
    "enthusiasm": 0-100
  },
  "sentimentTrend": "Positive|Neutral|Negative",
  "keyObservations": ["string"],
  "improvementAreas": ["string"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this interview transcript:\n\n${transcript.substring(0, 8000)}` }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      console.log(`✅ Sentiment Analysis Complete`);
      console.log(`   Confidence: ${analysis.confidence} (${analysis.confidenceScore}%)`);
      console.log(`   Communication: ${analysis.communicationClarity}`);
      console.log(`   Sentiment: ${analysis.sentimentTrend}`);
      console.log(`${'='.repeat(80)}\n`);

      return {
        ...analysis,
        fillerWordCount,
        fillerWordPercentage: Math.round(fillerWordPercentage * 100) / 100,
        wordCount,
        analyzedAt: new Date(),
        analysisMethod: 'ai-powered'
      };

    } catch (error) {
      console.error('❌ Sentiment analysis error:', error.message);
      
      // Return basic analysis
      return {
        confidence: fillerCount < 10 ? 'High' : 'Medium',
        communicationClarity: fillerCount < 15 ? 'Clear' : 'Moderate',
        fillerWordCount,
        fillerWordPercentage: Math.round(fillerWordPercentage * 100) / 100,
        wordCount,
        error: error.message,
        analysisMethod: 'fallback'
      };
    }
  }

  /**
   * Fallback question generation
   */
  static generateFallbackQuestions(stream, difficulty, count) {
    const templates = {
      'Computer Science': [
        'Explain the concept of ${topic} and provide a practical example.',
        'How would you implement ${topic} in a production environment?',
        'Describe a situation where you used ${topic} to solve a problem.',
        'What are the advantages and disadvantages of ${topic}?',
        'Compare ${topic} with alternative approaches.'
      ],
      'Data Science': [
        'How do you handle ${topic} in data analysis?',
        'Explain the statistical foundations of ${topic}.',
        'Describe your approach to ${topic} in a real project.',
        'What metrics would you use to evaluate ${topic}?',
        'How would you explain ${topic} to a non-technical stakeholder?'
      ]
    };

    const topics = {
      'Computer Science': ['algorithms', 'data structures', 'system design', 'databases', 'APIs'],
      'Data Science': ['feature engineering', 'model selection', 'data cleaning', 'visualization', 'ML pipelines']
    };

    const streamTemplates = templates[stream] || templates['Computer Science'];
    const streamTopics = topics[stream] || topics['Computer Science'];

    const questions = [];
    for (let i = 0; i < count; i++) {
      const template = streamTemplates[i % streamTemplates.length];
      const topic = streamTopics[i % streamTopics.length];
      questions.push({
        question: template.replace('${topic}', topic),
        type: i < count * 0.7 ? 'technical' : 'behavioral',
        category: stream,
        difficulty,
        generatedAt: new Date(),
        fallbackQuestion: true
      });
    }

    return questions;
  }

  /**
   * Fallback scoring
   */
  static fallbackScoring(transcript, questions) {
    const wordCount = transcript.split(/\s+/).length;
    const answerLength = wordCount / questions.length;

    // Simple heuristic scoring
    const matchScore = Math.min(100, Math.max(0, 
      (answerLength > 50 ? 40 : 20) + // Length
      (wordCount > 500 ? 30 : 15) + // Total words
      (transcript.length > 1000 ? 20 : 10) + // Total chars
      10 // Base score
    ));

    return {
      matchScore,
      breakdown: {
        technicalAccuracy: matchScore * 0.4,
        depthOfKnowledge: matchScore * 0.2,
        communicationSkills: matchScore * 0.15,
        problemSolving: matchScore * 0.15,
        jdAlignment: matchScore * 0.1
      },
      pros: [
        'Provided detailed responses',
        'Demonstrated problem-solving approach',
        'Showed enthusiasm for the role'
      ],
      cons: [
        'Could provide more specific examples',
        'Additional technical depth needed'
      ],
      overallAssessment: 'Candidate shows potential but needs further evaluation',
      recommendation: matchScore >= 70 ? 'Hire' : matchScore >= 50 ? 'Maybe' : 'No Hire',
      confidenceLevel: 60,
      fallbackScoring: true,
      scoredAt: new Date()
    };
  }
}

export default MasterPromptService;
