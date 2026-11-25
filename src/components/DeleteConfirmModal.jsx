export default function DeleteConfirmModal({ patient, onCancel, onConfirm, loading }) {
  if (!patient) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Patient Record</h2>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">✕</button>
        </div>
        <p className="confirm-text">
          Are you sure you want to permanently delete <strong>{patient.name}</strong>? This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}