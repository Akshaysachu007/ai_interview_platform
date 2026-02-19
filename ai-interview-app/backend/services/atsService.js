/**
 * ATS (Applicant Tracking System) Scoring Service
 * Calculates resume match score against job description
 */

/**
 * Calculate ATS score between resume and job description
 * @param {string} resumeText - Extracted resume text
 * @param {string} jobDescription - Job description from interview
 * @returns {Object} ATS score with breakdown
 */
export function calculateATSScore(resumeText, jobDescription) {
  if (!resumeText || !jobDescription) {
    return {
      score: 0,
      breakdown: {
        keywordMatch: 0,
        experienceRelevance: 0,
        educationalAlignment: 0,
        overallFit: 0
      },
      gapAnalysis: ['Missing resume or job description'],
      strengths: [],
      weaknesses: ['Incomplete data for analysis'],
      recommendation: 'Not Recommended'
    };
  }

  // Normalize text for analysis
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();

  // Extract keywords from job description
  const keywords = extractKeywords(jdLower);
  
  // Calculate keyword match score (40%)
  const keywordMatch = calculateKeywordMatch(resumeLower, keywords);
  
  // Calculate experience relevance (30%)
  const experienceRelevance = calculateExperienceRelevance(resumeLower, jdLower);
  
  // Calculate educational alignment (15%)
  const educationalAlignment = calculateEducationalAlignment(resumeLower, jdLower);
  
  // Calculate overall fit (15%)
  const overallFit = calculateOverallFit(resumeLower, jdLower);
  
  // Calculate weighted score
  const score = Math.round(
    (keywordMatch * 0.4) +
    (experienceRelevance * 0.3) +
    (educationalAlignment * 0.15) +
    (overallFit * 0.15)
  );

  // Generate analysis
  const gapAnalysis = generateGapAnalysis(resumeLower, keywords);
  const strengths = generateStrengths(resumeLower, keywords);
  const weaknesses = generateWeaknesses(resumeLower, keywords);
  const recommendation = generateRecommendation(score);

  return {
    score,
    breakdown: {
      keywordMatch: Math.round(keywordMatch),
      experienceRelevance: Math.round(experienceRelevance),
      educationalAlignment: Math.round(educationalAlignment),
      overallFit: Math.round(overallFit)
    },
    gapAnalysis,
    strengths,
    weaknesses,
    recommendation
  };
}

/**
 * Extract important keywords from job description
 */
function extractKeywords(jdText) {
  const keywords = new Set();
  
  // Technical skills patterns
  const techPatterns = [
    /\b(javascript|java|python|c\+\+|react|angular|vue|node\.?js|typescript|sql|nosql|mongodb|postgresql|mysql|aws|azure|gcp|docker|kubernetes|jenkins|git|agile|scrum|devops|ci\/cd|rest|api|microservices|machine learning|ml|ai|artificial intelligence|data science|big data|hadoop|spark|tableau|power bi|excel|erp|crm|salesforce)\b/gi,
    /\b(html|css|sass|less|webpack|babel|npm|yarn|express|django|flask|spring|hibernate|redux|graphql|elasticsearch|redis|kafka|rabbitmq|nginx|apache|linux|unix|windows|shell|bash|powershell)\b/gi
  ];
  
  techPatterns.forEach(pattern => {
    const matches = jdText.match(pattern) || [];
    matches.forEach(match => keywords.add(match.toLowerCase()));
  });
  
  // Soft skills
  const softSkills = ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative', 'adaptable', 'collaborative', 'management', 'strategic'];
  softSkills.forEach(skill => {
    if (jdText.includes(skill)) {
      keywords.add(skill);
    }
  });
  
  // Experience keywords
  const expPatterns = /\b(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)\b/gi;
  const expMatches = jdText.match(expPatterns) || [];
  expMatches.forEach(match => keywords.add(match.toLowerCase()));
  
  // Education keywords
  const eduKeywords = ["bachelor's", "master's", "phd", "degree", "diploma", "certification", "certified", "btech", "mtech", "mba", "bca", "mca"];
  eduKeywords.forEach(edu => {
    if (jdText.includes(edu)) {
      keywords.add(edu);
    }
  });
  
  return Array.from(keywords);
}

/**
 * Calculate keyword match percentage
 */
function calculateKeywordMatch(resumeText, keywords) {
  if (keywords.length === 0) return 50; // Default if no keywords
  
  let matchCount = 0;
  keywords.forEach(keyword => {
    if (resumeText.includes(keyword)) {
      matchCount++;
    }
  });
  
  return (matchCount / keywords.length) * 100;
}

/**
 * Calculate experience relevance score
 */
function calculateExperienceRelevance(resumeText, jdText) {
  let score = 50; // Base score
  
  // Check for experience mentions
  const resumeExpMatch = resumeText.match(/(\d+)\+?\s*(?:years?|yrs?)/gi);
  const jdExpMatch = jdText.match(/(\d+)\+?\s*(?:years?|yrs?)/gi);
  
  if (resumeExpMatch && jdExpMatch) {
    const resumeYears = Math.max(...resumeExpMatch.map(m => parseInt(m)));
    const requiredYears = Math.min(...jdExpMatch.map(m => parseInt(m)));
    
    if (resumeYears >= requiredYears) {
      score = 90;
    } else if (resumeYears >= requiredYears * 0.7) {
      score = 70;
    } else {
      score = 40;
    }
  } else if (resumeExpMatch) {
    score = 60; // Has experience mentioned
  }
  
  // Check for relevant work history keywords
  const workKeywords = ['developed', 'led', 'managed', 'designed', 'implemented', 'created', 'architected', 'optimized', 'collaborated', 'delivered'];
  let workKeywordCount = 0;
  workKeywords.forEach(keyword => {
    if (resumeText.includes(keyword)) {
      workKeywordCount++;
    }
  });
  
  score = Math.min(100, score + (workKeywordCount * 2));
  
  return score;
}

