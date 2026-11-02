import { spawnSync } from 'node:child_process';
import electronPath from 'electron';
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const result = spawnSync(electronPath, ['tests/app-real.mjs'], {
  env,
  windowsHide: true,
  stdio: 'inherit',
  timeout: 90000,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
