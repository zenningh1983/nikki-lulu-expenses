import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { supabase } from '../lib/supabase'
import Calculator from './Calculator'
import SplitRatioPicker from './SplitRatioPicker'

const CATEGORIES = ['學費/補習', '學用品/教材講義', '醫療保健', '日常用品', '早餐', '零用錢', '治裝']

function toDateStr(d) { return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '' }

export default function AddExpense({ onAdded }) {
  const today = new Date()
  const [form, setForm] = useState({ date: today, category: '學費/補習', description: '', amount: '', split_ratio: '50' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCalc, setShowCalc] = useState(false)
  const [showSplit, setShowSplit] = useState(false)

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.description.trim() || !form.amount) return
    setLoading(true)
    setError('')
    const { error } = await supabase.from('expenses').insert([{
      date: toDateStr(form.date),
      category: form.category,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      split_ratio: parseFloat(form.split_ratio) || 50,
    }])
    setLoading(false)
    if (error) { setError('新增失敗，請再試一次'); return }
    setForm({ date: new Date(), category: '學費/補習', description: '', amount: '', split_ratio: '50' })
    onAdded()
  }

  const splitAmount = form.amount ? Math.round(parseFloat(form.amount) * (parseFloat(form.split_ratio) || 0) / 100) : 0

  return (
    <form className="add-form" onSubmit={submit}>
      <h3>新增費用</h3>
      <div className="form-row">
        <label>日期</label>
        <DatePicker
          selected={form.date}
          onChange={d => setForm(f => ({ ...f, date: d }))}
          dateFormat="yyyy/MM/dd"
          locale="zh-TW"
          className="date-picker-input"
          calendarClassName="muji-calendar"
          todayButton="今天"
        />
      </div>
      <div className="form-row">
        <label>類別</label>
        <select value={form.category} onChange={handle('category')}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label>金額</label>
        <div className="amount-display" onClick={() => setShowCalc(true)}>
          {form.amount ? Number(form.amount).toLocaleString() : <span className="amount-placeholder">點擊輸入金額</span>}
        </div>
      </div>
      {showCalc && <Calculator value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} onClose={() => setShowCalc(false)} />}
      <div className="form-row">
        <label>說明</label>
        <input type="text" placeholder="例：英文補習費" value={form.description} onChange={handle('description')} required />
      </div>
      <div className="form-row">
        <label>拆帳比例</label>
        <div className="amount-display split-display" onClick={() => setShowSplit(true)}>
          {form.split_ratio}%
          {splitAmount > 0 && <span className="split-display-amount">對方付 {splitAmount.toLocaleString()}</span>}
        </div>
      </div>
      {showSplit && <SplitRatioPicker value={form.split_ratio} amount={form.amount} onConfirm={v => setForm(f => ({ ...f, split_ratio: v }))} onClose={() => setShowSplit(false)} />}
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? '新增中...' : '新增'}</button>
    </form>
  )
}
