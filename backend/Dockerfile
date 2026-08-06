FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --ignore-scripts
RUN npm rebuild bcrypt --build-from-source
COPY . .
RUN npx prisma generate

FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser
COPY --from=builder /app ./
RUN mkdir -p uploads temp generated_certificates && chown -R appuser:appgroup /app
USER appuser
EXPOSE 5001
CMD ["node", "src/index.js"]
