FROM node:20 AS builder
WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm install
COPY . .

# Generate Prisma client if present and build TypeScript
RUN npx prisma generate || true
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy runtime files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.cjs ./prisma.config.cjs
COPY package*.json ./

EXPOSE 3000

# Start the built server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
