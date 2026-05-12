import pool from '../db.js';

export const getSpokespersons = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, delivery_status, is_spokesperson, updated_at
       FROM citizens
       WHERE is_spokesperson = TRUE
       ORDER BY last_name, first_name`
    );

    return res.status(200).json({
      success: true,
      message: 'Voceros obtenidos exitosamente',
      data: result.rows,
    });
  } catch (error) {
    console.error('Error in getSpokespersons:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener los voceros',
    });
  }
};


export const assignSpokesperson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'El ID del ciudadano debe ser un número válido',
      });
    }

    // Verificar si el ciudadano existe
    const citizenCheck = await pool.query('SELECT id, is_spokesperson FROM citizens WHERE id = $1', [id]);
    
    if (citizenCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ciudadano no encontrado',
      });
    }

    if (citizenCheck.rows[0].is_spokesperson) {
      return res.status(400).json({
        success: false,
        message: 'El ciudadano ya es un vocero',
      });
    }

    const result = await pool.query(
      `UPDATE citizens
       SET is_spokesperson = TRUE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, id_number, first_name, last_name, is_spokesperson`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Cargo de vocero asignado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error in assignSpokesperson:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al asignar el cargo de vocero',
    });
  }
};

/**
 * Remueve el cargo de vocero a un ciudadano
 */
export const removeSpokesperson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'El ID del ciudadano debe ser un número válido',
      });
    }

    // Verificar si el ciudadano existe y si es vocero
    const citizenCheck = await pool.query('SELECT id, is_spokesperson FROM citizens WHERE id = $1', [id]);
    
    if (citizenCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ciudadano no encontrado',
      });
    }

    if (!citizenCheck.rows[0].is_spokesperson) {
      return res.status(400).json({
        success: false,
        message: 'El ciudadano no tiene el cargo de vocero',
      });
    }

    const result = await pool.query(
      `UPDATE citizens
       SET is_spokesperson = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, id_number, first_name, last_name, is_spokesperson`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Cargo de vocero removido exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error in removeSpokesperson:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al remover el cargo de vocero',
    });
  }
};
