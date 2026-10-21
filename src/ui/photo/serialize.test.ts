import { describe, it, expect } from 'vitest';
import { assertInlineOnly, photoSize, serializeForPhoto } from './serialize';

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

describe('serializeForPhoto 與 CSS 變數', () => {
  it('把 var(--x) 換成算出的顏色，序列化結果不留任何 var(--', () => {
    document.documentElement.style.setProperty('--fur', '#E9DFCF');
    document.documentElement.style.setProperty('--ink', '#2A2826');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const a = document.createElementNS(ns, 'rect');
    a.setAttribute('fill', 'var(--fur)');
    const b = document.createElementNS(ns, 'path');
    b.setAttribute('style', 'stroke: var(--ink); fill: var(--nope, #123456)');
    svg.append(a, b);
    document.body.append(svg);
    const out = serializeForPhoto(svg as unknown as SVGSVGElement);
    expect(out).not.toContain('var(--');
    expect(out).toContain('fill="#E9DFCF"');
    expect(out).toContain('stroke: #2A2826');
    expect(out).toContain('fill: #123456');
    svg.remove();
  });
});
