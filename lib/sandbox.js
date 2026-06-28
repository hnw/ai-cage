'use strict';

const fs = require('node:fs');
const path = require('node:path');

function prepareSandbox(sandboxDir) {
  if (fs.existsSync(sandboxDir)) {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(sandboxDir, '.devcontainer'), { recursive: true });
}

function computeSandboxDir(homeDir, currentDir) {
  const crypto = require('node:crypto');
  const projectName = path.basename(currentDir);
  const hash = crypto
    .createHash('sha256')
    .update(currentDir)
    .digest('hex')
    .substring(0, 12);
  const sandboxBaseDir = path.join(homeDir, '.ai-cage-sandboxes');
  return path.join(sandboxBaseDir, `sandbox-${projectName}-${hash}`);
}

module.exports = {
  prepareSandbox,
  computeSandboxDir,
};
