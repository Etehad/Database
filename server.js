const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.use(express.json());

// تنظیمات اتصال به دیتابیس
const dbConfig = {
  host: 'sql12.freesqldatabase.com',
  user: 'sql12768973',
  password: 'CCZrHECEZP',
  database: 'sql12768973',
  port: 3306
};

// تابع برای اتصال به دیتابیس
async function getDbConnection() {
  return await mysql.createConnection(dbConfig);
}

// API برای دریافت داده‌های کاربر
app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const db = await getDbConnection();
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    await db.end();
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }
    const user = rows[0];
    // تبدیل referrals از رشته JSON به آرایه
    user.referrals = user.referrals ? JSON.parse(user.referrals) : [];
    res.json({ success: true, user });
  } catch (error) {
    console.error('خطا در دریافت داده کاربر:', error);
    res.status(500).json({ success: false, error: 'خطا در سرور' });
  }
});

// API برای ذخیره یا به‌روزرسانی داده‌های کاربر
app.post('/api/user', async (req, res) => {
  const userData = req.body;
  try {
    const db = await getDbConnection();
    const referrals = userData.referrals ? JSON.stringify(userData.referrals) : '[]';
    await db.execute(
      `INSERT INTO users (id, username, first_name, balance, lastMiningStart, isMining, referrals, miningRate, referredBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       username = ?, first_name = ?, balance = ?, lastMiningStart = ?, isMining = ?, referrals = ?, miningRate = ?, referredBy = ?`,
      [
        userData.id, userData.username, userData.first_name, userData.balance, userData.lastMiningStart,
        userData.isMining, referrals, userData.miningRate, userData.referredBy,
        userData.username, userData.first_name, userData.balance, userData.lastMiningStart,
        userData.isMining, referrals, userData.miningRate, userData.referredBy
      ]
    );
    await db.end();
    res.json({ success: true });
  } catch (error) {
    console.error('خطا در ذخیره داده کاربر:', error);
    res.status(500).json({ success: false, error: 'خطا در سرور' });
  }
});

// API برای دریافت کاربران برتر
app.get('/api/top-users', async (req, res) => {
  try {
    const db = await getDbConnection();
    const [rows] = await db.execute('SELECT id, username, balance FROM users ORDER BY balance DESC LIMIT 100');
    await db.end();
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error('خطا در دریافت کاربران برتر:', error);
    res.status(500).json({ success: false, error: 'خطا در سرور' });
  }
});

// API برای حذف کاربر
app.delete('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const db = await getDbConnection();
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    await db.end();
    res.json({ success: true });
  } catch (error) {
    console.error('خطا در حذف کاربر:', error);
    res.status(500).json({ success: false, error: 'خطا در سرور' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`سرور در پورت ${PORT} اجرا شد`);
});
