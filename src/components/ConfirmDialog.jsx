export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="calc-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="calc-modal confirm-dialog">
        <p className="confirm-message">{message}</p>
        <div className="split-modal-actions">
          <button className="cancel-btn" onClick={onCancel}>取消</button>
          <button className="delete-confirm-btn" onClick={onConfirm}>刪除</button>
        </div>
      </div>
    </div>
  )
}
