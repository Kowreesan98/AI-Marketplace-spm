# AI Agent Marketplace

A full-stack AI agent marketplace application where users can hire specialized AI agents for various tasks. Built with React (frontend) and Node.js/Express (backend).

## Features

- **Agent Listing**: Browse 5 pre-built AI agents with different specializations
- **Agent Details**: View detailed information about each agent
- **Hire Flow**: Select hours, mock payment, and create sessions
- **Chat Workspace**: Real-time chat with AI agents
- **Session Timer**: Countdown timer showing remaining hired time
- **Session Enforcement**: Backend enforces session expiry (403)
- **User Dashboard**: View active and past sessions, billing history
- **Authentication**: JWT-based auth with register/login

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 |
| Backend | Node.js + Express |
| Database | SQLite |
| Auth | JWT |
| AI | MiniMax API |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env**
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret_here
   MINIMAX_API_KEY=your_minimax_api_key_here
   MINIMAX_GROUP_ID=your_minimax_group_id_here
   ```

5. **Install frontend dependencies**
   ```bash
   cd client && npm install
   ```

### Running the Application

**Terminal 1 - Backend**
```bash
npm run dev
```
Server runs on http://localhost:5000

**Terminal 2 - Frontend**
```bash
npm run client
```
Client runs on http://localhost:3000

### Testing the Flow

1. Open http://localhost:3000
2. Sign up for a new account
3. Browse agents on the home page
4. Click on an agent to view details
5. Click "Hire this Agent"
6. Select hours and confirm (mock payment)
7. Start chatting with the AI agent

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Agents
- `GET /agents` - List all agents (public)
- `GET /agents/:id` - Get agent details (public)

### Sessions
- `POST /sessions` - Create new session (requires auth)
- `GET /sessions` - Get user's sessions (requires auth)
- `GET /sessions/:id` - Get session details (requires auth)

### Chat
- `POST /chat` - Send message (requires auth)
- `GET /chat/:session_id` - Get chat history (requires auth)

## The 5 AI Agents

| Agent | Rate | Purpose |
|-------|------|---------|
| PDF Generator | $2/hr | Generates structured PDF content |
| Content Writing | $3/hr | Blogs, emails, marketing copy |
| Learn English | $2/hr | Conversational English tutor |
| Code Reviewer | $4/hr | Code review for bugs and best practices |
| Data Summarizer | $2/hr | Summarizes long text and data |

## Session Expiry Enforcement

The backend enforces session expiry. When a session expires:
- `POST /chat` returns 403 status
- Frontend disables input and shows "Session expired"
- Timer turns red when time is low

## AI Tooling Used

- **Kilo Code** (VS Code): Used to scaffold Express route handlers, JWT middleware structure, and React component boilerplate
- **OpenCode** (terminal): Used to generate the SQLite schema, agent seed data, and API response types

## Project Structure

```
├── server/
│   ├── index.js          # Express server entry
│   ├── database.js       # SQLite setup and seed
│   ├── middleware/
│   │   └── auth.js       # JWT authentication
│   └── routes/
│       ├── auth.js       # Register, login
│       ├── agents.js     # Agent endpoints
│       ├── sessions.js   # Session management
│       └── chat.js       # Chat with AI
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js      # React entry
│   │   ├── App.js        # Main app with routing
│   │   ├── App.css       # Styles
│   │   ├── api.js       # API client
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── components/
│   │   │   └── Navbar.js
│   │   └── pages/
│   │       ├── Home.js
│   │       ├── AgentDetail.js
│   │       ├── HireFlow.js
│   │       ├── Workspace.js
│   │       ├── Dashboard.js
│   │       ├── Login.js
│   │       └── Signup.js
│   └── package.json
├── package.json
├── .env.example
└── README.md
```

## License

MIT
