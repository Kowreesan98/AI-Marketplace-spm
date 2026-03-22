const express = require('express');
const authMiddleware = require('../middleware/auth');
const { createSession, getAllSessions, getSessionById } = require('../controllers/sessionsController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createSession);
router.get('/', getAllSessions);
router.get('/:id', getSessionById);

module.exports = router;
