# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # weCode

  weCode is a browser-based collaborative coding room. Multiple users can join the same room, edit code together, discuss specific lines, and run code from a shared workspace.

  ## Features

  - Real-time code and language synchronization with Socket.IO
  - Monaco Editor integration with remote cursor and selection indicators
  - Room presence, reconnect handling, host transfer, and user removal
  - Line-linked comment threads with replies, resolve, and delete actions
  - Email/password authentication with signed JWT sessions
  - Host-only code execution through the JDoodle API
  - PostgreSQL persistence for rooms and comment threads with Prisma
  - Docker Compose setup for the frontend, backend, and database

  ## Stack

  - Frontend: React 19, TypeScript, Vite, React Router, Monaco Editor
  - Backend: Node.js, TypeScript, Express, Socket.IO
  - Data: PostgreSQL and Prisma
  - Deployment: Docker, Docker Compose, nginx

  ## Run With Docker

  From the repository root:

  ```powershell
  Copy-Item backend\.env.example backend\.env
  # Add your JDoodle credentials to backend\.env if code execution is needed.
  docker compose up --build
  ```

  Open `http://localhost` in a browser. The backend listens on `http://localhost:3000`.

  Stop the stack with:

  ```powershell
  docker compose down
  ```

  See [DOCKER_EXPLAIN.md](../DOCKER_EXPLAIN.md) for the service layout and troubleshooting notes.

  ## Run Locally

  Start PostgreSQL, then configure `backend/.env` using [backend/.env.example](../backend/.env.example). Install and run each package in a separate terminal:

  ```powershell
  cd backend
  npm install
  npx prisma migrate deploy
  npm run dev
  ```

  ```powershell
  cd frontend
  npm install
  npm run dev
  ```

  ## Verification

  ```powershell
  cd frontend
  npm run lint
  npm run build

  cd ..\backend
  npm run build
  ```

  ## Architecture

  The browser connects to the backend through Socket.IO. Room membership and transient presence are held in memory by the backend, while room code, language, and comment data are persisted in PostgreSQL through Prisma. The frontend uses focused hooks for room state, editor synchronization, cursor decorations, and comments.

  ## Current Scope

  This is a portfolio and learning project. It uses email/password authentication with signed JWT sessions, and the frontend Socket.IO URL is configured for local development at `http://localhost:3000`. Production deployment would still require configurable service URLs and a shared presence store for multiple backend instances.
