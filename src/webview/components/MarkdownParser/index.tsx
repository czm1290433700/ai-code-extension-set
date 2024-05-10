import React, { FC, useEffect, useMemo } from "react";
import ClipboardJS from "clipboard";
import "./index.css";

interface IMarkdownParserProps {
  answer: string;
}

export const MarkdownParser: FC<IMarkdownParserProps> = ({ answer }) => {
  useEffect(() => {
    const clipboard = new ClipboardJS(".copy");
    return () => {
      clipboard.destroy();
    };
  }, []);

  const formatCode = useMemo(() => {
    // 将\n替换为<br />, 代码块前后会置两个换行，可以去掉
    let formattedStr = answer.replaceAll("\n\n", "").replace(/\n/g, "<br />");

    // 查找以```开始并以```结束的代码块，并提取语言标识和代码内容
    const codeBlockPattern = /```([\s\S]+?)```/g;

    let match;
    while ((match = codeBlockPattern.exec(formattedStr)) !== null) {
      const language = match[1].split("<br />")[0];
      const codeContent = match[1].split("<br />").slice(1).join("\n");

      // 替换当前代码块为带有语言标识和代码内容的新格式
      const formattedCode = `
      <div>
        <div class="markdown_topArea">
            <span>${language}</span>
            <span class="markdown_copy" data-clipboard-text="${codeContent.trim()}">copy code</span>
        </div>
        <pre class="markdown_codeArea"><code class=${`language-${language}`}>${codeContent.trim()}</code></pre>
       </div>`;
      formattedStr =
        formattedStr.slice(0, match.index) +
        formattedCode +
        formattedStr.slice(match.index + match[0].length);
    }

    // 最后将整个结果包裹在<div>...</div>中
    return `<div class="markdown_parserArea">${formattedStr}</div>`;
  }, [answer]);

  return <div dangerouslySetInnerHTML={{ __html: formatCode }} />;
};
