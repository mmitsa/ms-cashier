/**
 * MPOS Auto-Deploy Webhook Server
 *
 * Listens for two trigger types:
 *   1. GitHub `release` webhook  (type: published)
 *   2. GitHub Actions POST /deploy (with shared secret)
 *
 * On trigger → runs auto-deploy.ps1 which:
 *   pull-release → backup DB → deploy → verify
 *
 * Runs as a Windows service via NSSM on port 9850.
 * IIS reverse-proxies https://mops.mmit.sa/deploy-webhook → 127.0.0.1:9850
 *
 * Required env vars:
 *   WEBHOOK_SECRET  — shared HMAC secret (set in GitHub repo webhook settings)
 *   DEPLOY_ROOT     — (optional) defaults to C:\inetpub\mpos
 *   GITHUB_TOKEN    — (optional) for private repo release download
 */

const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.WEBHOOK_PORT || 9850;
const SECRET = process.env.WEBHOOK_SECRET;
const AUTO_DEPLOY = path.resolve(__dirname, '..', 'auto-deploy.ps1');
const LOG_DIR = __dirname;
const LOG_FILE = path.join(LOG_DIR, 'webhook.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB

if (!SECRET) {
  console.error('FATAL: WEBHOOK_SECRET env var is required. Set it via NSSM or system env.');
  process.exit(1);
}

// ---------- Logging ----------
function rotateLogIfNeeded() {
  try {
    const stat = fs.statSync(LOG_FILE);
    if (stat.size > MAX_LOG_SIZE) {
      const old = LOG_FILE + '.old';
      if (fs.existsSync(old)) fs.unlinkSync(old);
      fs.renameSync(LOG_FILE, old);
    }
  } catch (_) {}
}

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  process.stdout.write(line);
  try {
    rotateLogIfNeeded();
    fs.appendFileSync(LOG_FILE, line);
  } catch (_) {}
}

// ---------- Signature verification ----------
function verifySignature(payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload);
  const expected = 'sha256=' + hmac.digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ---------- Deploy ----------
let deploying = false;
let lastDeploy = { time: null, tag: null, status: null, duration: null };

function runDeploy(tag, trigger) {
  if (deploying) {
    log(`SKIPPED: deploy already in progress (triggered by ${trigger})`);
    return false;
  }

  deploying = true;
  const start = Date.now();
  log(`DEPLOY START [${trigger}] tag=${tag || 'latest'}`);

  const args = [
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', AUTO_DEPLOY,
  ];
  if (tag) args.push('-Tag', tag);

  execFile('pwsh.exe', args, {
    cwd: path.resolve(__dirname, '..'),
    timeout: 600_000, // 10 min max
    env: {
      ...process.env,
      AUTO_DEPLOY_TRIGGER: trigger,
    },
  }, (err, stdout, stderr) => {
    const duration = Math.round((Date.now() - start) / 1000);
    deploying = false;

    if (err) {
      lastDeploy = { time: new Date().toISOString(), tag, status: 'FAILED', duration };
      log(`DEPLOY FAILED after ${duration}s: ${err.message}`);
      if (stderr) log(`stderr: ${stderr.slice(0, 2000)}`);
    } else {
      lastDeploy = { time: new Date().toISOString(), tag, status: 'OK', duration };
      log(`DEPLOY SUCCESS after ${duration}s`);
    }
    if (stdout) log(`stdout (last 1000): ${stdout.slice(-1000)}`);
  });

  return true;
}

// ---------- HTTP server ----------
const server = http.createServer({ keepAlive: false }, (req, res) => {
  res.setHeader('Connection', 'close');

  // GET /health — service health + last deploy status
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      deploying,
      lastDeploy,
      uptime: Math.round(process.uptime()),
    }));
    return;
  }

  // POST /webhook — GitHub webhook (release or push events)
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const sig = req.headers['x-hub-signature-256'];
      if (!verifySignature(body, sig)) {
        log('REJECTED: invalid signature');
        res.writeHead(401);
        res.end('Unauthorized');
        return;
      }

      const event = req.headers['x-github-event'];
      log(`GitHub event: ${event}`);

      if (event === 'ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'pong' }));
        return;
      }

      // Release event — auto-deploy when a new release is published
      if (event === 'release') {
        let payload;
        try { payload = JSON.parse(body); } catch { res.writeHead(400); res.end('Bad JSON'); return; }

        if (payload.action !== 'published') {
          log(`Ignoring release action: ${payload.action}`);
          res.writeHead(200); res.end('Ignored');
          return;
        }

        const tag = payload.release?.tag_name;
        log(`Release published: ${tag} by ${payload.sender?.login}`);

        const started = runDeploy(tag, `github-release`);
        res.writeHead(started ? 200 : 202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          message: started ? 'Deploy started' : 'Deploy already in progress',
          tag,
        }));
        return;
      }

      // Push event — only deploy on main branch push (fallback)
      if (event === 'push') {
        let payload;
        try { payload = JSON.parse(body); } catch { res.writeHead(400); res.end('Bad JSON'); return; }

        const ref = payload.ref || '';
        if (ref !== 'refs/heads/main') {
          log(`Ignoring push to ${ref}`);
          res.writeHead(200); res.end('Ignored');
          return;
        }

        log(`Push to main by ${payload.pusher?.name}: ${payload.head_commit?.message?.slice(0, 80)}`);
        const started = runDeploy(null, 'github-push');
        res.writeHead(started ? 200 : 202);
        res.end(started ? 'Deploy started' : 'Deploy in progress');
        return;
      }

      log(`Ignoring event: ${event}`);
      res.writeHead(200); res.end('Ignored');
    });
    return;
  }

  // POST /deploy — direct trigger (from GitHub Actions or manual curl)
  if (req.method === 'POST' && req.url === '/deploy') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      // Simple Bearer token auth using the same secret
      const auth = req.headers['authorization'] || '';
      if (auth !== `Bearer ${SECRET}`) {
        log('REJECTED /deploy: invalid auth');
        res.writeHead(401); res.end('Unauthorized');
        return;
      }

      let tag = null;
      try { tag = JSON.parse(body).tag; } catch {}

      const started = runDeploy(tag, 'direct-api');
      res.writeHead(started ? 200 : 202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        message: started ? 'Deploy started' : 'Deploy already in progress',
      }));
    });
    return;
  }

  res.writeHead(404); res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  log(`Webhook server listening on 127.0.0.1:${PORT}`);
  log(`Endpoints: GET /health, POST /webhook (GitHub), POST /deploy (Actions/manual)`);
});
