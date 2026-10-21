import { describe, it, expect, vi, afterEach } from 'vitest';
import { authorId, getRecentQuestions } from '@/lib/sejmApi';

afterEach(() => vi.unstubAllGlobals());

describe('authorId', () => {
  it('zero-pads to three digits, as the Sejm API stores question authors', () => {
    expect(authorId(11)).toBe('011');
    expect(authorId(56)).toBe('056');
    expect(authorId(234)).toBe('234');
  });
});

describe('getRecentQuestions', () => {
  it('queries both endpoints with the padded author id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    await getRecentQuestions(56, 8);
    const urls = fetchMock.mock.calls.map(([url]) => url as string);
    expect(urls).toHaveLength(2);
    expect(urls.every((u) => u.includes('from=056&'))).toBe(true);
  });
});
