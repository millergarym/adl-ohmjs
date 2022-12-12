import ohm, {
    MatchResult
} from 'ohm-js';
import { Explicits, K_Decl, SemanticError, Top } from './adl';
import { ADLSemantics } from './adl.ohm_types';
import * as AST from './adl/runtime/sys/adlast';

export function resolveExplicits(adl: MatchResult, semantics: ADLSemantics, explicits: Explicits, errors: SemanticError[]) {
    const found: Record<string, boolean> = {}

    semantics.addOperation<AST.Module>("resolveExplicitModule", {
        Module_module(annon, _arg1, name, _arg3, imports, top, _arg6, _arg7) {
            top.children.forEach(t => {
                const top = t.resolveExplicitTop();
            });
            this.buildModule.annotations.push(...explicits.module);
            return this.buildModule;
        },
    });

    semantics.addOperation<Top>("resolveExplicitTop", {
        Top_annon(arg0) {
            return this.buildTop;
        },
        Top_decl(arg0) {
            arg0.resolveExplicitDecl();
            return this.buildTop;
        },
    });

    semantics.addOperation<K_Decl>("resolveExplicitDecl", {
        Decl_Struct(annon, _arg1, name, mversion, typeParam, _arg5, fields, _arg7, _arg8) {
            if( explicits.decl[name.sourceString] ) {
                this.buildDecl.decl.annotations.push(...explicits.decl[name.sourceString])
                found[name.sourceString] = true;
            }
            fields.children.map(f => f.resolveExplicitField(name.sourceString));
            return this.buildDecl;
        },
        Decl_Union(annon, _arg1, name, mversion, typeParam, _arg5, fields, _arg7, _arg8) {
            if( explicits.decl[name.sourceString] ) {
                this.buildDecl.decl.annotations.push(...explicits.decl[name.sourceString])
                found[name.sourceString] = true;
            }
            fields.children.map(f => f.resolveExplicitField(name.sourceString));
            return this.buildDecl;
        },
        Decl_Type(annon, _arg1, name, mversion, typeParam, _arg5, typeExpr, _arg7) {
            if( explicits.decl[name.sourceString] ) {
                this.buildDecl.decl.annotations.push(...explicits.decl[name.sourceString])
                found[name.sourceString] = true;
            }
            return this.buildDecl;
        },
        Decl_Newtype(annon, _arg1, name, mversion, typeParam, _arg5, typeExpr, _arg7, jsonValue, arg9) {
            if( explicits.decl[name.sourceString] ) {
                this.buildDecl.decl.annotations.push(...explicits.decl[name.sourceString])
                found[name.sourceString] = true;
            }
            return this.buildDecl;
        },
    });

    semantics.addOperation<AST.Field>("resolveExplicitField(declName)", {
        Fields_FieldStatement(annon, typeExpr, ident, _arg3, jsonValue, _arg5) {
            const name = this.args.declName + "::" + ident.sourceString
            if( explicits.field[name] ) {
                this.buildField.annotations.push(...explicits.field[name])
                found[name] = true;
            }
            return this.buildField;
        },
    });

    semantics.addOperation<void>("resolveExplicitAnnon", {
        Module_module(annon, _arg1, name, _arg3, imports, top, _arg6, _arg7) {
            top.children.forEach(t => {
                const top = t.resolveExplicitAnnon();
            });
        },
        Top_annon(arg0) {
            arg0.resolveExplicitAnnon();
        },
        Top_decl(arg0) {
        },
        RemoteAnnon_ModuleAnnotation(_arg0, sn, jv, _arg3) {
        },
        RemoteAnnon_DeclAnnotation(_arg0, declName, sn, jv, _arg4) {
            if( found[declName.sourceString] === undefined ) {
                errors.push({
                    source: this.source,
                    message: "Declaration not found for explicit annotation",
                });
            }
        },
        RemoteAnnon_FieldAnnotation(_arg0, declName, _arg2, field, sn, jv, _arg6) {
            const name = declName.sourceString + "::" + field.sourceString
            if( found[name] === undefined ) {
                errors.push({
                    source: this.source,
                    message: "Field not found for explicit annotation",
                });
            }
        },
    });

    semantics(adl).resolveExplicitModule();
    semantics(adl).resolveExplicitAnnon();
}
