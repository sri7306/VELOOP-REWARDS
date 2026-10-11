const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('./database');
const { requireAuth, cleanText, money, toCents, code } = require('./middleware');
const router = express.Router();

const walletFor = id => db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(id);
const userFor = id => db.prepare('SELECT id, first_name, last_name, username, email, mobile, country, created_at FROM users WHERE id = ?').get(id);
const currentRate = () => db.prepare('SELECT rate FROM exchange_rates WHERE active = 1 ORDER BY id DESC LIMIT 1').get()?.rate || 5.39;
const txInsert = db.prepare('INSERT INTO transactions (user_id, transaction_code, type, description, gems_delta_cents, ves_delta_cents) VALUES (?, ?, ?, ?, ?, ?)');
const notify = db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)');

function addTransaction(userId, type, description, gemsDelta, vesDelta) {
  txInsert.run(userId, code('VL'), type, description, gemsDelta, vesDelta);
}
function addNotification(userId, title, message) { notify.run(userId, title, message); }
function error(res, status, message) { return res.status(status).json({ error: message }); }

router.get('/health', (_req, res) => res.json({ ok: true, service: 'VELOOP Rewards API' }));

router.post('/auth/register', (req, res) => {
  const first = cleanText(req.body.firstName, 80);
  const last = cleanText(req.body.lastName, 80);
  const username = cleanText(req.body.username, 30);
  const email = cleanText(req.body.email, 180).toLowerCase();
  const mobile = cleanText(req.body.mobile, 30);
  const password = String(req.body.password || '');
  if (first.length < 2 || !last || !/^[a-zA-Z0-9_]{4,30}$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || mobile.length < 7 ||
      password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password) || req.body.terms !== true) {
    return error(res, 400, 'Please check all fields, password requirements, and Terms acceptance.');
  }
  if (db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)) {
    return error(res, 409, 'Username or email is already in use.');
  }
  const hash = bcrypt.hashSync(password, 12);
  const create = db.transaction(() => {
    const result = db.prepare('INSERT INTO users (first_name, last_name, username, email, mobile, password_hash) VALUES (?, ?, ?, ?, ?, ?)')
      .run(first, last, username, email, mobile, hash);
    const id = result.lastInsertRowid;
    db.prepare('INSERT INTO wallets (user_id, gems_cents, ves_cents) VALUES (?, 17195, 96862)').run(id);
    addNotification(id, 'Welcome to VELOOP', 'Your demo rewards account is ready.');
    return id;
  });
  const id = create();
  res.status(201).json({ message: 'Account created. You can now log in.', user: userFor(id) });
});

router.post('/auth/login', (req, res) => {
  const identity = cleanText(req.body.identity, 180);
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE').get(identity, identity);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return error(res, 401, 'Invalid username/email or password.');
  }
  req.session.userId = user.id;
  db.prepare('INSERT INTO login_activity (user_id, event) VALUES (?, ?)').run(user.id, 'Successful login');
  res.json({ message: 'Login successful.', user: userFor(user.id) });
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return error(res, 500, 'Could not end the session. Please try again.');
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});
router.get('/auth/me', requireAuth, (req, res) => res.json({ user: userFor(req.session.userId) }));

router.post('/auth/forgot-password', (_req, res) => {
  res.json({ message: 'Password reset delivery is not configured in this local demo. Ask the project administrator to configure an email provider.' });
});
router.post('/auth/verify', (_req, res) => error(res, 501, 'Email verification requires an email provider and token delivery configuration.'));

router.get('/dashboard', requireAuth, (req, res) => {
  const id = req.session.userId;
  const wallet = walletFor(id);
  const recent = db.prepare('SELECT transaction_code, type, description, gems_delta_cents, ves_delta_cents, status, created_at FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 5').all(id);
  const unread = db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0').get(id).count;
  const rewardCount = db.prepare('SELECT COUNT(*) AS count FROM redemptions WHERE user_id = ?').get(id).count;
  res.json({
    user: userFor(id),
    wallet: { gems: money(wallet.gems_cents), ves: money(wallet.ves_cents), lifetimeGemsEarned: money(wallet.lifetime_gems_earned), lifetimeGemsSpent: money(wallet.lifetime_gems_spent), lifetimeVesEarned: money(wallet.lifetime_ves_earned), lifetimeVesSpent: money(wallet.lifetime_ves_spent) },
    rewardsRedeemed: rewardCount, unreadNotifications: unread, rate: currentRate(),
    recentTransactions: recent.map(t => ({ ...t, gems: money(t.gems_delta_cents), ves: money(t.ves_delta_cents) }))
  });
});

