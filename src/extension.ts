import * as vscode from 'vscode';
import ChatgptWebviewProvider from './core/chatgptWebview';
import CodeTransformer from './core/codeTransformer';

export function activate(context: vscode.ExtensionContext) {
  // vscode插件中的ChatGPT
  const provider = new ChatgptWebviewProvider(context);
  const chatgptProvider = vscode.window.registerWebviewViewProvider(
    'chatgpt-for-vscode',
    provider,
    {
      webviewOptions: { retainContextWhenHidden: true }
    }
  );

  // 代码语言转换工具
  const codeTransformEntity = new CodeTransformer();
  const codeTransform = vscode.commands.registerCommand(
    'ai-code-extension-set.code-transform',
    (uri) => {
      const filePath = `/${uri.path.substring(1)}`;
      codeTransformEntity.fullTransform(filePath);
    }
  );

  context.subscriptions.push(chatgptProvider, codeTransform);
}

export function deactivate() { }
