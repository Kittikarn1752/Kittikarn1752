// The site's favicon: the hole seen nearly edge-on, as in the hero. A dark
// tile, a gold halo, the lensed arch above the shadow, the photon ring and the
// near half of the disk, brighter on the right where the gas comes toward us.
export function favicon(tokens) {
  const c = tokens.color;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="halo">
      <stop offset="0" stop-color="${c.accretion.gold}" stop-opacity=".45"/>
      <stop offset="1" stop-color="${c.accretion.gold}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="disk" x1="0" x2="1">
      <stop offset="0" stop-color="${c.accretion.plasma}"/>
      <stop offset=".55" stop-color="${c.accretion.gold}"/>
      <stop offset="1" stop-color="${c.accretion.photon}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="${c.space.void}"/>
  <circle cx="32" cy="32" r="26" fill="url(#halo)"/>
  <path d="M6 32a26 5 0 0 1 52 0" fill="none" stroke="url(#disk)" stroke-width="2.4" opacity=".7"/>
  <path d="M18.5 32a13.5 12.5 0 0 1 27 0" fill="none" stroke="url(#disk)" stroke-width="3.4"/>
  <path d="M21.5 33.5a10.5 8 0 0 0 21 0" fill="none" stroke="${c.accretion.plasma}" stroke-width="1.6" opacity=".8"/>
  <circle cx="32" cy="32" r="9" fill="${c.space.void}"/>
  <circle cx="32" cy="32" r="9.9" fill="none" stroke="${c.accretion.photon}" stroke-width="1" opacity=".9"/>
  <path d="M6 32a26 5 0 0 0 52 0" fill="none" stroke="url(#disk)" stroke-width="3.6"/>
</svg>
`;
}
