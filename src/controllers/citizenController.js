import pool from '../db.js';

export const getAllCitizens = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, delivery_status, delivery_quantity, gas_cylinder_number, updated_at
       FROM citizens
       ORDER BY last_name, first_name`
    );

    return res.status(200).json({
      success: true,
      message: 'Ciudadanos obtenidos exitosamente',
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener los ciudadanos',
    });
  }
};

export const getFamilyHeads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, delivery_status, updated_at
       FROM citizens
       WHERE head_of_household_id IS NULL
       ORDER BY last_name, first_name`
    );

    return res.status(200).json({
      success: true,
      message: 'Jefes de familia obtenidos exitosamente',
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener los jefes de familia',
    });
  }
};

export const getMembersByHeadId = async (req, res) => {
  try {
    const { headId } = req.params;

    if (!headId || isNaN(Number(headId))) {
      return res.status(400).json({
        success: false,
        message: 'headId debe ser un número válido',
      });
    }

    const headCheck = await pool.query('SELECT id FROM citizens WHERE id = $1 AND head_of_household_id IS NULL', [headId]);
    if (headCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Jefe de familia no encontrado',
      });
    }

    const membersResult = await pool.query(
      `SELECT id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, updated_at
       FROM citizens
       WHERE head_of_household_id = $1
       ORDER BY birth_date DESC`
    , [headId]);

    return res.status(200).json({
      success: true,
      message: 'Miembros obtenidos exitosamente',
      data: membersResult.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener los miembros del jefe de familia',
    });
  }
};

export const createCitizen = async (req, res) => {
  try {
    const {
      id_number,
      first_name,
      last_name,
      phone_number,
      house_number,
      gender,
      birth_date,
      head_of_household_id,
    } = req.body;

    if (!id_number || !first_name || !last_name || !house_number || !gender || !birth_date) {
      return res.status(400).json({
        success: false,
        message: 'id_number, first_name, last_name, house_number, gender y birth_date son requeridos',
      });
    }

    if (!['M', 'F'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'gender debe ser "M" o "F"',
      });
    }

    const existingIdNumber = await pool.query('SELECT id FROM citizens WHERE id_number = $1', [id_number]);
    if (existingIdNumber.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'El número de identificación ya está registrado',
      });
    }

    if (head_of_household_id) {
      const headCheck = await pool.query(
        'SELECT id FROM citizens WHERE id = $1 AND head_of_household_id IS NULL',
        [head_of_household_id]
      );
      if (headCheck.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'head_of_household_id no es un jefe de familia válido',
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO citizens
       (id_number, first_name, last_name, phone_number, house_number, gender, birth_date, head_of_household_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, head_of_household_id, updated_at`,
      [id_number, first_name, last_name, phone_number, house_number, gender, birth_date, head_of_household_id || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Ciudadano creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al crear el ciudadano',
    });
  }
};

export const updateCitizen = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_number,
      first_name,
      last_name,
      phone_number,
      house_number,
      gender,
      birth_date,
      head_of_household_id,
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'id debe ser un número válido',
      });
    }

    const citizenExists = await pool.query('SELECT id FROM citizens WHERE id = $1', [id]);
    if (citizenExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ciudadano no encontrado',
      });
    }

    if (gender && !['M', 'F'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'gender debe ser "M" o "F"',
      });
    }

    if (head_of_household_id) {
      const headCheck = await pool.query(
        'SELECT id FROM citizens WHERE id = $1 AND head_of_household_id IS NULL AND id != $2',
        [head_of_household_id, id]
      );
      if (headCheck.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'head_of_household_id no es un jefe de familia válido o no puede asignarse a sí mismo',
        });
      }
    }

    const result = await pool.query(
      `UPDATE citizens
       SET id_number = COALESCE($1, id_number),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           phone_number = COALESCE($4, phone_number),
           house_number = COALESCE($5, house_number),
           gender = COALESCE($6, gender),
           birth_date = COALESCE($7, birth_date),
           head_of_household_id = COALESCE($8, head_of_household_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, head_of_household_id, updated_at`,
      [id_number, first_name, last_name, phone_number, house_number, gender, birth_date, head_of_household_id, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Ciudadano actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al actualizar el ciudadano',
    });
  }
};

export const deleteCitizen = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'id debe ser un número válido',
      });
    }

    const citizenExists = await pool.query('SELECT id FROM citizens WHERE id = $1', [id]);
    if (citizenExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ciudadano no encontrado',
      });
    }

    const dependentMembers = await pool.query(
      'SELECT COUNT(*) as count FROM citizens WHERE head_of_household_id = $1',
      [id]
    );
    if (parseInt(dependentMembers.rows[0].count, 10) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un jefe de familia con miembros asociados. Reasigna o elimina a los miembros primero.',
      });
    }

    await pool.query('DELETE FROM citizens WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Ciudadano eliminado exitosamente',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al eliminar el ciudadano',
    });
  }
};

export const startDeliverySession = async (req, res) => {
  try {
    const { event_type } = req.body;

    if (!event_type) {
      return res.status(400).json({
        success: false,
        message: 'event_type es requerido',
      });
    }

    await pool.query(
      `UPDATE citizens 
       SET current_event_type = $1, delivery_status = 'pending' 
       WHERE head_of_household_id IS NULL`,
      [event_type]
    );

    return res.status(200).json({
      success: true,
      message: `Jornada de ${event_type} iniciada exitosamente`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al iniciar la jornada',
    });
  }
};

export const markAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, quantity, cylinder_number } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'id debe ser un número válido',
      });
    }

    const gas_cylinder_number = cylinder_number ? cylinder_number : null;

    const result = await pool.query(
      `UPDATE citizens 
       SET delivery_status = $1,
           delivery_quantity = $2,
           gas_cylinder_number = $3
       WHERE id = $4
       RETURNING id, delivery_status`,
      [status, gas_cylinder_number, quantity, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ciudadano no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Entrega registrada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al registrar la entrega',
    });
  }
};

export const endDeliverySession = async (req, res) => {
  try {
    await pool.query(
      `UPDATE citizens 
       SET delivery_status = 'none', 
           current_event_type = 'NONE',
           delivery_quantity = 0,
           gas_cylinder_number = NULL`
    );

    return res.status(200).json({
      success: true,
      message: 'Jornada finalizada y estados reiniciados',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al finalizar la jornada',
    });
  }
};
