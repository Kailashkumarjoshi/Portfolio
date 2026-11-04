/**
 * Shared SVG filters for the wool. Rendered once per yarn field.
 *
 * `yarn-fibres` is the important one: a fractal-noise displacement that nudges
 * every edge by a couple of pixels, which is the difference between a vector
 * stroke and something that looks spun. It is skipped entirely on lean devices.
 */
export function YarnDefs() {
  return (
    <defs>
      <filter id="yarn-fibres" x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.045 0.09"
          numOctaves={3}
          seed={7}
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="3.1"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      <filter id="yarn-fuzz" x="-12%" y="-12%" width="124%" height="124%">
        <feGaussianBlur stdDeviation="3.4" />
      </filter>

      <filter id="yarn-soft" x="-12%" y="-12%" width="124%" height="124%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}
