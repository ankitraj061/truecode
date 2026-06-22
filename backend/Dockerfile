ARG BUILD_VERSION=20260611

# ---- Build stage: compile TypeScript to JS ----
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# ---- Runtime stage: only production deps + compiled output ----
FROM node:20-bookworm-slim

ARG BUILD_VERSION

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
LABEL build_version=$BUILD_VERSION

EXPOSE 8080

CMD ["node", "dist/index.js"]
