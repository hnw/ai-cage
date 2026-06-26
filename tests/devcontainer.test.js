'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateDevcontainerJson } = require('../lib/devcontainer');

describe('devcontainer', () => {
  const context = {
    projectName: 'my-project',
    currentDir: '/home/user/projects/my-project',
    homeDir: '/home/user',
  };

  const baseConfig = {
    agents: ['claude', 'codex'],
    image: 'mcr.microsoft.com/devcontainers/base:ubuntu-24.04',
    mountAuth: true,
    autoStartAgent: null,
  };

  it('generates devcontainer.json with correct name', () => {
    const json = generateDevcontainerJson(baseConfig, context);
    assert.strictEqual(json.name, 'AI Cage (my-project)');
    assert.strictEqual(json.image, baseConfig.image);
    assert.strictEqual(json.remoteUser, 'vscode');
  });

  it('includes workspace mount and auth mounts', () => {
    const json = generateDevcontainerJson(baseConfig, context);
    assert.strictEqual(json.mounts.length, 6);
    assert.ok(json.mounts[0].includes('/home/user/projects/my-project'));
    assert.ok(json.mounts[1].includes('/home/user/.claude'));
  });

  it('excludes auth mounts when mountAuth is false', () => {
    const config = { ...baseConfig, mountAuth: false };
    const json = generateDevcontainerJson(config, context);
    assert.strictEqual(json.mounts.length, 1);
    assert.ok(json.mounts[0].includes('/home/user/projects/my-project'));
  });

  it('includes npm-packages feature with selected agents', () => {
    const json = generateDevcontainerJson(baseConfig, context);
    const npmFeature =
      json.features['ghcr.io/devcontainers-extra/features/npm-packages:1'];
    assert.ok(npmFeature);
    assert.ok(npmFeature.packages.includes('@anthropic-ai/claude-code'));
    assert.ok(npmFeature.packages.includes('@openai/codex'));
  });

  it('includes postCreateCommand for antigravity', () => {
    const config = { ...baseConfig, agents: ['claude', 'antigravity'] };
    const json = generateDevcontainerJson(config, context);
    assert.ok(json.postCreateCommand);
    assert.match(json.postCreateCommand, /antigravity\.google/);
  });

  it('omits postCreateCommand when no command agents', () => {
    const json = generateDevcontainerJson(baseConfig, context);
    assert.strictEqual(json.postCreateCommand, undefined);
  });
});
