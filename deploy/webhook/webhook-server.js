/**
 * MPOS GitHub Webhook Listener
 * Listens for push events on main branch and triggers auto-deploy.
 * Runs as a Windows service via NSSM on port 9850.
 */

const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 9850;
const SECRET = process.env.WEBHOOK_SECRET || 'ded6bb36135f4b332f5fbfed0031ea6a36b8d7b8';
const DEPLOY_SCRIPT = path.join(__dirname, 'deploy.bat');
const LOG_FILE = path.join(__dirname, 'webhook.log');

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  process.stdout.write(line);
  try { fs.appendFileSync(LOG_FILE, line); } catch (_) {}
}

function verifySignature(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const expected = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

let deploying = false;

const server = http.createServer({ keepAlive: false }, (req, res) => {
  res.setHeader('Connection', 'close');
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      // Verify GitHub signature
      const sig = req.headers['x-hub-signature-256'];
      if (!verifySignature(body, sig)) {
        log('REJECTED: Invalid signature');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      // Parse event
      const event = req.headers['x-github-event'];
      log(`Received event: ${event}`);

      if (event === 'ping') {
        log('Ping received - webhook is configured correctly');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'pong' }));
        return;
      }

      if (event !== 'push') {
        log(`Ignoring event: ${event}`);
        res.writeHead(200);
        res.end('Ignored');
        return;
      }

      // Parse push payload
      let payload;
      try {
        payload = JSON.parse(body);
      } catch (e) {
        log('ERROR: Invalid JSON payload');
        res.writeHead(400);
        res.end('Bad Request');
        return;
      }

      const branch = payload.ref?.replace('refs/heads/', '');
      if (branch !== 'main') {
        log(`Ignoring push to branch: ${branch}`);
        res.writeHead(200);
        res.end(`Ignored branch: ${branch}`);
        return;
      }

      const pusher = payload.pusher?.name || 'unknown';
      const commitMsg = payload.head_commit?.message || 'no message';
      log(`Push to main by ${pusher}: ${commitMsg}`);

      // Prevent concurrent deploys
      if (deploying) {
        log('SKIPPED: Deploy already in progress');
        res.writeHead(202);
        res.end('Deploy already in progress');
        return;
      }

      // Trigger deploy
      deploying = true;
      log('Starting deploy...');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Deploy started' }));

      execFile('cmd.exe', ['/c', DEPLOY_SCRIPT], {
        cwd: __dirname,
        timeout: 300000 // 5 min max
      }, (err, stdout, stderr) => {
        deploying = false;
        if (err) {
          log(`DEPLOY FAILED: ${err.message}`);
          log(`stderr: ${stderr}`);
        } else {
          log('DEPLOY SUCCESS');
        }
        if (stdout) log(`stdout: ${stdout}`);
      });
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  log(`Webhook server listening on 0.0.0.0:${PORT}`);
});
