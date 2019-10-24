import * as vscode from 'vscode';
import * as fs from 'fs-jetpack';

const CONTEXT_VALUE = 'env-var';

export class EnvVar extends vscode.TreeItem {
  constructor(public readonly label: string, public value: string) {
    super(label);
  }

  get description(): string {
    return this.value;
  }

  get tooltip(): string {
    return `${this.label}=${this.value || ''}`;
  }

  contextValue = CONTEXT_VALUE;
}

const ENV_VARS_KEY = 'env-vars';
type EnvVarsMap = { [key: string]: EnvVar };

const showEnvVarNamePrompt = (value?: string) =>
  vscode.window.showInputBox({
    prompt: 'Environment Variable Name',
    placeHolder: 'ENVIRONMENT_VARIABLE_NAME',
    value,
  });

const showEnvVarValuePrompt = (value?: string) =>
  vscode.window.showInputBox({
    prompt: 'Environment Variable Value',
    placeHolder: 'ENVIRONMENT_VARIABLE_VALUE',
    value,
  });

export class EnvVarsProvider implements vscode.TreeDataProvider<EnvVar> {
  private _onDidChangeTreeData: vscode.EventEmitter<EnvVar | undefined>;

  constructor(private readonly context: vscode.ExtensionContext) {
    this._onDidChangeTreeData = new vscode.EventEmitter<EnvVar | undefined>();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  public readonly onDidChangeTreeData?: vscode.Event<EnvVar | undefined>;

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public contains(key: string): boolean {
    const envVars = this.envVars;
    return envVars[key] === undefined || envVars[key] === null;
  }

  public set(key: string, value: string) {
    this.setEnvVar(key, value);
  }

  public delete(key: string) {
    this.setEnvVar(key, undefined);
  }

  public promptEdit(envVar: EnvVar): void {
    showEnvVarNamePrompt(envVar.label).then((envVarName) => {
      showEnvVarValuePrompt(envVar.value).then((envVarValue) => {
        this.setEnvVar(envVarName, envVarValue);
      });
    });
  }

  public promptAddNew(): void {
    showEnvVarNamePrompt().then((envVarName) => {
      showEnvVarValuePrompt().then((envVarValue) => {
        this.setEnvVar(envVarName, envVarValue);
      });
    });
  }

  public export(): void {
    const folder = vscode.workspace.workspaceFolders!![0];
    vscode.window
      .showSaveDialog({
        defaultUri: folder
          ? vscode.workspace.getWorkspaceFolder(folder.uri)!!.uri
          : undefined,
      })
      .then((fileURL) => {
        if (!fileURL) {
          return;
        }
        const writeStream = fs.createWriteStream(fileURL.fsPath, {
          flags: 'a',
        });

        for (const key of Object.keys(this.envVars)) {
          writeStream.write(
            `${this.envVars[key].label}=${this.envVars[key].value}`,
          );
        }
        writeStream.end();
      });
  }

  private setEnvVar(label?: string, value?: string) {
    if (!label) {
      return;
    }
    const envVars = this.envVars;
    if (value !== undefined || value !== null) {
      envVars[label] = new EnvVar(label, value || '');
    } else {
      delete envVars[label];
    }

    this.context.workspaceState.update(ENV_VARS_KEY, envVars);
    this._onDidChangeTreeData.fire();
  }

  private get envVars() {
    return this.context.workspaceState.get<EnvVarsMap>(ENV_VARS_KEY) || {};
  }

  public getTreeItem(
    element: EnvVar,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(
    element?: EnvVar | undefined,
  ): vscode.ProviderResult<EnvVar[]> {
    if (!element) {
      const envVars = this.context.workspaceState.get<EnvVarsMap>(ENV_VARS_KEY);
      if (!envVars) {
        return undefined;
      }

      return Object.values(envVars).map(
        ({ label, value }) => new EnvVar(label, value),
      );
    }
  }
}
