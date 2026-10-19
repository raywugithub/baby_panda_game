import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/preact';

afterEach(() => cleanup());

// 部分執行環境（Node 25 的 webstorage）的 localStorage 是殘缺的，沒有 clear/setItem 等方法，
// 此時換成記憶體版 Storage；環境正常時不動它。
{
  // 先看屬性描述子，能不讀 getter 就不讀（Node 的 localStorage getter 會印出警告）。
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const usable = desc
    ? 'value' in desc
      ? typeof (desc.value as Storage | undefined)?.clear === 'function'
      : typeof (globalThis as { localStorage?: Storage }).localStorage?.clear === 'function'
    : false;
  if (!usable) {
    const data = new Map<string, string>();
    const shim = {
      getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
      setItem: (k: string, v: string) => { data.set(k, String(v)); },
      removeItem: (k: string) => { data.delete(k); },
      clear: () => { data.clear(); },
      key: (i: number) => [...data.keys()][i] ?? null,
      get length() { return data.size; },
    };
    Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true, writable: true });
  }
}

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.setPointerCapture ??= () => {};
  proto.releasePointerCapture ??= () => {};
  proto.hasPointerCapture ??= () => false;
}

if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
  Blob.prototype.text = function (this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// 測試環境的 object URL 用無操作的空殼（C10）；原生實作拒絕 fake-indexeddb 還原的非 Blob 值。
if (typeof URL !== 'undefined') {
  URL.createObjectURL = () => 'blob:test-object-url';
  URL.revokeObjectURL = () => {};
}
