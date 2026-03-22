# AI Agent Marketplace — Assignment Analysis & Complete Guide

> **Duration:** 2 Days | **Deadline:** Sunday 11:59 PM | **Delivery:** GitHub Repository | **Level:** Mid-level

---

## What This Assignment Is Really About

You are a **frontend developer moving into full-stack**. The assessors already know your React is strong — they are evaluating whether you can **think full-stack**: structure a backend, wire it to a frontend, and manage state across a session lifecycle.

The last page of the document says it clearly:

> *"You are not expected to finish every requirement. A working agent listing, one fully functional agent chat with session enforcement, and clean backend API design is a strong submission."*

This means **depth beats breadth**. One perfectly working agent chat > five half-broken features.

---

## Evaluation Breakdown

| Criterion | Weight | What They're Looking For |
|-----------|--------|--------------------------|
| Backend design | **30%** | Clean API structure, proper auth, session logic, DB schema |
| Frontend integration | **25%** | Connects to API correctly, manages JWT, handles session state |
| AI integration | **20%** | MiniMax connected, each agent has a unique system prompt |
| AI tooling evidence | **15%** | Proof you used Kilo Code + OpenCode (commit history + README) |
| Delivery | **10%** | On time, clean repo, working README |

**Key insight:** Backend + Frontend together = 55% of your grade. Get those right first.

---

## Required Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React | Your strength — keep UI clean |
| Backend | Node.js + Express | Chosen stack |
| Database | SQLite | Fastest to set up |
| AI | MiniMax API | Different system prompt per agent |
| Auth | JWT | Stored client-side in localStorage |
| Dev tools | Kilo Code + OpenCode | Must show evidence of usage |

---

## The 5 Agents (Pre-built into the Platform)

| Agent | Purpose | Rate | System Prompt Focus |
|-------|---------|------|---------------------|
| PDF Generator | Generates structured PDF content | $2/hr | Format content for PDF with headings and sections |
| Content Writing Companion | Blogs, emails, marketing copy | $3/hr | Tone, audience, CTAs, variations |
| Learn English | Conversational English tutor | $2/hr | Gentle corrections, encouragement, practice |
| Code Reviewer | Reviews code snippets | $4/hr | Bugs, security, performance, best practices |
| Data Summarizer | Summarizes long text/data | $2/hr | Key points, insights, executive summary |

---

## Frontend Requirements (7 Pages/Screens)

### Requirement 1 — Home Page (Agent Grid)
- Display all 5 agents in a grid layout
- Each card shows: agent name, description, hourly rate, Hire button
- Fetches from `GET /agents`
- Hire button redirects to login if not authenticated

### Requirement 2 — Agent Detail Page
- Expanded information about a single agent
- Shows: full description, rate, category
- Has a "Hire this agent" call-to-action button
- Route: `/agent/:id`

### Requirement 3 — Hire Flow
- Step 1: Select number of hours (options + custom input)
- Step 2: Mock payment confirmation screen (no real payment)
- Step 3: Success screen → redirect to workspace
- Creates session via `POST /sessions`

### Requirement 4 — Agent Workspace (Chat UI)
- Full chat interface with message bubbles
- User messages on the right, AI responses on the left
- Sends messages via `POST /chat`
- Loads message history via `GET /chat/:session_id`
- Shows loading state while AI responds

### Requirement 5 — Session Timer
- Visible countdown showing remaining hired time (HH:MM:SS)
- Updates every second (local countdown)
- Syncs with server every ~15 seconds
- Turns red/amber when time is running low
- Disables input when expired

### Requirement 6 — User Dashboard
- Active sessions with "Open workspace" button
- Past (expired) sessions with "Hire again" option
- Basic billing history (total spent, cost per session)
- Stats: total sessions, active count, total spent

### Requirement 7 — Auth Screens
- Login page: email + password
- Signup page: name + email + password
- JWT stored in localStorage after login
- Protected routes redirect unauthenticated users to `/login`

---

## Backend Requirements (6 Endpoints + DB)

### Requirement 8 — Auth API

```
POST /auth/register
  Body:    { name, email, password }
  Returns: { token, user }
  Errors:  400 missing fields | 409 email exists

POST /auth/login
  Body:    { email, password }
  Returns: { token, user }
  Errors:  401 invalid credentials
```

