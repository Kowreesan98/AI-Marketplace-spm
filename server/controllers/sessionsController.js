const { dbGet, dbAll, dbRun } = require('../database');

const createSession = async (req, res) => {
  try {
    const { agent_id, duration_hours } = req.body;
    const userId = req.user.id;
    
    if (!agent_id || !duration_hours) {
      return res.status(400).json({ error: 'Agent ID and duration are required' });
    }
    
    const agent = await dbGet('SELECT * FROM agents WHERE id = ?', [agent_id]);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const total_cost = agent.rate * duration_hours;
    
    const result = await dbRun(
      'INSERT INTO sessions (user_id, agent_id, duration_hours, total_cost) VALUES (?, ?, ?, ?)',
      [userId, agent_id, duration_hours, total_cost]
    );
    
    const session = await dbGet(
      'SELECT * FROM sessions WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      session_id: session.id,
      agent_name: agent.name,
      duration_hours: session.duration_hours,
      total_cost: session.total_cost,
      start_time: session.start_time
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

const getAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sessions = await dbAll(`
      SELECT 
        s.*,
        a.name as agent_name,
        a.icon as agent_icon,
        a.category as agent_category
      FROM sessions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.user_id = ?
      ORDER BY s.start_time DESC
    `, [userId]);
    
    const sessionsWithTime = sessions.map(session => {
      const startTime = new Date(session.start_time).getTime();
      const endTime = startTime + (session.duration_hours * 3600000);
      const now = Date.now();
      const remainingMs = Math.max(0, endTime - now);
      const expired = now >= endTime;
      
      return {
        ...session,
        remaining_ms: remainingMs,
        expired
      };
    });
    
    res.json(sessionsWithTime);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const session = await dbGet(`
      SELECT 
        s.*,
        a.name as agent_name,
        a.icon as agent_icon,
        a.category as agent_category,
        a.system_prompt as agent_system_prompt
      FROM sessions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.id = ? AND s.user_id = ?
    `, [id, userId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const startTime = new Date(session.start_time).getTime();
    const endTime = startTime + (session.duration_hours * 3600000);
    const now = Date.now();
    const remainingMs = Math.max(0, endTime - now);
    const expired = now >= endTime;
    
    res.json({
      ...session,
      remaining_ms: remainingMs,
      expired
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

module.exports = {
  createSession,
  getAllSessions,
  getSessionById
};
