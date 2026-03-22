const express = require('express');
const { getAllAgents, getAgentById } = require('../controllers/agentsController');

const router = express.Router();

router.get('/', getAllAgents);
router.get('/:id', getAgentById);

module.exports = router;