router.get('/exchange/rate', requireAuth, (_req, res) => res.json({ rate: currentRate() }));
router.post('/exchange/preview', requireAuth, (req, res) => {
  const amountCents = toCents(req.body.gems);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return error(res, 400, 'Enter a Gems amount greater than zero.');
  const wallet = walletFor(req.session.userId);
  if (amountCents > wallet.gems_cents) return error(res, 400, 'Insufficient Gems balance.');
  const rate = currentRate();
  const outputCents = Math.round(amountCents * rate);
  res.json({ gems: money(amountCents), rate, ves: money(outputCents), gemsBalanceAfter: money(wallet.gems_cents - amountCents), vesBalanceAfter: money(wallet.ves_cents + outputCents) });
});
router.post('/exchange/confirm', requireAuth, (req, res) => {
  const amountCents = toCents(req.body.gems);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return error(res, 400, 'Enter a Gems amount greater than zero.');
  const id = req.session.userId;
  const rate = currentRate();
  const outputCents = Math.round(amountCents * rate);
  const run = db.transaction(() => {
    const wallet = walletFor(id);
    if (!wallet || amountCents > wallet.gems_cents) throw new Error('INSUFFICIENT_GEMS');
    db.prepare('UPDATE wallets SET gems_cents = gems_cents - ?, ves_cents = ves_cents + ?, lifetime_gems_spent = lifetime_gems_spent + ?, lifetime_ves_earned = lifetime_ves_earned + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(amountCents, outputCents, amountCents, outputCents, id);
    addTransaction(id, 'Conversion', `Converted ${money(amountCents)} Gems at ${rate} VEs per Gem`, -amountCents, outputCents);
    addNotification(id, 'Conversion successful', `${money(amountCents)} Gems were exchanged for ${money(outputCents)} VEs.`);
    return walletFor(id);
  });
  try {
    const wallet = run();
    res.json({ message: 'Conversion successful.', wallet: { gems: money(wallet.gems_cents), ves: money(wallet.ves_cents) }, rate, received: money(outputCents) });
  } catch (e) {
    if (e.message === 'INSUFFICIENT_GEMS') return error(res, 400, 'Insufficient Gems balance.');
    console.error(e);
    return error(res, 500, 'Conversion failed. No balance changes were saved.');
  }
});
router.get('/exchange/history', requireAuth, (req, res) => res.json({ items: db.prepare("SELECT * FROM transactions WHERE user_id = ? AND type = 'Conversion' ORDER BY id DESC").all(req.session.userId) }));

router.get('/earn-gems', requireAuth, (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  const activities = db.prepare('SELECT * FROM earning_activities WHERE active = 1 ORDER BY id').all();
  const claims = db.prepare('SELECT activity_id, claim_date FROM earning_claims WHERE user_id = ?').all(req.session.userId);
  res.json({ activities: activities.map(a => ({ id: a.id, name: a.name, description: a.description, rewardGems: money(a.reward_gems_cents), frequency: a.frequency, claimed: claims.some(c => c.activity_id === a.id && (a.frequency === 'daily' ? c.claim_date === date : true)) })) });
});
router.post('/earn-gems/claim', requireAuth, (req, res) => {
  const activityId = Number(req.body.activityId);
  const activity = db.prepare('SELECT * FROM earning_activities WHERE id = ? AND active = 1').get(activityId);
  if (!activity) return error(res, 404, 'Earning activity not found.');
  const id = req.session.userId;
  const today = new Date().toISOString().slice(0, 10);
  const claimDate = activity.frequency === 'daily' ? today : 'once';
  try {
    const run = db.transaction(() => {
      db.prepare('INSERT INTO earning_claims (user_id, activity_id, claim_date, gems_cents) VALUES (?, ?, ?, ?)').run(id, activityId, claimDate, activity.reward_gems_cents);
      db.prepare('UPDATE wallets SET gems_cents = gems_cents + ?, lifetime_gems_earned = lifetime_gems_earned + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(activity.reward_gems_cents, activity.reward_gems_cents, id);
      addTransaction(id, 'Gem Earn', activity.name, activity.reward_gems_cents, 0);
      addNotification(id, 'Gems earned', `You earned ${money(activity.reward_gems_cents)} Gems from ${activity.name}.`);
    });
    run();
    res.json({ message: `You earned ${money(activity.reward_gems_cents)} Gems.` });
  } catch (e) {
    if (String(e.code).includes('SQLITE_CONSTRAINT')) return error(res, 409, 'This activity has already been claimed for its allowed period.');
    return error(res, 500, 'Could not claim this activity.');
  }
});

router.get('/rewards', requireAuth, (req, res) => {
  const category = cleanText(req.query.category, 50);
  const q = cleanText(req.query.q, 100);
  let sql = 'SELECT * FROM rewards WHERE active = 1';
  const params = [];
  if (category && category !== 'All') { sql += ' AND category = ?'; params.push(category); }
  if (q) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY cost_ves_cents ASC';
  res.json({ rewards: db.prepare(sql).all(...params).map(r => ({ id: r.id, name: r.name, category: r.category, description: r.description, imageLabel: r.image_label, costVes: money(r.cost_ves_cents), stock: r.stock })) });
});
router.post('/rewards/:id/redeem', requireAuth, (req, res) => {
  const rewardId = Number(req.params.id);
  const id = req.session.userId;
  try {
    const run = db.transaction(() => {
      const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND active = 1').get(rewardId);
      if (!reward || reward.stock < 1) throw new Error('REWARD_UNAVAILABLE');
      const wallet = walletFor(id);
      if (wallet.ves_cents < reward.cost_ves_cents) throw new Error('INSUFFICIENT_VES');
      db.prepare('UPDATE wallets SET ves_cents = ves_cents - ?, lifetime_ves_spent = lifetime_ves_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(reward.cost_ves_cents, reward.cost_ves_cents, id);
      db.prepare('UPDATE rewards SET stock = stock - 1 WHERE id = ? AND stock > 0').run(rewardId);
      db.prepare('INSERT INTO redemptions (user_id, reward_id, cost_ves_cents) VALUES (?, ?, ?)').run(id, rewardId, reward.cost_ves_cents);
      addTransaction(id, 'Reward Redemption', reward.name, 0, -reward.cost_ves_cents);
      addNotification(id, 'Reward redeemed', `${reward.name} was redeemed successfully.`);
      return walletFor(id);
    });
    const wallet = run();
    res.json({ message: 'Reward redeemed successfully.', wallet: { gems: money(wallet.gems_cents), ves: money(wallet.ves_cents) } });
  } catch (e) {
    if (e.message === 'INSUFFICIENT_VES') return error(res, 400, 'You do not have enough VEs.');
    if (e.message === 'REWARD_UNAVAILABLE') return error(res, 409, 'This reward is no longer available.');
    return error(res, 500, 'Redemption failed.');
  }
});

router.get('/wallet', requireAuth, (req, res) => {
  const w = walletFor(req.session.userId);
  res.json({ gems: money(w.gems_cents), ves: money(w.ves_cents), lifetimeGemsEarned: money(w.lifetime_gems_earned), lifetimeGemsSpent: money(w.lifetime_gems_spent), lifetimeVesEarned: money(w.lifetime_ves_earned), lifetimeVesSpent: money(w.lifetime_ves_spent), updatedAt: w.updated_at });
});
router.get('/wallet/history', requireAuth, (req, res) => res.json({ items: db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(req.session.userId).map(t => ({ ...t, gems: money(t.gems_delta_cents), ves: money(t.ves_delta_cents) })) }));
router.get('/transactions', requireAuth, (req, res) => {
  const type = cleanText(req.query.type, 50);
  const q = cleanText(req.query.q, 100);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  let where = 'WHERE user_id = ?';
  const params = [req.session.userId];
  if (type && type !== 'All') { where += ' AND type = ?'; params.push(type); }
  if (q) { where += ' AND (transaction_code LIKE ? OR description LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  const total = db.prepare(`SELECT COUNT(*) AS count FROM transactions ${where}`).get(...params).count;
  const items = db.prepare(`SELECT * FROM transactions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, (page - 1) * limit);
  res.json({ items: items.map(t => ({ ...t, gems: money(t.gems_delta_cents), ves: money(t.ves_delta_cents) })), page, pages: Math.max(1, Math.ceil(total / limit)), total });
});

router.get('/offers', requireAuth, (req, res) => {
  const id = req.session.userId;
  const claimed = db.prepare('SELECT offer_id FROM offer_claims WHERE user_id = ?').all(id).map(x => x.offer_id);
  res.json({ offers: db.prepare('SELECT * FROM offers WHERE active = 1 ORDER BY id').all().map(o => ({ id: o.id, title: o.title, description: o.description, rewardGems: money(o.reward_gems_cents), expiresAt: o.expires_at, claimed: claimed.includes(o.id) })) });
});
router.post('/offers/:id/claim', requireAuth, (req, res) => {
  const id = req.session.userId, offerId = Number(req.params.id);
  const offer = db.prepare('SELECT * FROM offers WHERE id = ? AND active = 1').get(offerId);
  if (!offer || offer.expires_at < new Date().toISOString().slice(0, 10)) return error(res, 404, 'Offer is unavailable or expired.');
  try {
    const run = db.transaction(() => {
      db.prepare('INSERT INTO offer_claims (user_id, offer_id) VALUES (?, ?)').run(id, offerId);
      db.prepare('UPDATE wallets SET gems_cents = gems_cents + ?, lifetime_gems_earned = lifetime_gems_earned + ? WHERE user_id = ?').run(offer.reward_gems_cents, offer.reward_gems_cents, id);
      addTransaction(id, 'Gem Earn', offer.title, offer.reward_gems_cents, 0);
      addNotification(id, 'Offer claimed', `You earned ${money(offer.reward_gems_cents)} Gems from ${offer.title}.`);
    });
    run();
    res.json({ message: `Offer claimed. You earned ${money(offer.reward_gems_cents)} Gems.` });
  } catch (e) {
    if (String(e.code).includes('SQLITE_CONSTRAINT')) return error(res, 409, 'This offer has already been claimed.');
    return error(res, 500, 'Could not claim this offer.');
  }
});

router.get('/notifications', requireAuth, (req, res) => res.json({ notifications: db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(req.session.userId) }));
router.patch('/notifications/:id/read', requireAuth, (req, res) => {
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.session.userId);
  if (!result.changes) return error(res, 404, 'Notification not found.');
  res.json({ message: 'Notification marked as read.' });
});
router.patch('/notifications/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.userId);
  res.json({ message: 'All notifications marked as read.' });
});

router.get('/profile', requireAuth, (req, res) => res.json({ user: userFor(req.session.userId) }));
router.patch('/profile', requireAuth, (req, res) => {
  const first = cleanText(req.body.firstName, 80), last = cleanText(req.body.lastName, 80), mobile = cleanText(req.body.mobile, 30), country = cleanText(req.body.country, 80);
  if (first.length < 2 || !last || mobile.length < 7) return error(res, 400, 'Enter a valid first name, last name, and mobile number.');
  db.prepare('UPDATE users SET first_name = ?, last_name = ?, mobile = ?, country = ? WHERE id = ?').run(first, last, mobile, country, req.session.userId);
  res.json({ message: 'Profile saved successfully.', user: userFor(req.session.userId) });
});
router.post('/security/change-password', requireAuth, (req, res) => {
  const current = String(req.body.currentPassword || ''), next = String(req.body.newPassword || ''), confirm = String(req.body.confirmPassword || '');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!bcrypt.compareSync(current, user.password_hash)) return error(res, 400, 'Current password is incorrect.');
  if (next.length < 8 || !/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/[0-9]/.test(next) || !/[^A-Za-z0-9]/.test(next)) return error(res, 400, 'New password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
  if (next !== confirm) return error(res, 400, 'Passwords do not match.');
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(next, 12), req.session.userId);
  req.session.regenerate(err => {
    if (err) return error(res, 500, 'Password changed, but session refresh failed. Please log in again.');
    req.session.userId = user.id;
    res.json({ message: 'Password changed successfully.' });
  });
});
router.get('/security/login-activity', requireAuth, (req, res) => res.json({ items: db.prepare('SELECT event, created_at FROM login_activity WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(req.session.userId) }));
router.post('/help/tickets', (req, res) => {
  const name = cleanText(req.body.name, 100), email = cleanText(req.body.email, 180).toLowerCase(), subject = cleanText(req.body.subject, 150), message = cleanText(req.body.message, 3000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 3 || message.length < 10) return error(res, 400, 'Please complete all support fields with valid information.');
  db.prepare('INSERT INTO support_tickets (user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)').run(req.session.userId || null, name, email, subject, message);
  res.status(201).json({ message: 'Your support ticket has been recorded.' });
});

module.exports = router;
