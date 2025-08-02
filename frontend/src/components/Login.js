import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { loginUser, registerUser } from '../utils/auth';
import { validateEmail, validatePassword } from '../utils/validation';

const Login = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateEmail(userInfo.email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    const passwordCheck = validatePassword(userInfo.password);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.message);
      setIsLoading(false);
      return;
    }

    try {
      let result;
      
      if (isLoginMode) {
        result = await loginUser(userInfo.email, userInfo.password);
        
        if (result.success) {
          toast.success('Welcome back!');
          onLogin(result.user);
        } else {
          toast.error(result.error);
        }
      } else {
        if (!userInfo.name.trim()) {
          toast.error('Please enter your name');
          setIsLoading(false);
          return;
        }
        
        result = await registerUser(userInfo);
        
        if (result.success) {
          toast.success('Account created! Please login now.');
          setIsLoginMode(true); // switch to login mode
          setUserInfo({ name: '', email: '', password: '' });
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error('Something went wrong:', error);
      toast.error('Something unexpected happened. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setUserInfo({ name: '', email: '', password: '' });
  };

  return (
    <div className="netflix-login-container">
      <div className="netflix-login-card">
        <h2 className="netflix-login-title">
          {isLoginMode ? '🔗 Welcome Back' : '🔗 Create Account'}
        </h2>

        <form onSubmit={handleFormSubmit} className="netflix-form">
          {/* Name field - only show when registering */}
          {!isLoginMode && (
            <div className="netflix-form-group">
              <label className="netflix-label">Your Name</label>
              <input
                type="text"
                name="name"
                value={userInfo.name}
                onChange={updateFormData}
                required={!isLoginMode}
                className="netflix-input"
                placeholder="What should we call you?"
              />
            </div>
          )}

          {/* Email field */}
          <div className="netflix-form-group">
            <label className="netflix-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={userInfo.email}
              onChange={updateFormData}
              required
              className="netflix-input"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Password field */}
          <div className="netflix-form-group">
            <label className="netflix-label">Password</label>
            <input
              type="password"
              name="password"
              value={userInfo.password}
              onChange={updateFormData}
              required
              className="netflix-input"
              placeholder="Enter a secure password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`netflix-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Switch between login/register */}
        <div className="netflix-switch">
          <span className="netflix-switch-text">
            {isLoginMode ? "Don't have an account yet? " : "Already have an account? "}
          </span>
          <button
            onClick={toggleMode}
            className="netflix-switch-button"
          >
            {isLoginMode ? 'Sign up here' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
