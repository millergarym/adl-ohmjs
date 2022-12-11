import ohm, {
    ActionDict,
    Grammar,
    IterationNode,
    Node,
    NonterminalNode,
    Semantics,
    TerminalNode,
    MatchResult
} from 'ohm-js';
import { grammar } from './adl.ohm';
import { ADLSemantics } from './adl.ohm_types';
import * as AST from './adl/runtime/sys/adlast';
import * as TS from './adl/runtime/sys/types';

interface SemanticErrors<T> {
    kind: "error";
    value: T;
    errors: SemanticError[];
}

interface SemanticError {
    source: ohm.Interval;
    message: string;
}

interface KV {
    key: string;
    val: {} | null;
}

type SnV = TS.MapEntry<AST.ScopedName, {} | null>;

type Result<T> = SemanticErrors<T> | { kind: "just"; value: T; };

type RemoteAnnonation =
    | { kind: "module", annon: AST.Annotations; }
    | { kind: "decl", name: string, annon: AST.Annotations; }
    | { kind: "field", name: string, field: string, annon: AST.Annotations; };

export function match(adlStr: string): MatchResult {
    return grammar.match(adlStr);
}

export function makeAST(adl: MatchResult): { ast: AST.Module; errors: SemanticError[]; } {
    const semantics: ADLSemantics = grammar.createSemantics();
    const errors: SemanticError[] = [];

    semantics.addOperation<AST.Module>("buildModule", {
        Module_module(annon, _arg1, name, _arg3, imports, top, _arg6, _arg7) {
            const decls: { [key: string]: AST.Decl; } = {};
            const annons: RemoteAnnonation[] = [];
            top.children.forEach(t => t.buildTop(decls, annons));
            return AST.makeModule({
                annotations: annon.children.map(a => a.buildAnnotations()),
                name: name.sourceString,
                imports: imports.numChildren !== 0 ? imports.children.map((n: Node) => n.buildImports()) : [],
                decls,
                // decls: decl.numChildren !== 0 ? decl.buildDecls() : {}, // TODO
            });
        },
    });

    semantics.addOperation<SnV>("buildAnnotations", {
        Annon_local(_arg0, sn, jv) {
            return TS.makeMapEntry<AST.ScopedName, {} | null>({
                key: sn.buildScopedName(),
                value: jv.numChildren !== 0 ? jv.children[0].buildJsonValue() : null,
            });
        },
        Annon_doc(dc1) {
            let firstHasSpace = false;
            return TS.makeMapEntry<AST.ScopedName, {} | null>({
                key: AST.makeScopedName({
                    moduleName: "",
                    name: "Doc",
                }),
                value: dc1.children.map((dc, i) => {
                    const s1 = dc.sourceString.substring(3);
                    if ((i === 0 || firstHasSpace) && s1.startsWith(" ")) {
                        firstHasSpace = true;
                        return s1.substring(1, s1.length - 1);
                    }
                    return s1.substring(0, s1.length - 1);
                }).join("\n"),
            });
        },
    });

    semantics.addOperation<void>("collectRemoteAnnon(annon)", {
        RemoteAnnon_ModuleAnnotation(_arg0, sn, jv, _arg3) {
            // TODO
        },
        RemoteAnnon_DeclAnnotation(_arg0, sn, declName, jv, _arg4) {
            // TODO
        },
        RemoteAnnon_FieldAnnotation(_arg0, declName, _arg2, arg3, arg4, jv, _arg6) {
            // TODO
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
            const typeParams: string[] = typeParam.numChildren !== 0 ? typeParam.children[0].buildTypeParam() : [];

            const decl = AST.makeDecl({
                name: name.sourceString,
                version: { kind: "nothing" }, // TODO
                annotations: annon.children.map(a => a.buildAnnotations()),
                type_: AST.makeDeclType("struct_", AST.makeStruct({
                    typeParams: typeParams,
                    fields: fields.children.map(f => f.buildField(typeParams))
                }))
            });
            this.args.decls[name.sourceString] = decl;
        },
        Decl_Union(annon, _arg1, name, mversion, typeParam, _arg5, fields, _arg7, _arg8) {
            const typeParams: string[] = typeParam.numChildren !== 0 ? typeParam.children[0].buildTypeParam() : [];

            const decl = AST.makeDecl({
                name: name.sourceString,
                version: { kind: "nothing" }, // TODO
                annotations: annon.children.map(a => a.buildAnnotations()),
                type_: AST.makeDeclType("union_", AST.makeUnion({
                    typeParams,
                    fields: fields.children.map(f => f.buildField(typeParams))
                }))
            });
            this.args.decls[name.sourceString] = decl;
        },
        Decl_Type(annon, _arg1, name, mversion, typeParam, _arg5, typeExpr, _arg7) {
            const typeParams: string[] = typeParam.numChildren !== 0 ? typeParam.children[0].buildTypeParam() : [];

            const decl = AST.makeDecl({
                name: name.sourceString,
                version: { kind: "nothing" }, // TODO
                annotations: annon.children.map(a => a.buildAnnotations()),
                type_: AST.makeDeclType("type_", AST.makeTypeDef({
                    typeParams,
                    typeExpr: typeExpr.buildTypeExpr(typeParams)
                }))
            });
            this.args.decls[name.sourceString] = decl;
        },
        Decl_Newtype(annon, _arg1, name, mversion, typeParam, _arg5, typeExpr, _arg7, jsonValue, arg9) {
            const typeParams: string[] = typeParam.numChildren !== 0 ? typeParam.children[0].buildTypeParam() : [];

            const decl = AST.makeDecl({
                name: name.sourceString,
                version: { kind: "nothing" }, // TODO
                annotations: annon.children.map(a => a.buildAnnotations()),
                type_: AST.makeDeclType("newtype_", AST.makeNewType({
                    typeParams,
                    typeExpr: typeExpr.buildTypeExpr(typeParams),
                    default: jsonValue.numChildren !== 0 ? { kind: "just", value: jsonValue.children[0].buildJsonValue() } : { kind: "nothing" },
                }))
            });
            this.args.decls[name.sourceString] = decl;
        },
    });

    semantics.addOperation<string[]>("buildTypeParam", {
        TypeParam_TypeParameter(_arg0, list, _arg2) {
            const result = list.asIteration().children.map((t: Node) => {
                if (simplePrimitive.includes(t.sourceString)) {
                    errors.push({
                        source: t.source,
                        message: "Type parameter can't be a primitive",
                    });
                }
                return t.sourceString;
            });
            return result;
        },
    });

    semantics.addOperation<AST.Field>("buildField(typeParams)", {
        Fields_FieldStatement(annon, typeExpr, ident, _arg3, jsonValue, _arg5) {
            return AST.makeField({
                name: ident.sourceString,
                serializedName: ident.sourceString,
                annotations: annon.children.map(a => a.buildAnnotations()),
                default: jsonValue.numChildren !== 0 ? { kind: "just", value: jsonValue.children[0].buildJsonValue() } : { kind: "nothing" },
                typeExpr: typeExpr.buildTypeExpr(this.args.typeParams)
            });
        },
    });

    semantics.addOperation<{} | null>("buildJsonValue", {
        JsonValue_StringStatement(str) {
            return str.sourceString;
        },
        JsonValue_true(_arg0) {
            return true;
        },
        JsonValue_false(_arg0) {
            return false;
        },
        JsonValue_null(_arg0) {
            return null;
        },
        JsonValue_number(num) {
            return Number(num.sourceString);
        },
        JsonValue_ArrayStatement(_arg0, list, _arg2) {
            return list.asIteration().children.map((e: Node) => e.buildJsonValue());
        },
        JsonValue_ObjStatement(_arg0, jobj, _arg2) {
            const obj = {};
            jobj.asIteration().children.forEach((e: Node) => e.collectJsonObj(obj));
            return obj;
        },
    });

    semantics.addOperation<void>("collectJsonObj(obj)", {
        JsonObj_JsonObjStatement(k, _arg1, v) {
            this.args.obj[k.sourceString] = v.buildJsonValue();
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

    const ast = semantics(adl).buildModule();
    return { ast, errors };
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
    "TypeToken",
];
