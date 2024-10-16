import axios from 'axios';

// Base instance for our primary API
export const baseApi = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    ... (localStorage.getItem("_MOANA_SSN_HASH") ? { 'Authorization': `Bearer ${localStorage.getItem("_MOANA_SSN_HASH")}` } : {}),
    'Content-Type': 'application/json'
  }
});
