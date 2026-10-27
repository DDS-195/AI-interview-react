// 经核对的高频事实卡。自由生成题仍标记为 generated，不能假装所有内容均已核验。
const CARDS = [
  {
    id: 'react-effects',
    matches: (text) => /useEffect/i.test(text),
    source: { title: 'React useEffect', url: 'https://react.dev/reference/react/useEffect' },
    facts: [
      '依赖变化后的提交阶段，先清理旧effect，再执行新setup；真正卸载时执行最后一次清理。',
      'React 18开发环境StrictMode的首次额外检查是setup→cleanup→setup；此阶段setup两次、cleanup一次，最终卸载另算。生产环境没有这次额外检查。',
      '空依赖数组在通常生产运行中只在挂载时setup、卸载时cleanup；开发StrictMode仍有额外检查。依赖逐项用Object.is比较，对象/函数新引用可能触发重跑。',
      'useEffect只在客户端执行，不在服务端渲染期间执行。',
      '不能把useEffect断言为总在绘制后执行或绝不阻塞绘制：非交互触发时通常先绘制，交互触发时可能在绘制前运行；长时间同步代码仍会占用主线程。'
    ]
  },
  {
    id: 'vue-computed',
    matches: (text) => /computed|计算属性/i.test(text) && !/React/i.test(text),
    source: {
      title: 'Vue 3 Computed Properties',
      url: 'https://vuejs.org/guide/essentials/computed.html'
    },
    facts: [
      'computed基于响应式依赖缓存；依赖未变化时重复读取使用缓存，依赖变化后在读取时重新求值。普通方法在每次调用时执行。',
      'computed getter应保持无副作用；不要在getter里修改其他状态、发请求或操作DOM。'
    ]
  },
  {
    id: 'cors',
    matches: (text) => /CORS|跨域|预检/i.test(text),
    source: {
      title: 'MDN CORS',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS'
    },
    facts: [
      'CORS通过服务器响应头允许浏览器读取跨源响应；跨域限制不等于所有请求都不会发送。',
      '满足安全列出方法、头和Content-Type等条件的请求可不预检；application/json通常触发OPTIONS预检。',
      '携带凭据时Access-Control-Allow-Origin不能使用*，服务端还需允许凭据，客户端需配置credentials。'
    ]
  },
  {
    id: 'promise-all',
    matches: (text) => /Promise\.all\b|promiseAll\b/i.test(text),
    source: {
      title: 'MDN Promise.all',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all'
    },
    facts: [
      'Promise.all接受可迭代对象；全部完成时按输入顺序给出结果，非Promise值也作为对应位置结果。',
      '任意一个拒绝会导致聚合Promise拒绝；这不取消其他已经开始的任务。空可迭代对象会得到已完成的Promise。'
    ]
  }
]
function factsFor(question) {
  const text = `${question.title || ''}\n${question.content || ''}\n${question.topic || ''}`
  return CARDS.filter((card) => card.matches(text))
}
const normalizeQuestionText = (text) =>
  text
    .normalize('NFKC')
    .replace(/[\p{P}\p{S}\s]/gu, '')
    .toLowerCase()
const VERIFIED_EFFECT_QUESTIONS = new Set(
  [
    'React 的 useEffect 清理函数在什么时候执行？依赖变化、组件卸载和开发环境 Strict Mode 分别会怎样？',
    'useEffect 的清理函数在什么时候执行？请分别说明依赖变化、组件卸载以及开发环境 Strict Mode 下的行为。'
  ].map(normalizeQuestionText)
)
function referenceFor(question) {
  const cards = factsFor(question)
  // 只有这道完整匹配的基准题直接使用核对过的参考；普通题保留AI参考并附事实卡。
  if (
    question.categoryId === 'react' &&
    VERIFIED_EFFECT_QUESTIONS.has(normalizeQuestionText(question.content))
  ) {
    return {
      referenceAnswer: CARDS[0].facts.slice(0, 3).join('\n\n'),
      referenceStatus: 'verified',
      sources: cards.map((x) => x.source)
    }
  }
  return { referenceStatus: 'generated', sources: cards.map((x) => x.source) }
}
function verifiedRubric(question) {
  if (referenceFor(question).referenceStatus !== 'verified') {
    return null
  }
  return [
    {
      id: 'dependency',
      description: '依赖变化时的清理与setup顺序',
      weight: 35,
      expected: CARDS[0].facts[0].split('；')[0]
    },
    {
      id: 'unmount',
      description: '组件卸载时执行清理',
      weight: 30,
      expected: '真正卸载时执行最后一次清理，用于释放该effect建立的资源。'
    },
    {
      id: 'strict',
      description: '开发StrictMode的额外检查及生产环境区别',
      weight: 35,
      expected: CARDS[0].facts[1]
    }
  ]
}
module.exports = { factsFor, referenceFor, verifiedRubric }
