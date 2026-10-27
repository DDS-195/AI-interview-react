// 本地模型版本和缓存目录保持集中定义，下载脚本与推理 Worker 使用同一位置。
const path = require('node:path')
const MODEL = 'Xenova/multilingual-e5-small'
const REVISION = '761b726dd34fb83930e26aab4e9ac3899aa1fa78'
const modelDirectory = (revision) =>
  path.join(__dirname, '../../.cache/embeddings', revision, 'model')
module.exports = { MODEL, REVISION, modelDirectory }
