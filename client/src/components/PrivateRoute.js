import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const PrivateRoute = ({ element }) => {
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    // User not logged in, redirect to login page
    // You can also pass the current location to redirect back after login
    // return <Navigate to="/login" state={{ from: location }} replace /> (requires useLocation)
    return <Navigate to="/login" replace />;
  }

  // User is logged in, render the requested component
  return element;
};

export default PrivateRoute;
