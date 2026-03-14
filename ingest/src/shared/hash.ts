import { createHash } from 'node:crypto'

const HASH_SEPARATOR = '\u001f'

export const hashParts = (parts: Array<string | number | null | undefined>) =>
  createHash('sha1')
    .update(parts.map((part) => (part === null || part === undefined ? '' : String(part))).join(HASH_SEPARATOR))
    .digest('hex')
