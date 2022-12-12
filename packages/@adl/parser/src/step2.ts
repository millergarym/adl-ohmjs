import ohm, {
    MatchResult
} from 'ohm-js';
import { Explicits, K_Decl, SemanticError, Top } from './step1';
import { ADLSemantics } from './adl.ohm_types';

export function resolveExplicits(semantics: ADLSemantics): (input: { match: MatchResult, explicits: Explicits, errors: SemanticError[]; }) => void {

    semantics.addOperation<void>("stuffExplicit(explicits,found)", {
        Module_module(annon, _arg1, name, _arg3, imports, top, _arg6, _arg7) {
            top.children.forEach(t => {
                t.stuffExplicit(this.args.explicits, this.args.found);
            });
            this.adlast.annotations.push(...this.args.explicits.module);
        },
        Top_annon(arg0) {
        },
        Top_decl(arg0) {
            arg0.stuffExplicit(this.args.explicits);
        },
        Decl_Struct(annon, _arg1, name, mversion, typeParam, _arg5, fields, _arg7, _arg8) {
            if (this.args.explicits.decl[name.sourceString]) {
                this.adlast.decl.annotations.push(...this.args.explicits.decl[name.sourceString]);
                this.args.found[name.sourceString] = true;
            }
            fields.children.forEach(f => f.stuffExplicitField(name.sourceString, this.args.explicits, this.args.found));
        },
        Decl_Union(annon, _arg1, name, mversion, typeParam, _arg5, fields, _arg7, _arg8) {
            if (this.args.explicits.decl[name.sourceString]) {
                this.adlast.decl.annotations.push(...this.args.explicits.decl[name.sourceString]);
                this.args.found[name.sourceString] = true;
            }
            fields.children.forEach(f => f.stuffExplicitField(name.sourceString, this.args.explicits, this.args.found));
        },
        Decl_Type(annon, _arg1, name, mversion, typeParam, _arg5, typeExpr, _arg7) {
            if (this.args.explicits.decl[name.sourceString]) {
                this.adlast.decl.annotations.push(...this.args.explicits.decl[name.sourceString]);
                this.args.found[name.sourceString] = true;
            }
        },
        Decl_Newtype(annon, _arg1, name, mversion, typeParam, _arg5, typeExpr, _arg7, jsonValue, arg9) {
            if (this.args.explicits.decl[name.sourceString]) {
                this.adlast.decl.annotations.push(...this.args.explicits.decl[name.sourceString]);
                this.args.found[name.sourceString] = true;
            }
        },
    });

    semantics.addOperation<void>("stuffExplicitField(declName,explicits,found)", {
        Fields_FieldStatement(annon, typeExpr, ident, _arg3, jsonValue, _arg5) {
            const name = this.args.declName + "::" + ident.sourceString;
            if (this.args.explicits.field[name]) {
                this.adlast.annotations.push(...this.args.explicits.field[name]);
                this.args.found[name] = true;
            }
        },
    });

    semantics.addOperation<void>("checkExplicits(errors,found)", {
        Module_module(annon, _arg1, name, _arg3, imports, top, _arg6, _arg7) {
            top.children.forEach(t => {
                t.checkExplicits(this.args.errors, this.args.found);
            });
        },
        Top_annon(arg0) {
            arg0.checkExplicits(this.args.errors, this.args.found);
        },
        Top_decl(arg0) {
        },
        RemoteAnnon_ModuleAnnotation(_arg0, sn, jv, _arg3) {
        },
        RemoteAnnon_DeclAnnotation(_arg0, declName, sn, jv, _arg4) {
            if (this.args.found[declName.sourceString] === undefined) {
                this.args.errors.push({
                    source: this.source,
                    message: "Declaration not found for explicit annotation",
                });
            }
        },
        RemoteAnnon_FieldAnnotation(_arg0, declName, _arg2, field, sn, jv, _arg6) {
            const name = declName.sourceString + "::" + field.sourceString;
            if (this.args.found[name] === undefined) {
                this.args.errors.push({
                    source: this.source,
                    message: "Field not found for explicit annotation",
                });
            }
        },
    });

    return (input: { match: MatchResult, explicits: Explicits, errors: SemanticError[]; }) => {
        const found: Record<string, boolean> = {};
        semantics(input.match).stuffExplicit(input.explicits, found);
        semantics(input.match).checkExplicits(input.errors, found);
    };
}
