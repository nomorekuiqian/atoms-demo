import { describe, expect, it } from 'vitest';
import { RunScope } from './runScope';

describe('workspace async ownership', () => {
  it('rejects late chunks, errors and completion after project navigation', () => {
    const scope = new RunScope();
    const a = scope.start('a', 'request-a');
    expect(a.current('a')).toBe(true);
    expect(a.current('b')).toBe(false);
    scope.cancel();
    expect(a.signal.aborted).toBe(true);
    expect(a.current('a')).toBe(false);
  });
  it('an old finally cannot clear a newer request, while explicit stop remains observable', () => {
    const scope = new RunScope();
    const a = scope.start('a', 'first');
    const b = scope.start('a', 'second');
    a.finish();
    expect(a.current('a')).toBe(false);
    expect(b.current('a')).toBe(true);
    scope.stop();
    expect(b.signal.aborted).toBe(true);
    expect(b.current('a')).toBe(true);
    b.finish();
    expect(b.current('a')).toBe(false);
  });
});
