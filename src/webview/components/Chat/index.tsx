import { default as LLMRequest } from "llm-request";
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { AIQuestionItem } from '../../App';
import { IChatItem } from "../Home";
import { MarkdownParser } from "../MarkdownParser";
import hljs from "highlight.js";
import "highlight.js/styles/default.css";
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

  useEffect(() => {
    hljs.highlightAll();
  }, [currentChatList]);

  /**
   * 提问function
   */
  const submit = async () => {
    setQuestion('');
    const LLMRequestEntity = new LLMRequest(apiKey);
    let result = '';
    setCurrentChatList([
      ...currentChatList,
      {
        role: 'user',
        content: question
      }
    ]);
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
    const newChat: AIQuestionItem[] = [
      ...currentChatList,
      {
        role: 'user',
        content: question
      },
      {
        role: 'assistant',
        content: result
      }
    ];
    // 如果是首次需要更新缓存
    if (currentChatList.length === 0) {
      vscode.postMessage({
        method: 'updateChatCacheByTimestamp',
        params: {
          chat: newChat,
          timestamp
        }
      });
    }
    setCurrentChatList(newChat);
    setAnswer('');
  };

  const enableSubmit = useMemo(() => {
    return question && apiKey && model;
  }, [question, apiKey, model]);

  return (
    <div>
      <button onClick={onBack}>回到首页</button>
      {!(apiKey && model) && <div>未填写apiKey或model配置，请完成必要配置后使用</div>}
      <div className="chat_chatArea" ref={contentRef}>
        {currentChatList?.map((item) => {
          return item.role === 'assistant' ? (
            <div className="chat_chatItem">
              <div className="chat_chatRole">ChatGPT</div>
              <div className="chat_chatContent">
                <MarkdownParser answer={item.content} />
              </div>
            </div>
          ) : (
            <div className="chat_chatItem" style={{ alignItems: 'flex-end' }}>
              <div className="chat_chatRole">You</div>
              <div className="chat_chatContent">{item.content}</div>
            </div>
          );
        })}
        {answer &&
          <div className="chat_chatItem" >
            <div className="chat_chatRole">ChatGPT</div>
            <div className="chat_chatContent">
              <MarkdownParser answer={answer} />
            </div>
          </div>}
      </div>
      <div>
        <div>
          <div className="chat_bottomArea">
            <textarea
              className="chat_textarea"
              placeholder="点击发送按钮或Enter回车询问"
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
            <button
              className={`chat_submitBtn ${enableSubmit ? "" : "chat_disabled"}`}
              onClick={() => {
                if (enableSubmit) {
                  submit();
                }
              }}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};