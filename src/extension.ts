import * as vscode from 'vscode';
import ChatgptWebviewProvider from './core/chatgptWebview';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ChatgptWebviewProvider(context);
  const chatgptProvider = vscode.window.registerWebviewViewProvider(
    'chatgpt-for-vscode',
    provider,
    {
      webviewOptions: { retainContextWhenHidden: true }
    }
  );

  context.subscriptions.push(chatgptProvider);
}

export function deactivate() { }
