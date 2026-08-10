// Cloudflare Pages Function: /api/check (POST only)
// Toggle single subject check for today

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  try {
    const { subjectId, action } = await request.json();
    const raw = await env.BABY_DATA.get('state', 'json');
    if (!raw) {
      return new Response(JSON.stringify({ ok: false, error: 'No data found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!raw.records[today]) raw.records[today] = {};

    const sub = raw.subjects.find(s => s.id === subjectId);
    const stars = sub ? sub.starsPerDay : 1;

    if (action === 'check') {
      if (!raw.records[today][subjectId]) {
        raw.records[today][subjectId] = true;
        raw.totalStars = (raw.totalStars || 0) + stars;
      }
    } else if (action === 'uncheck') {
      if (raw.records[today][subjectId]) {
        delete raw.records[today][subjectId];
        raw.totalStars = Math.max(0, (raw.totalStars || 0) - stars);
      }
    }

    await env.BABY_DATA.put('state', JSON.stringify(raw));
    return new Response(JSON.stringify({ ok: true, records: raw.records, totalStars: raw.totalStars }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
}
