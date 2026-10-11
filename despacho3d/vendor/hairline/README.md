Hairline by Lucas Marques, MIT. Source: https://github.com/lucasmarkes/hairline
Pinned commit: a2217852fed6d1a4f20bc7d43d4fad1a3de117b8
Kernel copied from skills/hairline-create/kernel.js with an ESM export appended.
The document drawing adapts examples/riffle.js for 1–8 authorized documents, selection and keyboard access. No remote runtime dependencies.

The complete upstream TypeScript source is vendored in src/ at the same pinned commit. Build the approved decorative access figures with `npx esbuild despacho3d/hairline-access.mjs --bundle --format=esm --minify --outfile=despacho3d/hairline-access.bundle.mjs`.
