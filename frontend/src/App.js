import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import URLShortener from './components/URLShortener';
import URLList from './components/URLList';
import Analytics from './components/Analytics';
import Login from './components/Login';

import { getCurrentUser, logoutUser } from './utils/auth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.log('User not authenticated or network issue');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleUserLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleUserLogout = async () => {
    try {
      const success = await logoutUser();
      if (success) {
        setCurrentUser(null);
        toast.success('You have been logged out');
      } else {
        toast.error('Logout failed - please try again');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Something went wrong during logout');
    }
  };

  if (isLoadingUser) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={handleUserLogin} />
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </>
    );
  }

  return (
    <Router>
      <div className="App">
        <div className="container">
          <div className="header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>🔗 URL Shortener</h1>
                <p>Shorten your long URLs and track analytics</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="welcome-text">
                  Hey {currentUser.name}! 👋
                </p>
                <button
                  onClick={handleUserLogout}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              Create Short URL
            </NavLink>
            <NavLink to="/my-urls" className={({ isActive }) => isActive ? 'active' : ''}>
              My URLs
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
              View Analytics
            </NavLink>
          </nav>

          <Routes>
            <Route path="/" element={<URLShortener />} />
            <Route path="/my-urls" element={<URLList />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
        
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;
