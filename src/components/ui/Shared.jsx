export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin ${className}`} />
  )
}

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner size="lg" />
    </div>
  )
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-sm">
        <div className="modal-header">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="text-slate-400 text-sm">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-outline" onClick={onCancel}>Cancelar</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        className="btn-outline py-1.5 px-3 text-xs"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >← Anterior</button>
      <span className="text-sm text-slate-400">
        Página {page} de {totalPages}
      </span>
      <button
        className="btn-outline py-1.5 px-3 text-xs"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >Siguiente →</button>
    </div>
  )
}

export function StatusBadge({ active }) {
  return active
    ? <span className="badge-green">Activo</span>
    : <span className="badge-red">Inactivo</span>
}
