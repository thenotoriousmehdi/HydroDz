import axios from 'axios';

const api = axios.create({
baseURL: import.meta.env.VITE_PUBLIC_API_BASE_URL ,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    
    console.log('Axios Interceptor Token Check:', {
      tokenExists: !!token,
      url: config.url
    });

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Axios Response Interceptor Error:', {
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/Login';
    }
    return Promise.reject(error);
  }
);

export default api;