'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateDevcontainerJson } = require('../lib/devcontainer');

describe('devcontainer', () => {
  const baseContext = {
    projectName: 'my-project',
    currentDir: '/home/user/projects/my-project',
    homeDir: '/home/user',
    sandboxDir: '/home/user/.ai-cage-sandboxes/sandbox-my-project-abc123',
  };

  const baseConfig = {
    agents: ['claude', 'codex'],
    image: 'mcr.microsoft.com/devcontainers/base:ubuntu-24.04',
    mountAuth: true,
    mountAgents: ['claude', 'codex'],
    autoStartCommand: null,
  };

  it('generates devcontainer.json with correct name', () => {
    const json = generateDevcontainerJson(baseConfig, baseContext);
    assert.strictEqual(json.name, 'AI Cage (my-project)');
    assert.strictEqual(json.image, baseConfig.image);
    assert.strictEqual(json.remoteUser, 'vscode');
  });

  it('mounts project as workspaceMount and .vscode as overlay', () => {
    const json = generateDevcontainerJson(baseConfig, baseContext);
    assert.strictEqual(
      json.workspaceMount,
      'source=/home/user/projects/my-project,target=/workspace/my-project,type=bind,consistency=cached',
    );
    assert.strictEqual(json.workspaceFolder, '/workspace/my-project');
    assert.strictEqual(json.mounts.length, 3);
    const vscodeMount = json.mounts.find((m) =>
      m.includes(
        '/home/user/.ai-cage-sandboxes/sandbox-my-project-abc123/.vscode',
      ),
    );
    assert.ok(vscodeMount);
    assert.ok(vscodeMount.includes('/workspace/my-project/.vscode'));
    assert.ok(!vscodeMount.includes('tasks.json'));
    const projectMount = json.mounts.find((m) =>
      m.includes('/home/user/projects/my-project'),
    );
    assert.ok(
      !projectMount,
      'project must not appear in mounts, only in workspaceMount',
    );
  });

  it('includes selected auth mounts', () => {
    const json = generateDevcontainerJson(baseConfig, baseContext);
    assert.ok(json.mounts.some((m) => m.includes('/home/user/.claude')));
    assert.ok(json.mounts.some((m) => m.includes('/home/user/.codex')));
    assert.ok(
      !json.mounts.some((m) => m.includes('/home/user/.local/share/opencode')),
    );
  });

  it('excludes auth mounts when mountAuth is false', () => {
    const config = { ...baseConfig, mountAuth: false };
    const json = generateDevcontainerJson(config, baseContext);
    assert.strictEqual(json.mounts.length, 1);
    assert.ok(
      json.mounts.some((m) =>
        m.includes(
          '/home/user/.ai-cage-sandboxes/sandbox-my-project-abc123/.vscode',
        ),
      ),
    );
  });

  it('mounts only selected auth directories', () => {
    const config = { ...baseConfig, mountAgents: ['claude'] };
    const json = generateDevcontainerJson(config, baseContext);
    assert.ok(json.mounts.some((m) => m.includes('/home/user/.claude')));
    assert.ok(!json.mounts.some((m) => m.includes('/home/user/.codex')));
  });

  it('includes npm-packages feature with selected agents', () => {
    const json = generateDevcontainerJson(baseConfig, baseContext);
    const npmFeature =
      json.features['ghcr.io/devcontainers-extra/features/npm-packages:1'];
    assert.ok(npmFeature);
    assert.ok(npmFeature.packages.includes('@anthropic-ai/claude-code'));
    assert.ok(npmFeature.packages.includes('@openai/codex'));
  });

  it('includes postCreateCommand for antigravity', () => {
    const config = { ...baseConfig, agents: ['claude', 'antigravity'] };
    const json = generateDevcontainerJson(config, baseContext);
    assert.ok(json.postCreateCommand);
    assert.match(json.postCreateCommand, /antigravity\.google/);
  });

  it('omits postCreateCommand when no command agents', () => {
    const json = generateDevcontainerJson(baseConfig, baseContext);
    assert.strictEqual(json.postCreateCommand, undefined);
  });
});
