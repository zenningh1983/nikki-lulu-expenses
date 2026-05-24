import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import AddExpense from './components/AddExpense'
import ExpenseList from './components/ExpenseList'
import MonthlySummary from './components/MonthlySummary'
import './App.css'

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function App() {
  const [tab, setTab] = useState('list')
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const [showAdd, setShowAdd] = useState(false)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const [year, month] = yearMonth.split('-')
    const start = `${year}-${month}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })

    setExpenses(data || [])
    setLoading(false)
  }, [yearMonth])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  function prevMonth() {
    const [y, m] = yearMonth.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  function nextMonth() {
    const [y, m] = yearMonth.split('-').map(Number)
    const d = new Date(y, m, 1)
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [year, month] = yearMonth.split('-')
  const monthLabel = `${year} 年 ${parseInt(month)} 月`
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>~$$$ 蕃茄茹茹 $$$~</h1>
      </header>

      <div className="month-nav">
        <button className="nav-btn" onClick={prevMonth}>‹</button>
        <span className="month-label">{monthLabel}</span>
        <button className="nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div className="tab-bar">
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>記錄</button>
        <button className={`tab ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>彙整截圖</button>
      </div>

      {loading ? (
        <p className="loading">載入中...</p>
      ) : tab === 'list' ? (
        <div className="list-view">
          <div className="list-header">
            <span>{monthLabel}・共 {expenses.length} 筆</span>
            <span className="list-total">NT$ {total.toLocaleString()}</span>
          </div>
          <ExpenseList expenses={expenses} onDeleted={fetchExpenses} />
        </div>
      ) : (
        <div className="summary-view">
          <MonthlySummary expenses={expenses} yearMonth={yearMonth} />
        </div>
      )}

      {tab === 'list' && (
        <button className="fab" type="button" onClick={() => setShowAdd(true)}>+</button>
      )}

      {showAdd && <AddExpense onAdded={fetchExpenses} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
