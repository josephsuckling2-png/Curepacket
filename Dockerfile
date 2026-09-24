# Chromium and its OS libraries come from the official Playwright image.
# Keep this tag in lockstep with the "playwright" version in package.json / package-lock.json.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

USER root
WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_NO_SANDBOX=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    npm_config_fund=false \
    npm_config_audit=false

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci && npx playwright install chromium

COPY . .

RUN npx prisma generate \
    && NODE_OPTIONS=--max-old-space-size=2048 npx next build \
    && mkdir -p /tmp/curepacket/screenshots \
    && chmod 777 /tmp/curepacket /tmp/curepacket/screenshots

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

ENTRYPOINT []
CMD ["node", "scripts/start.mjs"]
