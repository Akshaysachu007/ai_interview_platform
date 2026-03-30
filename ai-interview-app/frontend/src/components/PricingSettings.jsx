import React, { useState, useEffect } from 'react';
import './PricingSettings.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function PricingSettings() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ price: '', features: '' });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/pricing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        window.location.href = '/admin';
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setPricing(data);
      } else {
        setError(data.message || 'Failed to load pricing');
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan.planType);
    setFormData({
      price: plan.price,
      features: plan.features.join('\n')
    });
  };

  const handleSave = async (planType) => {
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      setSaveMessage('❌ Please enter a valid price.');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const features = formData.features.split('\n').filter(f => f.trim());
      
      const res = await fetch(`${API_URL}/admin/pricing/${planType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          price: parseFloat(formData.price),
          features
        })
      });
      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminName');
        localStorage.removeItem('adminEmail');
        window.location.href = '/admin';
        return;
      }
      if (res.ok) {
        setSaveMessage('✅ Pricing updated successfully!');
        setEditingPlan(null);
        fetchPricing();
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const data = await res.json();
        setSaveMessage('❌ ' + (data.message || 'Failed to update pricing'));
      }
    } catch (err) {
      setSaveMessage('❌ Network error: ' + err.message);
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setFormData({ price: '', features: '' });
    setSaveMessage('');
  };

  if (loading) return <div>Loading pricing...</div>;
  if (error) return <div className="error-message" style={{padding:'20px',color:'#c0392b',background:'#fdecea',borderRadius:'8px',margin:'16px'}}>⚠️ {error}</div>;

  return (
    <div className="pricing-settings">
      <h2>Subscription Pricing Management</h2>
      {saveMessage && (
        <div style={{padding:'10px 16px',marginBottom:'12px',borderRadius:'8px',background: saveMessage.startsWith('✅') ? '#e9f9ee' : '#fdecea', color: saveMessage.startsWith('✅') ? '#1a7a3c' : '#c0392b',fontWeight:'500'}}>
          {saveMessage}
        </div>
      )}
      
      <div className="pricing-cards">
        {pricing.map((plan) => (
          <div key={plan.planType} className="pricing-card">
            <div className="plan-header">
              <h3>{plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)} Plan</h3>
              {editingPlan !== plan.planType && (
                <button className="edit-btn" onClick={() => handleEdit(plan)}>
                  Edit
                </button>
              )}
            </div>
            
            {editingPlan === plan.planType ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Price ($):</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="49"
                  />
                </div>
                
                <div className="form-group">
                  <label>Features (one per line):</label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    rows={6}
                    placeholder="Post up to 5 job listings&#10;Access to candidate database&#10;Basic analytics"
                  />
                </div>
                
                <div className="action-buttons">
                  <button className="save-btn" onClick={() => handleSave(plan.planType)}>
                    Save Changes
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="plan-details">
                <div className="price-display">
                  <span className="price">${plan.price}</span>
                  <span className="duration">per {plan.planType === 'weekly' ? 'week' : 'month'}</span>
                </div>
                
                <div className="features-list">
                  <h4>Features:</h4>
                  <ul>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="plan-meta">
                  <small>Last updated: {new Date(plan.updatedAt).toLocaleDateString()}</small>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
