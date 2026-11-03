import { AngularNodeAppEngine, writeResponseToNodeResponse } from '@angular/ssr/node';
import express, { type Express } from 'express';

export type AngularSsrEngine = {
  handle: (req: express.Request) => Promise<Response | null | undefined>;
};

export async function attachAngularSsr(
  app: Express,
  browserDistFolder: string,
  createEngine: () => AngularSsrEngine = () => new AngularNodeAppEngine(),
): Promise<void> {
  const angularApp = createEngine();

  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

  app.use((req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
  });
}
