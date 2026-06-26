'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  getAgentKeys,
  getAgent,
  getDefaultAgents,
  validateAgentNames,
  buildNpmPackageList,
  buildPostCreateCommands,
} = require('../lib/agents');

describe('agents', () => {
  it('returns all agent keys', () => {
    const keys = getAgentKeys();
    assert.deepStrictEqual(keys, [
      'claude',
      'codex',
      'copilot',
      'antigravity',
      'opencode',
    ]);
  });

  it('returns agent metadata', () => {
    const agent = getAgent('claude');
    assert.strictEqual(agent.name, 'Claude Code');
    assert.strictEqual(agent.command, 'claude');
    assert.strictEqual(agent.npmPackage, '@anthropic-ai/claude-code');
  });

  it('returns null for unknown agent', () => {
    assert.strictEqual(getAgent('unknown'), null);
  });

  it('returns default agents', () => {
    assert.deepStrictEqual(getDefaultAgents(), getAgentKeys());
  });

  it('validates agent names', () => {
    assert.deepStrictEqual(validateAgentNames(['claude', 'codex']), [
      'claude',
      'codex',
    ]);
  });

  it('throws for invalid agent names', () => {
    assert.throws(
      () => validateAgentNames(['claude', 'unknown']),
      /Unknown agent\(s\): unknown/,
    );
  });

  it('builds npm package list', () => {
    const packages = buildNpmPackageList(['claude', 'antigravity']);
    assert.deepStrictEqual(packages, ['@anthropic-ai/claude-code']);
  });

  it('builds post-create commands', () => {
    const commands = buildPostCreateCommands(['claude', 'antigravity']);
    assert.strictEqual(commands.length, 1);
    assert.match(commands[0], /antigravity\.google/);
  });
});
