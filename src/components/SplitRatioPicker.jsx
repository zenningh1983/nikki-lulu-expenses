import { useState } from 'react'

const PRESETS = [40, 50, 100]

export default function SplitRatioPicker({ value, amount, onConfirm, onClose }) {
  const [custom, setCustom] = useState(
    PRESETS.includes(Number(value)) ? '' : (value || '')
  )
  const selected = Number(value)

  function confirm(ratio) {
    onConfirm(String(ratio))
    onClose()
  }

  const customVal = parseInt(custom)
  const customValid = custom !== '' && !isNaN(customVal) && customVal >= 0 && customVal <= 100

  const hisAmount = (r) => amount ? Math.round(Number(amount) * r / 100).toLocaleString() : null

  return (
    <div className="calc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="calc-modal split-modal">
        <div className="split-presets">
          {PRESETS.map(p => (
            <button
              key={p}
              className={`split-preset-btn ${selected === p ? 'active' : ''}`}
              onClick={() => confirm(p)}
            >
              <span className="preset-pct">{p}%</span>
              {hisAmount(p) && <span className="preset-amount">{hisAmount(p)}</span>}
            </button>
          ))}
        </div>

        <div className="split-custom-row">
          <span className="split-custom-label">其他</span>
          <div className="split-custom-input-wrap">
            <input
              type="text"
              inputMode="numeric"
              value={custom}
              onChange={e => setCustom(e.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && customValid && confirm(customVal)}
            />
            <span className="split-pct">%</span>
            {customValid && hisAmount(customVal) && (
              <span className="split-preview">＝ {hisAmount(customVal)}</span>
            )}
          </div>
        </div>

        <div className="split-modal-actions">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button
            className="save-btn"
            onClick={() => customValid && confirm(customVal)}
            disabled={!customValid}
          >確認</button>
        </div>
      </div>
    </div>
  )
}
