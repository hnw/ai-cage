'use strict';

const AGENTS = {
  claude: {
    name: 'Claude Code',
    command: 'claude',
    npmPackage: '@anthropic-ai/claude-code',
  },
  codex: {
    name: 'OpenAI Codex CLI',
    command: 'codex',
    npmPackage: '@openai/codex',
  },
  copilot: {
    name: 'GitHub Copilot CLI',
    command: 'copilot',
    npmPackage: '@github/copilot',
  },
  antigravity: {
    name: 'Google Antigravity CLI',
    command: 'antigravity',
    npmPackage: null,
    postCreateCommand:
      'curl -fsSL https://antigravity.google/cli/install.sh | bash',
  },
  opencode: {
    name: 'OpenCode',
    command: 'opencode',
    npmPackage: 'opencode-ai',
  },
};

const DEFAULT_AGENTS = Object.keys(AGENTS);

function getAgentKeys() {
  return Object.keys(AGENTS);
}

function getAgent(name) {
  return AGENTS[name] || null;
}

function getDefaultAgents() {
  return [...DEFAULT_AGENTS];
}

function validateAgentNames(names) {
  const invalid = names.filter((name) => !AGENTS[name]);
  if (invalid.length > 0) {
    throw new Error(
      `Unknown agent(s): ${invalid.join(', ')}. Available: ${getAgentKeys().join(', ')}`,
    );
  }
  return names;
}

function buildNpmPackageList(agentNames) {
  return agentNames
    .map((name) => AGENTS[name])
    .filter((agent) => agent?.npmPackage)
    .map((agent) => agent.npmPackage);
}

function buildPostCreateCommands(agentNames) {
  return agentNames
    .map((name) => AGENTS[name])
    .filter((agent) => agent?.postCreateCommand)
    .map((agent) => agent.postCreateCommand);
}

module.exports = {
  AGENTS,
  DEFAULT_AGENTS,
  getAgentKeys,
  getAgent,
  getDefaultAgents,
  validateAgentNames,
  buildNpmPackageList,
  buildPostCreateCommands,
};
