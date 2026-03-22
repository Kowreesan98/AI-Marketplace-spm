const { dbGet, dbAll } = require('../database');

const getAllAgents = async (req, res) => {
  try {
    const agents = await dbAll(
      'SELECT id, name, description, rate, category, icon FROM agents'
    );
    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
};

const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await dbGet(
      'SELECT id, name, description, long_description, rate, category, icon FROM agents WHERE id = ?',
      [id]
    );
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json(agent);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
};

module.exports = {
  getAllAgents,
  getAgentById
};
