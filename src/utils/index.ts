/**
 * 从 AI response 中提取代码
 * @param answer
 */
const getCode = (code: string) => {
  const codeRegex = /```(?:\w+\n)?([\s\S]*?)```/;
  const firstCodeBlock = code?.match(codeRegex)?.[0] || '';
  return firstCodeBlock.split('\n').slice(1, -1).join('\n') || code;
};

/**
 * 获取两段 code 列的区间范围
 * @param originCode 
 * @param exactCode 
 * @param startIndex 
 * @param endIndex 
 */
const getColumnRange = (originCode: string, exactCode: string, startIndex: number, endIndex: number): [number, number] => {
  const originArray = originCode.split('\n');
  const exactArray = exactCode.split('\n');
  const exactLength = exactArray.length;
  return [originArray[startIndex - 1].indexOf(exactArray[0]) + 1, originArray[endIndex - 1].indexOf(exactArray[exactLength - 1]) + exactArray[exactLength - 1].length + 1];
};

/**
 * 获取代码中的换行索引列表
 * a\nb\n&&c\nd [0, 1, 4]
 * @param text 
 * @returns 
 */
const getLinebreakIndices = (text) => {
  const regex = /\r\n|\r|\n/g;
  const indices = [];
  let match;

  while ((match = regex.exec(text))) {
    // \n 作为单字符计算，所以要加上前面的 length
    indices.push(match.index + indices.length);
  }

  // 非 \n 的字符才会计算实际索引
  return indices.map((item, index) => {
    return item - index * 2 - 1;
  });
};

/**
 * 获得代码行数区间
 * @param originCode
 * @param exactCode
 * @returns 
 */
const getCodeRange = (originCode: string, exactCode: string): [number, number] => {
  const finalOriginCode = originCode.replace(/[\n\s]*/g, "");
  const finalExactCode = exactCode.replace(/[\n\s]*/g, "");
  if (!finalOriginCode.includes(finalExactCode)) {
    // 非子集场景直接退出
    return [0, 0];
  }
  // 拿到源代码中所有 \n 的索引(假索引，\n不占索引位)
  const originCodeWithoutSpace = originCode.replace(/[^\S\n]/g, ''); // 移除空格，保留\n
  const newLineIndexList = getLinebreakIndices(originCodeWithoutSpace);
  // 拿到索引区间
  const startIndex = finalOriginCode.indexOf(finalExactCode);
  const endIndex = startIndex + finalExactCode.length - 1;
  // 起始行数
  const startLine = newLineIndexList.filter((item) => item < startIndex).length;
  // 只要 newLineIndexList 中元素 item >= startIndex, item <= endIndex 都是有效换行
  const newLineLength = newLineIndexList.filter((item) => item >= startIndex && item <= endIndex).length;
  return [startLine + 1, startLine + newLineLength];
};

export {
  getCode,
  getColumnRange,
  getCodeRange
};