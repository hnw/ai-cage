'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateTasksJson } = require('../lib/vscode');

describe('vscode', () => {
  it('returns null when no autoStartAgent', () => {
    const tasks = generateTasksJson({ autoStartAgent: null });
    assert.strictEqual(tasks, null);
  });

  it('generates tasks.json for autoStartAgent', () => {
    const tasks = generateTasksJson({ autoStartAgent: 'claude' });
    assert.ok(tasks);
    assert.strictEqual(tasks.tasks.length, 1);
    assert.strictEqual(tasks.tasks[0].label, 'Start Claude Code');
    assert.strictEqual(tasks.tasks[0].command, 'claude');
    assert.strictEqual(tasks.tasks[0].runOptions.runOn, 'folderOpen');
    assert.strictEqual(tasks.tasks[0].presentation.reveal, 'always');
  });

  it('throws for unknown autoStartAgent', () => {
    assert.throws(
      () => generateTasksJson({ autoStartAgent: 'unknown' }),
      /Unknown autoStartAgent: unknown/,
    );
  });
});
