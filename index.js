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
const { prepareSandbox, computeSandboxDir } = require('./lib/sandbox');
const {
  generateTasksJson,
  writeTasksJson,
  launchVsCode,
} = require('./lib/vscode');

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
    config = loadConfig({ cwd: currentDir, cliOptions: options });
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  const devcontainerJson = generateDevcontainerJson(config, {
    projectName,
    currentDir,
    homeDir,
  });

  const tasksJson = generateTasksJson(config);

  if (options.printDevcontainerJson) {
    console.log(JSON.stringify(devcontainerJson, null, 2));
    return;
  }

  const dockerHost = resolveDockerHost();

  if (options.dryRun) {
    console.log('\n==================================================');
    console.log(' 👑 Welcome to AI Cage (Universal AI Sandbox) ');
    console.log('==================================================');
    console.log(`📦 Project: ${projectName}`);
    console.log(`📁 Sandbox: ${sandboxDir}`);
    console.log(`🐳 Docker Host: ${dockerHost || '(default)'}`);
    console.log(`🤖 Agents: ${config.agents.join(', ')}`);
    console.log(`🔒 Mount Auth: ${config.mountAuth ? 'yes' : 'no'}`);
    if (config.autoStartAgent) {
      console.log(`🚀 Auto-start Agent: ${config.autoStartAgent}`);
    }
    console.log('\n--- Generated devcontainer.json ---');
    console.log(JSON.stringify(devcontainerJson, null, 2));
    if (tasksJson) {
      console.log('\n--- Generated .vscode/tasks.json ---');
      console.log(JSON.stringify(tasksJson, null, 2));
    }
    return;
  }

  if (config.mountAuth) {
    prepareAuthDirectories(homeDir);
  }

  prepareSandbox(sandboxDir);
  fs.writeFileSync(
    path.join(sandboxDir, '.devcontainer', 'devcontainer.json'),
    JSON.stringify(devcontainerJson, null, 2),
  );
  writeTasksJson(sandboxDir, tasksJson);

  console.log('\n==================================================');
  console.log(' 👑 Welcome to AI Cage (Universal AI Sandbox) ');
  console.log('==================================================');
  console.log(`🚀 Opening secure cage for project: [${projectName}]`);
  if (dockerHost) {
    console.log(`🔌 Routed via DOCKER_HOST: ${dockerHost}`);
  }
  console.log('🔒 Authentication Strategy: Secure Persistent Mounts');

  try {
    launchVsCode({ sandboxDir, projectName, dockerHost });
  } catch (err) {
    console.error('❌ Error: Failed to launch VS Code.');
    if (options.verbose) {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
