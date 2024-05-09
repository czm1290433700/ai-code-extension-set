import React, { FC, useEffect, useState } from 'react';
import { AIQuestionItem } from '../../App';
import dayjs from 'dayjs';
import './index.css';
import { cloneDeep } from 'lodash';

interface IProps {
  vscode: any;
  params: Record<string, any>;
  onChange: (chatItem: IChatItem) => void; // 点击某chat后的回调
}

export interface IChatItem {
  timestamp: number;
  chatList: AIQuestionItem[];
}

export const Home: FC<IProps> = ({ vscode, params, onChange }) => {
  const [currentChats, setCurrentChats] = useState<IChatItem[]>([]);

  const { chatCache } = params;

  useEffect(() => {
    if (chatCache) {
      setCurrentChats(chatCache);
    }
  }, [chatCache]);

  /**
   * 更新cache和页面state
   * @param newChats 
   */
  const updateChatCache = (newChats: IChatItem[]) => {
    setCurrentChats(newChats);
    vscode.postMessage({
      method: 'updateChatCache',
      params: {
        chatCache: newChats
      }
    });
  };

  return (
    <div>
      <button onClick={() => {
        const initChat = {
          timestamp: new Date().getTime(),
          chatList: []
        };
        onChange(initChat);
        updateChatCache([...currentChats.sort((item1, item2) => item1.timestamp - item2.timestamp), initChat]);
      }}>新的聊天</button>
      {currentChats.map((item, index) => {
        return (
          <div className="home_chatItem" onClick={() => {
            onChange(item);
          }}>
            <div className="home_titleArea">{item.chatList?.[0]?.content || '新的聊天(暂未提问)'}</div>
            <div className="home_infoArea">
              <div className="home_timestamp">{dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}</div>
              <div className="home_deleteBtn" onClick={(event) => {
                event.stopPropagation(); // 禁止冒泡
                currentChats.splice(index, 1);
                updateChatCache(cloneDeep(currentChats));
              }}>x</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};