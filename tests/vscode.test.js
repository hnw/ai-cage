'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { generateTasksJson, generateVscodeDir } = require('../lib/vscode');

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

  it('generates .vscode directory with tasks.json', () => {
    generateVscodeDir(tmpDir, { autoStartCommand: 'opencode' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.vscode', 'tasks.json')));
    const tasks = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.vscode', 'tasks.json'), 'utf8'),
    );
    assert.strictEqual(tasks.tasks[0].command, 'opencode');
  });

  it('copies project .vscode contents into sandbox .vscode', () => {
    const projectVscodeDir = path.join(tmpDir, 'project', '.vscode');
    fs.mkdirSync(projectVscodeDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectVscodeDir, 'settings.json'),
      JSON.stringify({ 'editor.tabSize': 4 }),
    );

    const sandboxDir = path.join(tmpDir, 'sandbox');
    generateVscodeDir(
      sandboxDir,
      { autoStartCommand: 'claude' },
      projectVscodeDir,
    );

    const copiedSettings = path.join(sandboxDir, '.vscode', 'settings.json');
    assert.ok(fs.existsSync(copiedSettings));
    const settings = JSON.parse(fs.readFileSync(copiedSettings, 'utf8'));
    assert.strictEqual(settings['editor.tabSize'], 4);
  });

  it('overwrites project tasks.json with auto-start task', () => {
    const projectVscodeDir = path.join(tmpDir, 'project', '.vscode');
    fs.mkdirSync(projectVscodeDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectVscodeDir, 'tasks.json'),
      JSON.stringify({ version: '2.0.0', tasks: [{ label: 'project task' }] }),
    );

    const sandboxDir = path.join(tmpDir, 'sandbox');
    generateVscodeDir(
      sandboxDir,
      { autoStartCommand: 'claude' },
      projectVscodeDir,
    );

    const tasks = JSON.parse(
      fs.readFileSync(path.join(sandboxDir, '.vscode', 'tasks.json'), 'utf8'),
    );
    assert.strictEqual(tasks.tasks.length, 1);
    assert.strictEqual(tasks.tasks[0].label, 'Start claude');
    assert.strictEqual(tasks.tasks[0].command, 'claude');
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
