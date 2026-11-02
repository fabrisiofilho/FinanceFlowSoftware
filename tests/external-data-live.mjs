// Ensaio opcional de conectividade. Não faz parte da suíte unitária offline.
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const { app } = require('electron');
const directory = path.resolve('.qa/external-data-live-profile');
fs.mkdirSync(directory, { recursive: true });
app.setPath('userData', directory);
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request.startsWith('@main/'))
    request = path.resolve('src/main', request.slice(6));
  if (request.startsWith('@shared/'))
    request = path.resolve('src/shared', request.slice(8));
  return resolve.call(this, request, ...args);
};
Module._extensions['.ts'] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: 1, target: 9, esModuleInterop: true },
    }).outputText,
    file,
  );
app
  .whenReady()
  .then(async () => {
    try {
      const {
        ExternalDataService,
      } = require('../src/main/application/services/external-data-service.ts');
      let memory = null;
      const service = new ExternalDataService({
        read: async () => memory,
        write: async (value) => {
          memory = value;
        },
      });
      const result = await service.snapshot();
      console.log(
        JSON.stringify(
          result.indicators.map((item) => ({
            id: item.id,
            status: item.status,
            publications: item.points.length,
            lastDate: item.points.at(-1)?.date,
          })),
        ),
      );
      if (result.indicators.some((item) => item.status !== 'fresh'))
        throw new Error('Uma ou mais séries não responderam à consulta real.');
      app.quit();
    } catch (error) {
      console.error(error.message);
      app.exit(1);
    }
  })
  .catch((error) => {
    console.error(error.message);
    app.exit(1);
  });
