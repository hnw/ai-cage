'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  buildNpmPackageList,
  buildPostCreateCommands,
  buildAuthSubPaths,
} = require('./agents');

function prepareAuthDirectories(homeDir, mountAgents) {
  for (const subPath of buildAuthSubPaths(mountAgents)) {
    const fullHostPath = path.join(homeDir, subPath);
    if (!fs.existsSync(fullHostPath)) {
      fs.mkdirSync(fullHostPath, { recursive: true });
    }
  }
}

function generateDevcontainerJson(config, context) {
  const { projectName, currentDir, homeDir, sandboxDir } = context;
  const containerProjectPath = `/workspace/${projectName}`;

  const workspaceMount = `source=${currentDir},target=${containerProjectPath},type=bind,consistency=consistent`;

  const mounts = [
    `source=${path.join(sandboxDir, '.vscode')},target=${path.join(containerProjectPath, '.vscode')},type=bind,consistency=consistent`,
  ];

  if (config.mountAuth) {
    for (const subPath of buildAuthSubPaths(config.mountAgents)) {
      const fullHostPath = path.join(homeDir, subPath);
      mounts.push(
        `source=${fullHostPath},target=/home/vscode/${subPath},type=bind,consistency=cached`,
      );
    }
  }

  const features = {
    'ghcr.io/devcontainers/features/common-utils:1': {},
    'ghcr.io/devcontainers/features/node:1': {},
    'ghcr.io/devcontainers-extra/features/ripgrep:1': {},
  };

  const npmPackages = buildNpmPackageList(config.agents);
  if (npmPackages.length > 0) {
    features['ghcr.io/devcontainers-extra/features/npm-packages:1'] = {
      packages: npmPackages.join(','),
    };
  }

  const postCreateCommands = buildPostCreateCommands(config.agents);

  const devcontainerJson = {
    name: `AI Cage (${projectName})`,
    image: config.image,
    remoteUser: 'vscode',
    updateRemoteUserUID: true,
    workspaceMount,
    workspaceFolder: containerProjectPath,
    mounts,
    features,
  };

  if (postCreateCommands.length > 0) {
    devcontainerJson.postCreateCommand = postCreateCommands.join(' && ');
  }

  return devcontainerJson;
}

module.exports = {
  prepareAuthDirectories,
  generateDevcontainerJson,
};
