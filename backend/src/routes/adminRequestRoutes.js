const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin, isSuperAdmin } = require('../middlewares/auth');
const adminRequestController = require('../controllers/adminRequestController');

// Ruta para crear una solicitud de admin (cualquier usuario autenticcado)
router.post('/request', authenticateToken, adminRequestController.createAdminRequest);

// Ruta para obtener solicitufdes pendientes (admin y superadmin)
router.get('/pending', authenticateToken, isAdmin, adminRequestController.getPendingRequests);

// Ruta para aprobar/rechazar soliscitudes (admin y superadmin)
router.put('/handle', authenticateToken, isAdmin, adminRequestController.handleAdminRequest);

// Rutas exclusivas para el superadministrador
router.get('/list', authenticateToken, isSuperAdmin, adminRequestController.getAllAdmins);
router.delete('/remove/:adminId', authenticateToken, isSuperAdmin, adminRequestController.removeAdmin);

module.exports = router; 