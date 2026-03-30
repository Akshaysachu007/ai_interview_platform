// ============================================================================
// ANSWER EVALUATION SERVICE - Topic-Based NLP Evaluation
// ============================================================================
// Evaluates candidate answers using Bayesian topic classification.
// Instead of matching exact questions, classifies any question into a CS topic
// and evaluates the answer against that topic's knowledge base.
// OpenAI/GPT is ONLY used as a fallback when confidence is very low.
// ============================================================================

import natural from 'natural';
import stringSimilarity from 'string-similarity';
import topicClassifier from '../ml/topicClassifier.js';

const { TfIdf, WordTokenizer, PorterStemmer, SentenceTokenizer } = natural;
const tokenizer = new WordTokenizer();
const sentenceTokenizer = new SentenceTokenizer();

class AnswerEvaluationService {

  constructor() {
    console.log(`[AnswerEvaluation] Topic-based evaluation ready. Classifier stats:`, topicClassifier.getStats());
  }

  // ===========================================================================
  // CORE: Evaluate a single answer
  // ===========================================================================
  evaluateAnswer(question, candidateAnswer, options = {}) {
    if (!candidateAnswer || candidateAnswer.trim().length === 0) {
      return this._emptyAnswerResult(question);
    }

    // Step 1: Classify the question into a CS topic
    const classification = topicClassifier.classify(question);

    if (!classification.topKnowledge || classification.confidence < 0.1) {
      // Classifier has no idea - use structural analysis only
      return this._evaluateStructuralOnly(question, candidateAnswer, classification);
    }

    const knowledge = classification.topKnowledge;

    // Step 2: Evaluate answer against the topic's knowledge base
    const keywordScore = this._evaluateKeywordCoverage(candidateAnswer, knowledge);
    const conceptGroupScore = this._evaluateConceptGroups(candidateAnswer, knowledge);
    const semanticScore = this._evaluateSemanticSimilarity(candidateAnswer, knowledge.modelAnswer);
    const structuralScore = this._evaluateStructure(candidateAnswer);
    const relevanceScore = this._evaluateRelevance(question, candidateAnswer);
    const depthScore = this._evaluateDepth(candidateAnswer, knowledge);

    // Step 3: Weighted scoring
    const weights = {
      conceptGroups: 0.30,  // Rubric-like concept group coverage
      keywords: 0.20,       // Required & bonus keyword coverage
      semantic: 0.20,       // TF-IDF similarity to model answer
      relevance: 0.10,      // How relevant is the answer to the question
      depth: 0.10,          // Technical depth of the answer
      structure: 0.10       // Answer structure quality
    };

    const finalScore = Math.round(
      conceptGroupScore.score * weights.conceptGroups +
      keywordScore.score * weights.keywords +
      semanticScore.score * weights.semantic +
      relevanceScore.score * weights.relevance +
      depthScore.score * weights.depth +
      structuralScore.score * weights.structure
    );

    // Step 4: Confidence calculation
    const confidence = this._calculateConfidence(
      classification.confidence,
      keywordScore,
      conceptGroupScore,
      semanticScore
    );

    return {
      score: Math.min(100, Math.max(0, finalScore)),
      confidence,
      useGptFallback: confidence < 0.35,
      classifiedTopic: classification.topic,
      topicCategory: knowledge.category,
      topicConfidence: classification.confidence,
      breakdown: {
        conceptGroupScore: conceptGroupScore.score,
        keywordScore: keywordScore.score,
        semanticScore: semanticScore.score,
        relevanceScore: relevanceScore.score,
        depthScore: depthScore.score,
        structuralScore: structuralScore.score,
        weights
      },
      details: {
        matchedKeywords: keywordScore.matched,
        missedKeywords: keywordScore.missed,
        conceptGroupBreakdown: conceptGroupScore.groupBreakdown,
        knowledgePointsCovered: depthScore.covered,
        knowledgePointsMissed: depthScore.missed,
        alternateTopics: classification.alternateTopics
      },
      feedback: this._generateFeedback(
        finalScore, keywordScore, conceptGroupScore, depthScore, knowledge
      )
    };
  }

