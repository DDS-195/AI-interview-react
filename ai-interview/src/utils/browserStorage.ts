// 隔离浏览器存储失败，偏好读写异常不应使整个练习页面崩溃。
export function getStored(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeStored(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* 存储受限时继续使用当前会话。 */
  }
}
