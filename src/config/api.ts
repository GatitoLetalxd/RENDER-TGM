import axios from 'axios';

// Configuración robusta del servidor API
const getServerUrl = () => {
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // En producción, usar la IP pública que siempre funciona
  // Esto evita problemas cuando se accede desde diferentes IPs
  return 'http://100.73.162.98:5000';
};

export const SERVER_URL = getServerUrl();

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Enviando solicitud con token:', {
        url: config.url,
        method: config.method,
        headers: {
          ...config.headers,
          Authorization: 'Bearer [OCULTO]'
        }
      });
    } else {
      console.warn('No se encontró token para la solicitud:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Error en interceptor de solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    console.log('Respuesta exitosa:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('Error de respuesta:', {
        url: error.config.url,
        status: error.response.status,
        data: error.response.data
      });
      // El servidor respondió con un código de estado fuera del rango 2xx
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('Error de solicitud:', {
        url: error.config.url,
        error: 'No se recibió respuesta'
      });
      // La solicitud se realizó pero no se recibió respuesta
      return Promise.reject({ message: 'No se pudo conectar con el servidor' });
    } else {
      console.error('Error de configuración:', error);
      // Algo sucedió en la configuración de la solicitud que provocó un error
      return Promise.reject({ message: 'Error al procesar la solicitud' });
    }
  }
);

export default api; 