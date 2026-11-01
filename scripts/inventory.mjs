import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import vm from 'node:vm';
const root = process.cwd();
const allFiles = execFileSync('rg', ['--files', 'src', 'tests'], {
  encoding: 'utf8',
})
  .trim()
  .split(/\r?\n/)
  .map((file) => file.replaceAll('\\', '/'));
const config = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('src/preload/controller-config.ts', 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText,
  { exports: config },
);
const migrationFiles = allFiles.filter(
  (file) =>
    file.startsWith('src/main/infrastructure/database/migrations/') &&
    file.endsWith('.sql'),
);
const inventory = {
  revision: execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
  branch: execFileSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
  }).trim(),
  scope:
    'Snapshot estático do checkout; presença não implica homologação funcional. Sem leitura do banco pessoal.',
  routes: [
    ...fs
      .readFileSync('src/renderer/src/routes/panel.routes.tsx', 'utf8')
      .matchAll(/routePath: '([^']+)'/g),
  ].map((match) => match[1]),
  pages: allFiles
    .filter((file) => file.startsWith('src/renderer/src/pages/'))
    .filter((file) => file.endsWith('index.tsx')),
  entities: allFiles
    .filter((file) => file.startsWith('src/main/application/entities/'))
    .filter((file) => file.endsWith('.ts')),
  controllers: allFiles
    .filter((file) => file.startsWith('src/main/application/controllers/'))
    .filter((file) => file.endsWith('-controller.ts')),
  repositories: allFiles
    .filter((file) => file.startsWith('src/main/application/repositories/'))
    .filter((file) => file.endsWith('.ts')),
  services: allFiles
    .filter((file) => file.startsWith('src/main/application/services/'))
    .filter((file) => file.endsWith('.ts')),
  ipc: Object.values(config.CONTROLLER_CONFIG).flatMap((controller) =>
    controller.methods.map((method) => controller.prefix + ':' + method),
  ),
  migrations: migrationFiles.map((file) => ({
    file,
    tables: [
      ...fs
        .readFileSync(file, 'utf8')
        .matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([\w]+)/gi),
    ].map((match) => match[1]),
  })),
  tests: allFiles
    .filter((file) => file.startsWith('tests/'))
    .filter((file) => /\.(mjs|cjs)$/.test(file)),
};
fs.writeFileSync(
  path.join(root, 'docs/INVENTARIO-V2.json'),
  JSON.stringify(inventory, null, 2) + '\n',
);
console.log(
  `${inventory.routes.length} rotas; ${inventory.entities.length} entidades; ${inventory.ipc.length} canais IPC; ${inventory.migrations.length} migrações.`,
);
