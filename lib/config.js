'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { getDefaultAgents, validateAgentNames } = require('./agents');

const DEFAULT_CONFIG = {
  agents: getDefaultAgents(),
  image: 'mcr.microsoft.com/devcontainers/base:ubuntu-24.04',
  mountAuth: true,
  mountAgents: null,
  autoStartCommand: null,
  autoStartCommandLabel: null,
};

function loadJson(filePath, { required = false } = {}) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      if (required) {
        throw new Error(`Config file not found: ${filePath}`);
      }
      return {};
    }
    throw new Error(`Failed to load config file ${filePath}: ${err.message}`);
  }
}

function loadConfig({
  cwd = process.cwd(),
  cliOptions = {},
  homeDir = os.homedir(),
} = {}) {
  const globalConfigPath = path.join(
    homeDir,
    '.config',
    'ai-cage',
    'config.json',
  );
  const projectConfigPath = path.join(cwd, '.ai-cage.json');

  const globalConfig = loadJson(globalConfigPath);
  const projectConfig = loadJson(projectConfigPath);

  const explicitConfig = cliOptions.configPath
    ? loadJson(cliOptions.configPath, { required: true })
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

  if (cliOptions.mountAgents !== undefined) {
    merged.mountAgents = validateAgentNames(cliOptions.mountAgents);
  }

  if (cliOptions.mountAuth !== undefined) {
    merged.mountAuth = cliOptions.mountAuth;
  }

  if (cliOptions.autoStartCommand !== undefined) {
    merged.autoStartCommand = cliOptions.autoStartCommand;
  }

  if (cliOptions.autoStartCommandLabel !== undefined) {
    merged.autoStartCommandLabel = cliOptions.autoStartCommandLabel;
  }

  if (merged.mountAgents === null) {
    merged.mountAgents = merged.agents;
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
    if (source.mountAgents !== undefined) {
      result.mountAgents = validateAgentNames(source.mountAgents);
    }
    if (source.autoStartCommand !== undefined) {
      result.autoStartCommand = source.autoStartCommand;
    }
    if (source.autoStartCommandLabel !== undefined) {
      result.autoStartCommandLabel = source.autoStartCommandLabel;
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
