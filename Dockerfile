FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.js ./

RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    npx prisma generate

COPY src ./src

ENV NODE_ENV=production

USER node

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && exec node src/server.js"]