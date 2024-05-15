import { IChatItem } from '../webview/components/Home';
import * as vscode from 'vscode';

class ChatgptWebviewProvider implements vscode.WebviewViewProvider {
  private extensionContext: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionContext.extensionUri, 'dist')]
    };
    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      const { method, params } = data;
      switch (method) {
        // 初始化
        case 'initParams':
          const configuration = vscode.workspace.getConfiguration();
          webviewView.webview.postMessage({
            chatCache: this.extensionContext.workspaceState.get('chatCache', []),
            apiKey: configuration.get('aiCodeExtensionSet.apiKey'),
            model: configuration.get('aiCodeExtensionSet.model'),
            currentTimestamp: this.extensionContext.workspaceState.get('currentTimestamp', 0),
          });
          break;
        // 落新的缓存
        case 'updateChatCache':
          const { chatCache } = params;
          this.extensionContext.workspaceState.update('chatCache', chatCache);
          webviewView.webview.postMessage({
            chatCache: this.extensionContext.workspaceState.get('chatCache', []),
          });
          break;
        // 更新指定timestamp的chat
        case 'updateChatCacheByTimestamp':
          const { chat, timestamp } = params;
          const cache = this.extensionContext.workspaceState.get('chatCache') as IChatItem[];
          const cacheIndex = cache.findIndex((item) => item.timestamp === timestamp);
          if (cacheIndex !== -1) {
            cache[cacheIndex].chatList = chat;
          }
          this.extensionContext.workspaceState.update('chatCache', cache);
          break;
        // 清除时间戳
        case 'clearTimestamp':
          this.extensionContext.workspaceState.update('currentTimestamp', 0);
          break;
        default:
          break;
      }
    });
  }

  private getWebviewContent(webview: vscode.Webview) {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>chatgpt for vscode</title>
      </head>
      <body>
          <div id="root"></div>
      </body>
      <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensionContext.extensionUri, 'dist/bundle.js'))}"></script>
      </html>`;
  }
}

export default ChatgptWebviewProvider;