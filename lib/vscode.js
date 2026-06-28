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

function generateWorkspaceFile(sandboxDir, config, projectName) {
  const workspaceFileName = `${projectName}.code-workspace`;
  const workspaceFilePath = path.join(sandboxDir, workspaceFileName);

  fs.mkdirSync(sandboxDir, { recursive: true });

  const workspaceFile = {
    folders: [
      {
        path: `/workspace/${projectName}`,
      },
    ],
    tasks: generateTasksJson(config),
  };

  fs.writeFileSync(
    workspaceFilePath,
    `${JSON.stringify(workspaceFile, null, 2)}\n`,
  );
  return workspaceFilePath;
}

function launchVsCode({ sandboxDir, projectName, dockerHost }) {
  const hexPath = Buffer.from(sandboxDir).toString('hex');
  const workspaceFileName = `${projectName}.code-workspace`;
  const workspaceFilePath = `/home/vscode/${workspaceFileName}`;
  const internalUri = `vscode-remote://dev-container+${hexPath}${workspaceFilePath}`;

  const runEnv = Object.assign({}, process.env);
  if (dockerHost) {
    runEnv.DOCKER_HOST = dockerHost;
  }

  try {
    execSync(`code --file-uri "${internalUri}"`, {
      stdio: 'ignore',
      env: runEnv,
    });
  } catch (err) {
    const isMac = process.platform === 'darwin';
    if (isMac) {
      const macCodePath =
        '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
      if (fs.existsSync(macCodePath)) {
        execSync(`"${macCodePath}" --file-uri "${internalUri}"`, {
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
  generateWorkspaceFile,
  launchVsCode,
};
