# ---- Lebanon crisis site: production image ----
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY backend/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# App code + static frontend
COPY backend/ ./
COPY public/ ./public/

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Basic container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/healthz || exit 1

CMD ["node", "server.js"]
