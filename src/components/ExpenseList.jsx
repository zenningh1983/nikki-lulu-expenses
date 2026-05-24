import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import EditExpenseModal from './EditExpenseModal'

const LEFT_REVEAL = 132  // edit + copy
const RIGHT_REVEAL = 76  // delete

function SwipeItem({ exp, onEdit, onCopy, onDelete, openId, setOpenId }) {
  const [offset, setOffset] = useState(0)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const isOpen = openId === exp.id

  // Close if another item opens
  if (!isOpen && offset !== 0) {
    setOffset(0)
  }

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    baseOffset.current = offset
    dragging.current = false
  }

  function onTouchMove(e) {
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (!dragging.current) {
      if (Math.abs(dy) > Math.abs(dx)) return  // vertical scroll, ignore
      if (Math.abs(dx) < 6) return             // not enough movement yet
      dragging.current = true
      setOpenId(exp.id)
    }

    e.preventDefault()
    const next = Math.max(-RIGHT_REVEAL, Math.min(LEFT_REVEAL, baseOffset.current + dx))
    setOffset(next)
  }

  function onTouchEnd() {
    if (!dragging.current) return
    dragging.current = false

    if (offset < -RIGHT_REVEAL / 2) setOffset(-RIGHT_REVEAL)
    else if (offset > LEFT_REVEAL / 2) setOffset(LEFT_REVEAL)
    else { setOffset(0); setOpenId(null) }
  }

  function close() {
    setOffset(0)
    setOpenId(null)
  }

  const ratio = Number(exp.split_ratio ?? 50)
  const splitAmount = Math.round(Number(exp.amount) * ratio / 100)

  return (
    <div className="swipe-wrapper">
      <div className="swipe-left-actions">
        <button className="swipe-action-btn copy-action" onPointerDown={e => e.stopPropagation()} onClick={() => { close(); onCopy(exp) }}>複製</button>
        <button className="swipe-action-btn edit-action" onPointerDown={e => e.stopPropagation()} onClick={() => { close(); onEdit(exp) }}>修改</button>
      </div>
      <div className="swipe-right-actions">
        <button className="swipe-action-btn delete-action" onPointerDown={e => e.stopPropagation()} onClick={() => { close(); onDelete(exp.id) }}>刪除</button>
      </div>
      <div
        className="expense-item"
        style={{ transform: `translateX(${offset}px)`, transition: dragging.current ? 'none' : 'transform 0.22s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (isOpen) close() }}
      >
        <div className="expense-info">
          <span className="expense-date">{exp.date}</span>
          <span className="expense-category">{exp.category}</span>
          <span className="expense-desc">{exp.description}</span>
        </div>
        <div className="expense-amounts">
          <span className="expense-amount">NT$ {Number(exp.amount).toLocaleString()}</span>
          <span className="expense-split">×{ratio}% ＝ NT$ {splitAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default function ExpenseList({ expenses, onDeleted }) {
  const [openId, setOpenId] = useState(null)
  const [copying, setCopying] = useState(null)
  const [editingExp, setEditingExp] = useState(null)

  async function copy(exp) {
    setCopying(exp.id)
    await supabase.from('expenses').insert([{
      date: exp.date,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      split_ratio: exp.split_ratio,
    }])
    setCopying(null)
    onDeleted()
  }

  async function remove(id) {
    await supabase.from('expenses').delete().eq('id', id)
    onDeleted()
  }

  if (expenses.length === 0) {
    return <p className="empty">這個月還沒有記錄</p>
  }

  return (
    <>
      <div className="expense-list">
        {expenses.map(exp => (
          <SwipeItem
            key={exp.id}
            exp={exp}
            openId={openId}
            setOpenId={setOpenId}
            onEdit={setEditingExp}
            onCopy={copy}
            onDelete={remove}
            copying={copying === exp.id}
          />
        ))}
      </div>

      {editingExp && (
        <EditExpenseModal
          expense={editingExp}
          onSaved={onDeleted}
          onClose={() => setEditingExp(null)}
        />
      )}


    </>
  )
}
