'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseArgs } = require('../lib/cli');

describe('cli', () => {
  it('parses empty args', () => {
    const options = parseArgs(['node', 'ai-cage']);
    assert.deepStrictEqual(options, {});
  });

  it('parses --print-devcontainer-json', () => {
    const options = parseArgs(['node', 'ai-cage', '--print-devcontainer-json']);
    assert.strictEqual(options.printDevcontainerJson, true);
  });

  it('parses --dry-run', () => {
    const options = parseArgs(['node', 'ai-cage', '--dry-run']);
    assert.strictEqual(options.dryRun, true);
  });

  it('parses --agents', () => {
    const options = parseArgs(['node', 'ai-cage', '--agents', 'claude,codex']);
    assert.deepStrictEqual(options.agents, ['claude', 'codex']);
  });

  it('parses --no-mount-auth', () => {
    const options = parseArgs(['node', 'ai-cage', '--no-mount-auth']);
    assert.strictEqual(options.mountAuth, false);
  });

  it('parses --verbose and --quiet', () => {
    const options = parseArgs(['node', 'ai-cage', '--verbose', '--quiet']);
    assert.strictEqual(options.verbose, true);
    assert.strictEqual(options.quiet, true);
  });

  it('parses --config', () => {
    const options = parseArgs([
      'node',
      'ai-cage',
      '--config',
      '/tmp/config.json',
    ]);
    assert.strictEqual(options.configPath, '/tmp/config.json');
  });

  it('parses --version and --help', () => {
    assert.strictEqual(
      parseArgs(['node', 'ai-cage', '--version']).version,
      true,
    );
    assert.strictEqual(parseArgs(['node', 'ai-cage', '--help']).help, true);
  });

  it('throws on unknown option', () => {
    assert.throws(
      () => parseArgs(['node', 'ai-cage', '--unknown']),
      /Unknown option: --unknown/,
    );
  });

  it('throws when --agents lacks value', () => {
    assert.throws(
      () => parseArgs(['node', 'ai-cage', '--agents']),
      /Option --agents requires a value/,
    );
  });
});
