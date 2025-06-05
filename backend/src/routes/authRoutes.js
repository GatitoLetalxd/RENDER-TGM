const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// Rutas de autenticación
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router; 