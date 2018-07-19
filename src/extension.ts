'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PubSpecProvider } from './pubspec';
// import { print } from 'util';
// import { print } from 'util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  vscode.window.showInformationMessage('Workspace has no package.json');
  const rootPath = vscode.workspace.rootPath;
  if (rootPath === undefined) {
    return;
  }
  const pubSpecProvider = new PubSpecProvider(rootPath);

  vscode.window.registerTreeDataProvider('pubspecManager', pubSpecProvider);
  vscode.commands.registerCommand('extension.openPackageOnPub', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://pub.dartlang.org/packages/${moduleName}`)));

}

// this method is called when your extension is deactivated
export function deactivate() {
}