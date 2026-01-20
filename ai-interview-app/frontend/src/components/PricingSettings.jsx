import React, { useState, useEffect } from 'react';
import './PricingSettings.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function PricingSettings() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const data = await res.json();
      if (res.ok) {
        setPricing(data);
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
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
      
      if (res.ok) {
        alert('Pricing updated successfully!');
        setEditingPlan(null);
        fetchPricing();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update pricing');
      }
    } catch (err) {
      alert('Error updating pricing: ' + err.message);
    }
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setFormData({ price: '', features: '' });
  };

  if (loading) return <div>Loading pricing...</div>;

  return (
    <div className="pricing-settings">
      <h2>Subscription Pricing Management</h2>
      
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
