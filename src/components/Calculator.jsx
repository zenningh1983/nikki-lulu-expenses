import { useState } from 'react'

export default function Calculator({ value, onChange, onClose }) {
  const initial = value && value !== '0' ? String(value) : '0'
  const [display, setDisplay] = useState(initial)
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(false) // next digit starts new number

  function pressDigit(d) {
    if (fresh) {
      setDisplay(d)
      setFresh(false)
    } else {
      setDisplay(cur => cur === '0' ? d : cur.length < 10 ? cur + d : cur)
    }
  }

  function pressDot() {
    if (fresh) { setDisplay('0.'); setFresh(false); return }
    if (!display.includes('.')) setDisplay(cur => cur + '.')
  }

  function pressOp(o) {
    setPrev(display)
    setOp(o)
    setFresh(true)
  }

  function calc(a, b, o) {
    const x = parseFloat(a), y = parseFloat(b)
    if (o === '+') return x + y
    if (o === '-') return x - y
    if (o === '×') return x * y
    if (o === '÷') return y !== 0 ? x / y : 0
    return y
  }

  function pressEquals() {
    if (op && prev !== null) {
      const result = calc(prev, display, op)
      const str = Number.isInteger(result) ? String(result) : parseFloat(result.toFixed(2)).toString()
      setDisplay(str)
      setPrev(null)
      setOp(null)
      setFresh(true)
    }
  }

  function pressBackspace() {
    if (fresh) return
    setDisplay(cur => cur.length > 1 ? cur.slice(0, -1) : '0')
  }

  function pressClear() {
    setDisplay('0'); setPrev(null); setOp(null); setFresh(false)
  }

  function confirm() {
    const val = parseFloat(display)
    onChange(isNaN(val) ? '' : String(Math.round(val * 100) / 100))
    onClose()
  }

  const buttons = [
    ['C', '⌫', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '0', '.', '='],
  ]

  function handleBtn(btn) {
    if (btn === 'C') pressClear()
    else if (btn === '⌫') pressBackspace()
    else if (btn === '=') pressEquals()
    else if (btn === '確認') confirm()
    else if (['+', '-', '×', '÷'].includes(btn)) pressOp(btn)
    else if (btn === '.') pressDot()
    else if (btn === '00') { pressDigit('0'); pressDigit('0') }
    else pressDigit(btn)
  }

  const displayNum = isNaN(parseFloat(display)) ? display : display.includes('.')
    ? display.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '.')
    : parseFloat(display).toLocaleString()

  const layout = [
    ['÷', '×', '-', '+'],
    ['7', '8', '9', '⌫'],
    ['4', '5', '6', 'C'],
    ['1', '2', '3', '='],
    ['.', '0', '00', '確認'],
  ]

  return (
    <div className="calc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="calc-modal">
        <div className="calc-display">
          {op && prev && <span className="calc-expr">{parseFloat(prev).toLocaleString()} {op}</span>}
          <span className="calc-value">{displayNum}</span>
        </div>
        <div className="calc-grid">
          {layout.map((row, ri) => (
            <div key={ri} className="calc-row">
              {row.map(btn => (
                <button
                  type="button"
                  key={btn + ri}
                  className={`calc-btn
                    ${['+','-','×','÷'].includes(btn) ? 'op' : ''}
                    ${btn === 'C' || btn === '⌫' ? 'clear' : ''}
                    ${btn === '=' ? 'equals' : ''}
                    ${btn === '確認' ? 'confirm' : ''}
                  `}
                  onClick={() => handleBtn(btn)}
                >
                  {btn}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
