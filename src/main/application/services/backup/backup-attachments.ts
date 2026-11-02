import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
function allowedFile(file: string, root: string): string {
  const resolved = fs.realpathSync(file),
    base = fs.realpathSync(root),
    relative = path.relative(base, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error('Anexo fora do diretório da aplicação.');
  return resolved;
}
export function embedAttachments(
  database: Database.Database,
  root?: string,
): void {
  database.exec(
    'CREATE TABLE backup_attachment_payloads(id INTEGER PRIMARY KEY,contents BLOB NOT NULL,thumbnail BLOB)',
  );
  const rows = database
    .prepare('SELECT id,file_path,thumbnail_path,file_size FROM attachments')
    .all() as {
    id: number;
    file_path: string;
    thumbnail_path: string | null;
    file_size: number;
  }[];
  for (const row of rows) {
    if (!root) throw new Error('Diretório de anexos indisponível.');
    const contents = fs.readFileSync(allowedFile(row.file_path, root));
    if (contents.length !== row.file_size)
      throw new Error('Anexo ausente ou com tamanho inconsistente.');
    const thumbnail = row.thumbnail_path
      ? fs.readFileSync(allowedFile(row.thumbnail_path, root))
      : null;
    database
      .prepare('INSERT INTO backup_attachment_payloads VALUES(?,?,?)')
      .run(row.id, contents, thumbnail);
  }
}
export function restoreAttachments(
  database: Database.Database,
  root?: string,
): string[] {
  const created: string[] = [];
  try {
    const exists = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='backup_attachment_payloads'",
      )
      .get();
    const count = (
      database.prepare('SELECT count(*) AS count FROM attachments').get() as {
        count: number;
      }
    ).count;
    if (!exists) {
      if (count) throw new Error('Backup sem conteúdo dos anexos.');
      return created;
    }
    const rows = database
      .prepare(
        'SELECT a.id,a.filename,a.file_size,p.contents,p.thumbnail FROM attachments a LEFT JOIN backup_attachment_payloads p ON p.id=a.id',
      )
      .all() as {
      id: number;
      filename: string;
      file_size: number;
      contents: Buffer;
      thumbnail: Buffer | null;
    }[];
    if (rows.length && !root)
      throw new Error('Diretório de anexos indisponível.');
    if (rows.length) fs.mkdirSync(root!, { recursive: true });
    for (const row of rows) {
      if (
        !Buffer.isBuffer(row.contents) ||
        row.contents.length !== row.file_size
      )
        throw new Error('Conteúdo de anexo inválido.');
      const extension = /^\.[a-z0-9]{1,8}$/i.test(path.extname(row.filename))
        ? path.extname(row.filename)
        : '.bin';
      const destination = path.join(root!, randomUUID() + extension);
      fs.writeFileSync(destination, row.contents, { flag: 'wx', mode: 0o600 });
      created.push(destination);
      let thumbnail: string | null = null;
      if (row.thumbnail) {
        thumbnail = path.join(root!, randomUUID() + '.png');
        fs.writeFileSync(thumbnail, row.thumbnail, { flag: 'wx', mode: 0o600 });
        created.push(thumbnail);
      }
      database
        .prepare(
          'UPDATE attachments SET file_path=?,thumbnail_path=? WHERE id=?',
        )
        .run(destination, thumbnail, row.id);
    }
    database.exec('DROP TABLE backup_attachment_payloads');
    return created;
  } catch (error) {
    for (const file of created) fs.unlinkSync(file);
    throw error;
  }
}
