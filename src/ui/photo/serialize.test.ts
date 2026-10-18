import { describe, it, expect } from 'vitest';
import { assertInlineOnly, photoSize } from './serialize';

describe('photo output rules', () => {
  it('rejects external hrefs, urls and font imports', () => {
    expect(() => assertInlineOnly('<svg><image href="https://x.com/a.png"/></svg>')).toThrow('external resource');
    expect(() => assertInlineOnly('<svg style="font-family:x"><style>@import url(a.css)</style></svg>')).toThrow();
    expect(() => assertInlineOnly('<svg><rect style="fill:url(https://x/y)"/></svg>')).toThrow();
  });
  it('allows internal references', () => {
    expect(() => assertInlineOnly('<svg><g clip-path="url(#c)"/><use href="#sticker-01"/></svg>')).not.toThrow();
  });
  it('long side 1600 for a 400x480 viewBox, and 1080 retry size', () => {
    expect(photoSize({ w: 400, h: 480 }, 1600)).toEqual({ w: 1333, h: 1600 });
    expect(photoSize({ w: 400, h: 480 }, 1080)).toEqual({ w: 900, h: 1080 });
  });
});
