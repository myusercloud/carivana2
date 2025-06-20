import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import carService from '../services/carService';

function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await carService.getAllCars();
        setCars(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch cars.');
        console.error('Error fetching cars:', err);
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  if (loading) {
    return <div className="container mt-3"><p>Loading cars...</p></div>;
  }

  if (error) {
    return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>;
  }

  if (cars.length === 0) {
    return <div className="container mt-3"><p>No cars available at the moment.</p></div>;
  }

  return (
    <div className="container mt-3">
      <h2>Our Cars</h2>
      <div className="row">
        {cars.map((car) => (
          <div key={car.id} className="col-md-4 mb-4">
            <div className="card h-100">
              {/* Placeholder for car image - you can add an image URL to your DB later */}
              {/* <img src={car.imageUrl || 'https://via.placeholder.com/300x200'} className="card-img-top" alt={`${car.make} ${car.model}`} /> */}
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{car.make} {car.model}</h5>
                <p className="card-text">Year: {car.year}</p>
                <p className="card-text">Price: ${parseFloat(car.price_per_day).toFixed(2)} / day</p>
                <p className={`card-text ${car.available ? 'text-success' : 'text-danger'}`}>
                  {car.available ? 'Available' : 'Not Available'}
                </p>
                <Link to={`/cars/${car.id}`} className="btn btn-primary mt-auto">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Cars;
