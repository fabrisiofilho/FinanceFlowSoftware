import {
  randomBytes,
  scryptSync,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
const MAX_BYTES = 256 * 1024 * 1024;
function passwordKey(password: string, salt: Buffer): Buffer {
  if (
    typeof password !== 'string' ||
    password.length < 10 ||
    password.length > 1024
  )
    throw new Error('Use uma senha de backup com pelo menos 10 caracteres.');
  return scryptSync(password, salt, 32);
}
export function encryptBackup(database: Buffer, password: string): string {
  if (
    database.length > MAX_BYTES ||
    database.subarray(0, 16).toString() !== 'SQLite format 3\0'
  )
    throw new Error('Banco inválido para backup.');
  const salt = randomBytes(16),
    iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', passwordKey(password, salt), iv);
  cipher.setAAD(Buffer.from('contabily-backup-v1'));
  const data = Buffer.concat([
    cipher.update(gzipSync(database)),
    cipher.final(),
  ]);
  return JSON.stringify({
    format: 'contabily-backup',
    version: 1,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  });
}
export function decryptBackup(text: string, password: string): Buffer {
  try {
    if (text.length > MAX_BYTES * 1.5) throw new Error('Arquivo muito grande.');
    const item = JSON.parse(text);
    if (
      item?.format !== 'contabily-backup' ||
      item.version !== 1 ||
      ['salt', 'iv', 'tag', 'data'].some((key) => typeof item[key] !== 'string')
    )
      throw new Error('Formato inválido.');
    const salt = Buffer.from(item.salt, 'base64'),
      iv = Buffer.from(item.iv, 'base64'),
      tag = Buffer.from(item.tag, 'base64');
    if (salt.length !== 16 || iv.length !== 12 || tag.length !== 16)
      throw new Error('Formato inválido.');
    const cipher = createDecipheriv(
      'aes-256-gcm',
      passwordKey(password, salt),
      iv,
    );
    cipher.setAAD(Buffer.from('contabily-backup-v1'));
    cipher.setAuthTag(tag);
    const compressed = Buffer.concat([
      cipher.update(Buffer.from(item.data, 'base64')),
      cipher.final(),
    ]);
    const db = gunzipSync(compressed, { maxOutputLength: MAX_BYTES });
    if (db.subarray(0, 16).toString() !== 'SQLite format 3\0')
      throw new Error('Banco inválido.');
    return db;
  } catch {
    throw new Error(
      'Backup inválido, alterado ou senha incorreta. Nenhum dado foi restaurado.',
    );
  }
}