  // ===========================================================================
  // KEYWORD EVALUATION: Check required & bonus keywords
  // ===========================================================================
  _evaluateKeywordCoverage(answer, knowledge) {
    const normalizedAnswer = this._normalizeText(answer);
    const answerStems = this._tokenizeAndStem(answer);

    const matched = [];
    const missed = [];

    // Required keywords (60% of keyword score)
    let requiredMatched = 0;
    const requiredKeywords = knowledge.requiredKeywords || [];
    for (const kw of requiredKeywords) {
      if (this._keywordFoundInText(kw, normalizedAnswer, answerStems)) {
        matched.push({ keyword: kw, type: 'required' });
        requiredMatched++;
      } else {
        missed.push({ keyword: kw, type: 'required' });
      }
    }
    const requiredScore = requiredKeywords.length > 0
      ? (requiredMatched / requiredKeywords.length) * 100
      : 50;

    // Bonus keywords (40% of keyword score)
    let bonusMatched = 0;
    const bonusKeywords = knowledge.bonusKeywords || [];
    for (const kw of bonusKeywords) {
      if (this._keywordFoundInText(kw, normalizedAnswer, answerStems)) {
        matched.push({ keyword: kw, type: 'bonus' });
        bonusMatched++;
      } else {
        missed.push({ keyword: kw, type: 'bonus' });
      }
    }
    const bonusScore = bonusKeywords.length > 0
      ? (bonusMatched / bonusKeywords.length) * 100
      : 0;

    const score = Math.round(requiredScore * 0.6 + bonusScore * 0.4);

    return { score: Math.min(100, score), matched, missed };
  }

  // ===========================================================================
  // CONCEPT GROUP EVALUATION: Rubric-style scoring per concept group
  // ===========================================================================
  _evaluateConceptGroups(answer, knowledge) {
    const normalizedAnswer = this._normalizeText(answer);
    const answerStems = this._tokenizeAndStem(answer);
    const conceptGroups = knowledge.conceptGroups || {};

    let totalWeightedScore = 0;
    let totalWeight = 0;
    const groupBreakdown = {};

    for (const [groupName, group] of Object.entries(conceptGroups)) {
      const groupKeywords = group.keywords || [];
      const groupWeight = group.weight || 25;
      totalWeight += groupWeight;

      let matched = 0;
      const matchedKeywords = [];
      const missedKeywords = [];

      for (const kw of groupKeywords) {
        if (this._keywordFoundInText(kw, normalizedAnswer, answerStems)) {
          matched++;
          matchedKeywords.push(kw);
        } else {
          missedKeywords.push(kw);
        }
      }

      const groupScore = groupKeywords.length > 0
        ? (matched / groupKeywords.length) * 100
        : 0;

      totalWeightedScore += groupScore * groupWeight;

      groupBreakdown[groupName] = {
        score: Math.round(groupScore),
        weight: groupWeight,
        matched: matchedKeywords,
        missed: missedKeywords
      };
    }

    const finalScore = totalWeight > 0
      ? Math.round(totalWeightedScore / totalWeight)
      : 0;

    return { score: Math.min(100, finalScore), groupBreakdown };
  }

