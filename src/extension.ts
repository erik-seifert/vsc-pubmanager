'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PubSpecProvider } from './pubspec';
import * as rp from 'request-promise-native';
import * as path from 'path';

import { readFileSync } from 'fs';
import * as Mustache from 'mustache';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  const rootPath = vscode.workspace.rootPath;
  if (rootPath === undefined) {
    return;
  }
  const pubSpecProvider = new PubSpecProvider(rootPath);

  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  vscode.window.registerTreeDataProvider('pubspecManager', pubSpecProvider);
  vscode.commands.registerCommand('extension.openPackageOnPub', (moduleName: string, version: any) => {
    let columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (columnToShowIn === undefined) {
       columnToShowIn =  vscode.ViewColumn.One;
    }
    if (currentPanel === undefined) {
      currentPanel = vscode.window.createWebviewPanel(moduleName, moduleName, columnToShowIn, {});
    }

    currentPanel.title = moduleName;
    currentPanel.webview.html = '<h2>Loading...</h2>';
    getWebViewContent(moduleName, version).then((r) => {
      if (currentPanel !== undefined) {
        currentPanel.webview.html = r;
      }
    });
    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    }, null, context.subscriptions);

  });
  vscode.commands.registerCommand('pubmanager.refresh', () => pubSpecProvider.refresh());
}

function getWebViewContent(module: string, version: any): Thenable<string> {
  var p = path.join(__filename, '..', '..', 'resources', 'template.dot');
  return new Promise(resolve => {
    let tpl = readFileSync(p);
    rp(`https://pub.dartlang.org/api/packages/${module}`).then(json => {
      let deps: Array<any> = [];
      let pkg = {
        package: JSON.parse(json),
        installed: version,
        has_update: false,
        dependencies: deps,
      };
      for (let i = 0; i < pkg.package.versions.length; i++) {
        pkg.package.versions[i].is_installed = false;
        if (pkg.package.versions[i].version === version ) {
          pkg.package.versions[i].is_installed = true;
        }
      }
      pkg.package.versions = pkg.package.versions.reverse();
      pkg.has_update = !(version === pkg.package.latest.version);
      for (let a in pkg.package.latest.pubspec.dependencies) {
        if ( a === "meta" ) {
          continue;
        }
        if (pkg.package.latest.pubspec.dependencies[a]) {
          pkg.dependencies.push({
            pkg: a,
            meta: (typeof pkg.package.latest.pubspec.dependencies[a] === "string") ? pkg.package.latest.pubspec.dependencies[a] : ""
          });
        }
      }
      // console.log(pkg);
      resolve(Mustache.render(tpl.toString(), pkg));
    }).catch(e => {
      resolve('Error');
    });
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
}