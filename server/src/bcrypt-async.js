/**
 * CiteCheck AI — Async bcrypt helpers using Worker Threads
 * 
 * bcryptjs is a pure-JS implementation: its "async" API still blocks the main
 * V8 thread during computation. On Render's CPU-throttled free tier this takes
 * 15-60 seconds and causes Cloudflare to drop the TCP connection (HTTP 000).
 *
 * Solution: run bcrypt inside a Worker Thread so the main event loop stays free
 * to send the HTTP response immediately after bcrypt finishes.
 */
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const WORKER_PATH = path.resolve(__dirname, 'bcrypt-worker.js');

// Rounds: configurable via BCRYPT_ROUNDS env var.
// Use 8 on Render free tier (fast, still secure). Default 10 locally.
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, { workerData: data });
    worker.once('message', (msg) => {
      if (msg.success) resolve(msg.result);
      else reject(new Error(msg.error));
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`bcrypt worker exited with code ${code}`));
    });
  });
}

export async function hashPassword(password) {
  return runWorker({ operation: 'hash', password, saltRounds: SALT_ROUNDS });
}

export async function comparePassword(password, hash) {
  return runWorker({ operation: 'compare', password, hash });
}
