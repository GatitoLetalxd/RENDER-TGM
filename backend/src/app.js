const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { testConnection } = require('./config/database');

const app = express();

// Configuración de CORS simple para desarrollo
app.use(cors({
  origin: true, // Permite todos los orígenes
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware adicional para asegurar los headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Middleware para parsear JSON y urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging con Morgan
app.use(morgan('dev'));

// Directorio para archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Error interno del servidor'
  });
});

// Probar la conexión a la base de datos al iniciar
testConnection()
  .then(() => {
    console.log('Conexión a la base de datos verificada');
  })
  .catch((error) => {
    console.error('Error al verificar la conexión a la base de datos:', error);
  });

module.exports = app; 