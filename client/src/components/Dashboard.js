import React, { useState, useEffect } from 'react';
import rentalService from '../services/rentalService';
import authService from '../services/authService';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = authService.getCurrentUser();
  const token = authService.getToken();

  useEffect(() => {
    const fetchRentals = async () => {
      if (!currentUser || !token) {
        setError('Please login to view your dashboard.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await rentalService.getRentals(token);
        setRentals(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch rentals.');
        console.error('Error fetching rentals:', err);
        setLoading(false);
      }
    };

    fetchRentals();
  }, [currentUser, token]);

  if (loading) {
    return <div className="container mt-3"><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>;
  }

  return (
    <div className="container mt-3">
      <h2>My Rentals Dashboard</h2>
      {currentUser && <p>Welcome, {currentUser.username || currentUser.email}!</p>}

      {rentals.length === 0 ? (
        <div className="alert alert-info">
          You have no rentals yet. <Link to="/cars">Browse cars</Link> to make a booking.
        </div>
      ) : (
        <div className="list-group">
          {rentals.map((rental) => (
            <div key={rental.id} className="list-group-item list-group-item-action flex-column align-items-start mb-3 shadow-sm">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{rental.make} {rental.model} ({rental.year})</h5>
                <small>Booked on: {new Date(rental.created_at).toLocaleDateString()}</small>
              </div>
              <p className="mb-1">
                Rented from <strong>{new Date(rental.start_date).toLocaleDateString()}</strong> to <strong>{new Date(rental.end_date).toLocaleDateString()}</strong>.
              </p>
              <p className="mb-1">
                Total Price: <strong>${parseFloat(rental.total_price).toFixed(2)}</strong>
              </p>
              <p className="mb-1">
                Price per day: ${parseFloat(rental.car_price_per_day).toFixed(2)}
              </p>
              <small>Rental ID: {rental.id}</small>
              {/* Future: Link to individual rental details or cancellation options */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
