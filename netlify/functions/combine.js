/* POST /api/combine  — put TWO characters together in one realistic scene.
   body: { imageA, imageB, scene?, action?, aspect? }
   Uses the identity-preserving edit model with both reference faces so each
   person stays recognizable. Returns { imageUrl }.
*/
'use strict';
const P = require('./lib/providers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return P.preflight();
  if (event.httpMethod !== 'POST') return P.json(405, { error: 'POST only' });

  try {
    const b = JSON.parse(event.body || '{}');
    if (!b.imageA || !b.imageB) return P.json(400, { error: 'imageA and imageB are required' });

    const prompt =
      'Create ONE photorealistic photograph that shows BOTH people from the two reference images together in the same scene. ' +
      'Keep each person\'s face, features and identity faithful and recognizable. ' +
      (b.action ? `They are ${b.action}. ` : 'They are together, interacting naturally. ') +
      (b.scene ? `Setting: ${b.scene}. ` : 'Setting: a warm, richly detailed environment. ') +
      'Consistent natural lighting on both, full-frame camera look, cinematic, high detail, photorealistic. No text, no watermark.';

    const data = await P.runFal(P.MODELS.character, {
      prompt,
      image_urls: [b.imageA, b.imageB],   // nano-banana / seedream edit: multiple refs
      image_url: b.imageA,                // fallback field
      aspect_ratio: b.aspect || '4:5',
      num_images: 1,
    });

    return P.json(200, { imageUrl: P.pickImage(data) });
  } catch (err) {
    return P.json(500, { error: String(err.message || err) });
  }
};
