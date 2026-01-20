import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import './SubscriptionPage.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('recruiterToken');
    if (!token) {
      navigate('/recruiter');
      return;
    }
    fetchPricing();
  }, [navigate]);

  const fetchPricing = async () => {
    try {
      const res = await fetch(`${API_URL}/payment/pricing`);
      const data = await res.json();
      setPricing(data);
    } catch (err) {
      console.error('Error fetching pricing:', err);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planType) => {
    setProcessingPlan(planType);
    setError('');
    
    try {
      const token = localStorage.getItem('recruiterToken');
      
      // Create mock order
      const res = await fetch(`${API_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planType })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      // Show mock payment confirmation dialog
      const confirmPayment = window.confirm(
        `💳 Mock Payment (Testing Mode)\n\n` +
        `Plan: ${planType.toUpperCase()}\n` +
        `Amount: ₹${data.amount / 100}\n\n` +
        `This is a simulated payment for testing.\n` +
        `No real money will be charged.\n\n` +
        `Click OK to complete the payment.`
      );

      if (!confirmPayment) {
        setProcessingPlan(null);
        return;
      }

      // Verify mock payment
      const verifyRes = await fetch(`${API_URL}/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: data.orderId,
          planType: planType
        })
      });

      const verifyData = await verifyRes.json();
      
      if (verifyData.success) {
        alert('✅ Subscription activated successfully!');
        navigate('/recruiter/dashboard');
      } else {
        throw new Error('Payment verification failed');
      }
      
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message);
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="subscription-loading">
        <div className="loader"></div>
        <p>Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-container">
        <div className="subscription-header">
          <h1>Choose Your Plan</h1>
          <p>Select a subscription plan to unlock all features and start hiring top talent</p>
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.9rem' }}>
            💡 <strong>Testing Mode:</strong> This is a mock payment system for development. No real payment will be processed.
          </div>
          {error && <div className="error-banner">{error}</div>}
        </div>

        <div className="pricing-cards">
          {pricing.map((plan) => (
            <div key={plan.planType} className={`pricing-card ${plan.planType === 'monthly' ? 'featured' : ''}`}>
              {plan.planType === 'monthly' && <div className="popular-badge">Most Popular</div>}
              
              <div className="plan-header">
                <h2>{plan.planType.charAt(0).toUpperCase() + plan.planType.slice(1)}</h2>
                <div className="price">
                  <span className="currency">₹</span>
                  <span className="amount">{plan.price}</span>
                  <span className="period">/{plan.planType === 'weekly' ? 'week' : 'month'}</span>
                </div>
              </div>

              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <Check size={20} className="check-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`subscribe-btn ${processingPlan === plan.planType ? 'processing' : ''}`}
                onClick={() => handleSubscribe(plan.planType)}
                disabled={processingPlan !== null}
              >
                {processingPlan === plan.planType ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>

        <div className="subscription-footer">
          <p>✓ Mock payment for testing purposes</p>
          <p>✓ Cancel anytime from your dashboard</p>
          <p>✓ 24/7 customer support</p>
        </div>
      </div>
    </div>
  );
}
