Project Overview & Tech Stack
Project Overview
Build a full-stack AI Operations Automation Platform called Agentic AI Automation Platform (Agentflow_AI) that lets operators describe an automation in natural language and turn it into an executable visual workflow. The platform must generate workflow graphs from prompts, render those graphs on a drag-and-drop canvas, execute them through a chain of cooperating AI agents, integrate with real third-party tools (Gmail, Slack, Discord, Google Sheets) over OAuth, queue and retry background jobs, stream live execution events to the browser, and persist a full timeline of every step for auditing.
Tech Stack
Frontend: Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, React Flow (@xyflow/react), Socket.IO client, and lucide-react icons.
Backend: Node.js, Express, MongoDB, Mongoose, JSON Web Tokens, BullMQ on Redis (via ioredis), Socket.IO, helmet, morgan, compression, express-validator, and bcryptjs.
AI Integration: OpenRouter API and Google Generative AI SDK, with LangChain and LangGraph available for agentic orchestration.
Integrations: OAuth and bot integrations covering Gmail, Slack, Discord, and Google Sheets. Sensitive credentials are encrypted at rest with an application-level key.
Authentication, Workflows, and Agentic Orchestration
Authentication
The authentication system must support registration, login, JWT-based session handling, protected routes, an /auth/me profile endpoint, role separation between admin and operator, password hashing with bcrypt at cost factor 12, and persistent login state on the client through Zustand.
Workflow Management
Users must be able to create workflows manually, generate workflows from a natural-language prompt, list and search their workflows, open any workflow on a React Flow canvas, drag nodes from a palette, configure each node through a side panel, save, duplicate, version, and delete workflows, and trigger executions on demand. Every workflow stores its nodes, edges, trigger configuration, tags, and version number.
Agentic Orchestration
For agentic execution, the backend must run each workflow through a fixed chain of agents:
Planner Agent: Decides node ordering and emits a confidence score.
Execution Agent: Runs each node against the correct integration or AI provider.
Validation Agent: Verifies required output fields.
Recovery Agent: Classifies failures (MISSING_FIELDS, API_FAILURE, AUTH_EXPIRED, RATE_LIMIT, TRANSIENT) and decides between retry_with_backoff and escalate.
Monitoring Agent: Emits timeline events.
LangGraph must be importable as the orchestration substrate, and the orchestrator must report langGraph: 'available' | 'not-installed' with each run.
Integrations, Executions, AI Generation, and Real-Time Layer
Third-Party Integrations
The integrations layer must support Gmail (send/read mail), Slack (post messages/subscribe to events), Discord (post bot messages), and Google Sheets (append rows/read ranges). Each provider must support an OAuth start endpoint, an OAuth callback endpoint, and a connected/disconnected status. Access tokens and refresh tokens must be encrypted at rest using CREDENTIAL_ENCRYPTION_KEY. The connection state must be visible from the integrations page, and a missing or expired credential must surface as a clear INTEGRATION_NOT_CONNECTED or AUTH_EXPIRED error in the execution timeline rather than a silent failure.
Execution Engine
The backend must persist every run as an Execution document with one of PENDING, RUNNING, COMPLETED, FAILED, RETRYING, PAUSED, or CANCELLED status, record the workflow snapshot at runtime, capture input, output, error, duration, and retry count, and write one ExecutionLog row per agent event. Users must be able to pause, resume, and cancel a running execution. BullMQ on Redis must handle background scheduling and retry backoff, with an in-memory fallback when Redis is not configured.
AI Workflow Generation
When a user submits a prompt, the system must return a complete workflow with named nodes, positions, edges, and per-node configuration. The generator must prefer OpenRouter when OPENROUTER_API_KEY is set, fall back to Google Gemini when GEMINI_API_KEY is set, and fall back to a deterministic rule-based builder when neither is available. The deterministic builder must still produce a runnable graph for common prompts (send email, invoice routing, Slack/Discord notification, sheet append).
Real-Time Layer
The Socket.IO server must broadcast agent events (planner, execution, validation, recovery, monitoring) for each execution to subscribed clients, and the client must render those events as a live timeline. Notifications generated during execution (success, failure, escalation) must persist and appear in a notifications drawer.
Frontend Pages
The application uses the Next.js Pages Router. The root / page redirects authenticated users to the dashboard and unauthenticated users to login.
/ – Landing page featuring platform introduction, multi-agent orchestration showcase, CTA buttons, and responsive layout with dark theme support.
/login – Form for email/password authentication with JWT handling, Zustand persistence, validation, and error states.
/register – Form for user registration with password validation, session persistence, and error handling.
/dashboard – Operator console with workflow metrics (MetricGrid), active workflow statistics, recent execution summaries, success rate indicators, AI activity feed, and real-time execution panels (AppShell layout).
/workflows/builder – Prompt-to-workflow generation page featuring PromptInputPanel, GraphPreviewPanel, WorkflowCanvas (React Flow), and WorkflowToolbar.
/workflows/[id] – Full workflow editor with node palette on the left, canvas in the center, node configuration panel on the right, plus execution controls and logs.
/executions – List of workflow executions with status badges, execution duration, timeline links, logs, filter/sort options, pagination, and live updates via Socket.IO.
/integrations – Status page for Gmail, Slack, Discord, and Google Sheets integrations with OAuth connection flows, reconnect buttons, and status toggles.
/settings – Profile management, user role details, API key/encryption key health checks, security controls, and theme settings.
Backend Architecture & Database Collections
Backend Architecture
Routes: Handles HTTP routing, request validation via express-validator, and middleware composition (auth, validation, error handler).
Controllers: Request parsing and response shaping only (never talks directly to MongoDB).
Services: Business logic ownership (workflow CRUD, execution lifecycle, token encryption, retry classification, notification creation, AI generation, log aggregation).
Agents Layer: Holds planner, execution, validation, recovery, monitoring, and orchestrator modules.
Integrations Layer: Wraps third-party SDKs behind a common interface defined in baseIntegration.js.
Queues Layer: Wraps BullMQ and Redis.
Config Layer: Centralizes environment variables, MongoDB connection (with in-memory fallback), and Socket.IO setup.
Database Collections
Users: Stores authenticated users (name, email, password with select: false, role: admin | operator, lastLogin).
Workflows: Stores workflows (name, description, owner, status: draft | active | paused | archived, triggerConfig, nodes, edges, version, tags).
Executions: Stores run instances (workflowId, immutable workflow snapshot, status, currentNode, startTime, endTime, duration, inputs, outputs, error, retryCount).
ExecutionLogs: Stores granular timeline events (executionId, workflowId, nodeId, agent: planner | execution | validation | recovery | monitoring, level: info | warning | error | success, message, metadata).
Integrations: Stores third-party connections (owner, provider: gmail | slack | google-sheets | discord | openrouter | gemini, isConnected, scopes, encrypted tokens, expiresAt).
Notifications: Stores alerts (owner, workflowId, executionId, type, title, message, isRead).
AgentMemory: Stores agent context across execution steps (workflowId, executionId, agentId, key, value, confidenceScore).
API Endpoints
Health and Auth
GET /api/health – System heartbeat and status check.
POST /api/auth/register – Register a new user account.
POST /api/auth/login – Authenticate user and issue JWT.
GET /api/auth/me – Fetch current user profile.
Workflows
GET /api/workflows/dashboard – Aggregated workflow and execution stats.
GET /api/workflows – List user workflows with pagination/filtering.
POST /api/workflows – Create a new workflow manually.
POST /api/workflows/generate – Generate workflow graph from prompt via AI.
GET /api/workflows/:id – Fetch single workflow details.
PUT /api/workflows/:id – Update existing workflow structure.
POST /api/workflows/:id/duplicate – Clone an existing workflow.
POST /api/workflows/:id/execute – Trigger an execution run.
DELETE /api/workflows/:id – Delete a workflow.
Executions
GET /api/executions – List all execution runs.
GET /api/executions/:id – Fetch execution run details and snapshot.
GET /api/executions/:id/timeline – Fetch detailed agent timeline logs.
POST /api/executions/:id/pause – Pause an active run.
POST /api/executions/:id/resume – Resume a paused run.
POST /api/executions/:id/cancel – Cancel a running execution.
Integrations & Notifications
GET /api/integrations – List all user integration connections.
GET /api/integrations/status – Provider health and token validity checks.
GET /api/integrations/oauth/:provider/start – Initiate OAuth flow.
GET /api/integrations/oauth/:provider/callback – Handle OAuth callback.
GET /api/integrations/oauth/error – OAuth error response endpoint.
POST /api/integrations – Manual integration credential setup.
GET /api/notifications – List user notifications.
Folder Structure & Development Phases
Frontend Structure
client/
└── src/
    ├── components/
    │   ├── AppShell/
    │   ├── MetricGrid/
    │   ├── NodePalette/
    │   ├── NodeConfigPanel/
    │   ├── WorkflowCanvas/
    │   └── ProtectedRoute/
    ├── pages/
    │   ├── _app.js
    │   ├── index.js
    │   ├── login.js
    │   ├── register.js
    │   ├── dashboard.js
    │   ├── integrations.js
    │   ├── settings.js
    │   ├── executions/
    │   │   ├── index.js
    │   │   └── [id].js
    │   └── workflows/
    │       ├── index.js
    │       ├── builder.js
    │       └── [id].js
    ├── store/
    │   ├── authStore.js
    │   └── workflowStore.js
    └── services/
        ├── api.js
        └── socket.js


