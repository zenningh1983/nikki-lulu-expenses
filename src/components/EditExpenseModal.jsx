import { useState, useRef } from 'react'
import DatePicker from 'react-datepicker'
import { supabase } from '../lib/supabase'
import Calculator from './Calculator'
import SplitRatioPicker from './SplitRatioPicker'

const CATEGORIES = ['學費/補習', '學用品/教材講義', '醫療保健', '日常用品', '早餐', '零用錢', '治裝']

function toDateObj(str) { return str ? new Date(str + 'T00:00:00') : new Date() }
function toDateStr(d) { return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '' }

export default function EditExpenseModal({ expense, onSaved, onClose }) {
  const [form, setForm] = useState({
    date: toDateObj(expense.date),
    category: expense.category,
    description: expense.description,
    amount: String(expense.amount),
    split_ratio: String(expense.split_ratio ?? 50),
  })
  const [saving, setSaving] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const descRef = useRef(null)

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const editRatio = parseFloat(form.split_ratio) || 0
  const editSplit = form.amount ? Math.round(parseFloat(form.amount) * editRatio / 100) : 0

  async function save() {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    await supabase.from('expenses').update({
      date: toDateStr(form.date),
      category: form.category,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      split_ratio: parseFloat(form.split_ratio) || 50,
    }).eq('id', expense.id)
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="calc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="calc-modal edit-modal">
        <p className="split-modal-title">修改費用</p>

        <div className="edit-modal-grid">
          <label>日期</label>
          <DatePicker
            selected={form.date}
            onChange={d => setForm(f => ({ ...f, date: d }))}
            dateFormat="yyyy/MM/dd"
            className="date-picker-input"
            calendarClassName="muji-calendar"
            todayButton="今天"
          />
          <label>類別</label>
          <select value={form.category} onChange={handle('category')}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <label>金額</label>
          <div className="amount-display" onClick={() => setShowCalc(true)}>
            {form.amount ? Number(form.amount).toLocaleString() : <span className="amount-placeholder">點擊輸入金額</span>}
          </div>
          <label>說明</label>
          <input ref={descRef} type="text" value={form.description} onChange={handle('description')} />
          <label>拆帳比例</label>
          <div className="amount-display split-display" onClick={() => setShowSplit(true)}>
            {form.split_ratio}%
            {editSplit > 0 && <span className="split-display-amount">對方付 {editSplit.toLocaleString()}</span>}
          </div>
        </div>

        <div className="split-modal-actions">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="save-btn" onClick={save} disabled={saving || !form.amount || !form.description.trim()}>
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      {showCalc && <Calculator value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} onClose={() => { setShowCalc(false); setTimeout(() => descRef.current?.focus(), 50) }} />}
      {showSplit && <SplitRatioPicker value={form.split_ratio} amount={form.amount} onConfirm={v => setForm(f => ({ ...f, split_ratio: v }))} onClose={() => setShowSplit(false)} />}
    </div>
  )
}
