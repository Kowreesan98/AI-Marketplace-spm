const express = require('express');
const authMiddleware = require('../middleware/auth');
const { sendMessage, getChatHistory } = require('../controllers/chatController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', sendMessage);
router.get('/:session_id', getChatHistory);

module.exports = router;
