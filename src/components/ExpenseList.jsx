import { useState } from 'react'
import { supabase } from '../lib/supabase'
import ConfirmDialog from './ConfirmDialog'
import EditExpenseModal from './EditExpenseModal'

export default function ExpenseList({ expenses, onDeleted }) {
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [editingExp, setEditingExp] = useState(null)

  async function remove(id) {
    setDeleting(id)
    await supabase.from('expenses').delete().eq('id', id)
    setDeleting(null)
    setConfirmId(null)
    onDeleted()
  }

  if (expenses.length === 0) {
    return <p className="empty">這個月還沒有記錄</p>
  }

  return (
    <>
      <div className="expense-list">
        {expenses.map(exp => {
          const ratio = Number(exp.split_ratio ?? 50)
          const splitAmount = Math.round(Number(exp.amount) * ratio / 100)
          return (
            <div key={exp.id} className="expense-item">
              <div className="expense-info">
                <span className="expense-date">{exp.date}</span>
                <span className="expense-category">{exp.category}</span>
                <span className="expense-desc">{exp.description}</span>
              </div>
              <div className="expense-right">
                <div className="expense-amounts">
                  <span className="expense-amount">NT$ {Number(exp.amount).toLocaleString()}</span>
                  <span className="expense-split">×{ratio}% ＝ NT$ {splitAmount.toLocaleString()}</span>
                </div>
                <button className="edit-btn" onClick={() => setEditingExp(exp)}>✎</button>
                <button className="delete-btn" onClick={() => setConfirmId(exp.id)} disabled={deleting === exp.id}>×</button>
              </div>
            </div>
          )
        })}
      </div>

      {editingExp && (
        <EditExpenseModal
          expense={editingExp}
          onSaved={onDeleted}
          onClose={() => setEditingExp(null)}
        />
      )}

      {confirmId && (
        <ConfirmDialog
          message="確定要刪除這筆記錄嗎？"
          onConfirm={() => remove(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  )
}
