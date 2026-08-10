// Cloudflare Pages Function: /api/data (GET + POST)
// KV binding: BABY_DATA (set in Cloudflare Dashboard > Pages > Settings > Bindings)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const defaultData = {
  subjects: [
    { id: 'pinyin', emoji: '🔤', name: '拼音', goal: '每天练习15分钟', starsPerDay: 1, category: 'study' },
    { id: 'shizi', emoji: '📖', name: '识字', goal: '每天认5个字', starsPerDay: 1, category: 'study' },
    { id: 'yuedu', emoji: '📚', name: '阅读', goal: '每天读1本绘本', starsPerDay: 1, category: 'study' },
    { id: 'suanshu', emoji: '🧮', name: '算术', goal: '每天做10道题', starsPerDay: 1, category: 'study' },
    { id: 'english', emoji: '🔡', name: '英语', goal: '每天学5个单词', starsPerDay: 1, category: 'study' },
    { id: 'xiezi', emoji: '✏️', name: '写字', goal: '每天写1页字帖', starsPerDay: 1, category: 'study' },
    { id: 'gushi', emoji: '🎵', name: '古诗', goal: '每天背1首古诗', starsPerDay: 1, category: 'study' },
    { id: 'yundong', emoji: '🤸', name: '运动', goal: '每天跳绳100个', starsPerDay: 1, category: 'study' },
    { id: 'tidy_toys', emoji: '🧸', name: '整理玩具', goal: '玩完收拾好', starsPerDay: 1, category: 'chores' },
    { id: 'fold_clothes', emoji: '👕', name: '叠衣服', goal: '自己叠衣服', starsPerDay: 1, category: 'chores' },
    { id: 'water_plants', emoji: '🪴', name: '浇花', goal: '给小花浇水', starsPerDay: 1, category: 'chores' },
    { id: 'set_table', emoji: '🍽️', name: '摆碗筷', goal: '帮摆碗筷', starsPerDay: 1, category: 'chores' },
    { id: 'brush_teeth', emoji: '🦷', name: '刷牙', goal: '早晚各刷1次', starsPerDay: 1, category: 'habits' },
    { id: 'bath', emoji: '🛁', name: '洗澡', goal: '每天洗澡澡', starsPerDay: 1, category: 'habits' },
    { id: 'early_sleep', emoji: '😴', name: '早睡', goal: '9点前睡觉', starsPerDay: 1, category: 'habits' },
    { id: 'drink_water', emoji: '🥛', name: '喝水', goal: '喝6杯水', starsPerDay: 1, category: 'habits' }
  ],
  rewards: [
    { id: 'r1', emoji: '🍦', name: '冰淇淋一次', cost: 10 },
    { id: 'r2', emoji: '📺', name: '看动画片30分钟', cost: 5 },
    { id: 'r3', emoji: '🎠', name: '去游乐场', cost: 30 },
    { id: 'r4', emoji: '🧸', name: '新玩具一个', cost: 50 },
    { id: 'r5', emoji: '🎨', name: '买新画笔', cost: 20 },
    { id: 'r6', emoji: '🍕', name: '吃披萨', cost: 15 }
  ],
  records: {},
  totalStars: 0,
  babyName: '宝宝'
};

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // GET — fetch all data
  if (request.method === 'GET') {
    try {
      const raw = await env.BABY_DATA.get('state', 'json');
      const data = raw || structuredClone(defaultData);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    } catch (e) {
      return new Response(JSON.stringify(defaultData), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
  }

  // POST — save full state
  if (request.method === 'POST') {
    try {
      const newData = await request.json();
      const raw = await env.BABY_DATA.get('state', 'json');
      const existing = raw || structuredClone(defaultData);

      if (newData.subjects !== undefined) existing.subjects = newData.subjects;
      if (newData.rewards !== undefined) existing.rewards = newData.rewards;
      if (newData.records !== undefined) existing.records = newData.records;
      if (newData.totalStars !== undefined) existing.totalStars = newData.totalStars;
      if (newData.babyName !== undefined) existing.babyName = newData.babyName;

      await env.BABY_DATA.put('state', JSON.stringify(existing));
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
  }

  // Other methods
  return new Response('Method not allowed', { status: 405, headers: CORS });
}
