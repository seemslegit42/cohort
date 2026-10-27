import { describe, expect, it } from 'bun:test';
import { mapFromAppwrite, mapToAppwrite } from './appwrite-schema';

describe('appwrite mapper', () => {
  it('round-trips lead activities and history without dataPayload', () => {
    const lead = {
      teamId: 'laevos-crm',
      name: 'Acme',
      email: 'ops@acme.test',
      source: 'Web',
      status: 'New',
      priority: 'Medium',
      value: 12000,
      activities: [{ type: 'Note', date: 'today', content: 'hello' }],
      history: [{ type: 'Created', date: 'today', content: 'new' }],
    };

    const mapped = mapToAppwrite('leads', lead);
    expect(mapped.dataPayload).toBeUndefined();
    expect(typeof mapped.activities).toBe('string');
    expect(typeof mapped.history).toBe('string');

    const restored = mapFromAppwrite<typeof lead>('leads', {
      $id: 'lead-1',
      $createdAt: '2026-01-01T00:00:00.000Z',
      $updatedAt: '2026-01-01T00:00:00.000Z',
      ...mapped,
    });

    expect(restored.activities).toEqual(lead.activities);
    expect(restored.history).toEqual(lead.history);
    expect(restored.name).toBe('Acme');
  });

  it('reads legacy dataPayload rows when scalar columns are missing', () => {
    const restored = mapFromAppwrite<{ name: string; teamId: string }>('leads', {
      $id: 'legacy-1',
      dataPayload: JSON.stringify({ name: 'Acme' }),
      teamId: 'laevos-crm',
    });
    expect(restored).toMatchObject({ name: 'Acme', teamId: 'laevos-crm' });
  });

  it('writes notifications with isRead, not read', () => {
    const mapped = mapToAppwrite('notifications', {
      teamId: 'laevos-crm',
      title: 'Ping',
      message: 'Hello',
      isRead: false,
      type: 'info',
    });
    expect(mapped.isRead).toBe(false);
    expect(mapped).not.toHaveProperty('read');
  });
});
