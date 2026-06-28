'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

function generateTasksJson(config) {
  const command = config.autoStartCommand || 'bash';
  const label =
    config.autoStartCommandLabel ||
    (config.autoStartCommand
      ? `Start ${config.autoStartCommand}`
      : 'Start Bash');

  return {
    version: '2.0.0',
    tasks: [
      {
        label,
        type: 'shell',
        command,
        problemMatcher: [],
        options: {
          cwd: '${workspaceFolder}',
        },
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

function generateVscodeDir(sandboxDir, config, projectVscodeDir) {
  const vscodeDir = path.join(sandboxDir, '.vscode');
  fs.mkdirSync(vscodeDir, { recursive: true });

  if (projectVscodeDir && fs.existsSync(projectVscodeDir)) {
    fs.cpSync(projectVscodeDir, vscodeDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(vscodeDir, 'tasks.json'),
    `${JSON.stringify(generateTasksJson(config), null, 2)}\n`,
  );
  return vscodeDir;
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
  generateVscodeDir,
  launchVsCode,
};
