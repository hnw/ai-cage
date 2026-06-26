'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadConfig, mergeConfig } = require('../lib/config');

describe('config', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cage-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads default config', () => {
    const config = loadConfig({ cwd: tmpDir, cliOptions: {} });
    assert.deepStrictEqual(config.agents, [
      'claude',
      'codex',
      'copilot',
      'antigravity',
      'opencode',
    ]);
    assert.strictEqual(
      config.image,
      'mcr.microsoft.com/devcontainers/base:ubuntu-24.04',
    );
    assert.strictEqual(config.mountAuth, true);
    assert.strictEqual(config.autoStartAgent, null);
  });

  it('merges project config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({ agents: ['claude', 'codex'], mountAuth: false }),
    );
    const config = loadConfig({ cwd: tmpDir, cliOptions: {} });
    assert.deepStrictEqual(config.agents, ['claude', 'codex']);
    assert.strictEqual(config.mountAuth, false);
  });

  it('cli options override project config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({ agents: ['claude'] }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      cliOptions: { agents: ['codex'] },
    });
    assert.deepStrictEqual(config.agents, ['codex']);
  });

  it('loads explicit config path', () => {
    const configPath = path.join(tmpDir, 'custom.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ agents: ['opencode'], image: 'custom:tag' }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      cliOptions: { configPath },
    });
    assert.deepStrictEqual(config.agents, ['opencode']);
    assert.strictEqual(config.image, 'custom:tag');
  });

  it('throws when autoStartAgent is not in agents', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({ agents: ['claude'], autoStartAgent: 'codex' }),
    );
    assert.throws(
      () => loadConfig({ cwd: tmpDir, cliOptions: {} }),
      /autoStartAgent "codex" is not in agents list/,
    );
  });

  it('mergeConfig applies sources in order', () => {
    const result = mergeConfig(
      { agents: ['claude'], image: 'default', mountAuth: true },
      { image: 'global' },
      { mountAuth: false },
    );
    assert.deepStrictEqual(result.agents, ['claude']);
    assert.strictEqual(result.image, 'global');
    assert.strictEqual(result.mountAuth, false);
  });
});
