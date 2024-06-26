import * as vscode from 'vscode';
import ChatgptWebviewProvider from './core/chatgptWebview';
import CodeTransformer from './core/codeTransformer';
import CodeReviewProvider from './core/codeReviewProvider';
import CodeReviewCodeActionProvider from './core/codeReviewCodeActionProvider';

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

  // 支持命令调起ChatGPT, 并创建一个新对话，指定上下文
  const openChatGPT = vscode.commands.registerCommand(
    'ai-code-extension-set.open-chatgpt',
    () => {
      vscode.commands.executeCommand('workbench.view.extension.chatgpt-for-vscode');
    }
  );

  // 代码语言转换工具
  const codeTransformEntity = new CodeTransformer(context);
  const codeTransform = vscode.commands.registerCommand(
    'ai-code-extension-set.code-transform',
    (uri) => {
      const filePath = `/${uri.path.substring(1)}`;
      codeTransformEntity.fullTransform(filePath);
    }
  );

  const followUpForCodeTransform = vscode.commands.registerCommand(
    'ai-code-extension-set.follow-up-for-code-transform',
    (uri) => {
      const filePath = `/${uri.path.substring(1)}`;
      codeTransformEntity.followUp(filePath);
    }
  );

  const codeTransformForPartCode = vscode.commands.registerCommand(
    'ai-code-extension-set.code-transform-for-part-code',
    (uri) => {
      const filePath = `/${uri.path.substring(1)}`;
      codeTransformEntity.partTransform(filePath);
    }
  );

  const codeReviewProvider = new CodeReviewProvider();
  const changePassiveDisposable = vscode.workspace.onDidSaveTextDocument((document) => {
    codeReviewProvider.setDocument(document);
    codeReviewProvider.review();
  });

  const openPassiveDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
    codeReviewProvider.setDocument(document);
    codeReviewProvider.review();
  });

  const fixActionProvider = vscode.languages.registerCodeActionsProvider({ scheme: 'file' }, new CodeReviewCodeActionProvider());

  context.subscriptions.push(chatgptProvider, openChatGPT, followUpForCodeTransform, codeTransform, codeTransformForPartCode, changePassiveDisposable, openPassiveDisposable, fixActionProvider);
}

export function deactivate() { }
