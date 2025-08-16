const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const crypto = require('crypto');
const transporter = require('../config/mail.config');

const register = async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está definido');
      return res.status(500).json({ message: 'Error en la configuración del servidor' });
    }

    const hashedPassword = await bcrypt.hash(contraseña, 10);
    
    console.log('Intentando registrar usuario:', { nombre, correo });
    
    const connection = await pool().getConnection();
    
    try {
      const [result] = await connection.execute(
        'INSERT INTO Usuario (nombre, correo, contraseña) VALUES (?, ?, ?)',
        [nombre, correo, hashedPassword]
      );

      console.log('Usuario insertado con ID:', result.insertId);

      // Get the created user data
      const [users] = await connection.execute(
        'SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE id_usuario = ?',
        [result.insertId]
      );

      if (!users || users.length === 0) {
        console.error('No se pudo obtener los datos del usuario después de la inserción');
        return res.status(500).json({ message: 'Error al crear el usuario' });
      }

      const user = users[0];
      console.log('Datos del usuario recuperados:', user);

      // Create token for the new user
      const token = jwt.sign(
        { 
          userId: user.id_usuario,
          email: user.correo,
          rol: user.rol 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const responseData = { 
        token,
        user: {
          id: user.id_usuario,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol
        }
      };

      console.log('Enviando respuesta:', responseData);
      res.status(201).json(responseData);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error completo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { correo, contraseña } = req.body;
    
    console.log('Intento de login para:', correo);
    
    const [users] = await connection.execute(
      'SELECT id_usuario, nombre, correo, contraseña, rol FROM Usuario WHERE correo = ?',
      [correo]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    console.log('Usuario encontrado:', { 
      id: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol
    });
    
    const validPassword = await bcrypt.compare(contraseña, user.contraseña);

    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Registrar la sesión del usuario
    await connection.execute(
      'INSERT INTO SesionUsuario (id_usuario, ip) VALUES (?, ?)',
      [user.id_usuario, req.ip]
    );

    const tokenPayload = { 
      userId: user.id_usuario, 
      email: user.correo,
      rol: user.rol 
    };
    
    console.log('Generando token con payload:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Verificar el token inmediatamente después de crearlo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verificado:', decoded);

    const responseData = { 
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol
      }
    };

    console.log('Enviando respuesta de login:', { 
      ...responseData, 
      token: 'TOKEN_OCULTO',
      user: {
        ...responseData.user,
        contraseña: undefined
      }
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    connection.release();
  }
};

const forgotPassword = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { correo } = req.body;

    // Verificar si el usuario existe
    const [users] = await connection.execute(
      'SELECT id_usuario FROM Usuario WHERE correo = ?',
      [correo]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'No existe una cuenta con este correo electrónico' });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    // Guardar el token en la base de datos con tiempo de expiración (1 hora)
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora desde ahora
    await connection.execute(
      'UPDATE Usuario SET reset_token = ?, reset_token_expires = ? WHERE correo = ?',
      [resetTokenHash, expiresAt, correo]
    );

    // Enviar correo con el enlace de restablecimiento
    // Detectar la IP del servidor dinámicamente
    const serverIP = req.get('host').split(':')[0];
    const resetUrl = `http://${serverIP}:5173/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Restablecimiento de Contraseña - RENDER-TGM',
      html: `
        <h1>Restablecimiento de Contraseña</h1>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <a href="${resetUrl}">Restablecer Contraseña</a>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Se ha enviado un enlace de restablecimiento a tu correo electrónico' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  } finally {
    connection.release();
  }
};

const resetPassword = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { token, contraseña } = req.body;

    // Buscar usuario con token de restablecimiento válido
    const [users] = await connection.execute(
      'SELECT id_usuario, reset_token, reset_token_expires FROM Usuario WHERE reset_token_expires > NOW()',
    );

    // Buscar el usuario con el token correcto
    let user = null;
    for (const u of users) {
      if (u.reset_token && await bcrypt.compare(token, u.reset_token)) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    await connection.execute(
      'UPDATE Usuario SET contraseña = ?, reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = ?',
      [hashedPassword, user.id_usuario]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  } finally {
    connection.release();
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
}; 