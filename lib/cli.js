'use strict';

const pkg = require('../package.json');

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--print-devcontainer-json':
        options.printDevcontainerJson = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--agents': {
        const value = args[++i];
        if (value === undefined) {
          throw new Error('Option --agents requires a value');
        }
        options.agents = value.split(',').map((s) => s.trim());
        break;
      }
      case '--no-mount-auth':
        options.mountAuth = false;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--quiet':
        options.quiet = true;
        break;
      case '--config': {
        const value = args[++i];
        if (value === undefined) {
          throw new Error('Option --config requires a value');
        }
        options.configPath = value;
        break;
      }
      case '--version':
      case '-v':
        options.version = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`ai-cage v${pkg.version}

Usage: ai-cage [options]

Options:
  --print-devcontainer-json   Print generated devcontainer.json to stdout
  --dry-run                   Show what would be done without executing
  --agents <list>             Comma-separated list of agents to install
  --no-mount-auth             Do not mount host authentication directories
  --verbose                   Enable verbose output
  --quiet                     Suppress non-error output
  --config <path>             Use specific config file
  --version, -v               Show version
  --help, -h                  Show help
`);
}

function printVersion() {
  console.log(pkg.version);
}

module.exports = {
  parseArgs,
  printHelp,
  printVersion,
};
