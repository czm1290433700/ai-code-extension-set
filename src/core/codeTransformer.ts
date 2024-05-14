import * as fs from 'fs';
import { default as LLMRequest } from "llm-request";
import { IOpenAIChatResponse } from 'llm-request/dist/types/core/openAI/chat';
import { getCode } from '../utils';
import * as vscode from 'vscode';


const languageMap = {
  javaScript: 'js',
  java: 'java',
  go: 'go',
  python: 'py'
};

class CodeTransformer {
  /**
   * 获取存放结果的filePath
   */
  private getResultFilePath(filePath: string) {
    const configuration = vscode.workspace.getConfiguration();
    const targetLanguage = configuration.get('aiCodeExtensionSet.targetLanguage') as 'javaScript' | 'java' | 'go' | 'python';
    const fileArr = filePath.split('.');
    return [...fileArr.slice(0, fileArr.length - 1), languageMap[targetLanguage]].join('.');
  }

  /**
   * 全量转换
   */
  async fullTransform(filePath: string) {
    const configuration = vscode.workspace.getConfiguration();
    const LLMRequestEntity = new LLMRequest(configuration.get('aiCodeExtensionSet.apiKey'));
    const model = configuration.get('aiCodeExtensionSet.model') as 'gpt-3.5-turbo';
    const targetLanguage = configuration.get('aiCodeExtensionSet.targetLanguage') as 'javaScript' | 'java' | 'go' | 'python';
    vscode.window.withProgress(
      {
        title: `Transform Code to ${targetLanguage}`,
        location: vscode.ProgressLocation.Notification,
        cancellable: true
      },
      async (progress, token) => {
        progress.report({ message: `当前作业文件路径: ${filePath}` });
        try {
          const fileContent = await fs.promises.readFile(filePath);
          const fileSuffix = filePath.split('.').pop();
          const resultFilePath = this.getResultFilePath(filePath);
          const chatRes = (await LLMRequestEntity.openAIChat({
            model,
            messages: [
              {
                role: 'user',
                content: `将以下${fileSuffix}代码用${targetLanguage}实现，尽可能保留原代码的能力，对于因为缺乏库和依赖等原因无法实现的部分，补充相关的注释说明。请使用markdown语法输出实现的代码, 需要实现的代码我在下一个问题告诉你。`
              },
              {
                role: 'user',
                content: `代码如下：${fileContent}`
              }
            ],
          })) as IOpenAIChatResponse;
          await fs.promises.writeFile(resultFilePath, getCode(chatRes.answer));
          vscode.window.showInformationMessage(`作业文件路径: ${filePath}转换完成`);
          return;
        } catch (err) {
          vscode.window.showErrorMessage(err.meesage);
          return;
        }
      }
    );
  }
}

export default CodeTransformer;