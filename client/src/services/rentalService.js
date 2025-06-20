import axios from 'axios';

const API_URL = '/api/rentals/';

// Attaches token to request headers
const authHeader = (token) => {
  if (token) {
    return { Authorization: 'Bearer ' + token };
  } else {
    return {};
  }
};

const createRental = (rentalData, token) => {
  return axios.post(API_URL, rentalData, { headers: authHeader(token) });
};

const getRentals = (token) => {
  return axios.get(API_URL, { headers: authHeader(token) });
};

// Example for future: Get specific rental details, might need admin rights or user ownership check
// const getRentalById = (id, token) => {
//   return axios.get(API_URL + id, { headers: authHeader(token) });
// };

export default {
  createRental,
  getRentals,
  // getRentalById,
};
