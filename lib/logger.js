'use strict';

let quiet = false;
let verbose = false;

function configure(options = {}) {
  quiet = options.quiet ?? quiet;
  verbose = options.verbose ?? verbose;
}

function info(...args) {
  if (!quiet) {
    console.log(...args);
  }
}

function warn(...args) {
  if (!quiet) {
    console.warn(...args);
  }
}

function error(...args) {
  console.error(...args);
}

function debug(...args) {
  if (verbose && !quiet) {
    console.error(...args);
  }
}

function isQuiet() {
  return quiet;
}

module.exports = {
  configure,
  info,
  warn,
  error,
  debug,
  isQuiet,
};
