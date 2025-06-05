const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const transporter = require('../config/mail.config');
const pool = require('../database/db');

const passwordResetController = {
  // Solicitar recuperación de contraseña
  requestReset: async (req, res) => {
    try {
      const { email } = req.body;

      // Verificar si el usuario existe
      const [user] = await pool.query('SELECT id, nombre FROM usuarios WHERE email = ?', [email]);
      
      if (user.length === 0) {
        return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
      }

      // Generar token de recuperación (válido por 1 hora)
      const resetToken = jwt.sign(
        { id: user[0].id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Guardar el token en la base de datos
      await pool.query(
        'UPDATE usuarios SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
        [resetToken, user[0].id]
      );

      // Enviar correo con el enlace de recuperación
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Recuperación de Contraseña',
        html: `
          <h1>Recuperación de Contraseña</h1>
          <p>Hola ${user[0].nombre},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <a href="${resetLink}">Restablecer Contraseña</a>
          <p>Este enlace es válido por 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: 'Se ha enviado un enlace de recuperación a tu correo electrónico' });
    } catch (error) {
      console.error('Error en requestReset:', error);
      res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
  },

  // Restablecer contraseña
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Verificar si el token es válido y no ha expirado
      const [user] = await pool.query(
        'SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()',
        [token]
      );

      if (user.length === 0) {
        return res.status(400).json({ message: 'El enlace ha expirado o no es válido' });
      }

      // Encriptar la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Actualizar la contraseña y limpiar el token
      await pool.query(
        'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        [hashedPassword, user[0].id]
      );

      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      console.error('Error en resetPassword:', error);
      res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
  }
};

module.exports = passwordResetController; 