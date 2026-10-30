const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../public/extension-test");
const files = new Map([
  ["index.html", "text/html; charset=utf-8"],
  ["test.js", "text/javascript; charset=utf-8"],
  ["style.css", "text/css; charset=utf-8"],
]);
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const name = pathname === "/" ? "index.html" : pathname.replace(/^\/extension-test\//, "").replace(/^\//, "");
  if (!["GET", "HEAD"].includes(req.method) || !files.has(name)) {
    res.writeHead(404).end("Not found");
    return;
  }
  fs.readFile(path.join(root, name), (error, content) => {
    if (error) {
      res.writeHead(500).end("Could not load test page");
      return;
    }
    res.writeHead(200, { "Content-Type": files.get(name), "Cache-Control": "no-store" });
    res.end(req.method === "HEAD" ? undefined : content);
  });
});
server.on("error", (error) => {
  console.error(`Could not start Signal Lab: ${error.message}`);
  process.exitCode = 1;
});
server.listen(3003, "127.0.0.1", () => console.log("Signal Lab: http://127.0.0.1:3003/extension-test/index.html"));
