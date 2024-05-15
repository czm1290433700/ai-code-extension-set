import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { Home, IChatItem } from './components/Home';
import './global.css';
import useParams from './hooks/useParams';
import { Chat } from './components/Chat';

// @ts-ignore
const vscode = acquireVsCodeApi();

export type AIQuestionItem = { role: 'user' | 'assistant' | 'system', content: string };

enum Mode {
  Home = '1',
  Chat = '2',
}

interface IParams {
  chatCache: {
    chatList: AIQuestionItem[],
    timestamp: number
  }[],
  apiKey?: string,
  model?: string,
  currentTimestamp: number,
}

const App = () => {
  const [currentMode, setCurrentMode] = useState<Mode>(Mode.Home);
  const [currentChat, setCurrentChat] = useState<IChatItem>();

  // vscode 透传的params
  const params = useParams<IParams>();

  useEffect(() => {
    // 2s轮询更新
    setInterval(() => {
      vscode.postMessage({
        method: 'initParams'
      });
    }, 5000);
  }, []);

  useEffect(() => {
    const { currentTimestamp, chatCache } = params;
    const chat = chatCache?.find((item) => item.timestamp === currentTimestamp);
    if (currentTimestamp && chat) {
      setCurrentMode(Mode.Chat);
      setCurrentChat(chat);
      // 切换完状态要初始化timestamp标记位
      vscode.postMessage({
        method: 'clearTimestamp'
      });
    }
  }, [params?.currentTimestamp, params?.chatCache]);

  return (
    <>
      <h1>chatgpt for vscode</h1>
      {currentMode === Mode.Home ? <Home vscode={vscode} params={params} onChange={(chat) => {
        setCurrentChat(chat);
        setCurrentMode(Mode.Chat);
      }} /> : <Chat chat={currentChat} vscode={vscode} params={params} onBack={() => {
        setCurrentMode(Mode.Home);
      }} />}
    </>
  );
};

render(<App />, document.getElementById('root'));
