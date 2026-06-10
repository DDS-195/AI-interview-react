import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV_ID || ''
const GATEWAY = import.meta.env.VITE_CLOUDBASE_GATEWAY || ''
const COLLECTIONS = {
  questions: 'questions',
  favorites: 'favorites',
  history: 'history',
}

let app: cloudbase.app.App | null = null
let db: any = null
let uid: string | null = null

export async function initCloudBase(): Promise<boolean> {
  try {
    app = cloudbase.init({ env: ENV_ID })
    const auth = app.auth({ persistence: 'local' })

    // 匿名登录（已有凭证则复用，没有则自动创建）
    const loginState = await auth.getLoginState()
    if (!loginState) {
      await auth.signInAnonymously()
    }

    const state = await auth.getLoginState()
    uid = state?.user?.uid || null
    db = app.database()
    console.log('[CloudSync] 已连接，用户:', uid)
    return true
  } catch (e) {
    console.warn('[CloudSync] 初始化失败，仅使用本地存储', e)
    return false
  }
}

export function getUid(): string | null {
  return uid
}

// ====== 上传 ======
export async function uploadCollection(name: string, data: unknown[]) {
  if (!db || !uid) return
  try {
    const col = db.collection(COLLECTIONS[name as keyof typeof COLLECTIONS] || name)
    const docId = `${uid}_${name}`
    await col.doc(docId).set({
      uid,
      data,
      updatedAt: Date.now(),
    })
    // 上传成功
  } catch (e: any) {
    console.warn(`[CloudSync] 上传 ${name} 失败`, e?.message || e)
  }
}

// ====== 下载 ======
export async function downloadCollection(name: string): Promise<unknown[] | null> {
  if (!db || !uid) return null
  try {
    const col = db.collection(COLLECTIONS[name as keyof typeof COLLECTIONS] || name)
    const res = await col.where({ uid }).orderBy('updatedAt', 'desc').limit(1).get()
    if (res.data && res.data.length > 0) {
      return res.data[0].data || []
    }
    return null
  } catch (e) {
    console.warn(`[CloudSync] 下载 ${name} 失败`, e)
    return null
  }
}

// ====== 启动时合并：云端优先，本地补充（按时间戳合并历史/收藏） ======
export async function restoreFromCloud(
  localQuestions: unknown[],
  localFavorites: unknown[],
  localHistory: unknown[],
): Promise<{ questions: unknown[]; favorites: unknown[]; history: unknown[] }> {
  const [cloudQ, cloudF, cloudH] = await Promise.all([
    downloadCollection('questions'),
    downloadCollection('favorites'),
    downloadCollection('history'),
  ])

  // 合并：按唯一键去重合并，数据不丢失
  const merge = (a: unknown[], b: unknown[], key: string) => {
    const map = new Map()
    b.forEach((item: any) => map.set(item[key], item))
    a.forEach((item: any) => { if (!map.has(item[key])) map.set(item[key], item) })
    return Array.from(map.values())
  }
  const questions = (cloudQ && localQuestions.length > 0
    ? merge(cloudQ as any[], localQuestions as any[], 'id') as unknown[]
    : ((cloudQ || localQuestions) as unknown[]))
  const favorites = (cloudF && localFavorites.length > 0
    ? merge(cloudF as any[], localFavorites as any[], 'questionId') as unknown[]
    : ((cloudF || localFavorites) as unknown[]))
  const history = (cloudH && localHistory.length > 0
    ? merge(cloudH as any[], localHistory as any[], 'submittedAt') as unknown[]
    : ((cloudH || localHistory) as unknown[]))

  // 合并后把更新推回云端
  if (questions !== localQuestions) uploadCollection('questions', questions).catch(() => {})
  if (favorites !== localFavorites) uploadCollection('favorites', favorites).catch(() => {})
  if (history !== localHistory) uploadCollection('history', history).catch(() => {})

  return { questions, favorites, history }
}