/**
 * Calculate educational alignment score
 */
function calculateEducationalAlignment(resumeText, jdText) {
  let score = 50; // Base score
  
  const eduLevels = {
    'phd': 100,
    'doctorate': 100,
    "master's": 90,
    'mtech': 90,
    'mba': 90,
    'mca': 90,
    "bachelor's": 80,
    'btech': 80,
    'bca': 80,
    'degree': 75,
    'diploma': 60,
    'certified': 70,
    'certification': 70
  };
  
  let resumeEduScore = 0;
  let jdEduScore = 0;
  
  Object.entries(eduLevels).forEach(([level, value]) => {
    if (resumeText.includes(level)) {
      resumeEduScore = Math.max(resumeEduScore, value);
    }
    if (jdText.includes(level)) {
      jdEduScore = Math.max(jdEduScore, value);
    }
  });
  
  if (resumeEduScore >= jdEduScore) {
    score = 95;
  } else if (resumeEduScore >= jdEduScore * 0.8) {
    score = 75;
  } else if (resumeEduScore > 0) {
    score = 50;
  }
  
  return score;
}

/**
 * Calculate overall fit score
 */
function calculateOverallFit(resumeText, jdText) {
  let score = 50;
  
  // Check for industry-specific terms
  const industries = {
    'software': ['software', 'development', 'programming', 'coding'],
    'data': ['data', 'analytics', 'analysis', 'insights'],
    'devops': ['devops', 'deployment', 'infrastructure', 'automation'],
    'management': ['management', 'leadership', 'strategy', 'business'],
    'design': ['design', 'ux', 'ui', 'user experience']
  };
  
  let matchCount = 0;
  let totalChecks = 0;
  
  Object.values(industries).forEach(terms => {
    const jdHasTerm = terms.some(term => jdText.includes(term));
    if (jdHasTerm) {
      totalChecks++;
      const resumeHasTerm = terms.some(term => resumeText.includes(term));
      if (resumeHasTerm) {
        matchCount++;
      }
    }
  });
  
  if (totalChecks > 0) {
    score = (matchCount / totalChecks) * 100;
  }
  
  return score;
}

/**
 * Generate gap analysis
 */
function generateGapAnalysis(resumeText, keywords) {
  const gaps = [];
  const missingKeywords = keywords.filter(keyword => !resumeText.includes(keyword));
  
  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 5);
    gaps.push(`Missing key skills: ${topMissing.join(', ')}`);
  }
  
  if (!resumeText.includes('experience') && !resumeText.includes('worked')) {
    gaps.push('Limited work experience mentioned');
  }
  
  if (!resumeText.includes('project') && !resumeText.includes('developed')) {
    gaps.push('No project experience highlighted');
  }
  
  if (gaps.length === 0) {
    gaps.push('Strong alignment with job requirements');
  }
  
  return gaps;
}

/**
 * Generate strengths
 */
function generateStrengths(resumeText, keywords) {
  const strengths = [];
  const matchedKeywords = keywords.filter(keyword => resumeText.includes(keyword));
  
  if (matchedKeywords.length >= keywords.length * 0.7) {
    strengths.push('Strong technical skill match');
  }
  
  if (resumeText.includes('experience') || resumeText.includes('years')) {
    strengths.push('Relevant work experience');
  }
  
  if (resumeText.includes('project') || resumeText.includes('developed')) {
    strengths.push('Demonstrated project experience');
  }
  
  if (resumeText.includes('degree') || resumeText.includes('bachelor') || resumeText.includes('master')) {
    strengths.push('Appropriate educational background');
  }
  
  if (resumeText.includes('leadership') || resumeText.includes('led') || resumeText.includes('managed')) {
    strengths.push('Leadership capabilities');
  }
  
  if (strengths.length === 0) {
    strengths.push('Basic qualifications present');
  }
  
  return strengths.slice(0, 5);
}

/**
 * Generate weaknesses
 */
function generateWeaknesses(resumeText, keywords) {
  const weaknesses = [];
  const missingKeywords = keywords.filter(keyword => !resumeText.includes(keyword));
  
  if (missingKeywords.length > keywords.length * 0.5) {
    weaknesses.push('Several key skills not mentioned');
  }
  
  if (!resumeText.includes('experience') && !resumeText.includes('years')) {
    weaknesses.push('Work experience not clearly stated');
  }
  
  if (!resumeText.includes('project') && !resumeText.includes('portfolio')) {
    weaknesses.push('Limited project showcase');
  }
  
  if (resumeText.length < 500) {
    weaknesses.push('Resume lacks detail');
  }
  
  if (weaknesses.length === 0) {
    weaknesses.push('Minor areas for improvement');
  }
  
  return weaknesses.slice(0, 3);
}

/**
 * Generate recommendation based on score
 */
function generateRecommendation(score) {
  if (score >= 80) {
    return 'Highly Recommended';
  } else if (score >= 60) {
    return 'Recommended';
  } else if (score >= 40) {
    return 'Consider';
  } else {
    return 'Not Recommended';
  }
}
