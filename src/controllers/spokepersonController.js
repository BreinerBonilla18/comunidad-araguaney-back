import pool from "../db.js";

export const getSpokespersons = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.citizen_id, s.rank, s.position, s.created_at, 
              c.id_number, c.first_name, c.last_name
       FROM spokespersons s
       JOIN citizens c ON s.citizen_id = c.id`,
    );

    return res.status(200).json({
      success: true,
      message: "Voceros obtenidos exitosamente",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error in getSpokespersons:", error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al obtener los voceros",
    });
  }
};

export const assignSpokesperson = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, rank } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "El ID del ciudadano debe ser un número válido",
      });
    }

    // Verificar si el ciudadano existe
    const citizenCheck = await pool.query(
      "SELECT id FROM citizens WHERE id = $1",
      [id],
    );

    if (citizenCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ciudadano no encontrado",
      });
    }

    const result = await pool.query(
      `INSERT INTO spokespersons (citizen_id, rank, position)
       VALUES ($1, $2, $3)
       RETURNING id, citizen_id, rank, position, created_at`,
      [id, rank, position],
    );

    return res.status(200).json({
      success: true,
      message: "Vocero creado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error in assignSpokesperson:", error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al crear vocero",
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
        message: "El ID del ciudadano debe ser un número válido",
      });
    }

    // Verificar si el ciudadano existe y si es vocero
    const citizenCheck = await pool.query(
      "SELECT id FROM citizens WHERE id = $1",
      [id],
    );

    if (citizenCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ciudadano no encontrado",
      });
    }

    const result = await pool.query(
      `DELETE FROM spokespersons
       WHERE id = $1
       RETURNING id, citizen_id, rank, position, created_at`,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Vocero removido exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error in removeSpokesperson:", error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al remover el vocero",
    });
  }
};
