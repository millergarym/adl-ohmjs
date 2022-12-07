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
import * as AST from './adl/runtime/sys/adlast';

const semantics: ADLSemantics = grammar.createSemantics();

export function match(adlStr: string): MatchResult {
    return grammar.match(adlStr);
}

type RemoteAnnonation =
    | { kind: "module", annon: AST.Annotations; }
    | { kind: "decl", name: string, annon: AST.Annotations; }
    | { kind: "field", name: string, field: string, annon: AST.Annotations; };

semantics.addOperation<AST.Module>("buildModule", {
    Module_module(annon, _arg1, name, _arg3, imports, top, _arg6, _arg7) {
        const decls: { [key: string]: AST.Decl; } = {};
        const annons: RemoteAnnonation[] = [];
        top.children.forEach(t => t.buildTop(decls, annons));
        return AST.makeModule({
            name: name.sourceString,
            imports: imports.numChildren !== 0 ? imports.children.map((n: Node) => n.buildImports()) : [],
            decls,
            // decls: decl.numChildren !== 0 ? decl.buildDecls() : {}, // TODO
            annotations: annon.numChildren !== 0 ? annon.children.map((n: Node) => n.buildAnnotations()) : [],
        });
    },
});

semantics.addOperation<void>("buildTop(decls, annons)", {
    Top_annon(arg0) {
        arg0.collectRemoteAnnon(this.args.annons);
    },
    Top_decl(arg0) {
        arg0.collectDecl(this.args.decls);
    },
});

semantics.addOperation<void>("collectDecl(decls)", {
    Decl_Struct(annon, _arg1, name, mversion, typeParam, _arg5, fields, _arg7, _arg8) {
        const typeParams: string[] = typeParam.numChildren !== 0 ? typeParam.children[0].buildTypeParam() : []
        const decl = AST.makeDecl({
            name: name.sourceString,
            version: { kind: "nothing" },
            annotations: annon.numChildren !== 0 ? annon.children.map((n: Node) => n.buildAnnotations()) : [],
            type_: AST.makeDeclType("struct_", AST.makeStruct({
                typeParams,
                fields: fields.children.map(f => f.buildField(typeParams))
            }))
        });
        this.args.decls[name.sourceString] = decl;
    },
});

semantics.addOperation<string[]>("buildTypeParam", {
    TypeParam_TypeParameter(_arg0, list, _arg2) {
        // TODO check param is not a primitive
        return list.asIteration().children.map((t: Node) => t.sourceString);
    },
});

semantics.addOperation<AST.Field>("buildField(typeParams)", {
    Fields_FieldStatement(annon, typeExpr, ident, _arg3, jsonValue, _arg5) {
        return AST.makeField({
            name: ident.sourceString,
            serializedName: ident.sourceString,
            annotations: annon.children.map((n: Node) => n.buildAnnotations()),
            default: { kind: "nothing" },
            typeExpr: typeExpr.buildTypeExpr(this.args.typeParams)
        });
    },
});

semantics.addOperation<AST.TypeExpr>("buildTypeExpr(typeParams)", {
    TypeExpr_TypeExprGeneric(sn, _arg1, teA, _arg3) {
        const name = sn.sourceString;
        if (genericPrimitive.includes(name)) {
            // TODO check arity
            return AST.makeTypeExpr({
                typeRef: AST.makeTypeRef("primitive", sn.sourceString),
                parameters: teA.asIteration().children.map((t: Node) => t.buildTypeExpr(this.args.typeParams))
            });
        }
        // TODO check not a simple primitive
        return AST.makeTypeExpr({
            typeRef: AST.makeTypeRef("reference", sn.buildScopedName()),
            parameters: teA.asIteration().children.map((t: Node) => t.buildTypeExpr(this.args.typeParams))
        });
    },
    TypeExpr_TypeExprSimple(sn) {
        if (this.args.typeParams.includes(sn.sourceString)) {
            return AST.makeTypeExpr({
                typeRef: AST.makeTypeRef("typeParam", sn.sourceString),
                parameters: []
            });
        }
        if (simplePrimitive.includes(sn.sourceString)) {
            return AST.makeTypeExpr({
                typeRef: AST.makeTypeRef("primitive", sn.sourceString),
                parameters: []
            });
        }
        // TODO check not a generic primitive
        return AST.makeTypeExpr({
            typeRef: AST.makeTypeRef("reference", sn.buildScopedName()),
            parameters: []
        });
    },
});

semantics.addOperation<AST.Import>("buildImports", {
    Imports_module(_arg0, nameStar, _arg2) {
        const n = nameStar.sourceString;
        return AST.makeImport("moduleName", n.substring(0, n.length - 2));
    },
    Imports_scopedName(_arg0, name, _arg2) {
        return AST.makeImport("scopedName", name.buildScopedName());
    },
});

semantics.addOperation<AST.ScopedName>("buildScopedName", {
    scopedName(module, _arg1, name) {
        return AST.makeScopedName({
            // moduleName: module.sourceString,
            moduleName: module.children.map((c: Node) => c.sourceString).join("."),
            name: name.sourceString,
        });
    },
});

export function makeAST(adl: MatchResult): AST.Module {
    return semantics(adl).buildModule();
}

const simplePrimitive = [
    "Void",
    "Bool",
    "Int8",
    "Int16",
    "Int32",
    "Int64",
    "Word8",
    "Word16",
    "Word32",
    "Word64",
    "Float",
    "Double",
    "Json",
    "ByteVector",
    "String",
];

const genericPrimitive = [
    "Vector",
    "StringMap",
    "Nullable",
];
