// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EnvVarsProvider, EnvVar } from './env-vars-provider';
import * as dotenv from 'dotenv';
import * as fs from 'fs-jetpack';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const envVarsProvider = new EnvVarsProvider(context);
  vscode.window.registerTreeDataProvider('env-variables', envVarsProvider);

  const disposables = [
    vscode.commands.registerCommand('env-variables.refresh', () => {
      envVarsProvider.refresh();
    }),
    vscode.commands.registerCommand('env-variables.add', () => {
      envVarsProvider.promptAddNew();
    }),
    vscode.commands.registerCommand(
      'env-variables.edit',
      ({ label, value }: { label: string; value: string }) => {
        envVarsProvider.promptEdit(new EnvVar(label, value));
      },
    ),
    vscode.commands.registerCommand(
      'env-variables.delete',
      ({ label }: { label: string }) => {
        envVarsProvider.delete(label);
      },
    ),
    vscode.commands.registerCommand(`env-variables.export`, () => {
      envVarsProvider.export();
    }),
  ];

  const setEnvVarsFromEnvFile = (fileURL: string, overwrite: boolean) => {
    const file = fs.read(fileURL);
    const parseResult = dotenv.parse(file || '');
    for (const key of Object.keys(parseResult)) {
      if (!envVarsProvider.contains(key) || overwrite) {
        envVarsProvider.set(key, parseResult[key]);
      }
    }
  };

  for (const folder of vscode.workspace.workspaceFolders || []) {
    const envExampleWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.getWorkspaceFolder(folder.uri)!!,
        '**/*.env.example',
      ),
    );
    disposables.push(
      envExampleWatcher.onDidChange((fileURL) =>
        setEnvVarsFromEnvFile(fileURL.fsPath, false),
      ),
    );
    disposables.push(envExampleWatcher);
    const envWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.getWorkspaceFolder(folder.uri)!!,
        '**/*.env',
      ),
    );
    disposables.push(
      envWatcher.onDidChange((fileURL) =>
        setEnvVarsFromEnvFile(fileURL.fsPath, true),
      ),
    );
    disposables.push(envWatcher);
  }

  console.log('Congratulations, your extension "project-pad" is now active!');

  for (const disposable of disposables) {
    context.subscriptions.push(disposable);
  }
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