### Requirement 9 — Agents API

```
GET /agents
  Auth:    Not required
  Returns: [ { id, name, description, rate, category, icon } ]

GET /agents/:id
  Auth:    Not required
  Returns: { id, name, description, long_description, rate, category }
```

### Requirement 10 — Sessions API

```
POST /sessions
  Auth:    Required (JWT)
  Body:    { agent_id, duration_hours }
  Returns: { session_id, agent_name, duration_hours, total_cost, start_time }

GET /sessions
  Auth:    Required (JWT)
  Returns: [ all sessions for logged-in user with time remaining ]

GET /sessions/:id
  Auth:    Required (JWT)
  Returns: { session data + remaining_ms + expired: boolean }
```

### Requirement 11 — Chat API

```
POST /chat
  Auth:    Required (JWT)
  Body:    { session_id, message }
  Returns: { reply, remaining_ms, session_id }
  Errors:  403 if session expired (CRITICAL)
           404 if session not found
```

### Requirement 12 — Session Status

```
GET /sessions/:id
  Returns remaining_ms field (milliseconds left in session)
  Frontend uses this to update the countdown timer
```

### Requirement 13 — Session Enforcement (CRITICAL)

```
POST /chat must check:
  1. Does session exist?
  2. Does session belong to this user?
  3. Has session time expired? → return 403 if yes

Logic:
  end_time = start_time + (duration_hours × 3,600,000 ms)
  if Date.now() > end_time → return 403
```

### Requirement 14 — Database Schema

```sql
users
  id INTEGER PRIMARY KEY AUTOINCREMENT
  name TEXT NOT NULL
  email TEXT UNIQUE NOT NULL
  password TEXT NOT NULL  ← bcrypt hashed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP

agents
  id INTEGER PRIMARY KEY AUTOINCREMENT
  name TEXT NOT NULL
  description TEXT NOT NULL
  long_description TEXT NOT NULL
  rate REAL NOT NULL
  category TEXT NOT NULL
  system_prompt TEXT NOT NULL  ← unique per agent
  icon TEXT NOT NULL

sessions
  id INTEGER PRIMARY KEY AUTOINCREMENT
  user_id INTEGER NOT NULL → FOREIGN KEY users(id)
  agent_id INTEGER NOT NULL → FOREIGN KEY agents(id)
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP
  duration_hours REAL NOT NULL
  total_cost REAL NOT NULL

messages
  id INTEGER PRIMARY KEY AUTOINCREMENT
  session_id INTEGER NOT NULL → FOREIGN KEY sessions(id)
  role TEXT NOT NULL  ← 'user' or 'assistant'
  content TEXT NOT NULL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

---

## Stretch Goals (Optional — Do Only If Time Allows)

| Goal | Effort | Value |
|------|--------|-------|
| Streaming responses (SSE) | Medium | Impresses — shows AI knowledge |
| Stripe test mode | Medium | Nice but not critical |
| Agent ratings | Low | Easy win after core is done |
| Usage analytics admin view | High | Skip unless ahead of schedule |

**Recommendation:** Only attempt stretch goals after all 14 core requirements work end-to-end.

---

## Deliverables Checklist

- [ ] GitHub repository with real commit history across both days
- [ ] Working agent listing (Home page loads agents from backend)
- [ ] Hire flow (select hours → confirmation → session created)
- [ ] At least one fully working agent chat with session enforcement
- [ ] All backend endpoints running
- [ ] `README.md` with local setup instructions
- [ ] `.env.example` with all required keys (placeholder values)

---

## 2-Day Execution Plan

### Day 1 — Backend First (Backend = 30% of grade)

| Time | Task |
|------|------|
| Morning (2h) | Project setup, folder structure, Git init, first commit |
| Morning (1.5h) | `database.js` — SQLite schema + seed all 5 agents |
| Afternoon (1h) | Auth endpoints: register, login, JWT |
| Afternoon (1.5h) | Agents + Sessions endpoints |
| Evening (1.5h) | Chat endpoint with MiniMax + 403 enforcement |
| Evening (30min) | Test all endpoints, `.env.example`, commit |

**Day 1 goal:** All 6 backend endpoints working. Test with Postman or curl.

### Day 2 — Frontend (Your strength)

| Time | Task |
|------|------|
| Morning (1h) | React setup, routing, AuthContext, API client |
| Morning (1.5h) | Home page (agent grid) + AgentDetail page |
| Afternoon (1.5h) | HireFlow (hours selector + confirmation screen) |
| Afternoon (2h) | Workspace (chat UI + session countdown timer) |
| Evening (1h) | Dashboard (sessions history + billing) + Auth screens |
| Evening (30min) | README, cleanup, final commits, push |

**Day 2 goal:** Full end-to-end flow working in the browser.

---

## Critical Things That Will Make or Break Your Score

### 1. The 403 Session Enforcement (Most Important Single Feature)
This is explicitly called out in the requirements. Evaluators will test this directly.

```javascript
// In POST /chat — this check must exist
const endTime = new Date(session.start_time).getTime() + session.duration_hours * 3600000;
if (Date.now() > endTime) {
  return res.status(403).json({ error: 'Session expired' });
}
```

### 2. Per-Agent System Prompts
Each agent in the database must have a unique `system_prompt` field. When `POST /chat` is called, the agent's system prompt is sent as the system message to MiniMax. This is what makes AI integration "work" in the evaluators' eyes.

### 3. Commit History Across Both Days
Evaluators check timestamps. Never push all your work in one commit at the end.

**Good commit pattern:**
```
Day 1: feat: initial setup
       feat: database schema and agent seeding
       feat: auth endpoints register and login
       feat: agents and sessions endpoints
       feat: chat endpoint with minimax integration
       feat: session expiry enforcement

