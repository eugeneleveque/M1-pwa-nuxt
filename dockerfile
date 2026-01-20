# ---------- Build stage ----------
FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Run stage ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN useradd -m nuxt
USER nuxt

COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
