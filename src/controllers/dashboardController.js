import pool from '../db.js';

export const getDashboardStats = async (req, res) => {
  try {
    const familiesQuery = 'SELECT COUNT(*) as count FROM citizens WHERE head_of_household_id IS NULL';

    const projectsQuery = "SELECT COUNT(*) as count FROM community_projects WHERE status = 'in_progress'";

    const documentsQuery = 'SELECT COUNT(*) as count FROM documents';

    const financeQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0) as balance 
      FROM finances
    `;

    const [familiesRes, projectsRes, documentsRes, financeRes] = await Promise.all([
      pool.query(familiesQuery),
      pool.query(projectsQuery),
      pool.query(documentsQuery),
      pool.query(financeQuery),
    ]);

    const stats = {
      registered_families: parseInt(familiesRes.rows[0].count),
      active_projects: parseInt(projectsRes.rows[0].count),
      stored_documents: parseInt(documentsRes.rows[0].count),
      community_balance: parseFloat(financeRes.rows[0].balance),
    };

    return res.status(200).json({
      success: true,
      message: 'Estadísticas del dashboard obtenidas exitosamente',
      data: stats,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error al procesar las estadísticas',
      error: error.message,
    });
  }
};
