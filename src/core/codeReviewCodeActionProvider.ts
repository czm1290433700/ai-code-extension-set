import * as vscode from 'vscode';

class CodeReviewCodeActionProvider implements vscode.CodeActionProvider {
  public static providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  public provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const actions: vscode.CodeAction[] = [];

    // 遍历诊断上下文，寻找 AI 生成的诊断提供修复
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.message.includes('[基于OpenAI API生成]')) {
        try {
          // @ts-ignore
          const fixArr = JSON.parse(String(diagnostic?.fixArr));
          fixArr.forEach((item) => {
            const { method, code } = item;
            const action = new vscode.CodeAction(method, vscode.CodeActionKind.QuickFix);
            action.edit = new vscode.WorkspaceEdit();
            action.edit.replace(
              document.uri,
              diagnostic.range,
              code
            );
            actions.push(action);
          });
        } catch (err) {

        }
      }
    }

    return actions;
  }
}

export default CodeReviewCodeActionProvider;