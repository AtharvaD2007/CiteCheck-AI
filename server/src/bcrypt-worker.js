/**
 * CiteCheck AI — bcrypt Worker Thread
 * Runs bcrypt hash/compare in a separate OS thread via Node.js Worker Threads.
 * Prevents CPU-intensive bcrypt from blocking the main event loop on Render.
 */
import { workerData, parentPort } from 'worker_threads';
import bcrypt from 'bcryptjs';

const { operation, password, hash, saltRounds } = workerData;

(async () => {
  try {
    if (operation === 'hash') {
      const result = await bcrypt.hash(password, saltRounds);
      parentPort.postMessage({ success: true, result });
    } else if (operation === 'compare') {
      const result = await bcrypt.compare(password, hash);
      parentPort.postMessage({ success: true, result });
    } else {
      parentPort.postMessage({ success: false, error: 'Unknown operation' });
    }
  } catch (err) {
    parentPort.postMessage({ success: false, error: err.message });
  }
})();
