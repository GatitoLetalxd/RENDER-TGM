const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isSuperAdmin } = require('../middlewares/auth');
const adminRequestController = require('../controllers/adminRequestController');

// Ruta para crear una solicitud de admin (cualquier usuario autenticado)
router.post('/request', authenticateToken, adminRequestController.createAdminRequest);

// Rutas para admin y superadmin
router.get('/pending', authenticateToken, isAdmin, adminRequestController.getPendingRequests);
router.put('/handle', authenticateToken, isAdmin, adminRequestController.handleAdminRequest);
router.get('/list', authenticateToken, isAdmin, adminRequestController.getAllAdmins);

// Rutas exclusivas para el superadministrador
router.delete('/remove/:adminId', authenticateToken, isSuperAdmin, adminRequestController.removeAdmin);

module.exports = router; 