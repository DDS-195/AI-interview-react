// 固定本地模型及索引指纹，避免不同模型或切片配置产生的向量混用。
const { hash, fail } = require('./validation')
const { CHUNKING_VERSION } = require('./chunker')
const { MODEL, REVISION } = require('./localModel')
function knowledgeConfig(env = process.env) {
  const mode = env.RAG_MODE || 'off'
  if (!['off', 'prefer'].includes(mode)) {
    fail('RAG_MODE仅支持off或prefer', 503)
  }
  // 模型固定，学习阶段只需要决定是否开启RAG。指纹仅用于拒绝旧模型留下的向量。
  return {
    mode,
    provider: 'local',
    model: MODEL,
    revision: REVISION,
    dimension: 384,
    configured: true,
    profileKey: hash(
      JSON.stringify({
        provider: 'local',
        baseUrl: '',
        model: MODEL,
        revision: REVISION,
        dimension: 384,
        chunking: CHUNKING_VERSION,
        distance: 'Cosine'
      })
    )
  }
}
module.exports = { knowledgeConfig }
