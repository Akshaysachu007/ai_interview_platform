import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecruiterPage.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function RecruiterPage() {
  const navigate = useNavigate();
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Debug: Log API URL on component mount
  useEffect(() => {
    console.log('RecruiterPage - API_URL:', API_URL);
    console.log('RecruiterPage - Full register URL:', `${API_URL}/recruiter/register`);
    console.log('RecruiterPage - Full login URL:', `${API_URL}/recruiter/login`);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('recruiterToken');
    if (token) {
      navigate('/recruiter/dashboard');
    }
  }, [navigate]);

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirm) {
      setRegisterError('All fields are required.');
      return;
    }
    if (registerForm.password !== registerForm.confirm) {
      setRegisterError('Passwords do not match.');
      return;
    }
    setRegisterLoading(true);
    try {
      console.log('Registering with API_URL:', API_URL);
      const url = `${API_URL}/recruiter/register`;
      console.log('Full registration URL:', url);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password
        })
      });
      
      console.log('Registration response status:', res.status);
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
        console.log('Registration response data:', data);
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an unexpected response.');
      }
      
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      setRightPanelActive(false);
      setRegisterForm({ name: '', email: '', password: '', confirm: '' });
      alert('Registration successful! Please log in.');
    } catch (err) {
      console.error('Registration error:', err);
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      console.log('Logging in with API_URL:', API_URL);
      const url = `${API_URL}/recruiter/login`;
      console.log('Full login URL:', url);
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });
      
      console.log('Login response status:', res.status);
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
        console.log('Login response data:', data);
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an unexpected response.');
      }
      
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('recruiterToken', data.token);
      setLoginForm({ email: '', password: '' });
      console.log('Login successful, navigating to dashboard');
      navigate('/recruiter/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="recruiter-page-wrapper">
      <div className="recruiter-auth-container">
        <div className={`container${rightPanelActive ? ' right-panel-active' : ''}`} id="container">
          <div className="form-container sign-up-container">
            <form onSubmit={handleRegister}>
              <h1>Create Recruiter Account</h1>
              <span>Register to post interviews and hire talent</span>
              <input name="name" type="text" placeholder="Your Name" value={registerForm.name} onChange={handleRegisterChange} />
              <input name="email" type="email" placeholder="Email" value={registerForm.email} onChange={handleRegisterChange} />
              <input name="password" type="password" placeholder="Password" value={registerForm.password} onChange={handleRegisterChange} />
              <input name="confirm" type="password" placeholder="Confirm Password" value={registerForm.confirm} onChange={handleRegisterChange} />
              {registerError && <div style={{ color: 'red', marginBottom: 8 }}>{registerError}</div>}
              <button type="submit" disabled={registerLoading}>{registerLoading ? 'Registering...' : 'Register'}</button>
            </form>
          </div>
          <div className="form-container sign-in-container">
            <form onSubmit={handleLogin}>
              <h1>Recruiter Login</h1>
              <span>Sign in to your recruiter account</span>
              <input name="email" type="email" placeholder="Email" value={loginForm.email} onChange={handleLoginChange} />
              <input name="password" type="password" placeholder="Password" value={loginForm.password} onChange={handleLoginChange} />
              <a href="#">Forgot your password?</a>
              {loginError && <div style={{ color: 'red', marginBottom: 8 }}>{loginError}</div>}
              <button type="submit" disabled={loginLoading}>{loginLoading ? 'Logging in...' : 'Log In'}</button>
            </form>
          </div>
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Already Have an Account?</h1>
                <p>Login to access your recruiter dashboard</p>
                <button className="ghost" id="signIn" onClick={() => setRightPanelActive(false)}>Log In</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>New to AI Interview?</h1>
                <p>Register as a recruiter and start hiring today!</p>
                <button className="ghost" id="signUp" onClick={() => setRightPanelActive(true)}>Register</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
