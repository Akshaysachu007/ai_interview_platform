import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function AuthForm() {
  const [rightPanelActive, setRightPanelActive] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const navigate = useNavigate();

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
      const res = await fetch(`${API_URL}/candidate/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password
        })
      });
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Server returned an unexpected response.');
      }
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      // Registration successful, redirect to login panel
      setRightPanelActive(false);
      setRegisterForm({ name: '', email: '', password: '', confirm: '' });
      alert('Registration successful! Please log in.');
    } catch (err) {
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
      const res = await fetch(`${API_URL}/candidate/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        })
      });
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error('Server returned an unexpected response.');
      }
      if (!res.ok) throw new Error(data.message || 'Login failed');
      // Save JWT token
      localStorage.setItem('candidateToken', data.token);
      // Fetch profile
      const profileRes = await fetch(`${API_URL}/candidate/profile`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      let profile;
      const profileContentType = profileRes.headers.get('content-type');
      if (profileContentType && profileContentType.includes('application/json')) {
        profile = await profileRes.json();
      } else {
        throw new Error('Server returned an unexpected response.');
      }
      if (!profileRes.ok) throw new Error(profile.message || 'Could not fetch profile');
      // Save minimal info for dashboard
      localStorage.setItem('candidateName', profile.name);
      localStorage.setItem('candidateEmail', profile.email);
      localStorage.setItem('candidateProfile', JSON.stringify(profile));
      setLoginForm({ email: '', password: '' });
      navigate('/candidate/dashboard');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="authform-center-wrapper">
      <div>
        <div className={`container${rightPanelActive ? ' right-panel-active' : ''}`} id="container">
          <div className="form-container sign-up-container">
            <form onSubmit={handleRegister}>
              <h1>Create Account</h1>

              <span>or use your email for registration</span>
              <input name="name" type="text" placeholder="Name" value={registerForm.name} onChange={handleRegisterChange} />
              <input name="email" type="email" placeholder="Email" value={registerForm.email} onChange={handleRegisterChange} />
              <input name="password" type="password" placeholder="New Password" value={registerForm.password} onChange={handleRegisterChange} />
              <input name="confirm" type="password" placeholder="Re-Enter Password" value={registerForm.confirm} onChange={handleRegisterChange} />
              {registerError && <div style={{ color: 'red', marginBottom: 8 }}>{registerError}</div>}
              <button type="submit" disabled={registerLoading}>{registerLoading ? 'Registering...' : 'Register'}</button>
            </form>
          </div>
          <div className="form-container sign-in-container">
            <form onSubmit={handleLogin}>
              <h1>Log in</h1>
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
                <h1>Already Have an Account</h1>
                <p>Login Here!</p>
                <button className="ghost" id="signIn" onClick={() => setRightPanelActive(false)}>Log In</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Don't Have an Account</h1>
                <p>Register Here!</p>
                <button className="ghost" id="signUp" onClick={() => setRightPanelActive(true)}>Register</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
