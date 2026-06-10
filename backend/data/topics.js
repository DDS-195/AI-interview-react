// 分类 → 知识点映射（全项目单一数据源）
const TOPICS = {
  'html-css': [
    'HTML语义化标签', 'HTML5新特性', '表单元素与约束验证', 'HTML可访问性(ARIA)',
    '盒模型与box-sizing', 'Flexbox布局', 'Grid布局', '响应式设计与容器查询',
    'CSS动画与过渡', 'CSS选择器优先级', '定位机制(position/z-index)',
    'BFC块级格式化上下文', 'CSS自定义属性(变量)', '伪类与伪元素',
    'CSS性能优化(will-change/contain)', '媒体查询与响应式断点', '层叠上下文与层叠顺序',
    'CSS reset/normalize', '现代CSS新特性(容器查询/嵌套/图层)'
  ],
  'javascript': [
    '变量声明与作用域(var/let/const)', '类型转换与隐式转换', '闭包与词法作用域',
    '原型链与继承', 'this绑定规则与箭头函数', '事件循环(Event Loop)与任务队列',
    'Promise与异步编程', 'async/await错误处理', 'Generator与迭代器',
    'Proxy与Reflect', 'ES Module与CommonJS', 'Set/Map/WeakMap实战',
    '数组高级方法(reduce/map/filter)', '防抖与节流实现', '深拷贝与结构化克隆',
    '错误处理与自定义Error', '内存管理与内存泄漏', '函数柯里化与偏函数',
    '发布订阅与观察者模式', 'Symbol与元编程', '正则表达式高级用法'
  ],
  'vue': [
    '响应式原理(Proxy/getter)', '虚拟DOM与Diff算法', 'Composition API设计模式',
    '组件通信(props/emit/provide-inject)', '插槽机制(作用域插槽)', 'Vue Router导航守卫',
    'Pinia状态管理', '生命周期钩子执行顺序', 'keep-alive缓存策略',
    '异步组件与Suspense', '自定义指令', '组合式函数(Composables)',
    'Teleport与Fragment', 'Transition动画', 'Vue编译器原理(模板→render)'
  ],
  'react': [
    'JSX语法与虚拟DOM', '函数组件与类组件', 'Hooks原理与使用规则',
    'useState/useEffect/useRef', 'useMemo/useCallback性能优化', 'useContext状态共享',
    '自定义Hooks设计模式', 'React Router路由管理', '状态管理(Redux/Zustand)',
    '组件通信(props/context/回调)', '受控与非受控组件', 'Fragment与Portals',
    '高阶组件与Render Props', 'React Fiber调度机制', 'Suspense与错误边界',
    '服务端渲染(Next.js/Remix)', '合成事件与事件委托', '性能优化(React.memo/lazy)'
  ],
  'jquery': [
    '选择器引擎与链式调用', 'DOM操作与批量更新', '事件绑定与委托',
    'AJAX封装与Promise化', '动画队列与自定义动画', '插件开发模式',
    'Deferred异步控制', 'jQuery与原生JS对比', '性能优化(缓存选择器/批量DOM)'
  ],
  'nodejs': [
    '事件驱动与非阻塞I/O', '模块系统(CommonJS/ESM)', 'Buffer与Stream流处理',
    'Express中间件机制', '错误处理中间件', '进程管理(Cluster/PM2)',
    '数据库连接池优化', 'RESTful API设计规范', 'JWT认证与刷新令牌',
    'WebSocket实时通信', '文件上传与流式处理', '日志系统设计'
  ],
  'es6': [
    '箭头函数与this绑定', '解构赋值与默认值', '模板字符串标签函数',
    '扩展运算符与剩余参数', 'Class与继承', 'Symbol与迭代器',
    'Set/Map/WeakSet/WeakMap', 'Proxy与Reflect', 'Promise.allSettled/any',
    '可选链(?.)与空值合并(??)', '动态import', '顶层await'
  ],
  'typescript': [
    '基础类型与类型推断', 'interface与type区别', '泛型与泛型约束',
    '工具类型(Partial/Pick/Omit等)', '联合类型与交叉类型', '类型守卫与类型收窄',
    '枚举(const enum vs 普通enum)', '模块声明与全局类型', '条件类型与 infer',
    '装饰器原理与使用', 'tsconfig常用配置', '类型兼容性与结构化类型',
    'declare与.d.ts声明文件'
  ],
  'performance': [
    '首屏加载优化', '代码分割与懒加载', 'Tree Shaking原理',
    '图片优化(WebP/懒加载/响应式)', '关键渲染路径优化', 'requestAnimationFrame使用',
    'Web Worker与计算密集任务', '虚拟列表与长列表优化', '防抖节流应用场景',
    '资源预加载(prefetch/preload)', 'Core Web Vitals指标', '浏览器缓存策略',
    'Service Worker与PWA', '打包体积分析与优化'
  ],
  'network': [
    'TCP三次握手四次挥手', 'HTTP状态码与语义', 'HTTPS握手与证书链',
    'HTTP缓存策略(强缓存/协商缓存)', 'HTTP/2多路复用与头部压缩', 'HTTP/3与QUIC协议',
    'DNS解析链路与优化', 'CDN原理与边缘计算', 'WebSocket与HTTP长轮询',
    'CORS跨域与预检请求', 'CSRF与XSS攻击防御', 'JWT结构、安全与最佳实践',
    'Cookie属性(HttpOnly/SameSite/Secure)', 'OAuth2.0授权码流程'
  ],
  'browser': [
    '浏览器渲染管线(Critical Rendering Path)', '回流(reflow)与重绘(repaint)',
    '事件循环与宏微任务队列', 'V8引擎JIT编译', '浏览器缓存机制(内存/磁盘/ServiceWorker)',
    '跨域与同源策略', '事件流(捕获→目标→冒泡)', '内存管理与垃圾回收',
    'requestAnimationFrame与requestIdleCallback', 'Web Worker与OffscreenCanvas',
    'Performance API与Core Web Vitals', '浏览器进程架构(多进程沙箱)'
  ],
  'engineering': [
    'Vite/Rspack构建原理', '代码分割(Code Splitting)策略', 'Tree Shaking机制',
    'HMR热更新原理', 'ESLint/Prettier配置', 'Git工作流与Conventional Commits',
    'CI/CD流水线设计', 'Docker多阶段构建', '单元测试vs集成测试vsE2E',
    '性能监控(错误/性能/用户行为)', '微前端架构(qiankun/Module Federation)',
    'Monorepo管理(pnpm workspace/turborepo)'
  ],
  'git': [
    'Git对象模型(blob/tree/commit)', '暂存区与工作区', '分支操作与合并策略',
    'rebase交互式变基', 'cherry-pick与revert', '冲突解决策略',
    'Git Hooks与自动化', 'Git Flow vs Trunk-Based Development', '子模块与subtree',
    'Git reflog与数据恢复'
  ],
  'scenario': [
    '大文件分片上传与断点续传', '图片懒加载与Intersection Observer',
    '虚拟列表(virtual scroll)实现', '无限滚动与预加载', '搜索防抖与请求竞态',
    '表单验证与错误状态设计', 'RBAC权限控制系统', '数据可视化(ECharts/D3)',
    '实时协作编辑(OT/CRDT)', '多语言国际化(i18n)', '主题切换(亮色/暗色)',
    '拖拽排序实现', '文件导出(Excel/PDF)', 'SSE/WebSocket推送通知',
    '前端水印与防截屏', '灰度发布与AB测试'
  ],
  'coding': [
    '数组扁平化与去重', '深拷贝(考虑循环引用/特殊类型)', 'Promise链与并发控制',
    'EventEmitter实现', '防抖(debounce)与节流(throttle)', '函数柯里化实现',
    '发布订阅模式', 'LRU缓存实现', '虚拟DOM diff简化版',
    '模板字符串解析', '大数相加', 'Promise.all/promiseAllSettled实现',
    'LazyMan异步任务链', '树转数组与数组转树', '对象扁平化与反扁平化'
  ]
}

const CATEGORY_NAMES = {
  'html-css': 'HTML/CSS',
  'javascript': 'JavaScript',
  'vue': 'Vue',
  'react': 'React',
  'jquery': 'jQuery',
  'nodejs': 'Node.js',
  'es6': 'ES6+',
  'typescript': 'TypeScript',
  'performance': '性能优化',
  'network': '计算机网络',
  'browser': '浏览器原理',
  'engineering': '工程化',
  'git': 'Git',
  'scenario': '场景应用题',
  'coding': '手写代码题'
}

function getCategoryName(id) {
  return CATEGORY_NAMES[id] || id
}

function getTopics(category) {
  return TOPICS[category] || ['核心概念', '基本原理', '实际应用', '性能优化', '最佳实践']
}

function sampleTopics(category, count = 3) {
  const all = getTopics(category)
  // Fisher-Yates 洗牌
  const shuffled = [...all]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
module.exports = { TOPICS, CATEGORY_NAMES, getCategoryName, getTopics, sampleTopics }
