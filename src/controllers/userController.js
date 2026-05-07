import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../db.js';

export const registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username y password son requeridos',
      });
    }

    const normalizedUsername = String(username).trim();
    if (!normalizedUsername) {
      return res.status(400).json({
        success: false,
        message: 'username no puede estar vacío',
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [normalizedUsername],
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'El username ya está registrado',
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const inserted = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
      [normalizedUsername, hashedPassword],
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: inserted.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al registrar el usuario',
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username y password son requeridos',
      });
    }

    const normalizedUsername = String(username).trim();
    if (!normalizedUsername) {
      return res.status(400).json({
        success: false,
        message: 'username no puede estar vacío',
      });
    }

    const result = await pool.query(
      'SELECT id, username, password, created_at FROM users WHERE username = $1',
      [normalizedUsername],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(String(password), user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET no está configurado en el servidor',
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al iniciar sesión',
    });
  }
};
