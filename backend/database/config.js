// 只在后端读取数据库配置，校验数据库名和连接参数后再交给 mysql2。
function integer(value, name, fallback, max) {
  const result = value === undefined || value === '' ? fallback : Number(value)
  if (!Number.isSafeInteger(result) || result < 1 || result > max) {
    throw new Error(`${name}配置无效`)
  }
  return result
}

function databaseName(value) {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value)) {
    throw new Error('MySQL数据库名须为字母开头，最多64位字母、数字或下划线')
  }
  return value
}

function mysqlConfig(overrides = {}) {
  return {
    host: overrides.host ?? process.env.MYSQL_HOST ?? '127.0.0.1',
    port: integer(overrides.port ?? process.env.MYSQL_PORT, 'MySQL端口', 3306, 65535),
    user: overrides.user ?? process.env.MYSQL_USER ?? 'root',
    password: overrides.password ?? process.env.MYSQL_PASSWORD ?? '',
    database: databaseName(
      overrides.database ?? process.env.MYSQL_DATABASE ?? 'ai_frontend_interview'
    ),
    connectionLimit: integer(
      overrides.connectionLimit ?? process.env.MYSQL_CONNECTION_LIMIT,
      'MySQL连接数',
      4,
      20
    ),
    connectTimeout: integer(overrides.connectTimeout, 'MySQL连接超时', 5000, 60000),
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: true,
    jsonStrings: true,
    enableKeepAlive: true,
    waitForConnections: true,
    queueLimit: 100
  }
}

function connectionConfig(config) {
  const connection = { ...config }
  for (const key of ['connectionLimit', 'waitForConnections', 'queueLimit']) {
    delete connection[key]
  }
  return connection
}

module.exports = { mysqlConfig, databaseName, connectionConfig }
