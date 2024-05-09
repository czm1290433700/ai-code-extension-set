import { default as LLMRequest } from "llm-request";
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { AIQuestionItem } from '../../App';
import { IChatItem } from "../Home";
import './index.css';

interface IProps {
  vscode: any;
  params: Record<string, any>;
  chat: IChatItem;
  onBack: () => void;
}

export const Chat: FC<IProps> = ({ vscode, params, chat, onBack }) => {
  const [currentChatList, setCurrentChatList] = useState<AIQuestionItem[]>(chat.chatList);
  const [timestamp, setTimestamp] = useState(chat.timestamp);
  const [answer, setAnswer] = useState('');
  const [question, setQuestion] = useState('');

  const { apiKey, model } = params;

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentChatList(chat.chatList);
    setTimestamp(chat.timestamp);
  }, [chat]);

  /**
   * 提问function
   */
  const submit = async () => {
    debugger;
    const LLMRequestEntity = new LLMRequest(apiKey);
    let result = '';
    await LLMRequestEntity.openAIStreamChatCallback(
      {
        model,
        messages: [
          ...currentChatList,
          {
            role: "user",
            content: question,
          },
        ],
        stream: true,
      },
      (res) => {
        result += res;
        setAnswer(result);
        // 自动滚动至底
        if (
          contentRef.current?.scrollTop &&
          contentRef.current?.scrollTop !== contentRef.current.scrollHeight
        ) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }
    );
    const chatList: AIQuestionItem[] = [{
      role: 'user',
      content: question
    }, {
      role: 'assistant',
      content: answer
    }];
    // 如果是首次需要更新缓存
    if (currentChatList.length === 0) {
      vscode.postMessage({
        method: 'updateChatCacheByTimestamp',
        params: {
          chat: [
            ...currentChatList,
            ...chatList
          ],
          timestamp
        }
      });
    }
    setCurrentChatList([
      ...currentChatList,
      ...chatList
    ]);
    setAnswer('');
  };

  const enableSubmit = useMemo(() => {
    return question && apiKey && model;
  }, [question, apiKey, model]);

  return (
    <div>
      <button onClick={onBack}>回到首页</button>
      {!(apiKey && model) && <div>未填写apiKey或model配置，请完成必要配置后使用</div>}
      <div ref={contentRef}>
        {currentChatList.map((item) => {
          return item.role === 'assistant' ? (
            <div>
              <div>ChatGPT</div>
              <div>{item.content}</div>
            </div>
          ) : (
            <div>
              <div>You</div>
              <div>{item.content}</div>
            </div>
          );
        })}
        {answer &&
          <div>
            <div>ChatGPT</div>
            <div>{answer}</div>
          </div>}
      </div>
      <div>
        <div>
          <div>
            <textarea
              className="chat_textarea"
              placeholder="输入询问的问题，按发送按钮或Enter回车结束"
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && enableSubmit) {
                  event.preventDefault();
                  submit();
                }
              }}
            ></textarea>
            <div
              className={`chat_submitBtn ${!enableSubmit ? "chat_disabled" : ""
                }`}
              onClick={() => {
                if (enableSubmit) {
                  submit();
                }
              }}
            >
              发送
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};