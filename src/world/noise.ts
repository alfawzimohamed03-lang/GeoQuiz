/** Deterministic value-noise (no external dependency) used for terrain, dune and ground color variation. */

function hash2D(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function valueNoise2D(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const tl = hash2D(xi, yi);
  const tr = hash2D(xi + 1, yi);
  const bl = hash2D(xi, yi + 1);
  const br = hash2D(xi + 1, yi + 1);

  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const top = tl + (tr - tl) * u;
  const bottom = bl + (br - bl) * u;
  return top + (bottom - top) * v; // 0..1
}

/** Fractal Brownian Motion: layered octaves of value noise for more natural, less repetitive shapes. */
export function fbm2D(x: number, y: number, octaves = 4): number {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * frequency, y * frequency) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / max; // 0..1
}

/** Ridged noise: good for dune crests and rocky ridgelines (sharper peaks than plain fbm). */
export function ridgedNoise2D(x: number, y: number, octaves = 4): number {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise2D(x * frequency, y * frequency) * 2 - 1);
    total += n * n * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / max; // 0..1
}
