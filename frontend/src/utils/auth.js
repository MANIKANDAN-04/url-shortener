
import { toast } from 'react-toastify';

export const loginUser = async (email, password) => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // important for sessions
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, user: data.user };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        error: error.detail || 'Login failed' 
      };
    }
  } catch (err) {
    console.error('Login error:', err); // keeping this for debugging
    return { 
      success: false, 
      error: 'Network error - please check your connection' 
    };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, user: data };
    } else {
      const error = await response.json();
      return { 
        success: false, 
        error: error.detail || 'Registration failed' 
      };
    }
  } catch (err) {
    console.error('Registration error:', err);
    return { 
      success: false, 
      error: 'Could not connect to server' 
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/me', {
      credentials: 'include',
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (err) {
    console.log('Not authenticated or network error');
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return true;
  } catch (err) {
    console.error('Logout error:', err);
    return false;
  }
};
