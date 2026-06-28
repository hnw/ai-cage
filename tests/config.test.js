'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadConfig, mergeConfig } = require('../lib/config');

describe('config', () => {
  let tmpDir;
  let tmpHomeDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cage-test-'));
    tmpHomeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cage-home-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(tmpHomeDir, { recursive: true, force: true });
  });

  it('loads default config', () => {
    const config = loadConfig({
      cwd: tmpDir,
      homeDir: tmpHomeDir,
      cliOptions: {},
    });
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
    assert.deepStrictEqual(config.mountAgents, [
      'claude',
      'codex',
      'copilot',
      'antigravity',
      'opencode',
    ]);
    assert.strictEqual(config.autoStartCommand, null);
  });

  it('merges project config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({ agents: ['claude', 'codex'], mountAuth: false }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      homeDir: tmpHomeDir,
      cliOptions: {},
    });
    assert.deepStrictEqual(config.agents, ['claude', 'codex']);
    assert.deepStrictEqual(config.mountAgents, ['claude', 'codex']);
    assert.strictEqual(config.mountAuth, false);
  });

  it('cli options override project config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({ agents: ['claude'] }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      homeDir: tmpHomeDir,
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
      homeDir: tmpHomeDir,
      cliOptions: { configPath },
    });
    assert.deepStrictEqual(config.agents, ['opencode']);
    assert.strictEqual(config.image, 'custom:tag');
  });

  it('allows autoStartCommand with arbitrary shell command', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({
        agents: ['opencode'],
        autoStartCommand: 'OPENCODE_ENABLE_EXA=1 opencode',
      }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      homeDir: tmpHomeDir,
      cliOptions: {},
    });
    assert.strictEqual(
      config.autoStartCommand,
      'OPENCODE_ENABLE_EXA=1 opencode',
    );
  });

  it('allows mountAgents subset of agents', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({ agents: ['claude', 'codex'], mountAgents: ['claude'] }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      homeDir: tmpHomeDir,
      cliOptions: {},
    });
    assert.deepStrictEqual(config.agents, ['claude', 'codex']);
    assert.deepStrictEqual(config.mountAgents, ['claude']);
  });

  it('allows mountAgents to contain agents not in agents list', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({ agents: ['claude'], mountAgents: ['claude', 'codex'] }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      homeDir: tmpHomeDir,
      cliOptions: {},
    });
    assert.deepStrictEqual(config.agents, ['claude']);
    assert.deepStrictEqual(config.mountAgents, ['claude', 'codex']);
  });

  it('throws when explicit config file does not exist', () => {
    assert.throws(
      () =>
        loadConfig({
          cwd: tmpDir,
          homeDir: tmpHomeDir,
          cliOptions: { configPath: '/tmp/ai-cage-does-not-exist.json' },
        }),
      /Config file not found/,
    );
  });

  it('loads autoStartCommandLabel from project config', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.ai-cage.json'),
      JSON.stringify({
        agents: ['opencode'],
        autoStartCommand: 'OPENCODE_ENABLE_EXA=1 opencode',
        autoStartCommandLabel: 'OpenCode with Exa',
      }),
    );
    const config = loadConfig({
      cwd: tmpDir,
      homeDir: tmpHomeDir,
      cliOptions: {},
    });
    assert.strictEqual(config.autoStartCommandLabel, 'OpenCode with Exa');
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
