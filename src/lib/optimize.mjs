// SVGO with a configuration that is safe for animated, CSS-driven SVG.
// Disabled plugins and why:
// - cleanupIds: IDs are prefixed per component and referenced from CSS/url().
// - inlineStyles, minifyStyles: they rewrite <style>, which carries the animation and reduced-motion rules.
// - removeHiddenElems: it computes styles from <style> and would delete the `.static` fallbacks.
// - collapseGroups, moveGroupAttrsToElems, moveElemsAttrsToGroup: wrapper groups keep a static
//   transform apart from an animated child.
// - mergePaths: shapes that animate separately must stay separate.
// - convertShapeToPath: circles rotate around their own box; keep them readable.
// - removeDesc: <desc> is the accessible description.
import { optimize } from 'svgo';

const CONFIG = {
  multipass: false,
  floatPrecision: 2,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          inlineStyles: false,
          minifyStyles: false,
          removeHiddenElems: false,
          collapseGroups: false,
          moveGroupAttrsToElems: false,
          moveElemsAttrsToGroup: false,
          mergePaths: false,
          convertShapeToPath: false,
          removeDesc: false,
          removeUnknownsAndDefaults: { keepRoleAttr: true, keepAriaAttrs: true },
        },
      },
    },
  ],
};

export function optimizeSvg(svg) {
  return optimize(svg, CONFIG).data;
}

// Counts elements that animate: SMIL nodes plus elements whose class has an
// `animation` rule. Used to report against tokens.budget.animatedNodesPerSvg.
export function countAnimated(svg) {
  const css = [...svg.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('');
  const flat = stripBlocks(css, /@(?:-webkit-)?keyframes\b/).replace(/@media[^{]*\{([\s\S]*?\})\}/g, '');
  const animated = new Set();
  for (const [, selectors, body] of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/\banimation(?:-name)?\s*:/.test(body) || /animation\s*:\s*none/.test(body)) continue;
    for (const [, cls] of selectors.matchAll(/\.([\w-]+)/g)) animated.add(cls);
  }
  let count = (svg.match(/<(?:animate|animateMotion|animateTransform|set)\b/g) ?? []).length;
  for (const [, cls] of svg.matchAll(/\sclass="([^"]+)"/g)) if (cls.split(/\s+/).some((c) => animated.has(c))) count++;
  return count;
}

// Removes `@keyframes name{…{…}…}` blocks, which contain nested braces.
function stripBlocks(css, opener) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const rest = css.slice(i);
    const m = rest.match(opener);
    if (!m) return out + rest;
    out += rest.slice(0, m.index);
    let j = i + m.index + rest.slice(m.index).indexOf('{');
    let depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out;
}