  // ===========================================================================
  // SEMANTIC SIMILARITY: TF-IDF comparison against model answer
  // ===========================================================================
  _evaluateSemanticSimilarity(candidateAnswer, modelAnswer) {
    if (!modelAnswer || !candidateAnswer) {
      return { score: 0 };
    }

    const normalizedCandidate = this._normalizeText(candidateAnswer);
    const normalizedModel = this._normalizeText(modelAnswer);

    // Method 1: String similarity (Dice coefficient)
    const directSimilarity = stringSimilarity.compareTwoStrings(
      normalizedCandidate, normalizedModel
    );

    // Method 2: TF-IDF cosine similarity
    const tfidf = new TfIdf();
    tfidf.addDocument(normalizedModel);
    tfidf.addDocument(normalizedCandidate);

    // Get term vectors
    const modelTerms = {};
    const candidateTerms = {};
    let tfidfSimilarity = 0;

    tfidf.listTerms(0).forEach(item => {
      modelTerms[item.term] = item.tfidf;
    });
    tfidf.listTerms(1).forEach(item => {
      candidateTerms[item.term] = item.tfidf;
    });

    // Cosine similarity
    let dotProduct = 0, normA = 0, normB = 0;
    const allTerms = new Set([...Object.keys(modelTerms), ...Object.keys(candidateTerms)]);
    for (const term of allTerms) {
      const a = modelTerms[term] || 0;
      const b = candidateTerms[term] || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    if (normA > 0 && normB > 0) {
      tfidfSimilarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // Method 3: Sentence-level overlap
    const modelSentences = this._splitSentences(modelAnswer);
    const candidateSentences = this._splitSentences(candidateAnswer);
    let sentenceOverlap = 0;

    if (modelSentences.length > 0 && candidateSentences.length > 0) {
      for (const ms of modelSentences) {
        let maxSim = 0;
        for (const cs of candidateSentences) {
          const sim = stringSimilarity.compareTwoStrings(
            this._normalizeText(ms), this._normalizeText(cs)
          );
          maxSim = Math.max(maxSim, sim);
        }
        sentenceOverlap += maxSim;
      }
      sentenceOverlap = sentenceOverlap / modelSentences.length;
    }

    // Combine: TF-IDF 40%, sentence 30%, direct 30%
    const combined = tfidfSimilarity * 0.4 + sentenceOverlap * 0.3 + directSimilarity * 0.3;
    const score = Math.round(combined * 100);

    return { score: Math.min(100, Math.max(0, score)) };
  }

  // ===========================================================================
  // RELEVANCE: Does the answer actually address the question?
  // ===========================================================================
  _evaluateRelevance(question, answer) {
    const questionTokens = this._tokenizeAndStem(question);
    const answerTokens = this._tokenizeAndStem(answer);
    const answerStemSet = new Set(answerTokens);

    // Remove common stop words from question tokens
    const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'how', 'does', 'do', 'explain',
      'describe', 'define', 'give', 'tell', 'me', 'about', 'can', 'you', 'of', 'in', 'and',
      'or', 'with', 'for', 'to', 'between', 'difference', 'are', 'why', 'when', 'which']);

    const meaningfulQTokens = questionTokens.filter(t => !stopWords.has(t) && t.length > 2);

    if (meaningfulQTokens.length === 0) {
      return { score: 50 }; // Can't determine
    }

    const matchedTokens = meaningfulQTokens.filter(qt => answerStemSet.has(qt));
    const directRelevance = matchedTokens.length / meaningfulQTokens.length;

    // Also check string similarity between question and answer
    const stringSim = stringSimilarity.compareTwoStrings(
      this._normalizeText(question),
      this._normalizeText(answer)
    );

    const score = Math.round((directRelevance * 0.7 + stringSim * 0.3) * 100);
    return { score: Math.min(100, Math.max(0, score)) };
  }

  // ===========================================================================
  // DEPTH: How many knowledge points does the answer cover?
  // ===========================================================================
  _evaluateDepth(answer, knowledge) {
    const normalizedAnswer = this._normalizeText(answer);
    const answerStems = this._tokenizeAndStem(answer);
    const knowledgePoints = knowledge.knowledgePoints || [];

    const covered = [];
    const missed = [];

    for (const point of knowledgePoints) {
      // Check if the answer covers this knowledge point
      const pointTokens = this._tokenizeAndStem(point);
      const pointNormalized = this._normalizeText(point);

      // Two ways to match: (1) stem overlap, (2) substring match
      const stemMatched = pointTokens.filter(pt =>
        answerStems.includes(pt)
      ).length;
      const stemRatio = pointTokens.length > 0
        ? stemMatched / pointTokens.length
        : 0;

      const substringMatch = normalizedAnswer.includes(pointNormalized) ||
        pointNormalized.split(' ').filter(w => w.length > 3 && normalizedAnswer.includes(w)).length >= 2;

      if (stemRatio >= 0.5 || substringMatch) {
        covered.push(point);
      } else {
        missed.push(point);
      }
    }

    const score = knowledgePoints.length > 0
      ? Math.round((covered.length / knowledgePoints.length) * 100)
      : 30;

    return { score: Math.min(100, score), covered, missed };
  }

