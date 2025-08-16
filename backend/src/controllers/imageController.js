const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const sharp = require('sharp');

const uploadImage = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }

    const originalPath = req.file.path;
    const fileName = req.file.filename;
    // Construir la ruta relativa para guardar en la base de datos
    const userId = req.user ? req.user.userId : null;
    const relativePath = `uploads/${userId}/${fileName}`;
    
    // Obtener la IP del servidor desde la request
    const serverIP = req.get('host').split(':')[0];
    
    // NO procesar ni guardar en processed al subir
    const [result] = await connection.execute(
      'INSERT INTO Imagen (nombre_archivo, ruta_archivo, id_usuario, fecha_subida) VALUES (?, ?, ?, NOW())',
      [fileName, relativePath, userId]
    );
    
    // Construir la URL completa de la imagen
    const imageUrl = `http://${serverIP}:5000/${relativePath}`;

    res.json({
      message: 'Imagen subida exitosamente',
      data: {
        id: result.insertId,
        nombre_archivo: fileName,
        url: imageUrl
      }
    });

  } catch (error) {
    console.error('Error en uploadImage:', error);
    res.status(500).json({
      message: 'Error al procesar la imagen',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

const getImageResults = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const userId = req.user.userId;
    
    // Obtener todas las imágenes del usuario
    const [images] = await connection.execute(
      `SELECT 
        id_imagen, 
        nombre_archivo, 
        ruta_archivo, 
        fecha_subida, 
        estado,
        procesada,
        ruta_archivo_procesada,
        fecha_procesamiento
      FROM Imagen 
      WHERE id_usuario = ? 
      ORDER BY fecha_subida DESC`,
      [userId]
    );

    // Agregar URL completa para cada imagen
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const imagesWithUrls = images.map(image => ({
      ...image,
      url: `${baseUrl}/${image.ruta_archivo}`,
      url_procesada: image.ruta_archivo_procesada ? `${baseUrl}/${image.ruta_archivo_procesada}` : undefined
    }));

    res.json(imagesWithUrls);
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({ message: 'Error al obtener las imágenes' });
  } finally {
    connection.release();
  }
};

const deleteImage = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { imageId } = req.params;
    const userId = req.user.userId;

    console.log('Eliminando imagen:', { imageId, userId });

    // Obtener las rutas de las imágenes antes de eliminar
    const [images] = await connection.execute(
      'SELECT ruta_archivo, ruta_archivo_procesada FROM Imagen WHERE id_imagen = ? AND id_usuario = ?',
      [imageId, userId]
    );

    if (images.length === 0) {
      console.log('Imagen no encontrada');
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    const image = images[0];
    console.log('Imagen encontrada:', image);

    // Eliminar el registro de la base de datos
    await connection.execute(
      'DELETE FROM Imagen WHERE id_imagen = ? AND id_usuario = ?',
      [imageId, userId]
    );

    // Eliminar los archivos físicos
    const basePath = path.join(__dirname, '..');
    const filesToDelete = [
      image.ruta_archivo ? path.join(basePath, image.ruta_archivo) : null,
      image.ruta_archivo_procesada ? path.join(basePath, image.ruta_archivo_procesada) : null
    ].filter(Boolean);

    console.log('Archivos a eliminar:', filesToDelete);

    for (const filePath of filesToDelete) {
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log('Archivo eliminado:', filePath);
      } catch (error) {
        console.warn('No se pudo eliminar el archivo:', filePath, error.message);
        // Continuamos con la ejecución aunque no se pueda eliminar el archivo
      }
    }

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la imagen:', error);
    res.status(500).json({
      message: 'Error al eliminar la imagen',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Función para procesar imagen usando Python y MBLLEN
const processPythonImage = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/image_processing.py');
    console.log('Ejecutando script Python:', pythonScript);
    console.log('Input:', inputPath);
    console.log('Output:', outputPath);
    
    const process = spawn('python', [pythonScript, inputPath, outputPath]);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('Python stdout:', output);
    });

    process.stderr.on('data', (data) => {
      const error = data.toString();
      stderr += error;
      console.error('Python stderr:', error);
    });

    process.on('close', (code) => {
      console.log(`Proceso Python terminó con código: ${code}`);
      if (code !== 0) {
        reject(new Error(`Python process failed with code ${code}. Error: ${stderr}`));
      } else {
        console.log('Procesamiento Python exitoso');
        resolve(outputPath);
      }
    });

    process.on('error', (error) => {
      console.error('Error al ejecutar Python:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
};

const processImage = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { imageId } = req.params;
    const userId = req.user.userId;

    console.log('Procesando imagen:', { imageId, userId });

    // Verificar que la imagen pertenezca al usuario
    const [images] = await connection.execute(
      'SELECT ruta_archivo, nombre_archivo FROM Imagen WHERE id_imagen = ? AND id_usuario = ?',
      [imageId, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    const image = images[0];
    // Corregir la ruta para apuntar a src/uploads
    const originalPath = path.join(__dirname, '../uploads', userId.toString(), image.nombre_archivo);
    
    console.log('Ruta de imagen original:', originalPath);
    
    // Verificar que el archivo original existe
    try {
      await fs.access(originalPath);
      console.log('Archivo encontrado:', originalPath);
    } catch (error) {
      console.error('Archivo no encontrado:', originalPath);
      return res.status(404).json({ message: 'Archivo de imagen no encontrado' });
    }
    
    // Crear nombre para la imagen procesada
    const ext = path.extname(image.nombre_archivo);
    const processedFileName = `processed_${Date.now()}${ext}`;
    const processedDir = path.join(__dirname, '../uploads', userId.toString(), 'processed');
    await fs.mkdir(processedDir, { recursive: true });
    const processedPath = path.join(processedDir, processedFileName);
    
    console.log('Ruta de imagen procesada:', processedPath);
    
    try {
      // Intentar procesar con ML Python primero
      await processPythonImage(originalPath, processedPath);
      console.log('Imagen procesada exitosamente con ML');
    } catch (mlError) {
      console.warn('Error con ML Python, usando procesamiento básico:', mlError.message);
      // Fallback: usar Sharp para procesamiento básico
      await enhanceImageWithSharp(originalPath, processedPath);
      console.log('Imagen procesada con Sharp (fallback)');
    }
    
    // Construir ruta relativa para la base de datos
    const relativePath = `uploads/${userId}/processed/${processedFileName}`;
    
    // Actualizar la base de datos con la ruta de la imagen procesada
    await connection.execute(
      'UPDATE Imagen SET ruta_archivo_procesada = ?, procesada = TRUE, fecha_procesamiento = NOW() WHERE id_imagen = ?',
      [relativePath, imageId]
    );

    res.json({
      message: 'Imagen procesada exitosamente',
      processedPath: relativePath,
      url_procesada: `/uploads/${userId}/processed/${processedFileName}`
    });
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    res.status(500).json({ 
      message: 'Error al procesar la imagen',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Función mejorada para usar Sharp como fallback
const enhanceImageWithSharp = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .modulate({
        brightness: 1.3,     // Aumentar brillo
        saturation: 1.2,     // Aumentar saturación
        hue: 0               // Sin cambio de matiz
      })
      .normalize()           // Normalizar contraste
      .sharpen()             // Agregar nitidez
      .toFile(outputPath);
    
    console.log('Imagen mejorada con Sharp:', outputPath);
  } catch (error) {
    console.error('Error al mejorar imagen con Sharp:', error);
    throw error;
  }
};

const getImages = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const userId = req.user.userId;
    const [images] = await connection.execute(
      'SELECT * FROM Imagen WHERE id_usuario = ? ORDER BY fecha_subida DESC',
      [userId]
    );
    
    // Obtener la IP del servidor desde la request
    const serverIP = req.get('host').split(':')[0];
    console.log('IP del servidor:', serverIP);
    
    // Construir la URL de la imagen y la procesada
    const imagesWithUrls = images.map(image => {
      // Construir URLs absolutas usando la IP del servidor
      const baseImageUrl = `http://${serverIP}:5000/uploads/${userId}/${image.nombre_archivo}`;
      let processedUrl = null;
      
      if (image.procesada && image.ruta_archivo_procesada) {
        processedUrl = `http://${serverIP}:5000/uploads/${userId}/processed/${path.basename(image.ruta_archivo_procesada)}`;
      }
      
      return {
        ...image,
        url: baseImageUrl,
        url_procesada: processedUrl
      };
    });
    
    console.log('Imágenes enviadas al frontend:', imagesWithUrls.length);
    res.json(imagesWithUrls);
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({ message: 'Error al obtener las imágenes' });
  } finally {
    connection.release();
  }
};

const downloadProcessedImage = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { imageId } = req.params;
    const userId = req.user.userId;

    const [images] = await connection.execute(
      'SELECT ruta_archivo_procesada FROM Imagen WHERE id_imagen = ? AND id_usuario = ? AND procesada = TRUE',
      [imageId, userId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: 'Imagen procesada no encontrada' });
    }

    const imagePath = path.join(__dirname, '../../', images[0].ruta_archivo_procesada);
    res.download(imagePath);
  } catch (error) {
    console.error('Error al descargar imagen:', error);
    res.status(500).json({ message: 'Error al descargar la imagen' });
  } finally {
    connection.release();
  }
};

module.exports = {
  uploadImage,
  getImageResults,
  deleteImage,
  processImage,
  getImages,
  downloadProcessedImage
}; 