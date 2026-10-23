import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

if (typeof document === 'undefined') {
  const fakeElement: any = {
    setAttribute: () => {},
    getAttribute: () => null,
    appendChild: () => fakeElement,
    removeChild: () => fakeElement,
    style: {},
  };

  const fakeDoc: any = {
    createElement: () => fakeElement,
    createComment: () => fakeElement,
    createTextNode: () => fakeElement,
    querySelector: () => null,
    querySelectorAll: () => [],
    head: fakeElement,
    body: fakeElement,
    nodeType: 9,
  };

  (globalThis as any).document = fakeDoc;
  (globalThis as any).window = globalThis;
}

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
  configurable: true,
});

try {
  getTestBed().initTestEnvironment(
    BrowserTestingModule,
    platformBrowserTesting(),
    { teardown: { destroyAfterEach: false } }
  );
} catch {
  // déjà initialisé
}
