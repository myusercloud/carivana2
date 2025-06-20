// client/src/services/authService.js
// const API_URL = '/api/auth/'; // This might be used later for specific calls from service itself

const login = (token, user) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

const getCurrentUser = () => { // Corrected syntax
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

const getToken = () => {
  return localStorage.getItem('token');
};

export default {
  login,
  logout,
  getCurrentUser,
  getToken,
};
