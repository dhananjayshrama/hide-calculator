import { useState } from 'react'

const SECRET = '1234' // change this to your own secret code

function evaluate(expr) {
  const raw = expr.match(/\d*\.?\d+|[+\-*/]/g)
  if (!raw) return null
  const t = []
  for (let i = 0; i < raw.length; i++) {
    const x = raw[i]
    const prev = t[t.length - 1]
    if (x === '-' && (t.length === 0 || typeof prev === 'string') && raw[i + 1] && !isNaN(raw[i + 1])) {
      t.push(-parseFloat(raw[++i]))
    } else if (!isNaN(x)) t.push(parseFloat(x))
    else t.push(x)
  }
  if (typeof t[0] !== 'number') return null
  const a = [t[0]]
  for (let i = 1; i < t.length; i += 2) {
    const op = t[i], n = t[i + 1]
    if (typeof n !== 'number') return null
    if (op === '*') a[a.length - 1] *= n
    else if (op === '/') a[a.length - 1] /= n
    else a.push(op, n)
  }
  let r = a[0]
  for (let i = 1; i < a.length; i += 2) r = a[i] === '+' ? r + a[i + 1] : r - a[i + 1]
  return Number.isFinite(r) ? +r.toFixed(10) : null
}

// iPhone-style layout: 4 columns, "0" spans two columns
const KEYS = ['C','⌫','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=']
const LABELS = { '/': '÷', '*': '×', '-': '−' }
const pretty = (s) => s.replace(/\//g, '÷').replace(/\*/g, '×').replace(/-/g, '−')

export default function Calculator({ onUnlock }) {
  const [expr, setExpr] = useState('')
  const [history, setHistory] = useState('')
  const [done, setDone] = useState(false)

  const isOp = (k) => '+-*/'.includes(k)
  const hasOp = /\d[+\-*/]/.test(expr)
  const preview = !done && hasOp ? evaluate(expr) : null

  const press = (k) => {
    if (k === 'C') { setExpr(''); setHistory(''); setDone(false); return }
    if (k === '⌫') { if (!done) setExpr(expr.slice(0, -1)); return }
    if (k === '%') {
      const m = expr.match(/(\d*\.?\d+)$/)
      if (m) setExpr(expr.slice(0, m.index) + String(+(parseFloat(m[1]) / 100).toFixed(10)))
      return
    }
    if (k === '=') {
      if (expr === SECRET) { setExpr(''); onUnlock(); return }
      const r = evaluate(expr)
      if (r !== null) { setHistory(expr); setExpr(String(r)); setDone(true) }
      return
    }
    if (done) {
      setHistory('')
      setExpr(isOp(k) ? expr + k : k)
      setDone(false)
      return
    }
    setExpr(expr + k)
  }

  const shown = done ? expr : preview !== null ? String(preview) : ''
  const size = shown.length > 12 ? 34 : shown.length > 9 ? 44 : shown.length > 6 ? 60 : 80

  const cls = (k) => {
    if (k === '=') return 'op'
    if (isOp(k)) return 'op' + (!done && expr.endsWith(k) ? ' active' : '')
    if (['C', '⌫', '%'].includes(k)) return 'fn'
    if (k === '0') return 'zero'
    return ''
  }

  return (
    <div className="calc">
      <div className="display">
        <div className="history">{done ? pretty(history) + ' =' : pretty(expr) || '\u00A0'}</div>
        <div className={'result ' + (done ? 'white' : 'gray')} style={{ fontSize: size }}>
          {shown || '\u00A0'}
        </div>
      </div>

      <div className="keys">
        {KEYS.map((k) => (
          <button key={k} className={cls(k)} onClick={() => press(k)}>
            {k === 'C' ? (expr ? 'C' : 'AC') : LABELS[k] || k}
          </button>
        ))}
      </div>

      <div className="credit">Made by Dhananjay</div>
    </div>
  )
}