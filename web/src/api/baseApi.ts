import axios from 'axios';

// Base instance for our primary API
export const baseApi = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    ... (localStorage.getItem("_MOANA_SSN_HASH") ? { 'Authorization': `Bearer ${localStorage.getItem("_MOANA_SSN_HASH")}` } : {}),
    "X-user-id": localStorage.getItem("_MOANA_USER_ID") ?? "NA",
    'Content-Type': 'application/json'
  },


});

 
baseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
        localStorage.removeItem('_MOANA_SSN_HASH');
        localStorage.removeItem("_MOANA_USER_ID")
        console.log("Unauthorized")
        window.location.href = '/auth/login';
        return Promise.reject(new Error('Unauthorized'));
    } else {
      throw error
    }
  }
);
