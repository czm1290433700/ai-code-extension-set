import * as vscode from 'vscode';
import { default as LLMRequest } from "llm-request";
import { IOpenAIChatResponse } from 'llm-request/dist/types/core/openAI/chat';
import { getCode, getCodeRange, getColumnRange } from '../utils';

/**
 * code review检测provider 
 */
class CodeReviewProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private document: vscode.TextDocument | null = null;
  private progressBar: vscode.StatusBarItem;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('AICodeReview');
    this.progressBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    this.progressBar.text = "代码审查中...";
    this.progressBar.hide();
  }

  public setDocument(currentDocument: vscode.TextDocument) {
    this.document = currentDocument;
  }

  /**
   * 清除指定文件指定行开头的诊断
   * @param uri 
   * @param startLine 
   */
  public clearDiagnosticsFromLine(uri: vscode.Uri, startLine: number) {
    const diagnostics = this.diagnosticCollection.get(uri);

    if (diagnostics) {
      const newDiagnostics = diagnostics.filter(diag => diag.range.start.line === startLine);
      this.diagnosticCollection.set(uri, newDiagnostics);
    }
  }

  /**
   * 清除指定文件的诊断
   * @param uri 
   */
  public clearDiagnosticsFromFile(uri: vscode.Uri) {
    this.diagnosticCollection.set(uri, []);
  }

  /**
   * code review prompt
   */
  public getAIQuestion(): {
    role: "user" | "assistant" | "system";
    content: string;
  }[] {
    const configuration = vscode.workspace.getConfiguration();
    const rules = configuration.get('aiCodeExtensionSet.codeReviewRule') as string[];
    const text = this.document.getText();

    // content 内容过多时，可以将结果等优先级较高的要求拆分放置最后
    return [{
      role: 'assistant',
      content: `帮我审查下列代码是否存在优化项，着重关注${rules.join(',')}等规则。需要审查的代码如下: ${text}, 具体输出的结果要求我将在下一个问题告诉你`
    }, {
      role: 'assistant',
      content: `你需要在完成审查后，以以下规则输出结果。如果审查发现代码没有任何优化项，则返回false，如果有可优化项，请按照以下json格式返回给我当前文件所有有问题的代码:
      {
        problems: [{
          content: xxx, // 有问题的代码片段, 请保持原代码的内容和格式
          msg: xxx, // 代码的具体问题，除描述问题外，尽可能提供解决的方案
          fix: [{
            method: xxx, // 修复方案的描述，比如“替换类型any为xxx”
            code: xxx // 以此方案修复后的代码，可以直接替换原代码
          }] // 针对有问题代码的修复方案，如果没有修复方案，返回[]
        }, ... // 如果还有其他问题，同样的json格式]
      }`
    }];
  }

  public async review() {
    this.progressBar.show();
    // 诊断前清除当前文件已有诊断
    this.diagnosticCollection.delete(this.document.uri);
    const configuration = vscode.workspace.getConfiguration();
    const LLMRequestEntity = new LLMRequest(configuration.get('aiCodeExtensionSet.apiKey'));
    const model = configuration.get('aiCodeExtensionSet.model') as 'gpt-3.5-turbo';

    try {
      const chatRes = (await LLMRequestEntity.openAIChat({
        model,
        messages: await this.getAIQuestion(),
      })) as IOpenAIChatResponse;
      const { problems } = JSON.parse(getCode(chatRes.answer)) || JSON.parse(chatRes.answer); // 兼容markdown语法输出和直接输出的可能
      const code = this.document.getText();
      problems.forEach((item) => {
        const { content, msg, fix } = item;
        const [startLine, endLine] = getCodeRange(code, content);
        const [startColumn, endColumn] = getColumnRange(code, content, startLine, endLine);
        const positionStart = new vscode.Position(startLine - 1, startColumn - 1);
        const positionEnd = new vscode.Position(endLine - 1, endColumn - 1);
        const diagnostic = new vscode.Diagnostic(
          new vscode.Range(positionStart, positionEnd),
          `[基于OpenAI API生成]${msg}`, // 加上标识，便于 Action 的识别
          vscode.DiagnosticSeverity.Warning
        );

        // @ts-ignore
        diagnostic.fixArr = JSON.stringify(fix); // 将 fix 的关键信息通过自定义的fixArr传递
        const currentDiagnostics = this.diagnosticCollection.get(this.document.uri) || [];
        this.diagnosticCollection.set(this.document.uri, [...currentDiagnostics, diagnostic]);
        this.progressBar.hide();
      });
    } catch (err) {
      this.progressBar.hide();
    }
  }
}

export default CodeReviewProvider;
