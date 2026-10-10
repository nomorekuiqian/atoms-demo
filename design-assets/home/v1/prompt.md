# Homepage still life · v1

Tool: built-in image_gen. Original artwork, no external character references.
Destination: `public/assets/illustrations/build-still-life-v1.webp`.
Source: `design-assets/home/v1/build-still-life.png`.
Approved direction: small matte 3D app objects above the homepage heading; timer, canvas, building blocks.

## Generation prompt

undefined

## Integration

Transparent artwork is decorative (empty alt), with fixed dimensions to avoid layout shifts. The original headline and composer interactions stay intact. The phone composition uses a smaller 160px illustration; desktop uses 220px. No looping motion. Production derivative is WebP with alpha; the source stays outside the public directory.

Derivative recipe: Sharp `resize(840, 480, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}}).webp({quality: 84, alphaQuality: 100})`. Verified alpha is non-opaque; 28,126 bytes.

Validation: homepage inspected at desktop and 375px phone width; no horizontal overflow; example prompt selection populates the composer and enables Send. Decorative image is omitted from the accessibility tree. ESLint and Impeccable detector passed. No generation request or demo quota was consumed by these visual checks.
