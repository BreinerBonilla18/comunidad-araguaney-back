import pool from "../db.js";

export const getAllCitizens = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, delivery_status, updated_at
       FROM citizens
       ORDER BY last_name, first_name`,
    );

    return res.status(200).json({
      success: true,
      message: "Ciudadanos obtenidos exitosamente",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al obtener los ciudadanos",
    });
  }
};

export const getFamilyHeads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        cit.id, 
        cit.id_number, 
        cit.first_name, 
        cit.last_name, 
        cit.phone_number, 
        cit.house_number, 
        cit.gender, 
        cit.birth_date, 
        cit.delivery_status, 
        cit.current_event_type,
        cit.updated_at,
        COALESCE(
          json_agg(
            json_build_object('cylinder_code', gas.cylinder_code, 'weight_kg', gas.weight_kg)
          ) FILTER (WHERE gas.id IS NOT NULL), '[]'
        ) AS cylinders
       FROM citizens AS cit
       LEFT JOIN current_delivery_gas AS gas ON cit.id = gas.head_of_household_id
       WHERE cit.head_of_household_id IS NULL
       GROUP BY cit.id
       ORDER BY cit.last_name, cit.first_name`
    );

    return res.status(200).json({
      success: true,
      message: "Jefes de familia obtenidos exitosamente",
      data: result.rows, // Ahora cada jefe vendrá con una propiedad "cylinders: [...]"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al obtener los jefes de familia",
    });
  }
};

