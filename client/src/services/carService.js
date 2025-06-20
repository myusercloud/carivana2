import axios from 'axios';

const API_URL = '/api/cars/';

const getAllCars = () => {
  return axios.get(API_URL);
};

const getCarById = (id) => {
  return axios.get(API_URL + id);
};

// Future methods for protected actions might need to include the token
// const createCar = (carData, token) => {
//   return axios.post(API_URL, carData, { headers: { Authorization: `Bearer ${token}` } });
// };

export default {
  getAllCars,
  getCarById,
  // createCar, // Example for later
};
