// 保留统一 Store 创建入口，当前运行时使用 MySQL。
const validation = require('./dataValidation')

function createDataStore(options) {
  return require('./mysqlStore')(options)
}

module.exports = { createDataStore, ...validation }
