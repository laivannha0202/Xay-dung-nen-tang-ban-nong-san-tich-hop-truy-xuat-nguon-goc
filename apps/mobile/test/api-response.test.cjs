/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadTsModule(relativePath) {
  const filename = path.resolve(
    __dirname,
    relativePath,
  );

  const source = fs.readFileSync(
    filename,
    'utf8',
  );

  const output = ts.transpileModule(
    source,
    {
      compilerOptions: {
        target:
          ts.ScriptTarget.ES2022,
        module:
          ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        verbatimModuleSyntax:
          false,
      },
      fileName: filename,
      reportDiagnostics: true,
    },
  ).outputText;

  const loaded = new Module(
    filename,
    module,
  );

  loaded.filename = filename;
  loaded.paths =
    Module._nodeModulePaths(
      path.dirname(filename),
    );

  loaded._compile(
    output,
    filename,
  );

  return loaded.exports;
}

const apiResponse =
  loadTsModule(
    '../src/lib/api-response.ts',
  );

test(
  'duLieuApi unwraps generated HTTP response data',
  () => {
    const payload = {
      id: 'abc',
      tong: 3,
    };

    assert.deepEqual(
      apiResponse.duLieuApi({
        data: payload,
        status: 200,
      }),
      payload,
    );
  },
);

test(
  'duLieuApi preserves already-unwrapped values',
  () => {
    const payload = {
      id: 'raw',
    };

    assert.deepEqual(
      apiResponse.duLieuApi(
        payload,
      ),
      payload,
    );

    assert.equal(
      apiResponse.duLieuApi(42),
      42,
    );

    assert.equal(
      apiResponse.duLieuApi(null),
      null,
    );
  },
);
