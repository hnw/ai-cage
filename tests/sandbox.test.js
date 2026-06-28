'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { prepareSandbox, computeSandboxDir } = require('../lib/sandbox');

describe('sandbox', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cage-sandbox-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('prepares sandbox directories', () => {
    prepareSandbox(tmpDir);
    assert.ok(fs.existsSync(path.join(tmpDir, '.devcontainer')));
  });

  it('recreates existing sandbox', () => {
    fs.writeFileSync(path.join(tmpDir, 'old-file.txt'), 'old');
    prepareSandbox(tmpDir);
    assert.ok(!fs.existsSync(path.join(tmpDir, 'old-file.txt')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.devcontainer')));
  });

  it('computes deterministic sandbox dir', () => {
    const dir1 = computeSandboxDir('/home/user', '/home/user/projects/foo');
    const dir2 = computeSandboxDir('/home/user', '/home/user/projects/foo');
    assert.strictEqual(dir1, dir2);
    assert.match(dir1, /sandbox-foo-[a-f0-9]{12}$/);
  });

  it('computes different sandbox dir for different projects', () => {
    const dir1 = computeSandboxDir('/home/user', '/home/user/projects/foo');
    const dir2 = computeSandboxDir('/home/user', '/home/user/projects/bar');
    assert.notStrictEqual(dir1, dir2);
  });
});
