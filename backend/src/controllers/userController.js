const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const getProfile = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT id_usuario, nombre, correo, rol, foto_perfil, fecha_registro FROM Usuario WHERE id_usuario = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    res.json({
      id: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      foto_perfil: user.foto_perfil ? `/uploads/profile/${user.foto_perfil}` : null,
      fecha_registro: user.fecha_registro
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener datos del perfil' });
  } finally {
    connection.release();
  }
};

const updateProfile = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { nombre, correo } = req.body;
    
    // Verificar si el correo ya está en uso por otro usuario
    const [existingUsers] = await connection.execute(
      'SELECT id_usuario FROM Usuario WHERE correo = ? AND id_usuario != ?',
      [correo, req.user.userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El correo ya está en uso' });
    }

    await connection.execute(
      'UPDATE Usuario SET nombre = ?, correo = ? WHERE id_usuario = ?',
      [nombre, correo, req.user.userId]
    );

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  } finally {
    connection.release();
  }
};

const updateProfilePhoto = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }

    // Guardar solo el nombre del archivo en la base de datos
    const fileName = req.file.filename;
    
    // Obtener la foto anterior para borrarla
    const [users] = await connection.execute(
      'SELECT foto_perfil FROM Usuario WHERE id_usuario = ?',
      [req.user.userId]
    );

    // Actualizar la foto en la base de datos
    await connection.execute(
      'UPDATE Usuario SET foto_perfil = ? WHERE id_usuario = ?',
      [fileName, req.user.userId]
    );

    // Si había una foto anterior, intentar borrarla
    if (users[0]?.foto_perfil) {
      try {
        const oldPhotoPath = path.join(__dirname, '../uploads/profile', users[0].foto_perfil);
        await fs.access(oldPhotoPath);
        await fs.unlink(oldPhotoPath);
      } catch (err) {
        console.error('Error o archivo no encontrado al borrar foto anterior:', err);
        // No devolvemos error ya que la actualización fue exitosa
      }
    }

    res.json({ 
      message: 'Foto de perfil actualizada',
      foto_url: `/uploads/profile/${fileName}`
    });
  } catch (error) {
    console.error('Error al actualizar foto:', error);
    res.status(500).json({ 
      message: 'Error al actualizar la foto de perfil',
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

const getAllUsers = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const [users] = await connection.execute(
      'SELECT id_usuario, nombre, correo, rol, fecha_registro FROM Usuario ORDER BY fecha_registro DESC'
    );

    res.json(users);
  } catch (error) {
    console.error('Error al obtener lista de usuarios:', error);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios' });
  } finally {
    connection.release();
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  getAllUsers
}; 