'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { getAgent } = require('./agents');

function generateTasksJson(config) {
  if (!config.autoStartAgent) {
    return null;
  }

  const agent = getAgent(config.autoStartAgent);
  if (!agent) {
    throw new Error(`Unknown autoStartAgent: ${config.autoStartAgent}`);
  }

  return {
    version: '2.0.0',
    tasks: [
      {
        label: `Start ${agent.name}`,
        type: 'shell',
        command: agent.command,
        problemMatcher: [],
        runOptions: {
          runOn: 'folderOpen',
        },
        presentation: {
          reveal: 'always',
          panel: 'dedicated',
          close: false,
        },
      },
    ],
  };
}

function writeTasksJson(sandboxDir, tasksJson) {
  if (!tasksJson) {
    return;
  }
  const vscodeDir = path.join(sandboxDir, '.vscode');
  fs.writeFileSync(
    path.join(vscodeDir, 'tasks.json'),
    JSON.stringify(tasksJson, null, 2),
  );
}

function launchVsCode({ sandboxDir, projectName, dockerHost }) {
  const hexPath = Buffer.from(sandboxDir).toString('hex');
  const containerProjectPath = `/workspace/${projectName}`;
  const internalUri = `vscode-remote://dev-container+${hexPath}${containerProjectPath}`;

  const runEnv = Object.assign({}, process.env);
  if (dockerHost) {
    runEnv.DOCKER_HOST = dockerHost;
  }

  try {
    execSync(`code --folder-uri "${internalUri}"`, {
      stdio: 'ignore',
      env: runEnv,
    });
  } catch (err) {
    const isMac = process.platform === 'darwin';
    if (isMac) {
      const macCodePath =
        '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
      if (fs.existsSync(macCodePath)) {
        execSync(`"${macCodePath}" --folder-uri "${internalUri}"`, {
          stdio: 'inherit',
          env: runEnv,
        });
        return;
      }
    }
    throw err;
  }
}

module.exports = {
  generateTasksJson,
  writeTasksJson,
  launchVsCode,
};
