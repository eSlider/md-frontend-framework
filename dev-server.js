import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3456;
/** In Docker, bind 0.0.0.0; local default stays 127.0.0.1. */
const host = process.env.HOST || "127.0.0.1";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json",
  ".yml": "text/yaml; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || "/", "http://127.0.0.1");
    if (u.pathname.includes("..")) {
      res.writeHead(400);
      return res.end("bad path");
    }
    let p = u.pathname === "/" || u.pathname === "" ? "index.html" : u.pathname.replace(/^\//, "");
    p = path.posix.normalize(p);
    if (p.startsWith("..")) {
      res.writeHead(400);
      return res.end("bad path");
    }
    const f = path.join(root, p);
    const st = await fs.stat(f).catch(() => null);
    if (!st || !st.isFile()) {
      res.writeHead(404);
      return res.end("not found: " + u.pathname);
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(await fs.readFile(f));
  } catch (e) {
    res.writeHead(500);
    res.end(String(e instanceof Error ? e.message : e));
  }
});

server.listen(port, host, () => {
  console.error(`http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`);
});
