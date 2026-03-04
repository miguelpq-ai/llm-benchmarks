FROM node:20-alpine AS base
WORKDIR /app

# Install native build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npx", "next", "dev"]
