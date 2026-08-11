/* POST /api/packaging-mockup
   body: { boxStyle, productName, colors:[hex], style?, finish?, angle?, artworkDataUrl? }
   -> renders a photorealistic packaging mockup on-brand. Returns { imageUrl }.
   (The dieline itself is drawn in the browser — see dielines.js — for free.)
*/
'use strict';
const P = require('./lib/providers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return P.preflight();
  if (event.httpMethod !== 'POST') return P.json(405, { error: 'POST only' });

  try {
    const b = JSON.parse(event.body || '{}');
    const boxStyle = (b.boxStyle || 'straight tuck end box').replace(/_/g, ' ');
    const colors = Array.isArray(b.colors) && b.colors.length ? b.colors.join(', ') : 'brand colours';
    const angle = b.angle || 'three-quarter hero angle showing the front and one side';
    const style = b.style || 'clean, premium';
    const finish = b.finish || 'matte laminate';

    const prompt =
      `Photorealistic product photograph of a ${boxStyle} retail package` +
      (b.productName ? ` for "${b.productName}"` : '') + `. ${angle}. ` +
      `Brand colours ${colors}, ${style} design, ${finish} finish. ` +
      `Studio product lighting, soft shadows, seamless background, sharp focus, high detail. ` +
      `Show the packaging clearly. No extra text, no watermark.`;

    const input = { prompt, image_size: 'square_hd', num_images: 1 };
    // If the user supplied existing artwork, use the identity model to keep it.
    const model = b.artworkDataUrl ? P.MODELS.character : P.MODELS.image;
    if (b.artworkDataUrl) input.image_url = b.artworkDataUrl;

    const data = await P.runFal(model, input);
    return P.json(200, { imageUrl: P.pickImage(data) });
  } catch (err) {
    return P.json(500, { error: String(err.message || err) });
  }
};
