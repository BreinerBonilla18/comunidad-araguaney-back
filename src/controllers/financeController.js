import pool from '../db.js';

export const createTransaction = async (req, res) => {
  try {
    const { description, transaction_type, amount, transaction_date } = req.body;

    if (!description || !transaction_type || !amount || !transaction_date) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos (description, transaction_type, amount, transaction_date)',
      });
    }

    if (!['income', 'expense'].includes(transaction_type)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de transacción debe ser "income" (ingreso) o "expense" (egreso)',
      });
    }

    const inserted = await pool.query(
      'INSERT INTO finances (description, transaction_type, amount, transaction_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [description, transaction_type, amount, transaction_date]
    );

    return res.status(201).json({
      success: true,
      message: 'Transacción registrada exitosamente',
      data: inserted.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al registrar la transacción',
    });
  }
};

export const getAllFinances = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, description, transaction_type, amount, transaction_date, created_at
       FROM finances
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      success: true,
      message: 'Finanzas obtenidas exitosamente',
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener las finanzas',
    });
  }
};

export const getFinanceStatistics = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
      FROM finances
    `;

    const result = await pool.query(statsQuery);
    const { total_income, total_expenses } = result.rows[0];
    
    const balance = parseFloat(total_income) - parseFloat(total_expenses);

    return res.status(200).json({
      success: true,
      data: {
        total_income: parseFloat(total_income),
        total_expenses: parseFloat(total_expenses),
        balance: balance
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al obtener las estadísticas financieras',
    });
  }
};