  // ===========================================================================
  // STRUCTURE: Answer quality indicators
  // ===========================================================================
  _evaluateStructure(answer) {
    let score = 0;
    const details = {};

    // Word count (minimum threshold for a good answer)
    const words = tokenizer.tokenize(answer) || [];
    const wordCount = words.length;

    if (wordCount >= 100) {
      score += 25;
      details.length = 'Detailed';
    } else if (wordCount >= 50) {
      score += 20;
      details.length = 'Good';
    } else if (wordCount >= 20) {
      score += 12;
      details.length = 'Brief';
    } else {
      score += 5;
      details.length = 'Too short';
    }

    // Sentence count and variety
    const sentences = this._splitSentences(answer);
    if (sentences.length >= 5) {
      score += 20;
      details.sentences = 'Well-developed';
    } else if (sentences.length >= 3) {
      score += 15;
      details.sentences = 'Adequate';
    } else {
      score += 5;
      details.sentences = 'Too few sentences';
    }

    // Uses technical terms (not just common English words)
    const technicalIndicators = [
      'algorithm', 'data', 'structure', 'function', 'class', 'object', 'method',
      'variable', 'loop', 'array', 'list', 'tree', 'graph', 'node', 'memory',
      'database', 'server', 'client', 'protocol', 'network', 'process', 'thread',
      'stack', 'queue', 'hash', 'sort', 'search', 'binary', 'linear', 'complexity',
      'O(', 'interface', 'abstract', 'inherit', 'polymorphism', 'encapsulation',
      'query', 'index', 'table', 'key', 'API', 'HTTP', 'cache', 'load',
      'encrypt', 'token', 'authentication', 'virtual', 'container', 'deploy'
    ];
    const normalizedLower = answer.toLowerCase();
    const techTermCount = technicalIndicators.filter(t => normalizedLower.includes(t)).length;

    if (techTermCount >= 8) {
      score += 25;
      details.technicalDepth = 'Highly technical';
    } else if (techTermCount >= 4) {
      score += 18;
      details.technicalDepth = 'Technical';
    } else if (techTermCount >= 2) {
      score += 10;
      details.technicalDepth = 'Somewhat technical';
    } else {
      score += 3;
      details.technicalDepth = 'Not very technical';
    }

    // Uses examples or specific details
    const exampleIndicators = ['for example', 'such as', 'e.g.', 'like ', 'instance',
      'example:', 'consider', 'suppose', 'in practice'];
    const hasExamples = exampleIndicators.some(e => normalizedLower.includes(e));
    if (hasExamples) {
      score += 15;
      details.examples = 'Includes examples';
    } else {
      score += 3;
      details.examples = 'No examples provided';
    }

    // Structured with headers, bullets, or clear organization
    const hasStructure = answer.includes('\n') || answer.includes('•') ||
      answer.includes('-') || answer.includes('1.') || answer.includes(':');
    if (hasStructure) {
      score += 15;
      details.organization = 'Well organized';
    } else {
      score += 5;
      details.organization = 'Basic paragraph';
    }

    return { score: Math.min(100, score), details };
  }

  // ===========================================================================
  // STRUCTURAL-ONLY EVALUATION (when classifier fails entirely)
  // ===========================================================================
  _evaluateStructuralOnly(question, answer, classification) {
    const structuralScore = this._evaluateStructure(answer);
    const relevanceScore = this._evaluateRelevance(question, answer);

    const finalScore = Math.round(
      structuralScore.score * 0.5 + relevanceScore.score * 0.5
    );

    return {
      score: Math.min(100, Math.max(0, finalScore)),
      confidence: 0.2,
      useGptFallback: true,
      classifiedTopic: classification?.topic || 'unknown',
      topicCategory: 'Unknown',
      topicConfidence: classification?.confidence || 0,
      breakdown: {
        conceptGroupScore: 0,
        keywordScore: 0,
        semanticScore: 0,
        relevanceScore: relevanceScore.score,
        depthScore: 0,
        structuralScore: structuralScore.score
      },
      details: {
        noTopicMatch: true,
        structuralDetails: structuralScore.details
      },
      feedback: {
        overallRating: finalScore >= 60 ? 'Potentially Good' : 'Needs Review',
        strengths: structuralScore.score >= 60 ? ['Well-structured response'] : [],
        improvements: ['Topic could not be identified with high confidence'],
        suggestions: ['Answer evaluation may be less accurate for this question'],
        missedTopics: []
      }
    };
  }

  // ===========================================================================
  // CONFIDENCE CALCULATION
  // ===========================================================================
  _calculateConfidence(topicConfidence, keywordScore, conceptGroupScore, semanticScore) {
    // Combine topic classification confidence with evaluation signals
    const evaluationStrength = (
      (keywordScore.score > 0 ? 0.3 : 0) +
      (conceptGroupScore.score > 0 ? 0.3 : 0) +
      (semanticScore.score > 0 ? 0.2 : 0)
    );

    // Scale: topic confidence weighted with evaluation coverage
    const confidence = topicConfidence * 0.5 + evaluationStrength * 0.5;

    return Math.min(1, Math.max(0, confidence));
  }

