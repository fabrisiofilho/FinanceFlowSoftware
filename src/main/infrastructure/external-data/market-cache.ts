import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
export interface MarketCache {
  read(): Promise<unknown>;
  write(value: unknown): Promise<void>;
}
export class DiskMarketCache implements MarketCache {
  private file = path.join(
    app.getPath('userData'),
    'cache',
    'external-data-v1.json',
  );
  async read(): Promise<unknown> {
    try {
      const stat = await fs.stat(this.file);
      if (stat.size > 1500000) return null;
      return JSON.parse(await fs.readFile(this.file, 'utf8'));
    } catch {
      return null;
    }
  }
  async write(value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file + '.tmp', JSON.stringify(value), 'utf8');
    await fs.rename(this.file + '.tmp', this.file);
  }
}
