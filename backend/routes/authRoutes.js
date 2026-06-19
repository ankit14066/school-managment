const { login, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginValidation } = require('../validators');

const router = require('express').Router();

router.post('/login', loginValidation, validate, login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
