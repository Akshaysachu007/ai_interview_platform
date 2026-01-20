import React, { useState } from 'react';
import './SubscriptionModal.css';

export default function SubscriptionModal({ onClose, onSubscribe }) {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const plans = [
    {
      id: 'weekly',
      name: 'Weekly Plan',
      price: '$49',
      duration: 'per week',
      features: [
        'Post up to 5 job listings',
        'Access to candidate database',
        'Basic analytics',
        'Email support',
      ],
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$149',
      duration: 'per month',
      features: [
        'Post unlimited job listings',
        'Full access to candidate database',
        'Advanced analytics & reports',
        'Priority email & chat support',
        'Featured job postings',
        'Save 25% compared to weekly',
      ],
      recommended: true,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      alert('Please select a subscription plan');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.company) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
      alert('Please fill in all payment details');
      return;
    }

    onSubscribe({
      plan: selectedPlan,
      ...formData,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Choose Your Subscription Plan</h2>
        
        <div className="plans-container">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.recommended ? 'recommended' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.recommended && <div className="recommended-badge">Recommended</div>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="duration">{plan.duration}</span>
              </div>
              <ul className="features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <span className="check-icon">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`select-plan-btn ${selectedPlan === plan.id ? 'selected' : ''}`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <form className="subscription-form" onSubmit={handleSubmit}>
            <h3>Billing Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your Company Inc."
                  required
                />
              </div>
            </div>

            <h3>Payment Details</h3>
            
            <div className="form-group">
              <label>Card Number *</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date *</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>CVV *</label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength="3"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="subscribe-btn">
                Subscribe Now
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