  // ===========================================================================
  // FEEDBACK GENERATION
  // ===========================================================================
  _generateFeedback(score, keywordScore, conceptGroupScore, depthScore, knowledge) {
    const strengths = [];
    const improvements = [];
    const suggestions = [];
    const missedTopics = [];

    // Identify strengths
    if (keywordScore.score >= 70) {
      strengths.push('Good use of relevant terminology');
    }
    if (conceptGroupScore.score >= 70) {
      strengths.push('Comprehensive coverage of key concepts');
    }
    if (depthScore.score >= 70) {
      strengths.push('Good depth of knowledge demonstrated');
    }
    if (score >= 80) {
      strengths.push('Excellent overall understanding of the topic');
    }
    if (keywordScore.matched?.filter(m => m.type === 'bonus').length >= 3) {
      strengths.push('Demonstrates advanced knowledge with bonus terms');
    }

    // Identify improvements from missed concept groups
    if (conceptGroupScore.groupBreakdown) {
      for (const [groupName, group] of Object.entries(conceptGroupScore.groupBreakdown)) {
        if (group.score < 30) {
          missedTopics.push(groupName);
          if (group.missed.length > 0) {
            const example = group.missed.slice(0, 2).join(', ');
            improvements.push(`Cover ${groupName} concepts (e.g., ${example})`);
          }
        }
      }
    }

    // Identify missed knowledge points
    if (depthScore.missed?.length > 0) {
      const topMissed = depthScore.missed.slice(0, 3);
      for (const point of topMissed) {
        suggestions.push(`Mention: ${point}`);
      }
    }

    // Generic feedback if nothing specific
    if (strengths.length === 0) {
      if (score >= 40) {
        strengths.push('Shows basic understanding of the topic');
      } else {
        strengths.push('Attempted to address the question');
      }
    }
    if (improvements.length === 0 && score < 70) {
      improvements.push('Provide more specific technical details');
      improvements.push('Include key terminology related to the topic');
    }

    // Overall rating
    let overallRating;
    if (score >= 85) overallRating = 'Excellent';
    else if (score >= 70) overallRating = 'Good';
    else if (score >= 50) overallRating = 'Average';
    else if (score >= 30) overallRating = 'Below Average';
    else overallRating = 'Poor';

    return {
      overallRating,
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3),
      suggestions: suggestions.slice(0, 3),
      missedTopics
    };
  }

  // ===========================================================================
  // BATCH: Evaluate all answers in an interview
  // ===========================================================================
  evaluateInterview(questions, options = {}) {
    const results = [];
    let totalScore = 0;
    let gptFallbackCount = 0;

    for (const q of questions) {
      if (!q.question || !q.answer) {
        results.push({
          question: q.question || 'Unknown',
          ...this._emptyAnswerResult(q.question)
        });
        continue;
      }

      const result = this.evaluateAnswer(q.question, q.answer, options);
      results.push({
        question: q.question,
        ...result
      });
      totalScore += result.score;
      if (result.useGptFallback) gptFallbackCount++;
    }

    const avgScore = questions.length > 0 ? Math.round(totalScore / questions.length) : 0;

    return {
      overallScore: avgScore,
      totalQuestions: questions.length,
      gptFallbackNeeded: gptFallbackCount,
      questionResults: results,
      overallConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / Math.max(results.length, 1)
    };
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================
  _normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  _tokenizeAndStem(text) {
    if (!text) return [];
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    return tokens.map(t => PorterStemmer.stem(t));
  }

  _keywordFoundInText(keyword, normalizedText, stemmedTokens) {
    // Direct substring check
    if (normalizedText.includes(keyword.toLowerCase())) return true;

    // Stem-based check
    const kwStems = keyword.toLowerCase().split(/\s+/)
      .map(w => PorterStemmer.stem(w))
      .filter(s => s.length > 2);

    if (kwStems.length === 0) return false;

    const matched = kwStems.filter(ks => stemmedTokens.includes(ks));
    return matched.length >= Math.ceil(kwStems.length * 0.6);
  }

  _splitSentences(text) {
    if (!text) return [];
    try {
      return sentenceTokenizer.tokenize(text) || [];
    } catch {
      return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }
  }

  _emptyAnswerResult(question = '') {
    return {
      score: 0,
      confidence: 1.0,
      useGptFallback: false,
      classifiedTopic: 'none',
      topicCategory: 'N/A',
      topicConfidence: 0,
      breakdown: {
        conceptGroupScore: 0,
        keywordScore: 0,
        semanticScore: 0,
        relevanceScore: 0,
        depthScore: 0,
        structuralScore: 0
      },
      details: { emptyAnswer: true },
      feedback: {
        overallRating: 'No Answer',
        strengths: [],
        improvements: ['No answer was provided'],
        suggestions: ['Provide a detailed answer'],
        missedTopics: []
      }
    };
  }
}

// Export a singleton instance
const answerEvaluationService = new AnswerEvaluationService();
export default answerEvaluationService;
