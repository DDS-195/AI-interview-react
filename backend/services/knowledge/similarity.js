// 余弦相似度比较向量方向，返回值不是技术正确率或经过校准的置信度。
// 余弦相似度：比较两个向量的方向。越接近1，语义通常越接近。
function cosine(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return -1
  }
  let dot = 0
  let a = 0
  let b = 0
  for (let i = 0; i < left.length; i++) {
    if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) {
      return -1
    }
    dot += left[i] * right[i]
    a += left[i] ** 2
    b += right[i] ** 2
  }
  return a && b ? dot / Math.sqrt(a * b) : -1
}
module.exports = { cosine }
