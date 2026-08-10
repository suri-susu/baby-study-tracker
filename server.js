const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON body
app.use(express.json({ limit: '2mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Data file path — use /tmp on Vercel (only writable directory), local file otherwise
const DATA_FILE = process.env.VERCEL ? path.join('/tmp', 'data.json') : path.join(__dirname, 'data.json');

// Default data
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

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load data.json, using defaults:', e.message);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

// Save data to file
function saveData(data) {
  try {
    // Atomic write: write to temp file first, then rename
    const tmpFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (e) {
    console.error('Failed to save data.json:', e.message);
    throw e;
  }
}

// =========== API Routes ===========

// GET /api/data — fetch all data
app.get('/api/data', (req, res) => {
  const data = loadData();
  res.json(data);
});

// POST /api/data — save full state
app.post('/api/data', (req, res) => {
  try {
    const newData = req.body;
    // Merge with existing data to avoid accidental overwrites
    const existing = loadData();
    if (newData.subjects !== undefined) existing.subjects = newData.subjects;
    if (newData.rewards !== undefined) existing.rewards = newData.rewards;
    if (newData.records !== undefined) existing.records = newData.records;
    if (newData.totalStars !== undefined) existing.totalStars = newData.totalStars;
    if (newData.babyName !== undefined) existing.babyName = newData.babyName;
    saveData(existing);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/check — toggle a single subject (atomic operation)
// Body: { subjectId, action: 'check' | 'uncheck' }
app.post('/api/check', (req, res) => {
  try {
    const { subjectId, action } = req.body;
    const data = loadData();
    const today = new Date().toISOString().slice(0, 10);

    if (!data.records[today]) data.records[today] = {};

    const sub = data.subjects.find(s => s.id === subjectId);
    const stars = sub ? sub.starsPerDay : 1;

    if (action === 'check') {
      if (!data.records[today][subjectId]) {
        data.records[today][subjectId] = true;
        data.totalStars = (data.totalStars || 0) + stars;
      }
    } else if (action === 'uncheck') {
      if (data.records[today][subjectId]) {
        delete data.records[today][subjectId];
        data.totalStars = Math.max(0, (data.totalStars || 0) - stars);
      }
    }

    saveData(data);
    res.json({ ok: true, records: data.records, totalStars: data.totalStars });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🌟 宝宝学习打卡服务器已启动: http://localhost:${PORT}`);
});
