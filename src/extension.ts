import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('multiversx.runContractSnippet', runContractSnippet);

	context.subscriptions.push(disposable);
}

async function runContractSnippet(contract: any) {
	let folderPath = undefined;
	if (contract instanceof vscode.Uri)
		folderPath = contract.fsPath;
	else
		folderPath = contract.getPath();

	const interactionsPath = path.join(folderPath, 'interactions');

	fs.stat(interactionsPath, async (err, stats) => {
		if (err) {
			//vscode.window.showInformationMessage('Folderul "interactions" nu există.');
			return;
		}

		if (!stats.isDirectory()) {
			//vscode.window.showInformationMessage('"interactions" nu este un folder.');
			return;
		}

		fs.readdir(interactionsPath, async (err, files) => {
			if (err) {
				//vscode.window.showErrorMessage('Eroare la citirea folderului "interactions".');
				return;
			}

			const shellScripts = files.filter(file => file.endsWith('.sh'));
			if (shellScripts.length === 0) {
				// vscode.window.showInformationMessage('Nu există fișiere .sh în "interactions".');
				return;
			}

			//vscode.window.showInformationMessage('Folderul "interactions" îndeplinește condițiile!');

			let functions = await extractFunctionsFromScripts(interactionsPath, shellScripts);

			const selectedFunction = await vscode.window.showQuickPick(functions, {
				placeHolder: 'Select a Contract Snippet:'
			});

			if (selectedFunction) {
				//vscode.window.showInformationMessage(`Ați selectat: ${selectedFunction}`);

				const [scriptName, functionName] = selectedFunction.split('> ');

				const terminal = vscode.window.createTerminal(`${functionName}`);
				terminal.show();

				terminal.sendText(`source ${interactionsPath}/${scriptName}.sh && ${functionName}`);
			}
		});
	});
}

async function extractFunctionsFromScripts(scriptsPath: string, shellScripts: string[]) {
	let allFunctions = [];

	for (const script of shellScripts) {
		const scriptPath = path.join(scriptsPath, script);
		const scriptContent = await fs.promises.readFile(scriptPath, 'utf-8');
	
		const functionRegex = /function\s+(\w+)\s*\(|(\w+)\s*\(\)\s*\{/g;
		let match;
		while ((match = functionRegex.exec(scriptContent)) !== null) {
			const functionName = match[1] || match[2];
			allFunctions.push(`${path.basename(script, '.sh')}> ${functionName}`);
		}
	  }

	return allFunctions;
}

export function deactivate() { }
