import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import { makeAST, match } from '../ohm/adl';

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
			console.log("onDidChangeContent", e, model.getValue(), m.failed());
			if (m.succeeded()) {
				const module = makeAST(m);
				setAstJsonStr(JSON.stringify(module, null, 4));
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
