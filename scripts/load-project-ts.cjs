/* eslint-disable @typescript-eslint/no-require-imports -- CLI-only CommonJS transpilation hook. */
// Small CLI-only loader; production code remains compiled by Next.js.
const ts = require("typescript"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return resolve.call(
    this,
    request.startsWith("@/")
      ? path.join(process.cwd(), request.slice(2))
      : request,
    parent,
    ...rest,
  );
};
require.extensions[".ts"] = function (module, file) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  module._compile(code, file);
};
