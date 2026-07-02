FROM node:20-bookworm-slim

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates; \
    rm -rf /var/lib/apt/lists/*; \
    npm install -g pm2@6

SHELL ["/bin/bash", "-c"]

ENV LANG=en_US.utf8
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./

# Use pnpm install with frozen lockfile for consistency
# Set NODE_ENV=development temporarily to get dev dependencies for build
RUN corepack enable && NODE_ENV=development pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# Create env.sh for runtime environment variables
RUN cp .env env.sh && sed -i 's/^/export /g' env.sh

EXPOSE 80

CMD ["bash", "-c", ". /app/env.sh && exec pm2-runtime /app/server-http.js -i max --max-memory-restart 512M"]
