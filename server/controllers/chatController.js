const { dbGet, dbAll, dbRun } = require('../database');

const sendMessage = async (req, res) => {
  try {
    const { session_id, message } = req.body;
    const userId = req.user.id;
    
    if (!session_id || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    const session = await dbGet(`
      SELECT 
        s.*,
        a.name as agent_name,
        a.system_prompt as agent_system_prompt
      FROM sessions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.id = ? AND s.user_id = ?
    `, [session_id, userId]);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const startTime = new Date(session.start_time).getTime();
    const endTime = startTime + (session.duration_hours * 3600000);
    const now = Date.now();
    
    if (now >= endTime) {
      return res.status(403).json({ error: 'Session expired' });
    }
    
    const remainingMs = endTime - now;
    
    const messages = await dbAll(
      'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      [session_id]
    );
    
    await dbRun(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
      [session_id, 'user', message]
    );
    
    const messagesForAI = [
      { role: 'system', content: session.agent_system_prompt }
    ];
    
    messages.forEach(msg => {
      messagesForAI.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    messagesForAI.push({ role: 'user', content: message });
    
    let reply = '';
    try {
      const groupId = process.env.MINIMAX_GROUP_ID;
      const apiUrl = `https://api.minimax.chat/v1/text/chatcompletion_v2${groupId ? `?GroupId=${groupId}` : ''}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'abab6.5s-chat',
          messages: messagesForAI,
          max_tokens: 1000,
          temperature: 0.7
        })
      });
      
      const data = await response.json();

      if (!response.ok) {
        console.error('MiniMax API error response:', JSON.stringify(data));
        throw new Error(`MiniMax API error: ${response.status} - ${data?.base_resp?.status_msg || response.statusText}`);
      }

      if (!data.choices || data.choices.length === 0) {
        console.error('MiniMax unexpected response:', JSON.stringify(data));
        throw new Error('MiniMax returned no choices');
      }

      reply = data.choices[0].message.content;
    } catch (apiError) {
      console.error('MiniMax API error:', apiError);
      reply = 'I apologize, but I encountered an error processing your request. Please try again.';
    }
    
    await dbRun(
      'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
      [session_id, 'assistant', reply]
    );
    
    const finalRemainingMs = Math.max(0, endTime - Date.now());
    
    res.json({
      reply,
      remaining_ms: finalRemainingMs < 0 ? remainingMs : finalRemainingMs,
      session_id
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { session_id } = req.params;
    const userId = req.user.id;
    
    const session = await dbGet(
      'SELECT * FROM sessions WHERE id = ? AND user_id = ?',
      [session_id, userId]
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const messages = await dbAll(
      'SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      [session_id]
    );
    
    const startTime = new Date(session.start_time).getTime();
    const endTime = startTime + (session.duration_hours * 3600000);
    const now = Date.now();
    const remainingMs = Math.max(0, endTime - now);
    const expired = now >= endTime;
    
    res.json({
      session_id,
      messages,
      remaining_ms: remainingMs,
      expired
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
};
