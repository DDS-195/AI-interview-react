// 下载固定版本的本地模型并核对文件，运行时不会临时联网补模型。
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { pipeline } = require('node:stream/promises')
const { createHash } = require('node:crypto')
const axios = require('axios')
const { MODEL, REVISION, modelDirectory } = require('../services/knowledge/localModel')
const files = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  'special_tokens_map.json',
  'onnx/model_quantized.onnx'
]
const modelHash = 'f80102d3f2a1229f387d3c81909990d8945513e347b0eab049f7de3c6f98c193'
async function valid(file, isJSON = file.endsWith('.json')) {
  try {
    if (isJSON) {
      JSON.parse(await fsp.readFile(file, 'utf8'))
      return true
    }
    const hash = createHash('sha256')
    for await (const part of fs.createReadStream(file)) {
      hash.update(part)
    }
    return hash.digest('hex') === modelHash
  } catch {
    return false
  }
}
async function download() {
  const host = process.argv.includes('--mirror')
    ? 'https://hf-mirror.com'
    : 'https://huggingface.co'
  const folder = modelDirectory(REVISION)
  for (const name of files) {
    const target = path.join(folder, name)
    if (await valid(target)) {
      console.log('已缓存：' + name)
      continue
    }
    await fsp.mkdir(path.dirname(target), { recursive: true })
    console.log('下载：' + name)
    const response = await axios.get(host + '/' + MODEL + '/resolve/' + REVISION + '/' + name, {
      responseType: 'stream',
      timeout: 180000,
      maxRedirects: 5
    })
    const temporary = target + '.part'
    await pipeline(response.data, fs.createWriteStream(temporary))
    if (!(await valid(temporary, name.endsWith('.json')))) {
      throw new Error('模型文件校验失败，未启用下载内容')
    }
    await fsp.rename(temporary, target)
  }
  console.log('本地向量模型下载完成，可离线运行。')
}
download().catch((error) => {
  console.error('模型下载失败：' + (error.code || error.message))
  process.exitCode = 1
})
