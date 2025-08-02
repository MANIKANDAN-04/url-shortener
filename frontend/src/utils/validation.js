
export const checkURL = (url) => {
  if (!url || url.trim() === '') {
    return { valid: false, message: 'Please enter a URL' };
  }
  
  try {
    new URL(url);
    return { valid: true };
  } catch (err) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { 
        valid: false, 
        message: 'URL must start with http:// or https://' 
      };
    }
    return { 
      valid: false, 
      message: 'Please enter a valid URL' 
    };
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
};
