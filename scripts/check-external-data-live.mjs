import { spawnSync } from 'node:child_process';
import electronPath from 'electron';
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const result = spawnSync(electronPath, ['tests/external-data-live.mjs'], {
  env,
  stdio: 'inherit',
  windowsHide: true,
  timeout: 45000,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
