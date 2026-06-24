#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

// =====================================================================
// 0. Windows対応: ネイティブ Windows は WSL2 内で実行を強制
// =====================================================================
if (process.platform === 'win32') {
    console.error("❌ ai-cage は WSL2 上で実行してください。");
    console.error("   WSL2のターミナルを開き、そこで ai-cage コマンドを実行してください。");
    process.exit(1);
}

// =====================================================================
// 1. パスとハッシュの生成（Colima対応のホームディレクトリ配下）
// =====================================================================
const currentDir = process.cwd();
const projectName = path.basename(currentDir);
const hash = crypto.createHash('sha256').update(currentDir).digest('hex').substring(0, 12);

const homeDir = os.homedir();
const sandboxBaseDir = path.join(homeDir, '.ai-cage-sandboxes');
const sandboxDir = path.join(sandboxBaseDir, `sandbox-${projectName}-${hash}`);

if (fs.existsSync(sandboxDir)) {
    console.warn(`Removing existing sandbox: ${sandboxDir}`);
    fs.rmSync(sandboxDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(sandboxDir, '.devcontainer'), { recursive: true });

// =====================================================================
// 2. Dockerルーティング（DOCKER_HOSTの動的抽出）
// =====================================================================
let dockerHost = process.env.DOCKER_HOST || "";
if (!dockerHost) {
    try {
        dockerHost = execSync("docker context inspect --format '{{.Endpoints.docker.Host}}'", { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch (e) {
        console.warn("⚠️  docker context inspect に失敗しました。Docker Desktop/Engine が起動しているか確認してください。");
    }
}
const runEnv = Object.assign({}, process.env);
if (dockerHost) runEnv.DOCKER_HOST = dockerHost;

// =====================================================================
// 👑 3. 永続化マウント戦略（Mount Once, Use Forever）
// =====================================================================
const authMounts = [];

// 💡 ゲスト側で認証した内容をホストに永続化させるため、ホストにフォルダがなければ事前作成する
const ensureAndMount = (subPath) => {
    const fullHostPath = path.join(homeDir, subPath);
    if (!fs.existsSync(fullHostPath)) {
        fs.mkdirSync(fullHostPath, { recursive: true });
    }
    authMounts.push(`source=${fullHostPath},target=/home/vscode/${subPath},type=bind,consistency=cached`);
};

ensureAndMount('.claude');
ensureAndMount('.codex');
ensureAndMount('.copilot');
ensureAndMount('.gemini');
ensureAndMount('.config/opencode');

// =====================================================================
// 4. DevContainer構成の生成
// =====================================================================
const containerProjectPath = `/workspace/${projectName}`;

const devcontainerJson = {
    name: `AI Cage (${projectName})`,
    image: "mcr.microsoft.com/devcontainers/base:ubuntu-24.04",
    remoteUser: "vscode",
    updateRemoteUserUID: true,
    workspaceFolder: containerProjectPath, 
    
    // 💡 環境変数は一切使わず、永続化バインドマウントのみでセキュアに構成
    mounts: [
        `source=${currentDir},target=${containerProjectPath},type=bind,consistency=cached`,
        ...authMounts
    ],

    features: { 
        "ghcr.io/devcontainers/features/common-utils:1": {},
        "ghcr.io/devcontainers/features/node:1": {},

        "ghcr.io/devcontainers-extra/features/ripgrep:1": {},

        "ghcr.io/devcontainers-extra/features/npm-packages:1": {
            "packages": "@anthropic-ai/claude-code,@openai/codex,@github/copilot,opencode-ai"
        },
    },
    
    postCreateCommand: [
        "curl -fsSL https://antigravity.google/cli/install.sh | bash",
    ].join(" && ")
};

fs.writeFileSync(path.join(sandboxDir, '.devcontainer', 'devcontainer.json'), JSON.stringify(devcontainerJson, null, 2));

// =====================================================================
// 5. URIの生成と起動
// =====================================================================
const hexPath = Buffer.from(sandboxDir).toString('hex');
const internalUri = `vscode-remote://dev-container+${hexPath}${containerProjectPath}`;

console.log(`\n==================================================`);
console.log(` 👑 Welcome to AI Cage (Universal AI Sandbox) `);
console.log(`==================================================`);
console.log(`🚀 Opening secure cage for project: [${projectName}]`);
if (dockerHost) console.log(`🔌 Routed via DOCKER_HOST: ${dockerHost}`);
console.log(`🔒 Authentication Strategy: Secure Persistent Mounts`);

const isMac = process.platform === 'darwin';

try {
    // 💡 実行時の環境変数(DOCKER_HOST)だけを伝書鳩に持たせて発射
    execSync(`code --folder-uri "${internalUri}"`, { stdio: 'ignore', env: runEnv });
} catch (err) {
    if (isMac) {
        const macCodePath = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
        if (fs.existsSync(macCodePath)) {
            execSync(`"${macCodePath}" --folder-uri "${internalUri}"`, { stdio: 'inherit', env: runEnv });
        } else {
            console.error("❌ Error: VS Code binary not found.");
            process.exit(1);
        }
    } else {
        console.error("❌ Error: Failed to launch VS Code.");
        process.exit(1);
    }
}
