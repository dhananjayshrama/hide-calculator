import { useState } from 'react'
import Calculator from './Calculator'
import Vault from './Vault'
import './index.css'

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  return unlocked
    ? <Vault onLock={() => setUnlocked(false)} />
    : <Calculator onUnlock={() => setUnlocked(true)} />
}