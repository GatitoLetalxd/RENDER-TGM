const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImage, getImageResults, deleteImage, processImage, getImages, downloadProcessedImage } = require('../controllers/imageController');
const { authenticateToken } = require('../middlewares/auth');

// Asegurar que existan los directorios necesarios
const dirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/users'),
  path.join(__dirname, '../uploads/temp'),
  path.join(__dirname, '../uploads/processed')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user.userId;
    const userDir = path.join(__dirname, '../uploads', userId.toString());
    const processedDir = path.join(userDir, 'processed');
    // Crear los directorios si no existen
    fs.mkdirSync(userDir, { recursive: true });
    fs.mkdirSync(processedDir, { recursive: true });
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user.userId;
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    // Nombre: userId_timestamp.ext
    cb(null, `${userId}_${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Validar tipo de archivo
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif)'));
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Rutas protegidas
router.use(authenticateToken);

// Ruta para obtener todas las imágenes del usuario
router.get('/', getImages);

// Ruta para subir imagen
router.post('/upload', upload.single('image'), uploadImage);

// Ruta para obtener resultados de imágenes
router.get('/results', getImageResults);

// Ruta para eliminar una imagen
router.delete('/:imageId', deleteImage);

// Ruta para procesar una imagen
router.post('/:imageId/process', processImage);

// Ruta para descargar una imagen procesada
router.get('/:imageId/download', downloadProcessedImage);

// Manejo de errores de multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo excede el tamaño máximo permitido (5MB)' });
    }
    return res.status(400).json({ message: 'Error al subir el archivo' });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router; 