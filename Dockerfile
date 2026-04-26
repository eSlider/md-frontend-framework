# Static yamd app + Bun HTTP server (dev-server.js). Mount content/ and pages.yml to customize without rebuild.
FROM oven/bun:1-alpine

LABEL org.opencontainers.image.title="yamd" \
  org.opencontainers.image.description="Yet another markdown — static docs, Bun dev server" \
  org.opencontainers.image.source="https://github.com/eSlider/yamd"

WORKDIR /app

ENV PORT=3456
ENV HOST=0.0.0.0
ENV NODE_ENV=production

COPY package.json dev-server.js index.html pages.yml ./
COPY content ./content
COPY src ./src

EXPOSE 3456

# Same entry as `npm start` — pure static file server for index.html, src/, content/, pages.yml
CMD ["bun", "run", "dev-server.js"]
