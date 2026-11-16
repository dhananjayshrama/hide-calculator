import { useEffect, useState } from 'react'
import { addMedia, getAllMedia, removeMedia } from './db'

export default function Vault({ onLock }) {
  const [tab, setTab] = useState('image')
  const [items, setItems] = useState([])

  const load = async () => {
    const all = await getAllMedia()
    setItems(all.map((m) => ({ ...m, url: URL.createObjectURL(m.blob) })))
  }

  useEffect(() => {
    load()
    return () => items.forEach((i) => URL.revokeObjectURL(i.url))
    // eslint-disable-next-line
  }, [])

  const onPick = async (e) => {
    for (const f of e.target.files) await addMedia(f)
    e.target.value = ''
    load()
  }

  const del = async (id) => { await removeMedia(id); load() }

  const shown = items.filter((i) => i.type.startsWith(tab))

  return (
    <div className="vault">
      <div className="vhead">
        <h2>🔒 Private Vault</h2>
        <button className="lock" onClick={onLock}>Lock</button>
      </div>

      <div className="tabs">
        <button className={tab === 'image' ? 'active' : ''} onClick={() => setTab('image')}>
          Images ({items.filter((i) => i.type.startsWith('image')).length})
        </button>
        <button className={tab === 'video' ? 'active' : ''} onClick={() => setTab('video')}>
          Videos ({items.filter((i) => i.type.startsWith('video')).length})
        </button>
      </div>

      <label className="add">
        + Add {tab === 'image' ? 'images' : 'videos'}
        <input type="file" hidden multiple accept={tab === 'image' ? 'image/*' : 'video/*'} onChange={onPick} />
      </label>

      <div className="grid">
        {shown.length === 0 && <p className="empty">Nothing here yet.</p>}
        {shown.map((m) => (
          <div className="card" key={m.id}>
            {tab === 'image' ? <img src={m.url} alt="" /> : <video src={m.url} controls />}
            <button className="del" onClick={() => del(m.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}