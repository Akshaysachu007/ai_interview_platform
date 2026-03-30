import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Award, Target, Clock } from 'lucide-react';
import './InterviewAnalytics.css';

const API_URL = import.meta.env.VITE_API_URL;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

export default function InterviewAnalytics() {
  const [mockStats, setMockStats] = useState(null);
  const [realStats, setRealStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('candidateToken');
      
      // Fetch mock interview statistics
      const mockRes = await fetch(`${API_URL}/interview/mock/statistics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (mockRes.ok) {
        const mockData = await mockRes.json();
        setMockStats(mockData);
      }

      // Fetch real interview statistics
      const realRes = await fetch(`${API_URL}/interview/stats/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (realRes.ok) {
        const realData = await realRes.json();
        setRealStats(realData);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  // Prepare data for charts
  const mockScoreData = mockStats?.recentScores?.slice().reverse().map((item, index) => ({
    name: `Test ${index + 1}`,
    score: item.score,
    date: new Date(item.date).toLocaleDateString()
  })) || [];

  const realScoreData = realStats?.recentInterviews?.map((item, index) => ({
    name: `Assessment ${index + 1}`,
    score: item.score || 0,
    date: new Date(item.createdAt).toLocaleDateString()
  })) || [];

  const streamComparisonData = Object.keys(mockStats?.byStream || {}).map(stream => ({
    name: stream.substring(0, 15),
    mock: mockStats.byStream[stream].averageScore,
    real: realStats?.streamPerformance?.[stream]?.averageScore || 0
  }));

  const difficultyData = Object.keys(mockStats?.byDifficulty || {}).map(difficulty => ({
    name: difficulty,
    count: mockStats.byDifficulty[difficulty].count,
    avgScore: mockStats.byDifficulty[difficulty].averageScore
  }));

  return (
    <div className="interview-analytics">
      <h2 className="analytics-title">
        <TrendingUp size={28} />
        Performance Analytics
      </h2>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card mock">
          <Target size={32} />
          <div>
            <h3>Practice Tests</h3>
            <div className="stat-value">{mockStats?.totalMockInterviews || 0}</div>
            <p>Avg Score: {mockStats?.averageMockScore || 0}/100</p>
          </div>
        </div>

        <div className="summary-card real">
          <Award size={32} />
          <div>
            <h3>Job Assessments</h3>
            <div className="stat-value">{realStats?.totalInterviews || 0}</div>
            <p>Avg Score: {realStats?.averageScore || 0}/100</p>
          </div>
        </div>

        <div className="summary-card completed">
          <Clock size={32} />
          <div>
            <h3>Completed</h3>
            <div className="stat-value">
              {(mockStats?.completedMockInterviews || 0) + (realStats?.completedInterviews || 0)}
            </div>
            <p>Total Completed</p>
          </div>
        </div>
      </div>

      {/* Mock Test Analysis */}
      {mockScoreData.length > 0 && (
        <div className="chart-container">
          <h3>🎯 Practice Test Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#667eea" 
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 6 }}
                activeDot={{ r: 8 }}
                name="Mock Score"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="chart-description">
            Track your improvement across practice tests. Each point represents a completed mock test.
          </p>
        </div>
      )}

      {/* Real Interview Analysis */}
      {realScoreData.length > 0 && (
        <div className="chart-container">
          <h3>💼 Job Assessment Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={realScoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#43e97b" 
                strokeWidth={3}
                dot={{ fill: '#43e97b', r: 6 }}
                activeDot={{ r: 8 }}
                name="Assessment Score"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="chart-description">
            Your performance in job assessments with recruiters.
          </p>
        </div>
      )}

      {/* Stream Comparison */}
      {streamComparisonData.length > 0 && (
        <div className="chart-container">
          <h3>📊 Performance by Stream</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={streamComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="mock" fill="#667eea" name="Practice Tests" />
              <Bar dataKey="real" fill="#43e97b" name="Job Assessments" />
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-description">
            Compare your performance across different streams in practice vs job assessments.
          </p>
        </div>
      )}

      {/* Difficulty Distribution */}
      {difficultyData.length > 0 && (
        <div className="chart-container">
          <h3>🎲 Difficulty Level Distribution</h3>
          <div className="chart-row">
            <ResponsiveContainer width="50%" height={300}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="50%" height={300}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#764ba2" name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-description">
            Distribution of assessments by difficulty level and performance.
          </p>
        </div>
      )}

      {/* Performance Insights */}
      <div className="insights-container">
        <h3>💡 Key Insights</h3>
        <div className="insights-grid">
          {mockStats?.averageMockScore > realStats?.averageScore && (
            <div className="insight-card positive">
              <h4>Strong Practice Performance</h4>
              <p>Your mock test scores are higher than job assessments. Keep practicing to close the gap!</p>
            </div>
          )}

          {mockStats?.totalMockInterviews < 5 && (
            <div className="insight-card warning">
              <h4>More Practice Recommended</h4>
              <p>Take at least 5 practice tests to build confidence before job assessments.</p>
            </div>
          )}

          {realStats?.averageScore >= 80 && (
            <div className="insight-card positive">
              <h4>Excellent Performance!</h4>
              <p>You're consistently scoring above 80%. Great job!</p>
            </div>
          )}

          {streamComparisonData.length > 2 && (
            <div className="insight-card info">
              <h4>Diverse Experience</h4>
              <p>You've been assessed across multiple streams. This versatility is valuable!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
