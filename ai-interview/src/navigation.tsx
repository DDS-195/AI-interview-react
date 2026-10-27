// 桌面侧栏和手机导航共用入口定义，避免两端出现不同的路由或名称。
import {
  QuestionCircleOutlined,
  BookOutlined,
  RetweetOutlined,
  BarChartOutlined,
  StarOutlined,
  HistoryOutlined
} from '@ant-design/icons'

export const NAVIGATION = [
  {
    key: 'questions',
    path: '/',
    label: '面试题目',
    shortLabel: '练习',
    icon: <QuestionCircleOutlined />
  },
  { key: 'bank', path: '/bank', label: '我的题库', shortLabel: '题库', icon: <BookOutlined /> },
  {
    key: 'reviews',
    path: '/reviews',
    label: '错题复习',
    shortLabel: '复习',
    icon: <RetweetOutlined />
  },
  {
    key: 'overview',
    path: '/overview',
    label: '学习概览',
    shortLabel: '概览',
    icon: <BarChartOutlined />
  },
  {
    key: 'favorites',
    path: '/favorites',
    label: '我的收藏',
    shortLabel: '收藏',
    icon: <StarOutlined />
  },
  {
    key: 'history',
    path: '/history',
    label: '答题历史',
    shortLabel: '历史',
    icon: <HistoryOutlined />
  },
  {
    key: 'knowledge',
    path: '/knowledge',
    label: '技术知识库',
    shortLabel: '知识库',
    icon: <BookOutlined />
  }
]
