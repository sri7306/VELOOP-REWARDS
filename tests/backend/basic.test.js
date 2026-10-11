const test = require('node:test');
const assert = require('node:assert/strict');

test('project configuration has a start script', () => {
  const pkg = require('../../package.json');
  assert.equal(typeof pkg.scripts.start, 'string');
  assert.ok(pkg.scripts.start.includes('server/server.js'));
});

test('official SVG assets are present', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  assert.ok(fs.existsSync(path.join(__dirname, '../../assets/svg/gem(4).svg')));
  assert.ok(fs.existsSync(path.join(__dirname, '../../assets/svg/ve(4).svg')));
});
