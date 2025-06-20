import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom'; // Link components need Router
import Cars from './Cars';
import carService from '../services/carService';

// Mock carService
jest.mock('../services/carService');

const mockCarsData = [
  { id: 1, make: 'Toyota', model: 'Camry', year: 2022, price_per_day: '50.00', available: true, created_at: '2023-01-01T00:00:00.000Z' },
  { id: 2, make: 'Honda', model: 'Civic', year: 2021, price_per_day: '45.00', available: false, created_at: '2023-01-02T00:00:00.000Z' },
];

describe('Cars Component', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    carService.getAllCars.mockClear();
  });

  test('renders loading state initially', () => {
    // Mock a promise that never resolves to keep it in loading state
    carService.getAllCars.mockReturnValue(new Promise(() => {}));
    render(<Router><Cars /></Router>);
    expect(screen.getByText(/loading cars.../i)).toBeInTheDocument();
  });

  test('fetches and displays cars correctly', async () => {
    carService.getAllCars.mockResolvedValue({ data: mockCarsData });
    render(<Router><Cars /></Router>);

    // Wait for cars to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText(/toyota camry/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/honda civic/i)).toBeInTheDocument();
    expect(screen.getByText(/year: 2022/i)).toBeInTheDocument();
    expect(screen.getByText(/price: \$50.00 \/ day/i)).toBeInTheDocument();

    // Check for availability text. This is more robust than checking class names.
    // For Toyota Camry (available)
    const toyotaCard = screen.getByText(/toyota camry/i).closest('.card-body');
    expect(toyotaCard).toHaveTextContent('Available');

    // For Honda Civic (not available)
    const hondaCard = screen.getByText(/honda civic/i).closest('.card-body');
    expect(hondaCard).toHaveTextContent('Not Available');

    // Check that links to details page are present
    const links = screen.getAllByRole('link', { name: /view details/i });
    expect(links.length).toBe(mockCarsData.length);
    expect(links[0]).toHaveAttribute('href', '/cars/1');
    expect(links[1]).toHaveAttribute('href', '/cars/2');
  });

  test('displays an error message if the API call fails', async () => {
    carService.getAllCars.mockRejectedValue({ response: { data: { message: 'Custom API error' } } });
    render(<Router><Cars /></Router>);

    await waitFor(() => {
      expect(screen.getByText(/custom api error/i)).toBeInTheDocument();
    });
  });

  test('displays a generic error message if API call fails without specific message', async () => {
    carService.getAllCars.mockRejectedValue(new Error('Network Error')); // No response object
    render(<Router><Cars /></Router>);

    await waitFor(() => {
      // The component defaults to 'Failed to fetch cars.'
      expect(screen.getByText(/failed to fetch cars/i)).toBeInTheDocument();
    });
  });

  test('displays "no cars available" message if the API returns an empty list', async () => {
    carService.getAllCars.mockResolvedValue({ data: [] });
    render(<Router><Cars /></Router>);

    await waitFor(() => {
      expect(screen.getByText(/no cars available at the moment/i)).toBeInTheDocument();
    });
  });
});
