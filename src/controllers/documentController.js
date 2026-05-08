import pool from '../db.js';

export const createDocument = async (req, res) => {
  try {
    const { title, document_date } = req.body;
    const file = req.file;

    if (!title || !document_date || !file) {
      return res.status(400).json({
        success: false,
        message: 'title, document_date y el archivo (file) son requeridos',
      });
    }

    // Obtener la extensión del archivo para guardarla en la base de datos (e.g. 'pdf', 'docx')
    const fileExtension = file.originalname.split('.').pop().substring(0, 20);
    const file_type = fileExtension ? fileExtension.toUpperCase() : 'UNKNOWN';
    const file_path = `archives/${file.filename}`;

    const inserted = await pool.query(
      'INSERT INTO documents (title, file_type, file_path, document_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, file_type, file_path, document_date]
    );

    return res.status(201).json({
      success: true,
      message: 'Documento creado exitosamente',
      data: inserted.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al crear el documento',
    });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener los documentos',
    });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, document_date } = req.body;
    
    // Validar existencia del documento
    const existing = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
      });
    }

    let { file_type, file_path } = existing.rows[0];
    const file = req.file;

    // Si se subió un nuevo archivo, actualizar file_type y file_path
    if (file) {
      const fileExtension = file.originalname.split('.').pop().substring(0, 20);
      file_type = fileExtension ? fileExtension.toUpperCase() : 'UNKNOWN';
      file_path = `archives/${file.filename}`;
    }

    // Actualizar campos (si no se envían, se mantienen los existentes)
    const newTitle = title || existing.rows[0].title;
    const newDate = document_date || existing.rows[0].document_date;

    const updated = await pool.query(
      'UPDATE documents SET title = $1, file_type = $2, file_path = $3, document_date = $4 WHERE id = $5 RETURNING *',
      [newTitle, file_type, file_path, newDate, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Documento actualizado exitosamente',
      data: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al actualizar el documento',
    });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
      });
    }

    await pool.query('DELETE FROM documents WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Documento eliminado exitosamente',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al eliminar el documento',
    });
  }
};