Backend Structure
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── socket.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── workflowRoutes.js
    │   ├── executionRoutes.js
    │   ├── integrationRoutes.js
    │   └── notificationRoutes.js
    ├── controllers/
    │   ├── authController.js
    │   ├── workflowController.js
    │   ├── executionController.js
    │   └── integrationController.js
    ├── services/
    │   ├── authService.js
    │   ├── workflowService.js
    │   ├── executionService.js
    │   ├── aiService.js
    │   └── integrationService.js
    ├── agents/
    │   ├── orchestrator.js
    │   ├── plannerAgent.js
    │   ├── executionAgent.js
    │   ├── validationAgent.js
    │   ├── recoveryAgent.js
    │   └── monitoringAgent.js
    ├── integrations/
    │   ├── baseIntegration.js
    │   ├── gmailIntegration.js
    │   ├── slackIntegration.js
    │   ├── discordIntegration.js
    │   └── googleSheetsIntegration.js
    ├── models/
    │   ├── User.js
    │   ├── Workflow.js
    │   ├── Execution.js
    │   ├── ExecutionLog.js
    │   ├── Integration.js
    │   └── Notification.js
    └── queues/
        └── executionQueue.js


Development Phases
Phase 1: Project setup (Next.js, Express, MongoDB with in-memory fallback, JWT authentication, Zustand auth store, AppShell layout).
Phase 2: Workflow CRUD, canvas integration with React Flow, node palette, configuration panel, and metadata persistence.
Phase 3: AI prompt-to-workflow generation (OpenRouter primary, Gemini fallback, deterministic rule engine fallback).
Phase 4: Multi-agent orchestration engine (planner, executor, validator, recovery, monitoring) and execution control lifecycle (pause, resume, cancel).
Phase 5: Third-party OAuth integrations (Gmail, Slack, Discord, Google Sheets) with credential encryption.
Phase 6: BullMQ background queues, Socket.IO real-time event streaming, live execution timeline updates, and notification drawer.
UI, Security, Outcome, and Codex Instructions
UI and UX Requirements
The UI must use a clean operator-console aesthetic with Tailwind, be fully responsive, include loading states and skeleton loaders, render the workflow graph with React Flow including animated edges, support drag-from-palette node creation, surface a right-hand configuration panel for any selected node, render live execution events in a timeline with color-coded agent badges (planner / execution / validation / recovery / monitoring), and provide a notifications drawer accessible from the AppShell.
Security Requirements
The application must hash passwords with bcrypt at cost 12, sign and verify JWTs with JWT_SECRET, encrypt OAuth access and refresh tokens at rest with CREDENTIAL_ENCRYPTION_KEY, set HTTP security headers via helmet, apply CORS limited to CLIENT_URL, rate-limit auth endpoints via express-rate-limit, validate every request body with express-validator, never log decrypted tokens, and treat any missing or expired credential as an explicit INTEGRATION_NOT_CONNECTED / AUTH_EXPIRED error rather than a generic 500.
Final Expected Outcome
The completed platform must let an operator describe an automation in plain English, watch it materialize as a graph on the canvas, save it, execute it through the agent chain, see each agent event stream in real time, recover or escalate failures automatically, and receive notifications—all backed by real OAuth integrations and a full audit trail in MongoDB. The final application should feel like a modern operations console—close in spirit to n8n or Zapier, but with an explicit agentic execution layer on top.
Codex & AI Agent Implementation Instructions
The AI coding agent must build the application phase by phase, follow the folder structure strictly, keep controllers thin and push logic into services, keep agents pure (no HTTP knowledge), wrap every integration behind the baseIntegration interface, never call Mongo from a controller, never call an integration from an agent without going through the integration service, treat every secret as process.env, use the in-memory store fallback when Mongo or Redis is unavailable so local dev still works, emit a Socket.IO event for every agent step, write one ExecutionLog per agent event, and report the list of files created or changed at the end of every phase.
Where Each Specification Parameter Shows Up
Looking at the specification above, you can see how the parameters of a good specification appear in practice:
Clarity: The Project Overview and Final Expected Outcome sections describe the product in single-meaning sentences and explicitly identify the primary user ("operator") and primary workflow motion.
Completeness: The document covers all technical facets: stack, features, agents, integrations, pages, database schemas, endpoints, queues, real-time layers, and verification.
Consistency: Casing and naming conventions match across layers. For instance, the five agent names defined in Agentic Orchestration match the agent names in UI and UX Requirements and Real-Time Layer.
Concrete Technology Choices: The Tech Stack section locks down explicit dependencies—Next.js (Pages Router), @xyflow/react, BullMQ on ioredis, Socket.IO, OpenRouter, and Gemini—eliminating ambiguity for AI coding agents.
Structured Sections: Heading levels organize details into scannable sub-domains for both human reviewers and AI parsers.
