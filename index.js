#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { parseArgs, printHelp, printVersion } = require('./lib/cli');
const { loadConfig } = require('./lib/config');
const {
  prepareAuthDirectories,
  generateDevcontainerJson,
} = require('./lib/devcontainer');
const { resolveDockerHost } = require('./lib/docker');
const logger = require('./lib/logger');
const { prepareSandbox, computeSandboxDir } = require('./lib/sandbox');
const { generateWorkspaceFile, launchVsCode } = require('./lib/vscode');

function main() {
  if (process.platform === 'win32') {
    console.error('❌ ai-cage は WSL2 上で実行してください。');
    console.error(
      '   WSL2のターミナルを開き、そこで ai-cage コマンドを実行してください。',
    );
    process.exit(1);
  }

  let options;
  try {
    options = parseArgs(process.argv);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  logger.configure({
    quiet: options.quiet,
    verbose: options.verbose,
  });

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    printVersion();
    return;
  }

  const currentDir = process.cwd();
  const homeDir = os.homedir();
  const projectName = path.basename(currentDir);
  const sandboxDir = computeSandboxDir(homeDir, currentDir);

  let config;
  try {
    config = loadConfig({
      cwd: currentDir,
      cliOptions: options,
      homeDir,
    });
  } catch (err) {
    logger.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  const devcontainerJson = generateDevcontainerJson(config, {
    projectName,
    currentDir,
    homeDir,
    sandboxDir,
  });

  if (options.printDevcontainerJson) {
    console.log(JSON.stringify(devcontainerJson, null, 2));
    return;
  }

  const dockerHost = resolveDockerHost();

  if (options.dryRun) {
    logger.info('\n==================================================');
    logger.info(' 👑 Welcome to AI Cage (Universal AI Sandbox) ');
    logger.info('==================================================');
    logger.info(`📦 Project: ${projectName}`);
    logger.info(`📁 Sandbox: ${sandboxDir}`);
    logger.info(`🐳 Docker Host: ${dockerHost || '(default)'}`);
    logger.info(`🤖 Agents: ${config.agents.join(', ')}`);
    if (config.mountAuth) {
      logger.info(`🔒 Mount Auth: ${config.mountAgents.join(', ')}`);
    } else {
      logger.info('🔒 Mount Auth: no');
    }
    logger.info(
      `🚀 Auto-start Command: ${config.autoStartCommand || 'bash (default)'}`,
    );
    logger.info('\n--- Generated devcontainer.json ---');
    logger.info(JSON.stringify(devcontainerJson, null, 2));
    return;
  }

  if (config.mountAuth) {
    try {
      prepareAuthDirectories(homeDir, config.mountAgents);
    } catch (err) {
      logger.error(
        `❌ Error: Failed to create authentication directories. ${err.message}`,
      );
      if (options.verbose) {
        logger.error(err);
      }
      process.exit(1);
    }
  }

  try {
    prepareSandbox(sandboxDir);
    generateWorkspaceFile(sandboxDir, config, projectName);
    fs.writeFileSync(
      path.join(sandboxDir, '.devcontainer', 'devcontainer.json'),
      JSON.stringify(devcontainerJson, null, 2),
    );
  } catch (err) {
    logger.error(
      `❌ Error: Failed to prepare sandbox directory. ${err.message}`,
    );
    if (options.verbose) {
      logger.error(err);
    }
    process.exit(1);
  }

  logger.info(`🚀 Opening AI Cage for project: [${projectName}]`);
  logger.info(`🤖 Agents: ${config.agents.join(', ')}`);
  if (dockerHost) {
    logger.info(`🔌 Routed via DOCKER_HOST: ${dockerHost}`);
  }
  if (config.mountAuth) {
    logger.info(`🔒 Auth mounts: ${config.mountAgents.join(', ')}`);
  }

  try {
    launchVsCode({ sandboxDir, projectName, dockerHost });
  } catch (err) {
    logger.error('❌ Error: Failed to launch VS Code.');
    if (options.verbose) {
      logger.error(err);
    }
    process.exit(1);
  }
}

main();
