import * as userControllers from "./controllers/userController.js";
import * as citizenControllers from "./controllers/citizenController.js";
import * as projectControllers from "./controllers/projectController.js";
import * as documentControllers from "./controllers/documentController.js";
import * as financeControllers from "./controllers/financeController.js";
import * as dashboardControllers from "./controllers/dashboardController.js";
import upload from "./middlewares/uploadMiddleware.js";
import { Router } from 'express';

const router = Router();
// Rutas de Autenticación
router.post('/register-user', userControllers.registerUser);
router.post('/login-user', userControllers.loginUser);
// Dashboard
router.get('/dashboard/stats', dashboardControllers.getDashboardStats);
// Rutas de Registro de Familias
router.get('/family-heads', citizenControllers.getFamilyHeads);
router.get('/members-by-head/:headId', citizenControllers.getMembersByHeadId);
router.get('/citizens', citizenControllers.getAllCitizens);
router.post('/citizens', citizenControllers.createCitizen);
router.put('/citizens/:id', citizenControllers.updateCitizen);
router.delete('/citizens/:id', citizenControllers.deleteCitizen);
router.patch('/citizens/start-session', citizenControllers.startDeliverySession);
router.patch('/citizens/mark-delivered/:id', citizenControllers.markAsDelivered);
router.patch('/citizens/end-session', citizenControllers.endDeliverySession);
// Rutas de Proyectos Comunitarios
router.get('/projects', projectControllers.getProjects);
router.post('/projects', projectControllers.createProject);
router.put('/projects/:id', projectControllers.updateProject);
router.delete('/projects/:id', projectControllers.deleteProject);
// Rutas de Documentos
router.post('/documents', upload.single('file'), documentControllers.createDocument);
router.get('/documents', documentControllers.getDocuments);
router.put('/documents/:id', upload.single('file'), documentControllers.updateDocument);
router.delete('/documents/:id', documentControllers.deleteDocument);
// Rutas de Finanzas
router.post('/finances', financeControllers.createTransaction);
router.get('/finances', financeControllers.getAllFinances);
router.get('/finances/stats', financeControllers.getFinanceStatistics);

export default router;
