# ai-cage

AI エージェント（Claude Code / Codex CLI / OpenCode など）を、安全かつ簡単に VS Code DevContainer 内で動かすための CLI ツールです。

プロジェクトごとに隔離された DevContainer を起動し、認証情報はホスト側と共有して再利用します。

## できること

- 実行したディレクトリを対象に、専用の DevContainer を自動生成して VS Code で開く
- 各 AI ツールの認証情報をホスト側からマウントし、プロジェクトをまたいで使い回す
- 作業環境をコンテナ内に閉じ込め、ホスト環境を汚さない
- Colima / Docker Desktop / Docker Engine に対応

## 対応 AI ツール

コンテナ内に以下の CLI を自動インストールします。

- [Claude Code](https://code.claude.com/docs/en/overview)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [GitHub Copilot CLI](https://github.com/features/copilot/cli)
- [Antigravity CLI](https://antigravity.google/product/antigravity-cli)
- [OpenCode](https://opencode.ai/)


## 動作環境

- **macOS** + Colima または Docker Desktop
- **Linux** + Docker Engine
- **Windows** + WSL2（WSL2 内で実行してください）

> ⚠️ ネイティブ Windows（PowerShell / cmd.exe）からは実行できません。WSL2 内で `node ./index.js` を実行してください。

## 必要なもの

- Node.js 16 以上
- Docker（または Colima）
- VS Code
- VS Code 拡張機能 **Dev Containers**
- VS Code の `code` コマンドが PATH で利用可能であること
  - macOS の場合は、VS Code で `Cmd+Shift+P` → `Shell Command: Install 'code' command in PATH` を実行してください。

## インストール

GitHubリポジトリから直接グローバルにインストールします。

```bash
npm install -g github:hnw/ai-cage
```


> **開発向け:**
> リポジトリをクローンして手元でインストールする場合は、ディレクトリ内で `npm install -g .` を実行してください。

## 使い方

対象プロジェクトのディレクトリに移動して実行します。

```bash
cd /path/to/your-project
ai-cage
```

実行すると、以下の処理が行われます。

1. `~/.ai-cage-sandboxes/sandbox-<project>-<hash>/` に DevContainer 構成を生成
2. ホスト側の `~/.claude`, `~/.codex`, `~/.copilot`, `~/.gemini`, `~/.config/opencode` をコンテナ内にバインドマウント
3. VS Code を `vscode-remote://dev-container+...` URI で起動

## 初回利用時の認証について

ai-cage はホスト側の認証ディレクトリをマウントするため、**ホストですでにログイン済みの認証情報はコンテナ内でもそのまま使えます**。

ただし、ホスト側で未ログインの場合は、コンテナ内で各 AI ツールの公式な認証コマンドを実行する必要があります。例：

- Claude Code: ターミナルで `claude` を起動し、画面の指示に従う
- OpenAI Codex CLI: `codex login`
- GitHub Copilot CLI: `copilot login`
- Opencode: `opencode` を起動し、必要に応じて API キーを設定

## 認証・設定の引き継ぎ

AI ツールの認証情報やグローバル設定は、以下のディレクトリをホストと共有することで、異なるプロジェクト間でも引き継がれます。

| ホスト側パス | コンテナ内パス | 用途 |
|-------------|---------------|------|
| `~/.claude` | `/home/vscode/.claude` | Claude Code の認証・設定・履歴 |
| `~/.codex` | `/home/vscode/.codex` | Codex CLI の認証・設定・履歴 |
| `~/.copilot` | `/home/vscode/.copilot` | GitHub Copilot の認証・設定 |
| `~/.gemini` | `/home/vscode/.gemini` | Google Antigravity の認証・設定 |
| `~/.config/opencode` | `/home/vscode/.config/opencode` | Opencode の設定 |

これにより、プロジェクト A でログインした認証情報を、プロジェクト B のコンテナでもそのまま利用できます。

> `.gemini` は Google Antigravity が認証情報や設定を保存するために使用するディレクトリです。

## セキュリティについて

ai-cage は「プロジェクトごとに作業環境を隔離する」ことを目的としていますが、**認証情報の保存場所はホストとコンテナで共有されています**。

ai-cageは、プロジェクト間でAIのスキルや履歴、認証情報をシームレスに共有するために、ホストのディレクトリをコンテナへ直接（読み書き可能で）マウントしています。

そのため、コンテナ内からホスト側の認証トークン等にアクセス・上書きが可能な状態になります。信頼できないパッケージのインストールや、出処不明なスクリプトの実行には十分注意してください。

## 注意事項

- サンドボックスディレクトリは実行のたびに再生成されます。コンテナ内に保存したファイルは次回起動時に失われます。
- 永続化したいデータは、必ず上記のマウント対象ディレクトリ、またはプロジェクトディレクトリ内に保存してください。
- `postCreateCommand` 内で `curl | bash` を使用しています。ネットワーク環境によっては失敗する場合があります。
- 初回起動時は DevContainer イメージと feature のダウンロード・ビルドが発生するため、数分かかることがあります。2 回目以降はキャッシュが使われて速くなります。

## トラブルシューティング

### `docker context inspect に失敗しました` と表示される

Docker Desktop / Docker Engine / Colima が起動しているか確認してください。

### `code: command not found` と表示される / VS Code が起動しない

- VS Code がインストールされているか確認してください。
- macOS の場合は、`Shell Command: Install 'code' command in PATH` を実行してください。
- それでも解決しない場合は、システムの `PATH` に `/Applications/Visual Studio Code.app/Contents/Resources/app/bin`（macOS）または VS Code のインストール先ディレクトリが含まれているか確認してください。

### Dev Container に接続できない

VS Code 拡張機能 **Dev Containers** がインストールされているか確認してください。

### コンテナ内でファイルが書き込めない

`devcontainer.json` 内の `updateRemoteUserUID: true` により、コンテナ内の `vscode` ユーザがホスト側のファイル所有者に合わせて調整されます。それでも問題が続く場合は、ホスト側のファイル権限を確認してください。

### コンテナのビルドや `curl | bash` が失敗する

ネットワーク環境やプロキシ設定によって、feature のダウンロードや `postCreateCommand` の実行が失敗することがあります。Docker デーモン側の DNS・プロキシ設定、`~/.docker/config.json` などを確認してください。

### Windows で `ai-cage は WSL2 上で実行してください` と表示される

PowerShell や cmd.exe から直接実行しないでください。WSL2 ターミナル内で実行してください。

### コンテナ内で認証を求められる

ホスト側で該当する AI ツールにログインしていない可能性があります。ホスト側でログインするか、コンテナ内で各ツールの認証コマンドを実行してください。

## ライセンス

MIT
