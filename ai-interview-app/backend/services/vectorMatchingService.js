// Vector Embedding Matching Engine
// Uses cosine similarity to match candidates with job descriptions
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * PREMIUM FEATURE: Vector Embedding Matching Engine
 * Converts JD and candidate skills into vectors and calculates similarity
 * Formula: similarity = (A · B) / (||A|| ||B||)
 */
class VectorMatchingService {

  /**
   * Generate vector embedding for text using OpenAI embeddings API
   * @param {string} text - Text to convert to vector
   * @returns {Promise<Array>} Vector embedding (array of numbers)
   */
  static async generateEmbedding(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding generation');
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('⚠️ OpenAI API key not configured. Using fallback TF-IDF vectors.');
      return this.generateTFIDFVector(text);
    }

    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // Cost-effective embedding model
        input: text.substring(0, 8000), // Limit to 8k characters for API
        encoding_format: "float"
      });

      return response.data[0].embedding;

    } catch (error) {
      console.error('❌ Embedding generation error:', error.message);
      // Fallback to TF-IDF
      return this.generateTFIDFVector(text);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * Formula: similarity = (A · B) / (||A|| ||B||)
   * @param {Array} vectorA - First vector
   * @param {Array} vectorB - Second vector
   * @returns {number} Similarity score between 0 and 1
   */
  static calculateCosineSimilarity(vectorA, vectorB) {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    // Calculate dot product (A · B)
    let dotProduct = 0;
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
    }

    // Calculate magnitudes (||A|| and ||B||)
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    // Calculate cosine similarity
    const similarity = dotProduct / (magnitudeA * magnitudeB);

    // Ensure result is between 0 and 1
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Match candidate with job description using vector embeddings
   * @param {Object} candidateProfile - Structured candidate profile
   * @param {Object} jobDescription - Job description with requirements
   * @returns {Promise<Object>} Match result with similarity score
   */
  static async matchCandidateToJob(candidateProfile, jobDescription) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎯 VECTOR EMBEDDING MATCHING ENGINE');
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Create candidate text representation
      const candidateText = this.createCandidateText(candidateProfile);
      
      // Create job description text representation
      const jobText = this.createJobText(jobDescription);

      console.log('🔄 Generating embeddings...');
      console.log(`   Candidate text length: ${candidateText.length} chars`);
      console.log(`   Job description length: ${jobText.length} chars\n`);

      // Generate embeddings
      const [candidateVector, jobVector] = await Promise.all([
        this.generateEmbedding(candidateText),
        this.generateEmbedding(jobText)
      ]);

      console.log('✅ Embeddings generated');
      console.log(`   Candidate vector dimension: ${candidateVector.length}`);
      console.log(`   Job vector dimension: ${jobVector.length}\n`);

      // Calculate cosine similarity
      const similarityScore = this.calculateCosineSimilarity(candidateVector, jobVector);

      console.log('📊 MATCHING RESULTS');
      console.log(`   Similarity Score: ${(similarityScore * 100).toFixed(2)}%`);
      console.log(`   Threshold: 80%`);
      console.log(`   Should Notify: ${similarityScore >= 0.8 ? '✅ YES' : '❌ NO'}`);
      console.log(`${'='.repeat(80)}\n`);

      // Determine match quality
      let matchQuality;
      if (similarityScore >= 0.9) matchQuality = 'Excellent Match';
      else if (similarityScore >= 0.8) matchQuality = 'Strong Match';
      else if (similarityScore >= 0.7) matchQuality = 'Good Match';
      else if (similarityScore >= 0.6) matchQuality = 'Moderate Match';
      else matchQuality = 'Weak Match';

      return {
        success: true,
        similarityScore: Math.round(similarityScore * 100) / 100, // Round to 2 decimals
        similarityPercentage: Math.round(similarityScore * 100),
        matchQuality,
        shouldNotify: similarityScore >= 0.8,
        threshold: 0.8,
        vectorDimension: candidateVector.length,
        matchedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Vector matching error:', error.message);
      
      // Fallback to keyword matching
      return this.fallbackKeywordMatching(candidateProfile, jobDescription);
    }
  }

  /**
   * Create text representation of candidate profile for embedding
   */
  static createCandidateText(profile) {
    const parts = [];

    // Add skills
    if (profile.skills?.hardSkills?.length > 0) {
      parts.push(`Skills: ${profile.skills.hardSkills.join(', ')}`);
    }

    // Add work experience
    if (profile.workExperience?.length > 0) {
      const experience = profile.workExperience.map(job => 
        `${job.role} at ${job.company}: ${job.description || ''}`
      ).join('. ');
      parts.push(`Experience: ${experience}`);
    }

    // Add education
    if (profile.education?.length > 0) {
      const education = profile.education.map(edu => 
        `${edu.degree} in ${edu.field} from ${edu.institution}`
      ).join('. ');
      parts.push(`Education: ${education}`);
    }

    // Add certifications
    if (profile.certifications?.length > 0) {
      parts.push(`Certifications: ${profile.certifications.join(', ')}`);
    }

    // Add profile summary
    if (profile.profileSummary) {
      parts.push(`Summary: ${profile.profileSummary}`);
    }

    // Add years of experience
    if (profile.yearsOfExperience) {
      parts.push(`Years of Experience: ${profile.yearsOfExperience}`);
    }

    return parts.join(' ');
  }

  /**
   * Create text representation of job description for embedding
   */
  static createJobText(jobDescription) {
    const parts = [];

    // Add job title
    if (jobDescription.title) {
      parts.push(`Position: ${jobDescription.title}`);
    }

    // Add stream/domain
    if (jobDescription.stream) {
      parts.push(`Domain: ${jobDescription.stream}`);
    }

    // Add full job description
    if (jobDescription.jobDescription) {
      parts.push(`Description: ${jobDescription.jobDescription}`);
    }

    // Add required skills
    if (jobDescription.requiredSkills?.length > 0) {
      parts.push(`Required Skills: ${jobDescription.requiredSkills.join(', ')}`);
    }

    // Add preferred skills
    if (jobDescription.preferredSkills?.length > 0) {
      parts.push(`Preferred Skills: ${jobDescription.preferredSkills.join(', ')}`);
    }

    // Add requirements
    if (jobDescription.requirements) {
      const req = jobDescription.requirements;
      if (req.minExperience) {
        parts.push(`Minimum Experience: ${req.minExperience} years`);
      }
      if (req.educationLevel) {
        parts.push(`Education: ${req.educationLevel}`);
      }
      if (req.specificRequirements?.length > 0) {
        parts.push(`Requirements: ${req.specificRequirements.join(', ')}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Batch match multiple candidates against a job description
   * @param {Array} candidates - Array of candidate profiles
   * @param {Object} jobDescription - Job description
   * @returns {Promise<Array>} Sorted array of matches with scores
   */
  static async batchMatchCandidates(candidates, jobDescription) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔍 BATCH VECTOR MATCHING');
    console.log(`   Processing ${candidates.length} candidates...`);
    console.log(`${'='.repeat(80)}\n`);

    // Generate job vector once
    const jobText = this.createJobText(jobDescription);
    const jobVector = await this.generateEmbedding(jobText);

    // Match all candidates
    const matches = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const candidateText = this.createCandidateText(candidate);
          const candidateVector = await this.generateEmbedding(candidateText);
          const similarityScore = this.calculateCosineSimilarity(candidateVector, jobVector);

          return {
            candidateId: candidate._id || candidate.id,
            candidateName: candidate.personalDetails?.fullName || candidate.name || 'Unknown',
            candidateEmail: candidate.personalDetails?.email || candidate.email,
            similarityScore,
            similarityPercentage: Math.round(similarityScore * 100),
            shouldNotify: similarityScore >= 0.8,
            matchQuality: similarityScore >= 0.9 ? 'Excellent Match' :
                         similarityScore >= 0.8 ? 'Strong Match' :
                         similarityScore >= 0.7 ? 'Good Match' :
                         similarityScore >= 0.6 ? 'Moderate Match' : 'Weak Match'
          };
        } catch (error) {
          console.error(`Error matching candidate ${candidate._id}:`, error.message);
          return null;
        }
      })
    );

    // Filter out null results and sort by similarity
    const validMatches = matches
      .filter(match => match !== null)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    console.log(`✅ Batch matching complete`);
    console.log(`   Total matches: ${validMatches.length}`);
    console.log(`   Strong matches (≥80%): ${validMatches.filter(m => m.shouldNotify).length}`);
    console.log(`${'='.repeat(80)}\n`);

    return validMatches;
  }

  /**
   * Fallback keyword-based matching using TF-IDF vectors
   */
  static generateTFIDFVector(text) {
    // Simple TF-IDF implementation for fallback
    // This creates a basic feature vector based on word frequencies
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const vocabulary = [...new Set(words)];
    const vector = new Array(Math.min(vocabulary.length, 500)).fill(0);

    words.forEach(word => {
      const index = vocabulary.indexOf(word);
      if (index !== -1 && index < vector.length) {
        vector[index] += 1;
      }
    });

    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  /**
   * Fallback keyword matching when embeddings are unavailable
   */
  static fallbackKeywordMatching(candidateProfile, jobDescription) {
    console.log('⚠️ Using fallback keyword matching...');

    const candidateSkills = [
      ...(candidateProfile.skills?.hardSkills || []),
      ...(candidateProfile.skills?.softSkills || [])
    ].map(s => s.toLowerCase());

    const requiredSkills = (jobDescription.requiredSkills || []).map(s => s.toLowerCase());

    let matchCount = 0;
    requiredSkills.forEach(skill => {
      if (candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))) {
        matchCount++;
      }
    });

    const similarityScore = requiredSkills.length > 0 
      ? matchCount / requiredSkills.length 
      : 0;

    return {
      success: true,
      similarityScore: Math.round(similarityScore * 100) / 100,
      similarityPercentage: Math.round(similarityScore * 100),
      matchQuality: similarityScore >= 0.8 ? 'Strong Match' : 'Moderate Match',
      shouldNotify: similarityScore >= 0.8,
      threshold: 0.8,
      fallbackMethod: 'keyword-matching',
      matchedAt: new Date()
    };
  }
}

export default VectorMatchingService;
