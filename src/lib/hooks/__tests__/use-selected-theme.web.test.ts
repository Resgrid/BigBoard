/**
 * Covers the web-only theme hook. jest-expo runs this suite without a DOM, so the handful of
 * browser globals the module touches are stubbed per test -- it reads them lazily inside the
 * functions under test, never at import time.
 */

type Listener = (event: { matches: boolean }) => void;

interface Harness {
  classes: Set<string>;
  emit: (matches: boolean) => void;
  listenerCount: () => number;
  matchMedia: jest.Mock;
}

const setupDom = ({ matches = false, legacy = false, storedTheme = null as string | null } = {}): Harness => {
  const listeners = new Set<Listener>();
  const classes = new Set<string>();

  const query: Record<string, unknown> = { matches };
  if (legacy) {
    // Safari < 14 exposes only the deprecated add/removeListener pair.
    query.addListener = (fn: Listener) => listeners.add(fn);
    query.removeListener = (fn: Listener) => listeners.delete(fn);
  } else {
    query.addEventListener = (_type: string, fn: Listener) => listeners.add(fn);
    query.removeEventListener = (_type: string, fn: Listener) => listeners.delete(fn);
  }

  const matchMedia = jest.fn(() => query);
  (global as unknown as { window: Record<string, unknown> }).window.matchMedia = matchMedia;

  (global as unknown as { document: unknown }).document = {
    documentElement: {
      classList: {
        add: (c: string) => classes.add(c),
        remove: (c: string) => classes.delete(c),
      },
      style: {} as Record<string, string>,
    },
  };

  (global as unknown as { localStorage: unknown }).localStorage = {
    getItem: () => storedTheme,
    setItem: jest.fn(),
  };

  return {
    classes,
    emit: (next: boolean) => listeners.forEach((fn) => fn({ matches: next })),
    listenerCount: () => listeners.size,
    matchMedia,
  };
};

const loadModule = () => {
  let mod: typeof import('../use-selected-theme.web');
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../use-selected-theme.web');
  });
  return mod!;
};

afterEach(() => {
  delete (global as unknown as { document?: unknown }).document;
  delete (global as unknown as { localStorage?: unknown }).localStorage;
  delete (global as unknown as { window: Record<string, unknown> }).window.matchMedia;
});

describe('web theme application', () => {
  it('follows later OS changes while the stored theme is "system"', () => {
    const dom = setupDom({ matches: false, storedTheme: 'system' });
    const { loadSelectedTheme } = loadModule();

    loadSelectedTheme();
    expect(dom.classes.has('light')).toBe(true);

    // The OS flips after the theme was applied -- the resolved-once value is now wrong.
    dom.emit(true);

    expect(dom.classes.has('dark')).toBe(true);
    expect(dom.classes.has('light')).toBe(false);
  });

  it('does not subscribe for an explicitly selected theme', () => {
    const dom = setupDom({ matches: false, storedTheme: 'dark' });
    const { loadSelectedTheme } = loadModule();

    loadSelectedTheme();

    expect(dom.classes.has('dark')).toBe(true);
    expect(dom.listenerCount()).toBe(0);
  });

  it('drops the subscription when switching from system to an explicit theme', () => {
    const dom = setupDom({ matches: false, storedTheme: 'system' });
    const mod = loadModule();

    mod.loadSelectedTheme();
    expect(dom.listenerCount()).toBe(1);

    // Re-applying an explicit theme must tear the follower down, or the OS would keep
    // overwriting a choice the user made deliberately.
    setupDom({ matches: false, storedTheme: 'light' });
    mod.loadSelectedTheme();

    expect(dom.listenerCount()).toBe(0);
  });

  it('uses the legacy addListener API when addEventListener is unavailable', () => {
    const dom = setupDom({ matches: false, legacy: true, storedTheme: 'system' });
    const { loadSelectedTheme } = loadModule();

    loadSelectedTheme();

    expect(dom.listenerCount()).toBe(1);
    dom.emit(true);
    expect(dom.classes.has('dark')).toBe(true);
  });

  it('applies the historical dark default when nothing is stored', () => {
    const dom = setupDom({ matches: false, storedTheme: null });
    const { loadSelectedTheme } = loadModule();

    loadSelectedTheme();

    expect(dom.classes.has('dark')).toBe(true);
    expect(dom.listenerCount()).toBe(0);
  });
});
