/**
 * @file _setup.js
 * @description Shared setup for the UNIT test suite.
 *
 * The domain/pattern classes emit a lot of diagnostic `console.log` output
 * (e.g. "[Factory] Creating AdminUser...", "[Chain:Logger] ..."). That output is
 * useful in the running app but clutters test results. Because this file is
 * loaded via the config `require` option BEFORE any test/spec file, replacing
 * console.log/console.info here silences that noise for the whole unit run.
 * console.error and console.warn are left intact so real problems stay visible.
 *
 * The Root Hook Plugin (exports.mochaHooks) restores the originals after the run.
 *
 * Loaded via `require: './test/unit/_setup.js'` in .mocharc.unit.yml.
 */

const originalLog  = console.log;
const originalInfo = console.info;

// Silence immediately, at require time — before any class module is loaded.
console.log  = () => {};
console.info = () => {};

exports.mochaHooks = {
  afterAll() {
    console.log  = originalLog;
    console.info = originalInfo;
  },
};