export const getMembersByHeadId = async (req, res) => {
  try {
    const { headId } = req.params;

    if (!headId || isNaN(Number(headId))) {
      return res.status(400).json({
        success: false,
        message: "headId debe ser un número válido",
      });
    }

    const headCheck = await pool.query(
      "SELECT id FROM citizens WHERE id = $1 AND head_of_household_id IS NULL",
      [headId],
    );
    if (headCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Jefe de familia no encontrado",
      });
    }

    const membersResult = await pool.query(
      `SELECT id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, updated_at
       FROM citizens
       WHERE head_of_household_id = $1
       ORDER BY birth_date DESC`,
      [headId],
    );

    return res.status(200).json({
      success: true,
      message: "Miembros obtenidos exitosamente",
      data: membersResult.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al obtener los miembros del jefe de familia",
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

    if (
      !id_number ||
      !first_name ||
      !last_name ||
      !house_number ||
      !gender ||
      !birth_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "id_number, first_name, last_name, house_number, gender y birth_date son requeridos",
      });
    }

    if (!["M", "F"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'gender debe ser "M" o "F"',
      });
    }

    const existingIdNumber = await pool.query(
      "SELECT id FROM citizens WHERE id_number = $1",
      [id_number],
    );
    if (existingIdNumber.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: "El número de identificación ya está registrado",
      });
    }

    if (head_of_household_id) {
      const headCheck = await pool.query(
        "SELECT id FROM citizens WHERE id = $1 AND head_of_household_id IS NULL",
        [head_of_household_id],
      );
      if (headCheck.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: "head_of_household_id no es un jefe de familia válido",
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO citizens
       (id_number, first_name, last_name, phone_number, house_number, gender, birth_date, head_of_household_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, id_number, first_name, last_name, phone_number, house_number, gender, birth_date, head_of_household_id, updated_at`,
      [
        id_number,
        first_name,
        last_name,
        phone_number,
        house_number,
        gender,
        birth_date,
        head_of_household_id || null,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Ciudadano creado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al crear el ciudadano",
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
        message: "id debe ser un número válido",
      });
    }

    const citizenExists = await pool.query(
      "SELECT id FROM citizens WHERE id = $1",
      [id],
    );
    if (citizenExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ciudadano no encontrado",
      });
    }

    if (gender && !["M", "F"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'gender debe ser "M" o "F"',
      });
    }

    if (head_of_household_id) {
      const headCheck = await pool.query(
        "SELECT id FROM citizens WHERE id = $1 AND head_of_household_id IS NULL AND id != $2",
        [head_of_household_id, id],
      );
      if (headCheck.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message:
            "head_of_household_id no es un jefe de familia válido o no puede asignarse a sí mismo",
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
      [
        id_number,
        first_name,
        last_name,
        phone_number,
        house_number,
        gender,
        birth_date,
        head_of_household_id,
        id,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Ciudadano actualizado exitosamente",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al actualizar el ciudadano",
    });
  }
};

export const deleteCitizen = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "id debe ser un número válido",
      });
    }

    const citizenExists = await pool.query(
      "SELECT id FROM citizens WHERE id = $1",
      [id],
    );
    if (citizenExists.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ciudadano no encontrado",
      });
    }

    const dependentMembers = await pool.query(
      "SELECT COUNT(*) as count FROM citizens WHERE head_of_household_id = $1",
      [id],
    );
    if (parseInt(dependentMembers.rows[0].count, 10) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar un jefe de familia con miembros asociados. Reasigna o elimina a los miembros primero.",
      });
    }

    await pool.query("DELETE FROM citizens WHERE id = $1", [id]);

    return res.status(200).json({
      success: true,
      message: "Ciudadano eliminado exitosamente",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al eliminar el ciudadano",
    });
  }
};

export const startDeliverySession = async (req, res) => {
  try {
    const { event_type } = req.body;

    if (!event_type) {
      return res.status(400).json({
        success: false,
        message: "event_type es requerido",
      });
    }

    await pool.query(
      `UPDATE citizens 
       SET current_event_type = $1, delivery_status = 'pending' 
       WHERE head_of_household_id IS NULL`,
      [event_type],
    );

    return res.status(200).json({
      success: true,
      message: `Jornada de ${event_type} iniciada exitosamente`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al iniciar la jornada",
    });
  }
};

export const markAsDelivered = async (req, res) => {
  const { id } = req.params;
  const { status, event_type, cylinders, quantity } = req.body;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: "id debe ser un número válido",
    });
  }

  if (status === 'delivered' && event_type === 'Gas Comunal' && (!Array.isArray(cylinders) || cylinders.length === 0)) {
    return res.status(400).json({
      success: false,
      message: "Para registrar entregas de gas se requiere al menos un cilindro con su código",
    });
  }

  const quantityValue = quantity != null ? Number(quantity) : null;
  const isGasEvent = event_type === 'Gas Comunal';
  const isClapEvent = event_type && event_type.toLowerCase().includes('clap');

  const client = await pool.connect(); 

  try {
    await client.query("BEGIN");

    const citizenResult = await client.query(
      `UPDATE citizens 
       SET delivery_status = $1
       WHERE id = $2
       RETURNING id, delivery_status`,
      [status, id]
    );

    if (citizenResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Ciudadano no encontrado",
      });
    }

    if (status === 'pending' && !event_type && !cylinders) {
      await client.query(
        "DELETE FROM current_delivery_gas WHERE head_of_household_id = $1",
        [id],
      );
    }

    if (isGasEvent || isClapEvent) {
      const quantityColumn = isGasEvent ? 'gas_quantity' : 'clap_quantity';
      await client.query(
        `UPDATE citizens SET ${quantityColumn} = $1 WHERE id = $2`,
        [quantityValue, id],
      );
    }

    if (status === 'delivered' && event_type === 'Gas Comunal' && cylinders) {
      for (const cyl of cylinders) {

        if (!cyl.cylinder_code) {
          throw new Error("Estructura de cilindro inválida");
        }
        await client.query(
          `INSERT INTO current_delivery_gas (head_of_household_id, cylinder_code, weight_kg)
           VALUES ($1, $2, $3)`,
          [id, cyl.cylinder_code, cyl.weight_kg.toString() || "10"]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Entrega registrada exitosamente",
      data: citizenResult.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al registrar la entrega",
    });
  } finally {
    client.release(); 
  }
};

export const endDeliverySession = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE citizens 
       SET delivery_status = 'none', 
           current_event_type = 'NONE'`
    );

    await client.query("TRUNCATE TABLE current_delivery_gas RESTART IDENTITY");

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Jornada finalizada, estados reiniciados y registros de cilindros purgados.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al finalizar la jornada",
    });
  } finally {
    client.release();
  }
};
