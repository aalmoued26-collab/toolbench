/* POST /api/packaging-mockup
   body: { artworkDataUrl?, boxStyle, productName?, colors?[], finish?, angle? }
   -> If artworkDataUrl is supplied, wraps THAT design onto a realistic package
      (image-edit model, faithful to the logo/colours/layout). One angle per call
      so each request stays within the function time limit — the page asks for
      several angles by calling this repeatedly. Returns { imageUrl }.
*/
'use strict';
const P = require('./lib/providers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return P.preflight();
  if (event.httpMethod !== 'POST') return P.json(405, { error: 'POST only' });

  try {
    const b = JSON.parse(event.body || '{}');
    const boxStyle = (b.boxStyle || 'straight tuck end box').replace(/_/g, ' ');
    const angle = b.angle || 'three-quarter hero angle showing the front and one side';
    const finish = b.finish || 'matte laminate';

    if (b.artworkDataUrl) {
      // Faithful path: put the user's real design on the package.
      const prompt =
        `Turn this artwork into a photorealistic product mockup of a ${boxStyle}. ` +
        `Print this exact design — its logo, colours, patterns, illustration and text — ` +
        `onto the package as the printed label/wrap, keeping the layout faithful. ` +
        `${angle}. ${finish} finish. Professional studio product photography, soft shadows, ` +
        `seamless light background, sharp focus, high resolution. Show the package clearly.`;
      const data = await P.runFal(P.MODELS.packEdit, {
        prompt,
        image_url: b.artworkDataUrl,          // kontext-style models
        image_urls: [b.artworkDataUrl],       // nano-banana / seedream edit models
        num_images: 1,
      });
      return P.json(200, { imageUrl: P.pickImage(data) });
    }

    // Fallback (no artwork): generate from colours + description only.
    const colors = Array.isArray(b.colors) && b.colors.length ? b.colors.join(', ') : 'brand colours';
    const prompt =
      `Photorealistic product photograph of a ${boxStyle} retail package` +
      (b.productName ? ` for "${b.productName}"` : '') + `. ${angle}. ` +
      `Brand colours ${colors}, ${b.style || 'clean, premium'} design, ${finish} finish. ` +
      `Studio product lighting, soft shadows, seamless background, sharp focus, high detail. No text, no watermark.`;
    const data = await P.runFal(P.MODELS.image, { prompt, image_size: 'square_hd', num_images: 1 });
    return P.json(200, { imageUrl: P.pickImage(data) });
  } catch (err) {
    return P.json(500, { error: String(err.message || err) });
  }
};
