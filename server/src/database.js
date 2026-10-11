const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const configured = process.env.DATABASE_PATH || './database/veloop.sqlite';
const dbPath = path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
const schema = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
db.exec(schema);

function seed() {
  const rateCount = db.prepare('SELECT COUNT(*) AS count FROM exchange_rates').get().count;
  if (!rateCount) db.prepare('INSERT INTO exchange_rates (rate, active) VALUES (?, 1)').run(5.39);

  const rewardsCount = db.prepare('SELECT COUNT(*) AS count FROM rewards').get().count;
  if (!rewardsCount) {
    const insert = db.prepare('INSERT INTO rewards (name, category, description, image_label, cost_ves_cents, stock) VALUES (?, ?, ?, ?, ?, ?)');
    const rows = [
      ['Digital Gift Card', 'Gift Cards', 'A demo digital reward for your VE balance.', 'GIFT', 25000, 100],
      ['Shopping Voucher', 'Shopping', 'A sample shopping voucher redemption.', 'SHOP', 50000, 100],
      ['Entertainment Pass', 'Entertainment', 'A sample entertainment reward.', 'PLAY', 75000, 100],
      ['Digital Bundle', 'Digital Rewards', 'A digital reward bundle for demonstration.', 'DIGI', 120000, 100],
      ['Premium Gift Card', 'Gift Cards', 'A premium sample reward.', 'PREM', 200000, 50],
      ['Lifestyle Voucher', 'Shopping', 'A sample lifestyle reward.', 'LIFE', 150000, 50]
    ];
    const tx = db.transaction(() => rows.forEach(r => insert.run(...r)));
    tx();
  }

  const activitiesCount = db.prepare('SELECT COUNT(*) AS count FROM earning_activities').get().count;
  if (!activitiesCount) {
    const insert = db.prepare('INSERT INTO earning_activities (name, description, reward_gems_cents, frequency) VALUES (?, ?, ?, ?)');
    [
      ['Daily Check-in', 'Claim your daily welcome reward.', 500, 'daily'],
      ['Complete Survey', 'Complete a sample survey activity.', 2000, 'once'],
      ['Watch Video', 'Complete a demo video activity.', 1000, 'once'],
      ['Refer a Friend', 'Learn how referral rewards would work.', 2500, 'once'],
      ['Complete Profile', 'Keep your account information complete.', 1500, 'once'],
      ['Special Offer', 'Claim a sample promotional activity.', 3000, 'once']
    ].forEach(r => insert.run(...r));
  }

  const offersCount = db.prepare('SELECT COUNT(*) AS count FROM offers').get().count;
  if (!offersCount) {
    const insert = db.prepare('INSERT INTO offers (title, description, reward_gems_cents, expires_at) VALUES (?, ?, ?, ?)');
    [
      ['Welcome Offer', 'A sample one-time welcome offer.', 1000, '2099-12-31'],
      ['Profile Completion', 'Complete your profile to claim this offer.', 1500, '2099-12-31'],
      ['Community Challenge', 'A sample challenge for demonstration.', 2000, '2099-12-31']
    ].forEach(r => insert.run(...r));
  }
}

module.exports = { db, seed };
