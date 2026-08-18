import { singleFlight } from '../single-flight';

describe('singleFlight', () => {
  it('collapses concurrent callers into one execution', async () => {
    let calls = 0;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const wrapped = singleFlight(async () => {
      calls += 1;
      await gate;
      return calls;
    });

    // Four widgets asking for the same data set at once -- one request.
    const results = Promise.all([wrapped(), wrapped(), wrapped(), wrapped()]);
    release?.();

    expect(await results).toEqual([1, 1, 1, 1]);
    expect(calls).toBe(1);
  });

  it('starts a fresh execution once the previous one settles', async () => {
    let calls = 0;
    const wrapped = singleFlight(async () => {
      calls += 1;
      return calls;
    });

    await expect(wrapped()).resolves.toBe(1);
    await expect(wrapped()).resolves.toBe(2);
    expect(calls).toBe(2);
  });

  it('releases the in-flight slot when the call rejects', async () => {
    let calls = 0;
    const wrapped = singleFlight(async () => {
      calls += 1;
      throw new Error(`boom ${calls}`);
    });

    await expect(wrapped()).rejects.toThrow('boom 1');
    // A failed refresh must not wedge the slot shut for the rest of the session.
    await expect(wrapped()).rejects.toThrow('boom 2');
  });

  it('shares the rejection with every concurrent caller', async () => {
    const wrapped = singleFlight(async () => {
      throw new Error('boom');
    });

    const a = wrapped();
    const b = wrapped();

    await expect(a).rejects.toThrow('boom');
    await expect(b).rejects.toThrow('boom');
  });
});
