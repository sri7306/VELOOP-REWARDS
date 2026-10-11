function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Please log in to continue.' });
  next();
}
function cleanText(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}
function money(value) {
  return Number((Number(value || 0) / 100).toFixed(2));
}
function toCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}
function code(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
module.exports = { requireAuth, cleanText, money, toCents, code };
