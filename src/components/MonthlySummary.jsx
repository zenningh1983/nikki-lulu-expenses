import { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabase'

const CATEGORY_ORDER = ['學費/補習', '學用品/教材講義', '醫療保健', '日常用品', '早餐', '零用錢', '治裝']
const HEALTH_INSURANCE_DEDUCT = 644

export default function MonthlySummary({ expenses, yearMonth }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [paidAt, setPaidAt] = useState(null)
  const [toggling, setToggling] = useState(false)

  const [year, month] = yearMonth.split('-')
  const label = `${year} 年 ${parseInt(month)} 月`

  useEffect(() => {
    supabase
      .from('monthly_payments')
      .select('paid, paid_at')
      .eq('year_month', yearMonth)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setPaid(data.paid); setPaidAt(data.paid_at) }
        else { setPaid(false); setPaidAt(null) }
      })
  }, [yearMonth])

  async function togglePaid() {
    setToggling(true)
    const newPaid = !paid
    const now = newPaid ? new Date().toISOString() : null
    await supabase.from('monthly_payments').upsert({
      year_month: yearMonth,
      paid: newPaid,
      paid_at: now,
    })
    setPaid(newPaid)
    setPaidAt(now)
    setToggling(false)
  }

  const byCategory = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = expenses.filter(e => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const totalHis = expenses.reduce((s, e) =>
    s + Math.round(Number(e.amount) * Number(e.split_ratio ?? 50) / 100), 0)
  const finalClaim = totalHis - HEALTH_INSURANCE_DEDUCT

  const totalMine = expenses.reduce((s, e) =>
    s + Math.round(Number(e.amount) * (100 - Number(e.split_ratio ?? 50)) / 100), 0)

  async function downloadImage() {
    if (!cardRef.current) return
    setDownloading(true)
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true })
    const link = document.createElement('a')
    link.download = `蕃茄茹茹費用_${yearMonth}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setDownloading(false)
  }

  function downloadCsv() {
    const rows = [['日期', '類別', '說明', '總金額', '我的比例', '我的部分']]
    expenses.forEach(e => {
      const ratio = 100 - Number(e.split_ratio ?? 50)
      const mine = Math.round(Number(e.amount) * ratio / 100)
      rows.push([e.date, e.category, e.description, Number(e.amount), `${ratio}%`, mine])
    })
    rows.push(['', '', '合計', '', '', totalMine])
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.download = `我的支出_${yearMonth}.csv`
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  if (expenses.length === 0) {
    return <p className="empty">這個月還沒有記錄</p>
  }

  return (
    <div className="summary-view-inner">
      {/* 他的部分 — 可截圖 */}
      <div className="summary-card" ref={cardRef}>
        <div className="summary-header">
          <h2>~$$$ 蕃茄茹茹 $$$~</h2>
          <p className="summary-period">{label}</p>
        </div>

        {Object.entries(byCategory).map(([cat, items]) => {
          const catHis = items.reduce((s, e) =>
            s + Math.round(Number(e.amount) * Number(e.split_ratio ?? 50) / 100), 0)
          return (
            <div key={cat} className="summary-section">
              <div className="summary-cat-header">
                <span className="summary-cat-name">{cat}</span>
                <span className="summary-cat-total">NT$ {catHis.toLocaleString()}</span>
              </div>
              {items.map(item => {
                const his = Math.round(Number(item.amount) * Number(item.split_ratio ?? 50) / 100)
                return (
                  <div key={item.id} className="summary-row">
                    <span className="summary-row-date">{item.date.slice(5).replace('-', '/')}</span>
                    <span className="summary-row-desc">{item.description}</span>
                    <span className="summary-row-amount">NT$ {his.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          )
        })}

        <div className="summary-subtotal">
          <span>費用合計</span>
          <span>NT$ {totalHis.toLocaleString()}</span>
        </div>
        <div className="summary-deduct">
          <span>扣除代墊健保費</span>
          <span>－NT$ {HEALTH_INSURANCE_DEDUCT.toLocaleString()}</span>
        </div>
        <div className="summary-total">
          <span>實際請款金額</span>
          <span>NT$ {finalClaim.toLocaleString()}</span>
        </div>

        <button
          className={`paid-toggle ${paid ? 'paid' : ''}`}
          onClick={togglePaid}
          disabled={toggling}
        >
          {paid ? '✓ 已付清' + (paidAt ? `　${new Date(paidAt).toLocaleDateString('zh-TW')}` : '') : '標記為已付清'}
        </button>
      </div>

      <button className="download-btn" onClick={downloadImage} disabled={downloading}>
        {downloading ? '處理中...' : '下載請款圖片'}
      </button>

      {/* 我的部分 */}
      <div className="summary-card mine-card">
        <div className="summary-section-title mine">我的部分</div>

        {Object.entries(byCategory).map(([cat, items]) => {
          const catMine = items.reduce((s, e) =>
            s + Math.round(Number(e.amount) * (100 - Number(e.split_ratio ?? 50)) / 100), 0)
          if (catMine === 0) return null
          return (
            <div key={cat} className="summary-section">
              <div className="summary-cat-header">
                <span className="summary-cat-name">{cat}</span>
                <span className="summary-cat-total">NT$ {catMine.toLocaleString()}</span>
              </div>
              {items.map(item => {
                const mine = Math.round(Number(item.amount) * (100 - Number(item.split_ratio ?? 50)) / 100)
                if (mine === 0) return null
                return (
                  <div key={item.id} className="summary-row">
                    <span className="summary-row-date">{item.date.slice(5).replace('-', '/')}</span>
                    <span className="summary-row-desc">{item.description}</span>
                    <span className="summary-row-amount">NT$ {mine.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          )
        })}

        <div className="summary-total mine-total">
          <span>我的支出合計</span>
          <span>NT$ {totalMine.toLocaleString()}</span>
        </div>
      </div>

      <button className="download-btn csv-btn" onClick={downloadCsv}>
        匯出我的支出 CSV
      </button>
    </div>
  )
}
