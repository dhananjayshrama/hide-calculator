import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { addMedia, getAllMedia, removeMedia } from './db'

// ✏️ KEEP YOUR ABOUT = { ... } BLOCK HERE, unchanged

const toBase64 = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(blob)
  })

// Save a file back to the phone (or download it in a browser)
async function saveToDevice(item) {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: `Unhidden/${Date.now()}_${item.name}`,
      data: await toBase64(item.blob),
      directory: Directory.Documents,
      recursive: true,
    })
  } else {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(item.blob)
    a.download = item.name
    a.click()
  }
}

export default function Vault({ onLock }) {
  const [tab, setTab] = useState('image')
  const [items, setItems] = useState([])
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const urlsRef = useRef([])

  const load = async () => {
    urlsRef.current.forEach(URL.revokeObjectURL)
    const all = await getAllMedia()
    const withUrls = all.map((m) => ({ ...m, url: URL.createObjectURL(m.blob) }))
    urlsRef.current = withUrls.map((m) => m.url)
    setItems(withUrls)
  }

  useEffect(() => {
    load()
    return () => urlsRef.current.forEach(URL.revokeObjectURL)
    // eslint-disable-next-line
  }, [])

  const onPick = async (e) => {
    for (const f of e.target.files) await addMedia(f)
    e.target.value = ''
    load()
  }

  const isMedia = tab === 'image' || tab === 'video'
  const shown = items.filter((i) => i.type.startsWith(tab))

  const changeTab = (t) => {
    setTab(t)
    setSelectMode(false)
    setSelected(new Set())
  }

  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const selectAll = () =>
    setSelected(
      selected.size === shown.length ? new Set() : new Set(shown.map((i) => i.id))
    )

  const exitSelect = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  const chosen = () => shown.filter((i) => selected.has(i.id))

  const unhide = async () => {
    const list = chosen()
    if (!list.length) return
    setBusy(true)
    try {
      for (const item of list) await saveToDevice(item)
      for (const item of list) await removeMedia(item.id)
      alert(`${list.length} file(s) unhidden. Saved in Documents/Unhidden.`)
    } catch (err) {
      alert('Unhide failed: ' + (err?.message || err) + '\nNothing was deleted from the vault.')
    }
    setBusy(false)
    exitSelect()
    load()
  }

  const del = async () => {
    const list = chosen()
    if (!list.length) return
    if (!confirm(`Permanently delete ${list.length} file(s)? This cannot be undone.`)) return
    setBusy(true)
    for (const item of list) await removeMedia(item.id)
    setBusy(false)
    exitSelect()
    load()
  }

  return (
    <div className="vault">
      <div className="vhead">
        <h2>🔒 Private Vault</h2>
        <button className="lock" onClick={onLock}>Lock</button>
      </div>

      <div className="tabs">
        <button className={tab === 'image' ? 'active' : ''} onClick={() => changeTab('image')}>
          Images ({items.filter((i) => i.type.startsWith('image')).length})
        </button>
        <button className={tab === 'video' ? 'active' : ''} onClick={() => changeTab('video')}>
          Videos ({items.filter((i) => i.type.startsWith('video')).length})
        </button>
        <button className={tab === 'about' ? 'active' : ''} onClick={() => changeTab('about')}>
          About
        </button>
      </div>

      {isMedia && (
        <>
          <div className="toolbar">
            <label className="add">
              + Hide {tab === 'image' ? 'images' : 'videos'}
              <input type="file" hidden multiple accept={tab === 'image' ? 'image/*' : 'video/*'} onChange={onPick} />
            </label>
            {shown.length > 0 && (
              <button className="selbtn" onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}>
                {selectMode ? 'Cancel' : 'Select'}
              </button>
            )}
          </div>

          {selectMode && (
            <button className="selall" onClick={selectAll}>
              {selected.size === shown.length ? 'Deselect all' : 'Select all'}
            </button>
          )}

          <div className="grid">
            {shown.length === 0 && <p className="empty">Nothing here yet.</p>}
            {shown.map((m) => (
              <div
                className={'card' + (selected.has(m.id) ? ' sel' : '')}
                key={m.id}
              >
                {tab === 'image'
                  ? <img src={m.url} alt="" />
                  : <video src={m.url} controls={!selectMode} muted />}
                {selectMode && (
                  <div className="pick" onClick={() => toggle(m.id)}>
                    <span className="check">{selected.has(m.id) ? '✔' : ''}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectMode && (
            <div className="selbar">
              <span>{selected.size} selected</span>
              <button disabled={busy || !selected.size} onClick={unhide}>Unhide</button>
              <button className="danger" disabled={busy || !selected.size} onClick={del}>Delete</button>
            </div>
          )}
        </>
      )}

      {tab === 'about' && (
        <div className="about">
          {/* keep your existing About JSX here, unchanged */}
        </div>
      )}
    </div>
  )
}