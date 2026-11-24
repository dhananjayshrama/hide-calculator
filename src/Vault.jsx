import { useEffect, useState } from 'react'
import { addMedia, getAllMedia, removeMedia } from './db'

// ✏️ Edit your own details here
const ABOUT = {
  name: 'Dhananjay',
  tagline: 'Web developer • Solapur, Maharashtra',
  aboutMe:
    'Write a short intro about yourself here: who you are, what you enjoy building, and your interests.',
  professional: {
    role: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'HTML/CSS', 'IndexedDB'],
    experience: 'Add your experience, projects or education here.',
    email: 'your@email.com',
    links: [
      { label: 'GitHub', url: 'https://github.com/your-username' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/your-username' },
    ],
  },
  howDeveloped: [
    'Built with React (hooks) and plain CSS.',
    'The calculator uses a custom expression evaluator with operator precedence.',
    'Typing the secret code and pressing "=" unlocks the vault.',
    'Photos and videos are stored as blobs in the browser\'s IndexedDB, so they stay on your device.',
    'No backend and no uploads. Everything is local.',
  ],
}

export default function Vault({ onLock }) {
  const [tab, setTab] = useState('image')
  const [items, setItems] = useState([])

  const load = async () => {
    const all = await getAllMedia()
    setItems(all.map((m) => ({ ...m, url: URL.createObjectURL(m.blob) })))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [])

  const onPick = async (e) => {
    for (const f of e.target.files) await addMedia(f)
    e.target.value = ''
    load()
  }

  const del = async (id) => { await removeMedia(id); load() }

  const isMedia = tab === 'image' || tab === 'video'
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
        <button className={tab === 'about' ? 'active' : ''} onClick={() => setTab('about')}>
          About
        </button>
      </div>

      {isMedia && (
        <>
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
        </>
      )}

      {tab === 'about' && (
        <div className="about">
          <section>
            <h3>{ABOUT.name}</h3>
            <p className="muted">{ABOUT.tagline}</p>
          </section>

          <section>
            <h4>About me</h4>
            <p>{ABOUT.aboutMe}</p>
          </section>

          <section>
            <h4>Professional</h4>
            <p><b>{ABOUT.professional.role}</b></p>
            <div className="chips">
              {ABOUT.professional.skills.map((s) => <span key={s}>{s}</span>)}
            </div>
            <p>{ABOUT.professional.experience}</p>
            <p>📧 <a href={`mailto:${ABOUT.professional.email}`}>{ABOUT.professional.email}</a></p>
            <p>
              {ABOUT.professional.links.map((l) => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer">{l.label} </a>
              ))}
            </p>
          </section>

          <section>
            <h4>How this app was developed</h4>
            <ul>
              {ABOUT.howDeveloped.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}