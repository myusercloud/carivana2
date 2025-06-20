import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // Import datepicker CSS
import carService from '../services/carService';
import rentalService from '../services/rentalService';
import authService from '../services/authService';

function CarDetails() {
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rentalMessage, setRentalMessage] = useState('');
  const [rentalError, setRentalError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const currentUser = authService.getCurrentUser();
  const token = authService.getToken();

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        setError('');
        setRentalMessage('');
        setRentalError('');
        const response = await carService.getCarById(id);
        setCar(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Car not found.' : (err.response?.data?.message || 'Failed to fetch car details.'));
        console.error(`Error fetching car ${id}:`, err);
        setLoading(false);
      }
    };

    if (id) {
      fetchCarDetails();
    }
  }, [id]);

  const handleRentalSubmit = async () => {
    setRentalMessage('');
    setRentalError('');

    if (!currentUser) {
      setRentalError('Please login to rent a car.');
      // Optionally redirect to login after a delay: setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!startDate || !endDate) {
      setRentalError('Please select a start and end date.');
      return;
    }
    if (startDate >= endDate) {
      setRentalError('End date must be after start date.');
      return;
    }
    if (new Date(startDate) < new Date().setHours(0,0,0,0)) {
        setRentalError('Start date cannot be in the past.');
        return;
    }


    const rentalData = {
      car_id: car.id,
      start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      end_date: endDate.toISOString().split('T')[0],     // Format as YYYY-MM-DD
    };

    try {
      await rentalService.createRental(rentalData, token);
      setRentalMessage('Rental successful! Check your dashboard for details.');
      // Disable dates or car or redirect
      setCar(prevCar => ({ ...prevCar, available: false })); // Optimistically update UI
      // navigate('/dashboard'); // Or redirect
    } catch (err) {
      setRentalError(err.response?.data?.message || 'Failed to create rental. The car might have been booked or dates are invalid.');
      console.error('Rental creation error:', err.response?.data || err.message);
    }
  };

  const today = new Date();

  if (loading) {
    return <div className="container mt-3"><p>Loading car details...</p></div>;
  }

  if (error) {
    return <div className="container mt-3"><div className="alert alert-danger">{error}</div><Link to="/cars" className="btn btn-secondary">Back to Cars</Link></div>;
  }

  if (!car) {
    return <div className="container mt-3"><p>Car details not available.</p><Link to="/cars" className="btn btn-secondary">Back to Cars</Link></div>;
  }

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">{car.make} {car.model} ({car.year})</h2>
              <p className="card-text"><strong>Make:</strong> {car.make}</p>
              <p className="card-text"><strong>Model:</strong> {car.model}</p>
              <p className="card-text"><strong>Year:</strong> {car.year}</p>
              <p className="card-text"><strong>Price per day:</strong> ${parseFloat(car.price_per_day).toFixed(2)}</p>
              <p className={`card-text ${car.available ? 'text-success' : 'text-danger'}`}>
                <strong>Availability:</strong> {car.available ? 'Available for rent' : 'Currently not available'}
              </p>
              <p className="card-text"><em>Car registered on: {new Date(car.created_at).toLocaleDateString()}</em></p>
              <Link to="/cars" className="btn btn-outline-secondary mt-3">Back to Cars</Link>
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <h4>Rent this Car</h4>
          {rentalMessage && <div className="alert alert-success">{rentalMessage}</div>}
          {rentalError && <div className="alert alert-danger">{rentalError}</div>}

          {!car.available && !rentalMessage && ( // Show only if car became unavailable and no success message yet
            <div className="alert alert-warning">This car is currently not available for new rentals.</div>
          )}

          {car.available && !rentalMessage && (
            <form onSubmit={(e) => { e.preventDefault(); handleRentalSubmit(); }}>
              <div className="mb-3">
                <label htmlFor="startDate" className="form-label">Start Date</label><br/>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={today}
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                  id="startDate"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="endDate" className="form-label">End Date</label><br/>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || today}
                  dateFormat="yyyy-MM-dd"
                  className="form-control"
                  id="endDate"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-success btn-lg w-100"
                disabled={!currentUser || !car.available}
              >
                {currentUser ? 'Confirm Rental' : 'Login to Rent'}
              </button>
              {!currentUser && <p className="text-muted small mt-2">You need to be logged in to rent a car.</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CarDetails;
