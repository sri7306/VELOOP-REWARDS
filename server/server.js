require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { db, seed } = require('./src/database');
const app = express();
app.set('trust proxy', 1);
const SQLiteStore = SQLiteStoreFactory(session);
const port = Number(process.env.PORT || 3000);
const dbDir = path.join(__dirname, '..', 'database');
fs.mkdirSync(dbDir, { recursive: true });
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: dbDir }),
  secret: process.env.SESSION_SECRET || 'development-only-change-this-secret-before-deployment',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false }));
app.use('/api', require('./src/routes'));

const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir, { extensions: ['html'] }));
app.get('/', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
  res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

seed();
app.listen(port, () => console.log(`VELOOP Rewards running at http://localhost:${port}`));
