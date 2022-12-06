import {
    ActionDict,
    Grammar,
    IterationNode,
    Node,
    NonterminalNode,
    Semantics,
    TerminalNode,
    MatchResult
} from 'ohm-js';
import grammar, { ADLSemantics } from './adl.ohm-bundle';

const semantics: ADLSemantics = grammar.createSemantics();

semantics.addOperation("buildAST", {
    Module_module(annon, _arg1, name, _arg3, imports, decl, _arg6, _arg7) {
        
    },
})