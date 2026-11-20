# Build stage: install everything, build the standalone server.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Baked into canonical URLs, the sitemap, robots and social metadata at build time.
ARG SITE_URL=http://localhost:3000
ENV SITE_URL=$SITE_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Run stage: only the standalone output, as a non-root user.
FROM node:24-slim
WORKDIR /app
ARG SITE_URL=http://localhost:3000
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 \
    SITE_URL=$SITE_URL PORT=3000 HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/app/data/randsight.db
COPY --from=build --chown=node:node /app/.next/standalone ./
# The database is created and seeded on first request; the folder must be writable.
RUN mkdir data && chown node:node data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
