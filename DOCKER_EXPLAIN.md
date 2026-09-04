# Docker Guide for this Project

This project uses Docker to run three services together:

- `db` — local PostgreSQL database for development.
- `backend` — Node + TypeScript API server.
- `frontend` — React/Vite app built to static files and served from a container.

## What the main files do

- `backend/Dockerfile`
  - Builds the backend in two stages.
  - Installs dependencies, compiles TypeScript, and copies runtime files into a small runtime image.
   - Applies Prisma migrations and starts the backend on port `3000`.

- `frontend/Dockerfile`
  - Builds the frontend with Vite.
  - Copies the built `dist/` files into an nginx image for static hosting.

- `docker-compose.yml`
  - Starts Postgres, the backend, and the frontend together.
  - Exposes frontend on `localhost:80` and backend on `localhost:3000`.

- `backend/.dockerignore` and `frontend/.dockerignore`
  - Keep build context small by excluding `node_modules`, build output, env files, and local metadata.

## Run the app with Docker

From the project root:

```powershell
cd C:\Users\Aashay\Documents\weCode
Copy-Item backend\.env.example backend\.env
# Edit backend\.env and add your JDoodle credentials before running the stack.
docker compose up --build
```

Then open:
- `http://localhost` for the frontend
- `http://localhost:3000` for the backend

The first account must be registered from the frontend. The backend reads `JWT_SECRET` from `backend/.env`.

To run in the background:

```powershell
docker compose up --build -d
```

To stop the app:

```powershell
docker compose down
```

## Local database access

The local Docker Postgres is configured as:
- Host: `localhost`
- Port: `5432`
- Database: `wecode`
- User: `wecode`
- Password: `pass`

From a host GUI or CLI, connect with those values.

## Why Docker is useful here

- Keeps frontend, backend, and database all in isolated containers.
- Avoids installing dependencies globally on your machine.
- Makes the app reproducible for others or for interviews.
- Lets the backend use a local Postgres service without changing your host database.

## Interview guide

When explaining this project, cover these points:

1. **What each service does**
   - `db`: local PostgreSQL database.
   - `backend`: API and sockets using Express + Prisma.
   - `frontend`: React app built by Vite and served as static files.

2. **Why use Docker Compose**
   - It starts multiple services together with one command.
   - It defines service dependencies and shared networking.
   - It keeps ports and environment variables organized.

3. **Why use a multi-stage backend Dockerfile**
   - Build stage installs deps and compiles code.
   - Runtime stage is smaller and contains only what is needed to run.
   - This results in a leaner final image.

4. **Why use nginx for frontend hosting**
   - nginx is fast and stable for static files.
   - It supports SPA routing with `try_files` so refresh on routes like `/room/1` works.
   - It separates the frontend hosting from the backend API logic.

5. **How local DB and Neon DB differ**
   - The current Compose setup uses local Postgres for development.
   - The backend can also be pointed at Neon by changing `DATABASE_URL`.
   - For interview answers, mention that local Docker DB is used to keep the stack self-contained.

6. **Common Docker interviews topics**
   - `Dockerfile` layers and caching
   - `.dockerignore` purpose
   - `docker compose up` vs `docker compose up -d`
   - network isolation and environment variables
   - why `depends_on` does not guarantee service readiness

## Quick troubleshooting

- If refresh on `/room/1` returns 404, rebuild frontend and make sure the SPA nginx config is in use.
- If the backend is not writing to Neon, check the `DATABASE_URL` inside the backend container.
- If Docker is not running, start Docker Desktop before using `docker compose up`.
