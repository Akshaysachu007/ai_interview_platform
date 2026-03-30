// ============================================================================
// TOPIC CLASSIFIER - Bayesian + TF-IDF Hybrid Classifier
// ============================================================================
// Trains on csKnowledgeBase question paraphrases → topic labels.
// Classifies any unseen question into the nearest CS topic.
// Returns topic + confidence + knowledge points for evaluation.
// ============================================================================

import natural from 'natural';
import csKnowledgeBase from '../data/csKnowledgeBase.js';

const { BayesClassifier, TfIdf, WordTokenizer, PorterStemmer } = natural;

class TopicClassifier {
  constructor() {
    this.classifier = null;
    this.tfidf = null;
    this.tokenizer = new WordTokenizer();
    this.isReady = false;
    this.topicMap = new Map();      // topic => full knowledge object
    this.categoryMap = new Map();   // category => [topics]
    this._init();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION: Train the Bayes classifier on all question paraphrases
  // ---------------------------------------------------------------------------
  _init() {
    try {
      this.classifier = new BayesClassifier(PorterStemmer);
      this.tfidf = new TfIdf();

      // Build topic map and train the classifier
      for (const entry of csKnowledgeBase) {
        this.topicMap.set(entry.topic, entry);

        // Track categories
        if (!this.categoryMap.has(entry.category)) {
          this.categoryMap.set(entry.category, []);
        }
        this.categoryMap.get(entry.category).push(entry.topic);

        // Train Bayes classifier with each question paraphrase
        for (const question of entry.trainingQuestions) {
          this.classifier.addDocument(question.toLowerCase(), entry.topic);
        }

        // Also train with knowledge points to improve classification
        const knowledgeText = [
          ...entry.knowledgePoints,
          ...entry.requiredKeywords,
          ...entry.bonusKeywords
        ].join(' ');
        this.classifier.addDocument(knowledgeText.toLowerCase(), entry.topic);

        // Add model answer to TF-IDF corpus for similarity matching
        this.tfidf.addDocument(entry.modelAnswer.toLowerCase());
      }

      // Train the classifier
      this.classifier.train();
      this.isReady = true;

      console.log(`[TopicClassifier] Trained on ${csKnowledgeBase.length} topics with ${this._getTotalQuestions()} question paraphrases`);
    } catch (error) {
      console.error('[TopicClassifier] Initialization failed:', error.message);
      this.isReady = false;
    }
  }

  _getTotalQuestions() {
    return csKnowledgeBase.reduce((sum, e) => sum + e.trainingQuestions.length, 0);
  }

  // ---------------------------------------------------------------------------
  // CLASSIFY: Given any question, returns the best matching topic(s)
  // ---------------------------------------------------------------------------
  classify(question) {
    if (!this.isReady || !question) {
      return { topic: null, confidence: 0, topKnowledge: null };
    }

    const normalizedQ = question.toLowerCase().trim();

    // ----- Step 1: Bayesian classification -----
    const bayesTopic = this.classifier.classify(normalizedQ);
    const bayesClassifications = this.classifier.getClassifications(normalizedQ);

    // Compute Bayesian confidence (top score vs sum)
    const topScore = bayesClassifications[0]?.value || 0;
    const secondScore = bayesClassifications[1]?.value || 0;

    // Higher separation = higher confidence
    let bayesConfidence = 0;
    if (topScore > 0) {
      // Ratio-based confidence: how much better is top vs second?
      const ratio = secondScore > 0 ? topScore / secondScore : 10;
      bayesConfidence = Math.min(1, ratio / 5); // normalize to 0-1
    }

    // ----- Step 2: Keyword matching as supplementary signal -----
    const keywordScores = this._scoreByKeywords(normalizedQ);
    const keywordTopic = keywordScores[0]?.topic || null;
    const keywordConfidence = keywordScores[0]?.score || 0;

    // ----- Step 3: TF-IDF similarity against model answers -----
    const tfidfScores = this._scoreByTfIdf(normalizedQ);
    const tfidfTopic = tfidfScores[0]?.topic || null;
    const tfidfConfidence = tfidfScores[0]?.score || 0;

    // ----- Step 4: Combine scores with weighted voting -----
    const combinedScores = new Map();

    // Weight: Bayes 50%, Keywords 30%, TF-IDF 20%
    this._addScore(combinedScores, bayesTopic, bayesConfidence * 0.5);
    if (keywordTopic) this._addScore(combinedScores, keywordTopic, keywordConfidence * 0.3);
    if (tfidfTopic) this._addScore(combinedScores, tfidfTopic, tfidfConfidence * 0.2);

    // Also add top-3 from each method for diversity
    bayesClassifications.slice(0, 3).forEach((c, i) => {
      const weight = (0.5 - i * 0.15) * (c.value || 0);
      this._addScore(combinedScores, c.label, Math.max(0, weight * 0.3));
    });

    keywordScores.slice(0, 3).forEach((s, i) => {
      this._addScore(combinedScores, s.topic, s.score * 0.2 * (1 - i * 0.3));
    });

    // Find final winner
    let bestTopic = bayesTopic;
    let bestScore = 0;
    for (const [topic, score] of combinedScores) {
      if (score > bestScore) {
        bestScore = score;
        bestTopic = topic;
      }
    }

    // Normalize confidence to 0-1
    const confidence = Math.min(1, bestScore);
    const topKnowledge = this.topicMap.get(bestTopic) || null;

    return {
      topic: bestTopic,
      confidence,
      topKnowledge,
      // Include runner-ups for multi-topic questions
      alternateTopics: this._getAlternateTopics(combinedScores, bestTopic)
    };
  }

  // ---------------------------------------------------------------------------
  // KEYWORD SCORING: Match question against each topic's keywords
  // ---------------------------------------------------------------------------
  _scoreByKeywords(normalizedQ) {
    const tokens = new Set(this.tokenizer.tokenize(normalizedQ));
    const stemmedTokens = new Set([...tokens].map(t => PorterStemmer.stem(t)));
    const scores = [];

    for (const entry of csKnowledgeBase) {
      let score = 0;
      let maxPossible = 0;

      // Check required keywords (2 points each)
      for (const kw of entry.requiredKeywords) {
        maxPossible += 2;
        const kwTokens = kw.toLowerCase().split(/\s+/);
        const matched = kwTokens.some(k =>
          tokens.has(k) || stemmedTokens.has(PorterStemmer.stem(k)) ||
          normalizedQ.includes(kw.toLowerCase())
        );
        if (matched) score += 2;
      }

      // Check bonus keywords (1 point each)
      for (const kw of entry.bonusKeywords) {
        maxPossible += 1;
        const kwTokens = kw.toLowerCase().split(/\s+/);
        const matched = kwTokens.some(k =>
          tokens.has(k) || stemmedTokens.has(PorterStemmer.stem(k)) ||
          normalizedQ.includes(kw.toLowerCase())
        );
        if (matched) score += 1;
      }

      // Check training questions for close text match
      for (const tq of entry.trainingQuestions) {
        if (normalizedQ.includes(tq.toLowerCase().replace('?', '').trim()) ||
            tq.toLowerCase().replace('?', '').trim().includes(normalizedQ)) {
          score += maxPossible * 0.5; // big boost for near-exact match
        }
      }

      if (maxPossible > 0) {
        scores.push({
          topic: entry.topic,
          score: score / maxPossible
        });
      }
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  // ---------------------------------------------------------------------------
  // TF-IDF SCORING: Compare question to model answers
  // ---------------------------------------------------------------------------
  _scoreByTfIdf(normalizedQ) {
    const scores = [];

    // Add the question as a temporary document
    const tempTfidf = new TfIdf();
    tempTfidf.addDocument(normalizedQ);

    // Get question terms and their weights
    const questionTerms = [];
    tempTfidf.listTerms(0).forEach(item => {
      questionTerms.push({ term: item.term, tfidf: item.tfidf });
    });

    // Score each topic's model answer against the question terms
    for (let i = 0; i < csKnowledgeBase.length; i++) {
      let score = 0;
      const entry = csKnowledgeBase[i];
      const modelTokens = new Set(
        this.tokenizer.tokenize(entry.modelAnswer.toLowerCase())
          .map(t => PorterStemmer.stem(t))
      );

      for (const qt of questionTerms) {
        if (modelTokens.has(PorterStemmer.stem(qt.term))) {
          score += qt.tfidf;
        }
      }

      scores.push({ topic: entry.topic, score: Math.min(1, score / 5) });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  _addScore(map, topic, score) {
    if (!topic) return;
    map.set(topic, (map.get(topic) || 0) + score);
  }

  _getAlternateTopics(combinedScores, bestTopic) {
    const alts = [];
    for (const [topic, score] of combinedScores) {
      if (topic !== bestTopic && score > 0.1) {
        alts.push({ topic, score: Math.min(1, score) });
      }
    }
    return alts.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API: Get knowledge for a topic
  // ---------------------------------------------------------------------------
  getTopicKnowledge(topic) {
    return this.topicMap.get(topic) || null;
  }

  getAllTopics() {
    return Array.from(this.topicMap.keys());
  }

  getCategories() {
    const result = {};
    for (const [cat, topics] of this.categoryMap) {
      result[cat] = topics;
    }
    return result;
  }

  getStats() {
    return {
      totalTopics: this.topicMap.size,
      totalQuestions: this._getTotalQuestions(),
      categories: this.categoryMap.size,
      isReady: this.isReady
    };
  }
}

// Export singleton instance (trains once on import)
const topicClassifier = new TopicClassifier();
export default topicClassifier;
