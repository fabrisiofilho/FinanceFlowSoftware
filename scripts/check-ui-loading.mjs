import { spawnSync } from 'node:child_process';
import process from 'node:process';
import electronPath from 'electron';

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const result = spawnSync(electronPath, ['tests/ui-loading.mjs'], {
  env,
  windowsHide: true,
  stdio: 'inherit',
  timeout: 60000,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
