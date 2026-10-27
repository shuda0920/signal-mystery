const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT 必須是 1 到 65535 的整數。');
  process.exit(1);
}
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8' };
const server = http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err,data) => { if (err) { res.writeHead(404).end('Not found'); return; } res.writeHead(200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream' }); res.end(data); });
});
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') console.error(`連接埠 ${port} 已被使用。若遊戲已經啟動，可開啟 http://127.0.0.1:${port}；否則可在 PowerShell 執行 $env:PORT=4174; npm start 使用其他埠。`);
  else console.error('無法啟動遊戲伺服器：', error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`遊戲網址：http://127.0.0.1:${port}`));
