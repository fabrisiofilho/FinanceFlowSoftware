import { createRequire } from 'node:module';
import type BetterSqlite3 from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { logger } from '@main/infrastructure/log/logger';

const loadModule = createRequire(__filename);
function getNativeBinding(): string | undefined {
  const isDev =
    process.env.NODE_ENV === 'development' ||
    !process.resourcesPath?.includes('app.asar');
  if (isDev) {
    return undefined;
  }

  const nativePath = path.join(
    process.resourcesPath!,
    'app.asar.unpacked',
    'node_modules',
    'better-sqlite3',
    'build',
    'Release',
    'better_sqlite3.node',
  );

  return nativePath;
}

const nativeBinding = getNativeBinding();

type DatabaseConstructor = typeof BetterSqlite3;

const Database: DatabaseConstructor = nativeBinding
  ? (() => {
      const mod = loadModule('better-sqlite3');
      return mod.default || mod;
    })()
  : loadModule('better-sqlite3');

function createDatabase(dbPath: string): BetterSqlite3.Database {
  const options: BetterSqlite3.Options = {};
  if (nativeBinding) {
    options.nativeBinding = nativeBinding;
  }
  return new Database(dbPath, options);
}

let electronApp: {
  getAppPath: () => string;
  getPath: (name: string) => string;
} | null = null;

function getElectronApp(): {
  getAppPath: () => string;
  getPath: (name: string) => string;
} | null {
  if (electronApp !== null) return electronApp;

  try {
    const moduleName = 'electron';

    const electron = loadModule(moduleName);
    electronApp = electron.app || null;
    return electronApp;
  } catch {
    electronApp = null;
    return null;
  }
}

interface Migration {
  id: number;
  name: string;
  applied_at: string;
}

interface MigrationFile {
  name: string;
  path: string;
  version: number;
}

