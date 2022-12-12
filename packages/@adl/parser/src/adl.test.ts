import test from 'ava';
import fs from 'fs';
import ohm from "ohm-js";
import { ADLSemantics } from './adl.ohm_types';

import { makeAST } from './step1';
import { resolveExplicits } from './step2';

test("step2", t => {
  const grammar = ohm.grammar(fs.readFileSync("ohm/adl.ohm", "utf-8"));
  const semantics: ADLSemantics = grammar.createSemantics();
  const step1 = makeAST(semantics);
  const step2x = resolveExplicits(semantics);
  {
    const r1 = step1(grammar.match("module X { annotation A 1; };"));
    step2x(r1);
    t.is(JSON.stringify(r1.adlast), '{"name":"X","imports":[],"decls":{},"annotations":[{"key":{"moduleName":"","name":"A"},"value":1}]}');
  }
  {
    const r1 = step1(grammar.match("module X { annotation A A 1; };"));
    step2x(r1);
    t.is(r1.errors[0].message, "Declaration not found for explicit annotation");
  }
});

test("ast", t => {

  const grammar = ohm.grammar(fs.readFileSync("ohm/adl.ohm", "utf-8"));
  const semantics: ADLSemantics = grammar.createSemantics();
  const builder = makeAST(semantics);

  t.is(JSON.stringify(builder(grammar.match("module X {};")).adlast), '{"name":"X","imports":[],"decls":{},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module a.b.c.d {};")).adlast), '{"name":"a.b.c.d","imports":[],"decls":{},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {import a.b.c;};")).adlast), '{"name":"X","imports":[{"kind":"scopedName","value":{"moduleName":"a.b","name":"c"}}],"decls":{},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {import a.b.*;};")).adlast), '{"name":"X","imports":[{"kind":"moduleName","value":"a.b"}],"decls":{},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {import a.b; import c.d;};")).adlast), '{"name":"X","imports":[{"kind":"scopedName","value":{"moduleName":"a","name":"b"}},{"kind":"scopedName","value":{"moduleName":"c","name":"d"}}],"decls":{},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {import a;};")).adlast), '{"name":"X","imports":[{"kind":"scopedName","value":{"moduleName":"","name":"a"}}],"decls":{},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {struct A{};};")).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":[],"fields":[]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {struct A<T,U>{};};")).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":["T","U"],"fields":[]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {struct A{String B;};};")).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":[],"fields":[{"name":"B","serializedName":"B","typeExpr":{"typeRef":{"kind":"primitive","value":"String"},"parameters":[]},"default":{"kind":"nothing"},"annotations":[]}]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {struct A<T>{Vector<T> B;};};")).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":["T"],"fields":[{"name":"B","serializedName":"B","typeExpr":{"typeRef":{"kind":"primitive","value":"Vector"},"parameters":[{"typeRef":{"kind":"typeParam","value":"T"},"parameters":[]}]},"default":{"kind":"nothing"},"annotations":[]}]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match("module X {union A{};};")).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"union_","value":{"typeParams":[],"fields":[]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match('module X {struct A{String B = "foo";};};')).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":[],"fields":[{"name":"B","serializedName":"B","typeExpr":{"typeRef":{"kind":"primitive","value":"String"},"parameters":[]},"default":{"kind":"just","value":"\\"foo\\""},"annotations":[]}]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match('module X {struct A{Vector<String> B = ["foo","bar"];};};')).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":[],"fields":[{"name":"B","serializedName":"B","typeExpr":{"typeRef":{"kind":"primitive","value":"Vector"},"parameters":[{"typeRef":{"kind":"primitive","value":"String"},"parameters":[]}]},"default":{"kind":"just","value":["\\"foo\\"","\\"bar\\""]},"annotations":[]}]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match('module X {struct A{B b = {"a":"b"};};};')).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":[],"fields":[{"name":"b","serializedName":"b","typeExpr":{"typeRef":{"kind":"reference","value":{"moduleName":"","name":"B"}},"parameters":[]},"default":{"kind":"just","value":{"\\"a\\"":"\\"b\\""}},"annotations":[]}]}},"annotations":[]}},"annotations":[]}');
  t.is(JSON.stringify(builder(grammar.match('@A {"a":"b"} module X {};')).adlast), '{"name":"X","imports":[],"decls":{},"annotations":[{"key":{"moduleName":"","name":"A"},"value":{"\\"a\\"":"\\"b\\""}}]}');
  t.is(JSON.stringify(builder(grammar.match('@A "a" @B "b" module X {};')).adlast), '{"name":"X","imports":[],"decls":{},"annotations":[{"key":{"moduleName":"","name":"A"},"value":"\\"a\\""},{"key":{"moduleName":"","name":"B"},"value":"\\"b\\""}]}');
  t.is(JSON.stringify(builder(grammar.match('module X {@A "a" struct A{@B "b" String B;};};')).adlast), '{"name":"X","imports":[],"decls":{"A":{"name":"A","version":{"kind":"nothing"},"type_":{"kind":"struct_","value":{"typeParams":[],"fields":[{"name":"B","serializedName":"B","typeExpr":{"typeRef":{"kind":"primitive","value":"String"},"parameters":[]},"default":{"kind":"nothing"},"annotations":[{"key":{"moduleName":"","name":"B"},"value":"\\"b\\""}]}]}},"annotations":[{"key":{"moduleName":"","name":"A"},"value":"\\"a\\""}]}},"annotations":[]}');

});

