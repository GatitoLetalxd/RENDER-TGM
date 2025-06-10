const { pool } = require('../config/database');

const searchUsers = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const { query } = req.query;
    const userId = req.user.userId;

    // Buscar usuarios que coincidan con la búsqueda, excluyendo al usuario actual
    const [users] = await connection.execute(
      `SELECT u.id_usuario, u.nombre, u.foto_perfil,
        CASE
          WHEN a.estado IS NOT NULL THEN a.estado
          ELSE NULL
        END as estado
      FROM Usuario u
      LEFT JOIN Amigos a ON (a.usuario_id = ? AND a.amigo_id = u.id_usuario)
        OR (a.amigo_id = ? AND a.usuario_id = u.id_usuario)
      WHERE u.id_usuario != ? AND u.nombre LIKE ?
      LIMIT 10`,
      [userId, userId, userId, `%${query}%`]
    );

    res.json(users);
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ message: 'Error al buscar usuarios' });
  } finally {
    connection.release();
  }
};

const getFriends = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const userId = req.user.userId;

    const [friends] = await connection.execute(
      `SELECT u.id_usuario, u.nombre, u.foto_perfil
      FROM Usuario u
      INNER JOIN Amigos a ON (a.usuario_id = ? AND a.amigo_id = u.id_usuario)
        OR (a.amigo_id = ? AND a.usuario_id = u.id_usuario)
      WHERE a.estado = 'aceptado'`,
      [userId, userId]
    );

    res.json(friends);
  } catch (error) {
    console.error('Error al obtener amigos:', error);
    res.status(500).json({ message: 'Error al obtener amigos' });
  } finally {
    connection.release();
  }
};

const getPendingRequests = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const userId = req.user.userId;

    const [requests] = await connection.execute(
      `SELECT u.id_usuario, u.nombre, u.foto_perfil
      FROM Usuario u
      INNER JOIN Amigos a ON a.usuario_id = u.id_usuario
      WHERE a.amigo_id = ? AND a.estado = 'pendiente'`,
      [userId]
    );

    res.json(requests);
  } catch (error) {
    console.error('Error al obtener solicitudes pendientes:', error);
    res.status(500).json({ message: 'Error al obtener solicitudes pendientes' });
  } finally {
    connection.release();
  }
};

const sendFriendRequest = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    // Verificar si ya existe una solicitud
    const [existing] = await connection.execute(
      'SELECT * FROM Amigos WHERE (usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?)',
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya existe una solicitud de amistad' });
    }

    await connection.execute(
      'INSERT INTO Amigos (usuario_id, amigo_id, estado) VALUES (?, ?, "pendiente")',
      [userId, friendId]
    );

    res.json({ message: 'Solicitud enviada correctamente' });
  } catch (error) {
    console.error('Error al enviar solicitud:', error);
    res.status(500).json({ message: 'Error al enviar solicitud' });
  } finally {
    connection.release();
  }
};

const acceptFriendRequest = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    await connection.execute(
      'UPDATE Amigos SET estado = "aceptado" WHERE usuario_id = ? AND amigo_id = ? AND estado = "pendiente"',
      [friendId, userId]
    );

    res.json({ message: 'Solicitud aceptada' });
  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    res.status(500).json({ message: 'Error al aceptar solicitud' });
  } finally {
    connection.release();
  }
};

const rejectFriendRequest = async (req, res) => {
  const connection = await pool().getConnection();
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    await connection.execute(
      'UPDATE Amigos SET estado = "rechazado" WHERE usuario_id = ? AND amigo_id = ? AND estado = "pendiente"',
      [friendId, userId]
    );

    res.json({ message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    res.status(500).json({ message: 'Error al rechazar solicitud' });
  } finally {
    connection.release();
  }
};

module.exports = {
  searchUsers,
  getFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
}; 