export class MigrationRunner {
  private db: BetterSqlite3.Database;
  private dbPath: string;
  private migrationsPath: string;
  private backupPath: string | null = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.db = createDatabase(dbPath);
    this.migrationsPath = this.resolveMigrationsPath();

    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
  }

  private resolveMigrationsPath(): string {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      return path.join(
        process.cwd(),
        'src/main/infrastructure/database/migrations',
      );
    }

    const app = getElectronApp();
    if (!app) {
      const defaultPath = path.join(process.cwd(), 'out/main/migrations');
      logger.info(
        'Worker thread - using default migrations path:',
        defaultPath,
      );
      return defaultPath;
    }

    const possiblePaths = [
      path.join(app.getAppPath(), 'out/main/migrations'),
      path.join(
        app.getAppPath(),
        '..',
        'app.asar.unpacked',
        'out/main/migrations',
      ),
      path.join(path.dirname(app.getPath('exe')), 'resources', 'migrations'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        logger.info('Migrations path found:', p);
        return p;
      }
    }

    const defaultPath = path.join(app.getAppPath(), 'out/main/migrations');
    logger.warning('Using default migrations path:', defaultPath);
    return defaultPath;
  }

  private createBackup(): string | null {
    if (!fs.existsSync(this.dbPath)) {
      return null;
    }

    const timestamp = Date.now();
    const backupPath = `${this.dbPath}.backup_${timestamp}`;

    try {
      this.db.close();
      fs.copyFileSync(this.dbPath, backupPath);

      const walPath = `${this.dbPath}-wal`;
      const shmPath = `${this.dbPath}-shm`;

      if (fs.existsSync(walPath)) {
        fs.copyFileSync(walPath, `${backupPath}-wal`);
      }
      if (fs.existsSync(shmPath)) {
        fs.copyFileSync(shmPath, `${backupPath}-shm`);
      }

      this.db = createDatabase(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('synchronous = NORMAL');

      logger.info('Database backup created:', backupPath);
      this.backupPath = backupPath;
      return backupPath;
    } catch (error) {
      logger.error('Failed to create backup:', error);
      try {
        this.db = createDatabase(this.dbPath);
      } catch (recoveryError) {
        console.error(
          'Falha ao liberar ou recuperar conexão do banco:',
          recoveryError,
        );
      }
      throw new Error(`Failed to create database backup: ${error}`);
    }
  }

  private restoreBackup(): void {
    if (!this.backupPath || !fs.existsSync(this.backupPath)) {
      logger.warning('No backup to restore');
      return;
    }

    try {
      try {
        this.db.close();
      } catch (recoveryError) {
        console.error(
          'Falha ao liberar ou recuperar conexão do banco:',
          recoveryError,
        );
      }

      if (fs.existsSync(this.dbPath)) {
        fs.unlinkSync(this.dbPath);
      }

      const walPath = `${this.dbPath}-wal`;
      const shmPath = `${this.dbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

      fs.copyFileSync(this.backupPath, this.dbPath);

      const backupWalPath = `${this.backupPath}-wal`;
      const backupShmPath = `${this.backupPath}-shm`;
      if (fs.existsSync(backupWalPath)) {
        fs.copyFileSync(backupWalPath, walPath);
      }
      if (fs.existsSync(backupShmPath)) {
        fs.copyFileSync(backupShmPath, shmPath);
      }

      logger.success('Database restored from backup');

      this.db = createDatabase(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
    } catch (error) {
      logger.error('Failed to restore backup:', error);
      throw new Error(`Failed to restore database backup: ${error}`);
    }
  }

  private removeBackup(): void {
    if (!this.backupPath) return;

    try {
      if (fs.existsSync(this.backupPath)) {
        fs.unlinkSync(this.backupPath);
      }

      const backupWalPath = `${this.backupPath}-wal`;
      const backupShmPath = `${this.backupPath}-shm`;
      if (fs.existsSync(backupWalPath)) fs.unlinkSync(backupWalPath);
      if (fs.existsSync(backupShmPath)) fs.unlinkSync(backupShmPath);

      logger.info('Backup removed after successful migration');
      this.backupPath = null;
    } catch (error) {
      logger.warning('Failed to remove backup (non-critical):', error);
    }
  }

  private isLegacyDatabase(): boolean {
    const migrationsTableExists = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'",
      )
      .get();

    if (migrationsTableExists) {
      return false;
    }

    const existingTables = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all() as { name: string }[];

    return existingTables.length > 0;
  }

  private isInconsistentDatabase(): boolean {
    const migrationsTableExists = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'",
      )
      .get();

    if (!migrationsTableExists) {
      return false;
    }

    const existingTables = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .all() as { name: string }[];

    const tableNames = existingTables.map((t) => t.name);
    const requiredTables = [
      'users',
      'companies',
      'establishments',
      'turnstiles',
      'workers',
      'events',
      'sync_history',
    ];
    const missingTables = requiredTables.filter((t) => !tableNames.includes(t));

    return (
      missingTables.length > 0 && missingTables.length < requiredTables.length
    );
  }

  private createMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private getAppliedMigrations(): Set<string> {
    const rows = this.db
      .prepare('SELECT name FROM migrations')
      .all() as Migration[];
    return new Set(rows.map((r) => r.name));
  }

  private getMigrationFiles(): MigrationFile[] {
    if (!fs.existsSync(this.migrationsPath)) {
      logger.warning('Migrations directory not found:', this.migrationsPath);
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsPath)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    return files
      .map((f) => {
        const match = f.match(/^(\d+)_/);
        const version = match ? parseInt(match[1], 10) : 0;

        return {
          name: f.replace('.sql', ''),
          path: path.join(this.migrationsPath, f),
          version,
        };
      })
      .sort((a, b) => a.version - b.version);
  }

  private executeMigration(migration: MigrationFile): void {
    const sql = fs.readFileSync(migration.path, 'utf-8');

    logger.info(`Executing migration: ${migration.name}`);

    const statements = this.splitSqlStatements(sql);

    const pragmaStatements: string[] = [];
    const regularStatements: string[] = [];

    for (const statement of statements) {
      const trimmed = statement.trim().toUpperCase();
      if (trimmed.startsWith('PRAGMA')) {
        pragmaStatements.push(statement);
      } else if (trimmed) {
        regularStatements.push(statement);
      }
    }

    for (const pragma of pragmaStatements) {
      try {
        this.db.exec(pragma);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.warning(`PRAGMA skipped (${errorMessage}): ${pragma}`);
      }
    }

    this.db.pragma('foreign_keys = OFF');

    for (let i = 0; i < regularStatements.length; i++) {
      const statement = regularStatements[i];
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        try {
          this.db.exec(trimmedStatement);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          if (!errorMessage.includes('already exists')) {
            const preview = trimmedStatement
              .substring(0, 100)
              .replace(/\s+/g, ' ');
            logger.error(`Failed at statement ${i + 1}: ${preview}...`);
            logger.error(`Error: ${errorMessage}`);
            throw error;
          }
        }
      }
    }

    const stmt = this.db.prepare(
      "INSERT OR IGNORE INTO migrations (name, applied_at) VALUES (?, datetime('now'))",
    );
    stmt.run(migration.name);

    this.db.pragma('foreign_keys = ON');

    logger.success(`Migration applied: ${migration.name}`);
  }

  private splitSqlStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';

    let cleanSql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

    cleanSql = cleanSql
      .split('\n')
      .map((line) => {
        const commentIndex = line.indexOf('--');
        if (commentIndex === -1) return line;

        let inStr = false;
        let strChar = '';
        for (let i = 0; i < commentIndex; i++) {
          const c = line[i];
          if (!inStr && (c === "'" || c === '"')) {
            inStr = true;
            strChar = c;
          } else if (inStr && c === strChar) {
            inStr = false;
          }
        }

        if (!inStr) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');

    for (let i = 0; i < cleanSql.length; i++) {
      const char = cleanSql[i];
      const nextChar = cleanSql[i + 1];

      if ((char === "'" || char === '"') && !inString) {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (inString && char === stringChar) {
        if (nextChar === stringChar) {
          current += char + nextChar;
          i++;
          continue;
        }
        inString = false;
        current += char;
        continue;
      }

      if (!inString && char === ';') {
        current += char;
        const trimmed = current.trim();
        if (trimmed && trimmed !== ';') {
          statements.push(trimmed);
        }
        current = '';
        continue;
      }

      current += char;
    }

    const trimmed = current.trim();
    if (trimmed && trimmed !== ';') {
      statements.push(trimmed);
    }

    return statements;
  }

  async run(): Promise<{ applied: string[]; skipped: string[] }> {
    const applied: string[] = [];
    const skipped: string[] = [];

    try {
      logger.info('Starting migration runner...');
      logger.info('Migrations path:', this.migrationsPath);

      const existing = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        )
        .all();
      if (
        existing.length &&
        this.db.pragma('user_version', { simple: true }) !== 3
      )
        throw new Error(
          'Banco do formato anterior detectado. Feche o Contabily e limpe o banco local para criar a versão V2 em centavos. Nenhum dado foi apagado automaticamente.',
        );
      const isLegacy = this.isLegacyDatabase();
      const isInconsistent = this.isInconsistentDatabase();
      const needsCleanup = isLegacy || isInconsistent;

      if (isLegacy) {
        logger.warning(
          'Legacy database detected (created by TypeORM synchronize)',
        );
      }
      if (isInconsistent) {
        logger.warning(
          'Inconsistent database detected (previous migration failed)',
        );
      }

      if (needsCleanup)
        throw new Error(
          'Banco incompatível ou incompleto. Feche a aplicação e limpe o banco local antes de continuar. Nenhuma tabela foi removida automaticamente.',
        );

      this.createMigrationsTable();

      const appliedMigrations = this.getAppliedMigrations();
      logger.info(`Found ${appliedMigrations.size} applied migrations`);

      const migrationFiles = this.getMigrationFiles();
      logger.info(`Found ${migrationFiles.length} migration files`);

      if (
        migrationFiles.some(
          (migration) => !appliedMigrations.has(migration.name),
        )
      )
        this.createBackup();
      for (const migration of migrationFiles) {
        if (appliedMigrations.has(migration.name)) {
          logger.info(`Skipping already applied migration: ${migration.name}`);
          skipped.push(migration.name);
          continue;
        }

        this.executeMigration(migration);
        applied.push(migration.name);
      }

      if (applied.length === 0) {
        logger.info('No new migrations to apply');
      } else {
        logger.success(`Applied ${applied.length} migrations`);
      }

      this.removeBackup();

      return { applied, skipped };
    } catch (error) {
      logger.error('Migration failed:', error);

      if (this.backupPath) {
        logger.warning('Restoring database from backup...');
        try {
          this.restoreBackup();
          logger.success('Database restored to previous state');
        } catch (restoreError) {
          logger.error('CRITICAL: Failed to restore backup:', restoreError);
          logger.error('Manual intervention may be required');
          logger.error('Backup file:', this.backupPath);
        }
      }

      throw error;
    } finally {
      this.close();
    }
  }

  getStatus(): { applied: Migration[]; pending: string[] } {
    this.createMigrationsTable();

    const appliedRows = this.db
      .prepare('SELECT id, name, applied_at FROM migrations ORDER BY id')
      .all() as Migration[];

    const appliedNames = new Set(appliedRows.map((r) => r.name));
    const migrationFiles = this.getMigrationFiles();
    const pending = migrationFiles
      .filter((m) => !appliedNames.has(m.name))
      .map((m) => m.name);

    return { applied: appliedRows, pending };
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch (recoveryError) {
        console.error(
          'Falha ao liberar ou recuperar conexão do banco:',
          recoveryError,
        );
      }
    }
  }
}

export async function runMigrations(dbPath: string): Promise<void> {
  const runner = new MigrationRunner(dbPath);
  await runner.run();
}

export function getMigrationStatus(dbPath: string): {
  applied: Migration[];
  pending: string[];
} {
  const runner = new MigrationRunner(dbPath);
  try {
    return runner.getStatus();
  } finally {
    runner.close();
  }
}
