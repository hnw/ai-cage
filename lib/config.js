'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { getDefaultAgents, validateAgentNames } = require('./agents');

const DEFAULT_CONFIG = {
  agents: getDefaultAgents(),
  image: 'mcr.microsoft.com/devcontainers/base:ubuntu-24.04',
  mountAuth: true,
  autoStartAgent: null,
};

function loadJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

function loadConfig({ cwd = process.cwd(), cliOptions = {} } = {}) {
  const globalConfigPath = path.join(
    os.homedir(),
    '.config',
    'ai-cage',
    'config.json',
  );
  const projectConfigPath = path.join(cwd, '.ai-cage.json');

  const globalConfig = loadJson(globalConfigPath);
  const projectConfig = loadJson(projectConfigPath);

  const explicitConfig = cliOptions.configPath
    ? loadJson(cliOptions.configPath)
    : {};

  const merged = mergeConfig(
    DEFAULT_CONFIG,
    globalConfig,
    projectConfig,
    explicitConfig,
  );

  if (cliOptions.agents !== undefined) {
    merged.agents = validateAgentNames(cliOptions.agents);
  }

  if (cliOptions.mountAuth !== undefined) {
    merged.mountAuth = cliOptions.mountAuth;
  }

  if (cliOptions.autoStartAgent !== undefined) {
    merged.autoStartAgent = cliOptions.autoStartAgent;
  }

  if (
    merged.autoStartAgent !== null &&
    !merged.agents.includes(merged.autoStartAgent)
  ) {
    throw new Error(
      `autoStartAgent "${merged.autoStartAgent}" is not in agents list`,
    );
  }

  return merged;
}

function mergeConfig(defaults, ...sources) {
  const result = { ...defaults };

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    if (source.agents !== undefined) {
      result.agents = validateAgentNames(source.agents);
    }
    if (source.image !== undefined) {
      result.image = source.image;
    }
    if (source.mountAuth !== undefined) {
      result.mountAuth = source.mountAuth;
    }
    if (source.autoStartAgent !== undefined) {
      result.autoStartAgent = source.autoStartAgent;
    }
  }

  return result;
}

module.exports = {
  DEFAULT_CONFIG,
  loadConfig,
  mergeConfig,
  loadJson,
};
