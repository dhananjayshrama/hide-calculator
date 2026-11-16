const DB_NAME = 'calc-vault'
const STORE = 'media'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

const run = async (mode, fn) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

export const addMedia = (file) =>
  run('readwrite', (s) =>
    s.add({ name: file.name, type: file.type, blob: file, added: Date.now() })
  )

export const getAllMedia = () => run('readonly', (s) => s.getAll())
export const removeMedia = (id) => run('readwrite', (s) => s.delete(id))