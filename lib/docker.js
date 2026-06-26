'use strict';

const { execSync } = require('node:child_process');

function resolveDockerHost() {
  const envHost = process.env.DOCKER_HOST;
  if (envHost) {
    return envHost;
  }

  try {
    return execSync(
      "docker context inspect --format '{{.Endpoints.docker.Host}}'",
      { stdio: ['ignore', 'pipe', 'ignore'] },
    )
      .toString()
      .trim();
  } catch {
    return '';
  }
}

module.exports = {
  resolveDockerHost,
};
