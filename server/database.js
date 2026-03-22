const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'marketplace.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Agents table
      db.run(`
        CREATE TABLE IF NOT EXISTS agents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          long_description TEXT NOT NULL,
          rate REAL NOT NULL,
          category TEXT NOT NULL,
          system_prompt TEXT NOT NULL,
          icon TEXT NOT NULL
        )
      `);

      // Sessions table
      db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          agent_id INTEGER NOT NULL,
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          duration_hours REAL NOT NULL,
          total_cost REAL NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (agent_id) REFERENCES agents(id)
        )
      `);

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `);

      // Payments table
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          session_id INTEGER,
          stripe_payment_intent_id TEXT UNIQUE,
          stripe_customer_id TEXT,
          amount REAL NOT NULL,
          currency TEXT DEFAULT 'usd',
          status TEXT DEFAULT 'pending',
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          // Seed agents after table creation
          seedAgents().then(resolve).catch(reject);
        }
      });
    });
  });
};

// Seed 5 agents
const seedAgents = () => {
  return new Promise((resolve, reject) => {
    const agents = [
      {
        name: 'PDF Generator',
        description: 'Generates structured PDF content with proper formatting',
        long_description: 'The PDF Generator agent helps you create professional PDF documents with proper headings, sections, tables, and formatting. Perfect for reports, invoices, and documentation.',
        rate: 2,
        category: 'Productivity',
        system_prompt: 'You are a PDF content generator. Your role is to structure content for PDF documents with clear headings (H1, H2, H3), organized sections, tables where appropriate, and professional formatting. Always use proper PDF markup conventions.',
        icon: '📄'
      },
      {
        name: 'Content Writing Companion',
        description: 'Blogs, emails, marketing copy, and content creation',
        long_description: 'Your personal writing assistant for all content needs. From engaging blog posts to persuasive marketing copy, this agent helps you create compelling content that resonates with your audience.',
        rate: 3,
        category: 'Writing',
        system_prompt: 'You are a content writing companion. You help with blogs, emails, marketing copy, and various content types. Focus on tone, audience engagement, clear CTAs, and provide multiple variations when appropriate. Be creative and persuasive.',
        icon: '✍️'
      },
      {
        name: 'Learn English',
        description: 'Conversational English tutor with corrections and practice',
        long_description: 'Practice your English conversation skills with a patient tutor who provides gentle corrections, encouragement, and structured practice sessions tailored to your level.',
        rate: 2,
        category: 'Education',
        system_prompt: 'You are a conversational English tutor. Provide gentle corrections to grammar and vocabulary, offer encouragement, and create practice scenarios. Be patient, supportive, and focus on helping the learner improve naturally.',
        icon: '🎓'
      },
      {
        name: 'Code Reviewer',
        description: 'Reviews code snippets for bugs, security, and best practices',
        long_description: 'Get expert code reviews that identify bugs, security vulnerabilities, performance issues, and suggest best practices. Support for multiple programming languages.',
        rate: 4,
        category: 'Development',
        system_prompt: 'You are a code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and best practices. Provide clear, actionable feedback with code examples when possible. Be thorough but constructive.',
        icon: '🔍'
      },
      {
        name: 'Data Summarizer',
        description: 'Summarizes long text and data into key insights',
        long_description: 'Transform lengthy documents, articles, and data into concise, actionable summaries. Perfect for executive briefings, research papers, and information extraction.',
        rate: 2,
        category: 'Productivity',
        system_prompt: 'You are a data summarizer. Extract key points, main insights, and create executive summaries from lengthy content. Focus on the most important information and present it clearly and concisely.',
        icon: '📊'
      }
    ];

    // Check if agents already exist
    db.get('SELECT COUNT(*) as count FROM agents', (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count === 0) {
        const stmt = db.prepare(`
          INSERT INTO agents (name, description, long_description, rate, category, system_prompt, icon)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        agents.forEach(agent => {
          stmt.run(
            agent.name,
            agent.description,
            agent.long_description,
            agent.rate,
            agent.category,
            agent.system_prompt,
            agent.icon
          );
        });

        stmt.finalize((err) => {
          if (err) reject(err);
          else {
            console.log('✓ Seeded 5 agents');
            resolve();
          }
        });
      } else {
        console.log('✓ Agents already seeded');
        resolve();
      }
    });
  });
};

// Database helper functions
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  initializeDatabase,
  dbRun,
  dbGet,
  dbAll
};
