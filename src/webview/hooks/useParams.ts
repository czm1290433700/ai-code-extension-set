import { useState, useEffect } from 'react';

const useParams = () => {
  const [webviewParams, setWebviewParams] = useState<Record<string, any>>({});

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