const dir = "../../../..";
const files = [
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test1/input/test.adl"
  },
  {
    "valid": false,
    "file": "tests/invalid.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/typescript/tests/example.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test16/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test16/input/test2.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test29/input/test29.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test11/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test27/input/test27.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test27/input/test27a.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test18/input/test.adl-rs"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test18/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test20/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test21/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test26/input/test26.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test19/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test10/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test17/input/test.adl"
  },
  {
    "valid": false,
    "file": dir + "/adl/haskell/compiler/tests/test28/input/test28.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test9/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test7/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test6/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test1/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test8/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test12/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test15/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test23/input/test23.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test24/input/test24.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test25/input/admin.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test22/input/test22b.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test22/input/test22a.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test14/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test13/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test4/input/test.adl-cpp"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test4/input/test.adl-rs"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test4/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test4/input/test.adl-java"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test4/input/test.adl-hs"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test3/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test2/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test2/input/test.adl-hs"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test5/input/test.adl-rs"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test5/input/test.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/test5/input/test.adl-hs"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/demo1/input/picture.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/tests/demo1/input/picture.adl-rs"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/lib/adl/adlc/config/typescript.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/lib/adl/adlc/config/haskell.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/lib/adl/adlc/config/rust.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/lib/adl/adlc/config/java.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/haskell/compiler/lib/adl/adlc/config/cpp.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/types.adl-rs"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/types.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/types.adl-cpp"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/dynamic.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/adlast.adl-java"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/dynamic.adl-java"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/adlast.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/annotations.adl"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/types.adl-java"
  },
  {
    "valid": true,
    "file": dir + "/adl/adl/stdlib/sys/types.adl-hs"
  },
  {
    "valid": true,
    "file": dir + "/adl/cpp/runtime/src-generated/unittests.adl"
  }
];

test("walk", t => {
  const grammar = ohm.grammar(fs.readFileSync("ohm/adl.ohm", "utf-8"));
  const semantics: ADLSemantics = grammar.createSemantics();
  const builder = makeAST(semantics);

  files.forEach((test, i) => {
    let content = "";
    try {
      content = fs.readFileSync(test.file, "utf-8");
    } catch (e) {
      t.fail(`test: ${i} error reading file ${test.file}`);
    }
    const m = grammar.match(content);
    if (test.valid) {
      t.assert(!m.failed(), `PARSE FAILED test: ${i} file: ${test.file} ${m.shortMessage}`);
      try {
        builder(m);
      } catch (e: any) {
        t.fail(`test: ${i} file: ${test.file} ${e.message} succeeded: ${m.succeeded()} \n${e.stack}`);
      }
    } else {
      t.assert(m.failed(), `test: ${i} SHOULD HAVE FAILED file: ${test.file}`);
    }
  });
});

test("grammar.match", t => {
  const grammar = ohm.grammar(fs.readFileSync("ohm/adl.ohm", "utf-8"));
  // const semantics: ADLSemantics = grammar.createSemantics();

  files.forEach((test, i) => {
    try {
      const f = fs.readFileSync(test.file, "utf-8");
      const m = grammar.match(f);
      if (test.valid) {
        t.assert(!m.failed(), `test: ${i} file: ${test.file} ${m.shortMessage}`);
      } else {
        t.assert(m.failed(), `test: ${i} SHOULD HAVE FAILED file: ${test.file}`);
      }
    } catch (e) {
      t.fail(`test: ${i} error reading file ${test.file}`);
    }
  });
})

