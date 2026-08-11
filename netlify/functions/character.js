/* POST /api/character
   body: { imageDataUrl, pose?, expression?, scene?, aspect? }
   -> generates a photorealistic, identity-matched character image from the
      uploaded photo. Returns { imageUrl }.
*/
'use strict';
const P = require('./lib/providers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return P.preflight();
  if (event.httpMethod !== 'POST') return P.json(405, { error: 'POST only' });

  try {
    const b = JSON.parse(event.body || '{}');
    if (!b.imageDataUrl) return P.json(400, { error: 'imageDataUrl (the uploaded photo) is required' });

    const pose = b.pose || 'head-and-shoulders portrait';
    const expression = b.expression || 'natural, warm, trustworthy';
    const scene = b.scene || 'clean studio with soft key light';
    const aspect = b.aspect || '1:1';

    const prompt =
      `Photorealistic marketing photograph of the same person as the reference image. ` +
      `Keep their identity, face and features consistent. Pose: ${pose}. Expression: ${expression}. ` +
      `Setting: ${scene}. Sharp focus, realistic skin texture, professional lighting, high detail. ` +
      `No text, no watermark.`;

    const data = await P.runFal(P.MODELS.character, {
      prompt,
      image_url: b.imageDataUrl,   // fal accepts a data: URL for the reference
      aspect_ratio: aspect,
      num_images: 1,
    });

    return P.json(200, { imageUrl: P.pickImage(data) });
  } catch (err) {
    return P.json(500, { error: String(err.message || err) });
  }
};
