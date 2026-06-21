FROM node:20-bookworm-slim

ARG BUILD_VERSION=20260611

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
LABEL build_version=$BUILD_VERSION

EXPOSE 8080

CMD ["node", "src/index.js"]