Day 2: feat: react routing and auth context
       feat: home page agent grid
       feat: hire flow pages
       feat: workspace chat ui with timer
       feat: dashboard and auth screens
       docs: readme and env example
```

### 4. Mention AI Tooling in README
The 15% AI tooling score requires evidence. Add this to your README:

```markdown
## AI Tooling Used
- **Kilo Code** (VS Code): Used to scaffold Express route handlers,
  JWT middleware structure, and React component boilerplate
- **OpenCode** (terminal): Used to generate the SQLite schema,
  agent seed data, and API response types
```

---

## MiniMax API Integration

### Endpoint
```
POST https://api.minimax.chat/v1/text/chatcompletion_v2
```

### Request Format
```javascript
{
  model: 'abab6.5s-chat',
  messages: [
    { role: 'system', content: agent.system_prompt },  // unique per agent
    { role: 'user',   content: 'user message here' },
    { role: 'assistant', content: 'previous reply' },  // conversation history
    { role: 'user',   content: 'latest message' }
  ],
  max_tokens: 1000,
  temperature: 0.7
}
```

### Headers
```javascript
Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`
Content-Type: application/json
```

### Get the Response
```javascript
const reply = response.data.choices[0].message.content;
```

---

## Environment Variables

### `.env` (backend — never commit this)
```
PORT=5000
JWT_SECRET=any_long_random_string_here
MINIMAX_API_KEY=your_actual_minimax_key
MINIMAX_GROUP_ID=your_minimax_group_id
```

### `.env.example` (commit this to GitHub)
```
PORT=5000
JWT_SECRET=your_jwt_secret_here
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
```

---

## Minimum Viable Submission (Strong Pass)

If you run out of time, this combination is described in the assignment itself as "a strong submission":

1. ✅ Home page showing all 5 agents from the backend
2. ✅ Hire flow (even with just mock payment)
3. ✅ One fully working agent chat (any agent)
4. ✅ Session expiry returns 403
5. ✅ Clean Express API with all endpoints
6. ✅ README + `.env.example`
7. ✅ Commit history across 2 days

Everything else — dashboard, agent detail page, auth screens, stretch goals — is a bonus on top of this.

---

## What "Full-Stack Thinking" Means to the Evaluators

They are not looking for perfect code. They want to see:

- **Backend structure:** Are routes organized cleanly? Is auth separated from business logic? Is the DB schema sensible?
- **Frontend integration:** Does the React app correctly attach the JWT token to requests? Does it handle 401 and 403 responses gracefully?
- **Session lifecycle management:** Does the timer sync with the server? Does the chat UI disable itself when expired? Does the backend actually enforce the expiry?
- **Error handling:** Do API errors show the user a useful message instead of crashing?

These are the things a senior engineer looks for when reviewing a junior-to-mid full-stack submission.
