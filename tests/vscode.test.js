'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { generateTasksJson, generateWorkspaceFile } = require('../lib/vscode');

describe('vscode', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cage-vscode-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns bash task when no autoStartCommand', () => {
    const tasks = generateTasksJson({ autoStartCommand: null });
    assert.ok(tasks);
    assert.strictEqual(tasks.tasks.length, 1);
    assert.strictEqual(tasks.tasks[0].label, 'Start Bash');
    assert.strictEqual(tasks.tasks[0].command, 'bash');
    assert.strictEqual(tasks.tasks[0].runOptions.runOn, 'folderOpen');
  });

  it('generates tasks.json for autoStartCommand', () => {
    const tasks = generateTasksJson({ autoStartCommand: 'claude' });
    assert.ok(tasks);
    assert.strictEqual(tasks.tasks.length, 1);
    assert.strictEqual(tasks.tasks[0].label, 'Start claude');
    assert.strictEqual(tasks.tasks[0].command, 'claude');
    assert.strictEqual(tasks.tasks[0].options.cwd, '${workspaceFolder}');
    assert.strictEqual(tasks.tasks[0].runOptions.runOn, 'folderOpen');
    assert.strictEqual(tasks.tasks[0].presentation.reveal, 'always');
  });

  it('generates tasks.json for shell command with environment variables', () => {
    const tasks = generateTasksJson({
      autoStartCommand: 'OPENCODE_ENABLE_EXA=1 opencode',
    });
    assert.ok(tasks);
    assert.strictEqual(
      tasks.tasks[0].command,
      'OPENCODE_ENABLE_EXA=1 opencode',
    );
    assert.strictEqual(
      tasks.tasks[0].label,
      'Start OPENCODE_ENABLE_EXA=1 opencode',
    );
  });

  it('generates workspace file with tasks', () => {
    generateWorkspaceFile(
      tmpDir,
      { autoStartCommand: 'opencode' },
      'my-project',
    );
    const workspaceFilePath = path.join(tmpDir, 'my-project.code-workspace');
    assert.ok(fs.existsSync(workspaceFilePath));
    const workspace = JSON.parse(fs.readFileSync(workspaceFilePath, 'utf8'));
    assert.strictEqual(workspace.folders[0].path, '/workspace/my-project');
    assert.strictEqual(workspace.tasks.tasks[0].command, 'opencode');
  });

  it('does not copy project .vscode contents into workspace file', () => {
    const projectVscodeDir = path.join(tmpDir, 'project', '.vscode');
    fs.mkdirSync(projectVscodeDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectVscodeDir, 'settings.json'),
      JSON.stringify({ 'editor.tabSize': 4 }),
    );

    const sandboxDir = path.join(tmpDir, 'sandbox');
    generateWorkspaceFile(
      sandboxDir,
      { autoStartCommand: 'claude' },
      'my-project',
    );

    const workspaceFilePath = path.join(
      sandboxDir,
      'my-project.code-workspace',
    );
    assert.ok(fs.existsSync(workspaceFilePath));
    const workspace = JSON.parse(fs.readFileSync(workspaceFilePath, 'utf8'));
    assert.strictEqual(workspace.settings, undefined);
    assert.strictEqual(workspace.tasks.tasks[0].command, 'claude');
  });

  it('uses autoStartCommandLabel when provided', () => {
    const tasks = generateTasksJson({
      autoStartCommand: 'OPENCODE_ENABLE_EXA=1 opencode',
      autoStartCommandLabel: 'OpenCode with Exa',
    });
    assert.strictEqual(tasks.tasks[0].label, 'OpenCode with Exa');
    assert.strictEqual(
      tasks.tasks[0].command,
      'OPENCODE_ENABLE_EXA=1 opencode',
    );
  });
});
