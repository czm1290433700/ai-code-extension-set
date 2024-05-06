import * as vscode from 'vscode';

class ChatgptWebviewProvider implements vscode.WebviewViewProvider {
  private extensonContext;
  constructor(context: vscode.ExtensionContext) {
    this.extensonContext = context;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensonContext.extensionUri, 'dist')]
    };
    webviewView.webview.html = this.getWebviewContent(webviewView.webview);
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