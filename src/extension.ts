// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EnvVarsProvider, EnvVar } from './env-vars-provider';

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
  ];

  const fsWatchers: vscode.FileSystemWatcher[] = [];
  for (const folder of vscode.workspace.workspaceFolders || []) {
    const fsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.getWorkspaceFolder(folder.uri)!!,
        '**/*.env.example',
      ),
    );
    fsWatcher.onDidCreate((e) => console.log(e));
    fsWatchers.push(fsWatcher);
  }

  console.log('Congratulations, your extension "project-pad" is now active!');

  for (const disposable of disposables) {
    context.subscriptions.push(disposable);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
