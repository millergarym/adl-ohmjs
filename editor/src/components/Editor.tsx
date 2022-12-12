import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { makeAST, match } from '../ohm/adl';
import { resolveExplicits } from '../ohm/adl_step2';

// @ts-ignore
self.MonacoEnvironment = {
	getWorkerUrl: function (_moduleId: any, label: string) {
		console.log("getWorkerUrl", _moduleId, label);
		if (label === 'json') {
			return './json.worker.bundle.js';
		}
		if (label === 'css' || label === 'scss' || label === 'less') {
			return './css.worker.bundle.js';
		}
		if (label === 'html' || label === 'handlebars' || label === 'razor') {
			return './html.worker.bundle.js';
		}
		if (label === 'typescript' || label === 'javascript') {
			return './ts.worker.bundle.js';
		}
		return './editor.worker.bundle.js';
	}
};

export const Editor = () => {
	const [astJsonStr, setAstJsonStr] = useState<string>(`{
    "name": "X",
    "imports": [],
    "decls": {},
    "annotations": []
}`);
	const divEl = useRef<HTMLDivElement>(null);
	let editor: monaco.editor.IStandaloneCodeEditor;
	useEffect(() => {

		let model = monaco.editor.createModel(
			['module X {};'].join('\n'),
			// 'javascript'
		);

		model.onDidChangeContent((e: monaco.editor.IModelContentChangedEvent) => {
			const m = match(model.getValue());

			// console.log("onDidChangeContent", e, model.getValue(), m.failed());
			if (m.failed()) {
				console.log("syntax error - message : ", m.message);
				console.log("syntax error - short message : ", m.shortMessage);
				const errorRE = /Line (\d*), col (\d*): expected (.*)/;
				const er = errorRE.exec(m.shortMessage ? m.shortMessage : "");
				if (er !== null) {
					const line = Number(er[1]);
					const col = Number(er[2]);
					const msg = er[3];
					// model.deltaDecorations(
					// 	[],
					// 	[
					// 		{
					// 			range: new monaco.Range(line, col, line, col),
					// 			options: {
					// 				isWholeLine: true,
					// 				linesDecorationsClassName: 'myLineDecoration',
					// 				glyphMarginHoverMessage: {
					// 					value: msg,
					// 				}
					// 			}
					// 		}
					// 	]
					// );

					monaco.editor.setModelMarkers(model, "", [
						{
							severity: 8,
							message: msg,
							startLineNumber: line,
							startColumn: col,
							endLineNumber: line,
							endColumn: col,
						}
					]);
				}
			}
			if (m.succeeded()) {
				monaco.editor.setModelMarkers(model, "", []);
				const { semantics, ast, errors, explicits } = makeAST(m);
				resolveExplicits(m, semantics, explicits, errors)

				monaco.editor.setModelMarkers(model, "", errors.map(e => {
					// console.log("!!", e.source.getLineAndColumnMessage());
					// console.log("!!!", e.source.collapsedRight().getLineAndColumnMessage());
					const msg = e.source.getLineAndColumnMessage();
					const errorRE = /Line (\d*), col (\d*):/;
					const er = errorRE.exec(msg);
					const startLineNumber = er ? Number(er[1]) : 1
					const startColumn = er ? Number(er[2]) : 1

					const er2 = errorRE.exec(e.source.collapsedRight().getLineAndColumnMessage());
					const endLineNumber = er2 ? Number(er2[1]) : 1
					const endColumn = er2 ? Number(er2[2]) : 1

					return {
						severity: 8,
						message: e.message,
						startLineNumber,
						startColumn,
						endLineNumber,
						endColumn,
					};
				}));
				setAstJsonStr(JSON.stringify(ast, null, 4));
			}
		});

		if (divEl.current) {
			editor = monaco.editor.create(divEl.current, {
				model: model,
			});
		}
		return () => {
			editor.dispose();
		};
	}, []);
	return (
		<div className="EditorView">
			<div className="Editor" ref={divEl}></div>
			<pre className="Output">{astJsonStr}</pre>
		</div>
	);
};
