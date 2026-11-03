import { createNodeRequestHandler, isMainModule } from '@angular/ssr/node';
import { join } from 'node:path';
import { createExpressApp } from './server/express-app';
import { attachAngularSsr } from './server/server-ssr';

const browserDistFolder = join(import.meta.dirname, '../browser');
const app = createExpressApp();

await attachAngularSsr(app, browserDistFolder);

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
