import pool from '../db.js';

export const getProjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, status, budget, estimated_cost, start_date, created_at
       FROM community_projects
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      success: true,
      message: 'Proyectos obtenidos exitosamente',
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener los proyectos',
    });
  }
};

export const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      budget,
      estimated_cost,
      start_date,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proyecto es requerido',
      });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Los estados permitidos son: pending, in_progress, completed',
      });
    }

    const result = await pool.query(
      `INSERT INTO community_projects
       (name, description, status, budget, estimated_cost, start_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, status, budget, estimated_cost, start_date, created_at`,
      [
        name,
        description || null,
        status || 'pending',
        budget || 0,
        estimated_cost || 0,
        start_date || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al crear el proyecto',
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      budget,
      estimated_cost,
      start_date,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'id debe ser un número válido',
      });
    }

    const projectExists = await pool.query('SELECT id FROM community_projects WHERE id = $1', [id]);
    if (projectExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado',
      });
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido. Los estados permitidos son: pending, in_progress, completed',
      });
    }

    const result = await pool.query(
      `UPDATE community_projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           budget = COALESCE($4, budget),
           estimated_cost = COALESCE($5, estimated_cost),
           start_date = COALESCE($6, start_date)
       WHERE id = $7
       RETURNING id, name, description, status, budget, estimated_cost, start_date, created_at`,
      [name, description, status, budget, estimated_cost, start_date, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al actualizar el proyecto',
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'id debe ser un número válido',
      });
    }

    const projectExists = await pool.query('SELECT id FROM community_projects WHERE id = $1', [id]);
    if (projectExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado',
      });
    }

    await pool.query('DELETE FROM community_projects WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Proyecto eliminado exitosamente',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al eliminar el proyecto',
    });
  }
};
