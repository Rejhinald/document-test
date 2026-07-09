# docs-api production image (Railway)
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# App source
COPY . .

ENV ENVIRONMENT=production
EXPOSE 8080

# Apply pending migrations, then start the server.
CMD ["sh", "-c", "bun run db/migrate.ts && bun run index.ts"]
