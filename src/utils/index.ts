/**
 * 从 AI response 中提取代码
 * @param answer
 */
const getCode = (code: string) => {
  const codeRegex = /```(?:\w+\n)?([\s\S]*?)```/;
  const firstCodeBlock = code?.match(codeRegex)?.[0] || '';
  return firstCodeBlock.split('\n').slice(1, -1).join('\n') || code;
};

export {
  getCode
};