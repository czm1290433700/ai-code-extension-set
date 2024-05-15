import { useState, useEffect } from 'react';

// 增加泛型提高引用的类型安全
const useParams = <T>(): T => {
  const [webviewParams, setWebviewParams] = useState<T>({});

  useEffect(() => {
    const messageHandler = (event) => {
      setWebviewParams(event.data);
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, []);

  return webviewParams;
};

export default useParams;