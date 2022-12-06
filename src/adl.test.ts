import test from 'ava';
import fs from 'fs';

import grammar, { ADLSemantics } from './adl.ohm-bundle';


test("match", t => {
  console.log("pwd", process.cwd());
  const files: (string | { valid: boolean; file: string; })[] = [
    "../adl/haskell/compiler/tests/test1/input/test.adl",

    { valid: false, file: "tests/invalid.adl" },

    "../adl/typescript/tests/example.adl",
    "../adl/haskell/compiler/tests/test16/input/test.adl",
    "../adl/haskell/compiler/tests/test16/input/test2.adl",
    "../adl/haskell/compiler/tests/test29/input/test29.adl",
    "../adl/haskell/compiler/tests/test11/input/test.adl",
    "../adl/haskell/compiler/tests/test27/input/test27.adl",
    "../adl/haskell/compiler/tests/test27/input/test27a.adl",
    "../adl/haskell/compiler/tests/test18/input/test.adl-rs",
    "../adl/haskell/compiler/tests/test18/input/test.adl",
    "../adl/haskell/compiler/tests/test20/input/test.adl",
    "../adl/haskell/compiler/tests/test21/input/test.adl",
    "../adl/haskell/compiler/tests/test26/input/test26.adl",
    "../adl/haskell/compiler/tests/test19/input/test.adl",
    "../adl/haskell/compiler/tests/test10/input/test.adl",
    "../adl/haskell/compiler/tests/test17/input/test.adl",
    { valid: false, file: "../adl/haskell/compiler/tests/test28/input/test28.adl" },
    "../adl/haskell/compiler/tests/test9/input/test.adl",
    "../adl/haskell/compiler/tests/test7/input/test.adl",
    "../adl/haskell/compiler/tests/test6/input/test.adl",
    "../adl/haskell/compiler/tests/test1/input/test.adl",
    "../adl/haskell/compiler/tests/test8/input/test.adl",
    "../adl/haskell/compiler/tests/test12/input/test.adl",
    "../adl/haskell/compiler/tests/test15/input/test.adl",
    "../adl/haskell/compiler/tests/test23/input/test23.adl",
    "../adl/haskell/compiler/tests/test24/input/test24.adl",
    "../adl/haskell/compiler/tests/test25/input/admin.adl",
    "../adl/haskell/compiler/tests/test22/input/test22b.adl",
    "../adl/haskell/compiler/tests/test22/input/test22a.adl",
    "../adl/haskell/compiler/tests/test14/input/test.adl",
    "../adl/haskell/compiler/tests/test13/input/test.adl",
    "../adl/haskell/compiler/tests/test4/input/test.adl-cpp",
    "../adl/haskell/compiler/tests/test4/input/test.adl-rs",
    "../adl/haskell/compiler/tests/test4/input/test.adl",
    "../adl/haskell/compiler/tests/test4/input/test.adl-java",
    "../adl/haskell/compiler/tests/test4/input/test.adl-hs",
    "../adl/haskell/compiler/tests/test3/input/test.adl",
    "../adl/haskell/compiler/tests/test2/input/test.adl",
    "../adl/haskell/compiler/tests/test2/input/test.adl-hs",
    "../adl/haskell/compiler/tests/test5/input/test.adl-rs",
    "../adl/haskell/compiler/tests/test5/input/test.adl",
    "../adl/haskell/compiler/tests/test5/input/test.adl-hs",
    "../adl/haskell/compiler/tests/demo1/input/picture.adl",
    "../adl/haskell/compiler/tests/demo1/input/picture.adl-rs",
    "../adl/haskell/compiler/lib/adl/adlc/config/typescript.adl",
    "../adl/haskell/compiler/lib/adl/adlc/config/haskell.adl",
    "../adl/haskell/compiler/lib/adl/adlc/config/rust.adl",
    "../adl/haskell/compiler/lib/adl/adlc/config/java.adl",
    "../adl/haskell/compiler/lib/adl/adlc/config/cpp.adl",
    "../adl/adl/stdlib/sys/types.adl-rs",
    "../adl/adl/stdlib/sys/types.adl",
    "../adl/adl/stdlib/sys/types.adl-cpp",
    "../adl/adl/stdlib/sys/dynamic.adl",
    "../adl/adl/stdlib/sys/adlast.adl-java",
    "../adl/adl/stdlib/sys/dynamic.adl-java",
    "../adl/adl/stdlib/sys/adlast.adl",
    "../adl/adl/stdlib/sys/annotations.adl",
    "../adl/adl/stdlib/sys/types.adl-java",
    "../adl/adl/stdlib/sys/types.adl-hs",
    "../adl/cpp/runtime/src-generated/unittests.adl",
  ];
  files.forEach((test, i) => {
    let file = "";
    let valid = true;
    if (typeof test === "string") {
      file = test as string;
    } else {
      const x = test as { valid: boolean; file: string; };
      file = x.file;
      valid = x.valid;
    }
    try {
      const f = fs.readFileSync(file, "utf-8");
      const m = grammar.match(f);
      if (valid) {
        t.assert(!m.failed(), `test: ${i} file: ${file} ${m.shortMessage}`);
      } else {
        t.assert(m.failed(), `test: ${i} SHOULD HAVE FAILED file: ${file}`);
      }
    } catch (e) {
      t.fail(`test: ${i} error reading file ${file}`);
    }
  });
})
