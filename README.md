# 💻 WeCode – Real-Time Collaborative Code Editor

WeCode is a full-stack collaborative code editor that enables multiple users to write, edit, and execute code together in real time. Built using React, Node.js, Socket.IO, Monaco Editor, and MongoDB, it provides an interactive coding environment with live collaboration, room management, comments, and host controls.

---

## 🚀 Features

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
## 🛠️ Tech Stack

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

### Tools & APIs
- Monaco Editor
- JDoodle API (for code execution)

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


# 🔄 Workflow

1. User registers or logs in.
2. Creates or joins a coding room.
3. Host selects programming language.
4. All participants collaborate in real time.
5. Cursor positions and selections are synchronized.
6. Users discuss using the comments section.
7. Host executes the code.
8. Output is shared with all participants.

---

# 📸 Screenshots

> Add screenshots here.

| Landing Page | Editor |
|--------------|--------|
| ![](screenshots/home.png) | ![](screenshots/editor.png) |

| Comments | User Management |
|-----------|-----------------|
| ![](screenshots/comments.png) | ![](screenshots/users.png) |

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/Aashay205/WeCode.git
```

```bash
cd WeCode
```

---

## Backend

```bash
cd Backend
npm install
```

Create a `.env` file

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173

JDOODLE_CLIENT_ID=your_client_id

JDOODLE_CLIENT_SECRET=your_client_secret
```

Start Backend

```bash
npm start
```

---

## Frontend

```bash
cd Frontend

npm install
```

Start Frontend

```bash
npm run dev
```

---

# 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Backend Port |
| JWT_SECRET | JWT Secret |
| CLIENT_URL | Frontend URL |
| JDOODLE_CLIENT_ID | JDoodle Client ID |
| JDOODLE_CLIENT_SECRET | JDoodle Secret |

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

