import * as express from 'express';
import * as controller from '../controller/userSettingsRequest';
import * as verify from '../token/verifyToken';

const router = express.Router();

// ----------- Auth Post Routes -----------
router.post('/userimage/:image', verify.connect, controller.updateUserImage);
router.put('/updatesettings', verify.connect, controller.updateSettings);

// ----------- Auth Get Routes -----------
router.get('/userinfo', verify.connect, controller.getUserInfo);
router.get('/userrole', verify.connect, controller.getUserRole);
router.get('/updaterole/:role', verify.connect, controller.updateRole);
router.get('/getroles/:role/:offset', verify.connect, controller.getRoles);

export default router;