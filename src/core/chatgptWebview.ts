import { IChatItem } from '../webview/components/Home';
import * as vscode from 'vscode';

class ChatgptWebviewProvider implements vscode.WebviewViewProvider {
  private extensonContext: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this.extensonContext = context;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensonContext.extensionUri, 'dist')]
    };
    webviewView.webview.html = this.getWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      const { method, params } = data;
      switch (method) {
        // 初始化
        case 'initParams':
          const configuration = vscode.workspace.getConfiguration();
          webviewView.webview.postMessage({
            chatCache: this.extensonContext.workspaceState.get('chatCache', []),
            apiKey: configuration.get('aiCodeExtensionSet.apiKey'),
            model: configuration.get('aiCodeExtensionSet.model')
          });
          break;
        // 落新的缓存
        case 'updateChatCache':
          const { chatCache } = params;
          this.extensonContext.workspaceState.update('chatCache', chatCache);
          webviewView.webview.postMessage({
            chatCache: this.extensonContext.workspaceState.get('chatCache', []),
          });
          break;
        // 更新指定timestamp的chat
        case 'updateChatCacheByTimestamp':
          const { chat, timestamp } = params;
          const cache = this.extensonContext.workspaceState.get('chatCache') as IChatItem[];
          const cacheIndex = cache.findIndex((item) => item.timestamp === timestamp);
          if (cacheIndex !== -1) {
            cache[cacheIndex].chatList = chat;
          }
          this.extensonContext.workspaceState.update('chatCache', cache);
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
      <script src="${webview.asWebviewUri(vscode.Uri.joinPath(this.extensonContext.extensionUri, 'dist/bundle.js'))}"></script>
      </html>`;
  }
}

export default ChatgptWebviewProvider;