# WeCode - Real-Time Collaborative Code Editor

WeCode is a full-stack collaborative code editor where multiple users can write, edit, and execute code together in real time. It combines a React frontend with a Node.js API, Socket.IO collaboration, Monaco Editor, Prisma, and PostgreSQL.

---

## Features

### 👥 Real-Time Collaboration
- Live multi-user code editing
- Real-time cursor tracking
- Live text selection synchronization
- Instant language synchronization
- Automatic code synchronization for new users

### 🏠 Room Management
- Create private coding rooms
- Join rooms using Room ID
- Host-based room administration
- Transfer host privileges
- Remove users from room
- Delete room functionality

### 💬 Comments System
- Add comments to code
- Reply to comments
- Resolve/Unresolve discussions
- Delete comments
- Persistent discussion history

### ▶️ Code Execution
- Execute code in multiple programming languages
- Host-only execution permission
- Display execution output in real time

### 🔐 Authentication
- Secure JWT Authentication
- User Registration & Login
- Protected Routes

### 💾 Persistence
- Save room details
- Persistent code state
- Comment history stored in database
- Room recovery after refresh

### 🎨 User Experience
- Monaco Code Editor
- Responsive UI
- Syntax Highlighting
- Live participant list
- Clean modern interface

---
## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Monaco Editor
- Socket.IO Client
- React Router
- Axios

### Backend
- Node.js
- Express.js
- TypeScript
- Socket.IO
- Prisma ORM
- PostgreSQL

### Authentication
- JWT (JSON Web Token)

### Tools and APIs
- Monaco Editor
- JDoodle API for code execution

## 📂 Project Structure

```text
WeCode/
│
├── backend/
│   ├── src/
│   │   ├── services/          # Business logic and room management
│   │   ├── socket/            # Socket.IO event handlers
│   │   ├── types/             # Shared TypeScript interfaces
│   │   ├── app.ts             # Express application
│   │   └── server.ts          # Server entry point
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── package-lock.json
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/            # Images and static assets
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Application pages
│   │   ├── socket/            # Socket.IO client configuration
│   │   ├── types/             # Shared TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── eslint.config.js
│   ├── package-lock.json
│   └── .gitignore
│
└── README.md
```


# Workflow

1. User registers or logs in.
2. Creates or joins a coding room.
3. Host selects programming language.
4. All participants collaborate in real time.
5. Cursor positions and selections are synchronized.
6. Users discuss using the comments section.
7. Host executes the code.
8. Output is shared with all participants.

---

# Screenshots

> Add screenshots here.

| Landing Page | Editor |
|--------------|--------|
| ![](screenshots/home.png) | ![](screenshots/editor.png) |

| Comments | User Management |
|-----------|-----------------|
| ![](screenshots/comments.png) | ![](screenshots/users.png) |

---

# Getting Started

### Clone the repository

```bash
git clone https://github.com/Aashay205/WeCode.git
```

```bash
cd WeCode
```

---

### Prerequisites

- Node.js 20 or later
- Docker Desktop, for the recommended setup
- JDoodle credentials, for code execution

### Recommended: Docker Compose

From the repository root:

```powershell
# Create backend\.env using the environment variables documented below.
docker compose up --build
```

Open `http://localhost` for the frontend. The backend is available at `http://localhost:3000` and PostgreSQL is exposed on port `5432`.

Stop the stack with:

```powershell
docker compose down
```

See [DOCKER_EXPLAIN.md](DOCKER_EXPLAIN.md) for service details and troubleshooting.

### Run locally

Start PostgreSQL first, then install dependencies in each application:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

Create `backend\.env` with values for your local database and services:

```env
DATABASE_URL=postgresql://wecode:pass@localhost:5432/wecode
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGIN=http://localhost:5173
JDOODLE_CLIENT_ID=your-client-id
JDOODLE_CLIENT_SECRET=your-client-secret
```

Run the backend and frontend in separate terminals:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

The local frontend runs at `http://localhost:5173`.

### Database migrations

Prisma migrations are stored in `backend/prisma/migrations`. For a local development database, apply existing migrations with:

```powershell
cd backend
npx prisma migrate deploy
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `CORS_ORIGIN` | Allowed frontend origin(s) |
| `JDOODLE_CLIENT_ID` | JDoodle client ID for code execution |
| `JDOODLE_CLIENT_SECRET` | JDoodle client secret for code execution |

The Compose file supplies the container database URL and exposes the backend on port `3000`.

---

# ✨ Key Features Implemented

- ✅ Real-time collaborative editing
- ✅ Room-based architecture
- ✅ JWT Authentication
- ✅ Monaco Editor integration
- ✅ Live cursor synchronization
- ✅ Live text selection
- ✅ Persistent room state
- ✅ Threaded comments & replies
- ✅ Host controls
- ✅ Code execution
- ✅ Responsive UI

---

# 🚀 Future Enhancements

- Video & Voice Chat
- Screen Sharing
- File Explorer
- Collaborative Whiteboard
- AI Code Assistant
- Live Chat
- Git Integration
- Pair Programming Timer
- Docker-based Code Execution
- Multiple Files Support

---

