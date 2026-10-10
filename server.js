const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h1>404 Not Found</h1><p>The requested URL ${pathname} was not found on this server.</p>`);
      return;
    }

    if (stats.isDirectory()) {
      const indexCandidate = path.join(filePath, 'index.html');
      const codeCandidate = path.join(filePath, 'code.html');

      if (fs.existsSync(indexCandidate)) {
        serveFile(indexCandidate, res);
      } else if (fs.existsSync(codeCandidate)) {
        serveFile(codeCandidate, res);
      } else {
        // List directory
        fs.readdir(filePath, (dirErr, files) => {
          if (dirErr) {
            res.writeHead(500);
            res.end('Error reading directory');
            return;
          }
          let html = `<html><head><title>Index of ${pathname}</title><style>body{font-family:sans-serif;padding:20px;line-height:1.6;}</style></head><body>`;
          html += `<h2>Index of ${pathname}</h2><hr><ul>`;
          if (pathname !== '/') {
            html += `<li><a href="..">../</a></li>`;
          }
          files.forEach(f => {
            const rel = path.join(pathname, f).replace(/\\/g, '/');
            html += `<li><a href="${rel}">${f}</a></li>`;
          });
          html += `</ul></body></html>`;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        });
      }
      return;
    }

    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Also accessible at http://127.0.0.1:${PORT}/`);
});
