import { pathToFileURL } from 'node:url';
import { createExpressApp } from './express-app';

const app = createExpressApp();

function isMainEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return import.meta.url === pathToFileURL(entry).href;
  } catch {
    return false;
  }
}

if (isMainEntry() || process.env['pm_id']) {
  const port = Number(process.env['PORT']) || 3001;
  const host = process.env['API_HOST'] ?? '127.0.0.1';
  app.listen(port, host, () => {
    console.log(`[lxv API] listening on http://${host}:${port}`);
  });
}
