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

const App = () => {
  const [currentMode, setCurrentMode] = useState<Mode>(Mode.Home);
  const [currentChat, setCurrentChat] = useState<IChatItem>();

  // vscode 透传的params
  const params = useParams();

  useEffect(() => {
    vscode.postMessage({
      method: 'initParams'
    });
  }, []);

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
