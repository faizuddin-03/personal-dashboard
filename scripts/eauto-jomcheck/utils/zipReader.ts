import * as zlib from 'node:zlib';

// Minimal .zip reader for 12412_TS11 (Download Payment Document zip). Reads
// the central directory and inflates each entry — stored (0) and deflate (8)
// only, which is what the eAuto zip uses (sample:
// _reference/tickets/EAINT-12412/payment_documents_1109700_2026-10-01_to_2026-10-03.zip).
// Kept dependency-free so the suite needs no new package.

export interface ZipEntry { name: string; data: Buffer }

export function readZip(buf: Buffer): ZipEntry[] {
  // End of central directory: signature 0x06054b50, searched from the end
  // (a trailing comment can sit after it).
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a zip file (no end-of-central-directory record).');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  const out: ZipEntry[] = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`Bad central directory entry #${n}.`);
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith('/')) continue;

    const lNameLen = buf.readUInt16LE(localOffset + 26);
    const lExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);
    if (method === 0) out.push({ name, data: Buffer.from(raw) });
    else if (method === 8) out.push({ name, data: zlib.inflateRawSync(raw) });
    else throw new Error(`${name}: unsupported zip compression method ${method}.`);
  }
  return out;
}
