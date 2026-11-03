import { describe, expect, it } from 'bun:test';
import { CRM_COLLECTIONS } from './config';
import { db } from './db';

describe('CRM API collections', () => {
  it('exposes only canonical TablesDB collections (no ghost tables)', () => {
    const dbKeys = Object.keys(db).sort();
    const canonical = [...CRM_COLLECTIONS].sort();
    expect(dbKeys).toEqual(canonical);
  });
});
