import * as userControllers from "./controllers/userController.js";
import * as citizenControllers from "./controllers/citizenController.js";
import * as documentControllers from "./controllers/documentController.js";
import upload from "./middlewares/uploadMiddleware.js";
import { Router } from 'express';
const router = Router();

router.post('/register-user', userControllers.registerUser);
router.post('/login-user', userControllers.loginUser);
router.get('/family-heads', citizenControllers.getFamilyHeads);
router.get('/members-by-head/:headId', citizenControllers.getMembersByHeadId);
router.post('/citizens', citizenControllers.createCitizen);
router.put('/citizens/:id', citizenControllers.updateCitizen);
router.delete('/citizens/:id', citizenControllers.deleteCitizen);

router.post('/documents', upload.single('file'), documentControllers.createDocument);
router.get('/documents', documentControllers.getDocuments);
router.put('/documents/:id', upload.single('file'), documentControllers.updateDocument);
router.delete('/documents/:id', documentControllers.deleteDocument);

export default router;
