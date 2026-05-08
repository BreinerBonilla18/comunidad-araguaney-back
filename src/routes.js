import * as userControllers from "./controllers/userController.js";
import * as citizenControllers from "./controllers/citizenController.js";
import * as projectControllers from "./controllers/projectController.js";
import { Router } from 'express';

const router = Router();
// Rutas de Autenticación
router.post('/register-user', userControllers.registerUser);
router.post('/login-user', userControllers.loginUser);
// Rutas de Registro de Familias
router.get('/family-heads', citizenControllers.getFamilyHeads);
router.get('/members-by-head/:headId', citizenControllers.getMembersByHeadId);
router.post('/citizens', citizenControllers.createCitizen);
router.put('/citizens/:id', citizenControllers.updateCitizen);
router.delete('/citizens/:id', citizenControllers.deleteCitizen);
// Rutas de Proyectos Comunitarios
router.get('/projects', projectControllers.getProjects);
router.post('/projects', projectControllers.createProject);
router.put('/projects/:id', projectControllers.updateProject);
router.delete('/projects/:id', projectControllers.deleteProject);
export default router;
