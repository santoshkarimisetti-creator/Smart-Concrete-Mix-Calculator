import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext.jsx'
import { deleteCalculation, loadCalculations, updateCalculationCost } from '../lib/calculations.js'
import Navbar from '../components/Navbar.jsx'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNum(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return Number(value).toFixed(digits)
}

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── View Modal ──────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="history-detail-row">
      <span className="history-detail-row__label">{label}</span>
      <strong className="history-detail-row__value">{value}</strong>
    </div>
  )
}

function ViewModal({ record, onClose }) {
  const r = record

  return (
    <div className="history-modal-backdrop" role="dialog" aria-modal="true" aria-label="Calculation details">
      <div className="history-modal">
        <header className="history-modal__header">
          <div>
            <p className="eyebrow">Saved Calculation</p>
            <h2>{r.concrete_grade} — {r.exposure_condition}</h2>
            <p className="history-modal__date">Saved on {formatDate(r.created_at)}</p>
          </div>
          <button type="button" className="history-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="history-modal__body">
          <section className="history-modal__section">
            <h3>Project Inputs</h3>
            <div className="history-detail-grid">
              <DetailRow label="Concrete Grade" value={r.concrete_grade ?? '—'} />
              <DetailRow label="Cement Type" value={r.cement_type ?? '—'} />
              <DetailRow label="Aggregate Size" value={r.aggregate_size ?? '—'} />
              <DetailRow label="Exposure Condition" value={r.exposure_condition ?? '—'} />
              <DetailRow label="Slump" value={r.slump != null ? `${r.slump} mm` : '—'} />
              <DetailRow label="W/C Ratio" value={r.water_cement_ratio != null ? formatNum(r.water_cement_ratio, 2) : '—'} />
              <DetailRow label="Area" value={r.area != null ? `${formatNum(r.area, 2)} m²` : '—'} />
              <DetailRow label="Thickness" value={r.thickness != null ? `${r.thickness} mm` : '—'} />
            </div>
          </section>

          <section className="history-modal__section">
            <h3>Mix Design Results</h3>
            <div className="history-detail-grid">
              <DetailRow label="Concrete Volume" value={r.concrete_volume != null ? `${formatNum(r.concrete_volume, 2)} m³` : '—'} />
              <DetailRow label="Target Mean Strength" value={r.target_mean_strength != null ? `${formatNum(r.target_mean_strength, 2)} MPa` : '—'} />
              <DetailRow label="Water Content" value={r.water_content != null ? `${formatNum(r.water_content, 2)} kg/m³` : '—'} />
              <DetailRow label="Cement Content" value={r.cement_content != null ? `${formatNum(r.cement_content, 2)} kg/m³` : '—'} />
              <DetailRow label="Fine Aggregate" value={r.fine_aggregate != null ? `${formatNum(r.fine_aggregate, 2)} kg/m³` : '—'} />
              <DetailRow label="Coarse Aggregate" value={r.coarse_aggregate != null ? `${formatNum(r.coarse_aggregate, 2)} kg/m³` : '—'} />
              <DetailRow label="Mix Ratio" value={r.mix_ratio ?? '—'} />
              <DetailRow label="Cement Bags" value={r.cement_bags != null ? formatNum(r.cement_bags, 2) : '—'} />
            </div>
          </section>

          <section className="history-modal__section">
            <h3>Absolute Volumes (per m³ concrete)</h3>
            <div className="history-detail-grid">
              <DetailRow
                label="Cement Volume"
                value={r.cement_volume != null ? `${formatNum(r.cement_volume, 4)} m³` : '—'}
              />
              <DetailRow
                label="Water Volume"
                value={r.water_volume != null ? `${formatNum(r.water_volume, 4)} m³` : '—'}
              />
              <DetailRow
                label="Admixture Volume"
                value={r.admixture_volume != null ? `${formatNum(r.admixture_volume, 4)} m³` : '—'}
              />
              <DetailRow
                label="Aggregate Volume"
                value={r.aggregate_volume != null ? `${formatNum(r.aggregate_volume, 4)} m³` : '—'}
              />
            </div>
          </section>

          {r.admixture ? (
            <section className="history-modal__section">
              <h3>Admixture</h3>
              <div className="history-detail-grid">
                <DetailRow label="Type" value={r.admixture_type ?? '—'} />
                <DetailRow label="Dosage" value={r.admixture_dosage != null ? `${r.admixture_dosage}%` : '—'} />
                <DetailRow label="Specific Gravity" value={r.admixture_specific_gravity != null ? formatNum(r.admixture_specific_gravity, 2) : '—'} />
                <DetailRow label="Water Reduction" value={r.water_reduction_percent != null ? `${r.water_reduction_percent}%` : '—'} />
                <DetailRow label="Admixture Quantity" value={r.admixture_quantity != null && r.admixture_quantity > 0 ? `${formatNum(r.admixture_quantity, 2)} kg` : '—'} />
              </div>
            </section>
          ) : null}

          {r.total_cost != null ? (
            <section className="history-modal__section">
              <h3>Cost Summary</h3>
              <div className="history-detail-grid">
                <DetailRow label="Total Cost" value={`₹ ${formatNum(r.total_cost, 2)}`} />
                <DetailRow label="Cost per m³" value={r.cost_per_m3 != null ? `₹ ${formatNum(r.cost_per_m3, 2)}` : '—'} />
                <DetailRow label="Cost per m²" value={r.cost_per_m2 != null ? `₹ ${formatNum(r.cost_per_m2, 2)}` : '—'} />
              </div>
            </section>
          ) : null}
        </div>

        <footer className="history-modal__footer">
          <button type="button" className="submit-button" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  )
}

// ─── Cost Panel ──────────────────────────────────────────────────────────────

function CostPanel({ record, onSaved, onCancel }) {
  const [prices, setPrices] = useState({ cementPrice: '', sandPrice: '', aggregatePrice: '', waterPrice: '', admixturePrice: '' })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setPrices((p) => ({ ...p, [name]: value }))
    setMessage('')
    setResult(null)
  }

  const handleCalculate = async () => {
    if (saving) return
    const admixtureEnabled = Boolean(record.admixture)
    const requiredKeys = ['cementPrice', 'sandPrice', 'aggregatePrice', 'waterPrice']
    if (admixtureEnabled) requiredKeys.push('admixturePrice')
    const allFilled = requiredKeys.every((k) => prices[k] !== '' && Number(prices[k]) > 0)
    if (!allFilled) {
      setMessage('Enter all material prices to calculate cost.')
      return
    }

    setSaving(true)
    setMessage('')

    // Derive totals from saved per-m³ values × concrete volume
    const vol = record.concrete_volume ?? 0
    const area = record.area ?? 0
    const quantities = {
      cementTotalKg:    (record.cement_content ?? 0) * vol,
      fineTotalKg:      (record.fine_aggregate  ?? 0) * vol,
      coarseTotalKg:    (record.coarse_aggregate ?? 0) * vol,
      waterTotalLitres: (record.water_content    ?? 0) * vol,
      admixtureQuantity: record.admixture_quantity ?? 0,
      concreteVolume:   vol,
      area,
    }

    const pricesForUpdate = {
      cementPrice:    prices.cementPrice,
      sandPrice:      prices.sandPrice,
      aggregatePrice: prices.aggregatePrice,
      waterPrice:     prices.waterPrice,
      admixturePrice: admixtureEnabled ? prices.admixturePrice : '0',
    }

    try {
      const { data, error } = await updateCalculationCost(record.id, quantities, pricesForUpdate)
      if (error) {
        setMessage(error.message || 'Unable to save cost. Please try again.')
        return
      }
      setResult({ totalCost: data.total_cost, costPerM3: data.cost_per_m3, costPerM2: data.cost_per_m2 })
      setMessage('Cost calculated and saved.')
      onSaved(data)
    } catch (err) {
      console.error('Cost update error:', err)
      setMessage('Unable to save cost. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cost-panel__body">
      <div className="cost-price-grid">
        {[
          { key: 'cementPrice',    label: 'Cement (₹/kg)',                  placeholder: 'e.g. 8' },
          { key: 'sandPrice',      label: 'Fine Aggregate / Sand (₹/kg)',   placeholder: 'e.g. 2' },
          { key: 'aggregatePrice', label: 'Coarse Aggregate (₹/kg)',        placeholder: 'e.g. 1.5' },
          { key: 'waterPrice',     label: 'Water (₹/litre)',                 placeholder: 'e.g. 0.05' },
          ...(record.admixture ? [{ key: 'admixturePrice', label: 'Admixture (₹/kg)', placeholder: 'e.g. 120' }] : []),
        ].map(({ key, label, placeholder }) => (
          <label key={key} className="cost-price-label">
            {label}
            <input
              type="number"
              name={key}
              value={prices[key]}
              onChange={handleChange}
              min="0"
              placeholder={placeholder}
              className="cost-price-input"
            />
          </label>
        ))}
      </div>
      <div className="cost-panel__actions">
        <button type="button" className="submit-button" onClick={handleCalculate} disabled={saving}>
          {saving ? 'Saving...' : 'Calculate Cost'}
        </button>
        <button type="button" className="history-delete-btn" onClick={onCancel}>Cancel</button>
      </div>
      {message && (
        <p role="status" className={`save-message ${message.includes('saved') ? 'save-message--ok' : 'save-message--err'}`}>
          {message}
        </p>
      )}
      {result && (
        <div className="cost-results">
          <div className="cost-result-item"><span>Total Cost</span><strong>₹ {Number(result.totalCost).toFixed(2)}</strong></div>
          <div className="cost-result-item"><span>Cost / m³</span><strong>{result.costPerM3 != null ? `₹ ${Number(result.costPerM3).toFixed(2)}` : '—'}</strong></div>
          <div className="cost-result-item"><span>Cost / m²</span><strong>{result.costPerM2 != null ? `₹ ${Number(result.costPerM2).toFixed(2)}` : '—'}</strong></div>
        </div>
      )}
    </div>
  )
}

// ─── Delete Confirm ──────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel, isDeleting }) {
  return (
    <div className="history-delete-confirm" role="alertdialog" aria-label="Confirm deletion">
      <p>Delete this calculation?</p>
      <div className="history-delete-confirm__actions">
        <button type="button" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </button>
        <button
          type="button"
          className="history-delete-btn--confirm"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

// ─── History Card ────────────────────────────────────────────────────────────

function HistoryCard({ record, onView, onDeleted, onCostUpdated }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showCostPanel, setShowCostPanel] = useState(false)
  const navigate = useNavigate()

  const hasCost = record.total_cost != null

  const handleTransfer = () => {
    navigate('/calculator', { state: { transfer: record } })
  }

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true)
    setDeleteError('')

    try {
      const { error } = await deleteCalculation(record.id)

      if (error) {
        console.error('Delete error:', error)
        setDeleteError('Unable to delete this calculation.')
        setIsDeleting(false)
        return
      }

      onDeleted(record.id)
    } catch (err) {
      console.error('Unexpected delete error:', err)
      setDeleteError('Unable to delete this calculation.')
      setIsDeleting(false)
    }
  }

  return (
    <article className="history-card card">
      <div className="history-card__header">
        <div>
          <strong className="history-card__grade">{record.concrete_grade ?? '—'}</strong>
          <span className="history-card__exposure">{record.exposure_condition ?? '—'} Exposure</span>
        </div>
        <span className="history-card__date">{formatDate(record.created_at)}</span>
      </div>

      <p className="history-card__geometry">
        {record.area != null ? `${formatNum(record.area, 0)} m²` : '—'}
        {record.thickness != null ? ` × ${record.thickness} mm` : ''}
      </p>

      <div className="history-card__metrics">
        <div className="history-card__metric">
          <span>Concrete Volume</span>
          <strong>{record.concrete_volume != null ? `${formatNum(record.concrete_volume, 2)} m³` : '—'}</strong>
        </div>
        <div className="history-card__metric">
          <span>Target Strength</span>
          <strong>{record.target_mean_strength != null ? `${formatNum(record.target_mean_strength, 2)} MPa` : '—'}</strong>
        </div>
        <div className="history-card__metric">
          <span>Mix Ratio</span>
          <strong>{record.mix_ratio ?? '—'}</strong>
        </div>
        {record.total_cost != null && (
          <div className="history-card__metric">
            <span>Total Cost</span>
            <strong>₹ {formatNum(record.total_cost, 2)}</strong>
          </div>
        )}
      </div>

      {deleteError ? (
        <p className="history-card__error" role="alert">{deleteError}</p>
      ) : null}

      {showCostPanel ? (
        <div className="history-card__cost-panel">
          <CostPanel
            record={record}
            onSaved={(updated) => { onCostUpdated(updated); setShowCostPanel(false) }}
            onCancel={() => setShowCostPanel(false)}
          />
        </div>
      ) : showConfirm ? (
        <DeleteConfirm
          onConfirm={handleDeleteConfirmed}
          onCancel={() => { setShowConfirm(false); setDeleteError('') }}
          isDeleting={isDeleting}
        />
      ) : (
        <div className="history-card__actions">
          <button type="button" className="topbar__link" onClick={() => onView(record)}>View</button>
          <button type="button" className="history-card__transfer-btn" onClick={handleTransfer} title="Open inputs in calculator">Transfer</button>
          {hasCost ? (
            <span className="history-card__cost-badge">Cost Added ✓</span>
          ) : (
            <button type="button" className="admixture-recommend-btn" onClick={() => setShowCostPanel(true)}>Calculate Cost</button>
          )}
          <button type="button" className="history-delete-btn" onClick={() => setShowConfirm(true)}>Delete</button>
        </div>
      )}
    </article>
  )
}

// ─── History Page ────────────────────────────────────────────────────────────

export default function History() {
  useContext(AuthContext)  // ensure auth is available

  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [viewRecord, setViewRecord] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchHistory = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const { data, error } = await loadCalculations()

        if (cancelled) return

        if (error) {
          console.error('Load history error:', error)
          setLoadError('Unable to load calculation history.')
          return
        }

        setCalculations(data ?? [])
      } catch (err) {
        if (cancelled) return
        console.error('Unexpected load error:', err)
        setLoadError('Unable to load calculation history.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHistory()
    return () => { cancelled = true }
  }, [])

  const handleDeleted = (id) => {
    setCalculations((current) => current.filter((c) => c.id !== id))
    if (viewRecord?.id === id) setViewRecord(null)
  }

  const handleCostUpdated = (updatedRow) => {
    setCalculations((current) =>
      current.map((c) => (c.id === updatedRow.id ? { ...c, ...updatedRow } : c))
    )
    // Also refresh the view modal if it's open for this record
    if (viewRecord?.id === updatedRow.id) {
      setViewRecord((v) => ({ ...v, ...updatedRow }))
    }
  }

  return (
    <>
      <Navbar />
      <main className="page-shell history-page">
        <header className="history-page__header">
          <p className="eyebrow">Smart Concrete Mix Calculator</p>
          <h1>Calculation History</h1>
          <p className="page-copy">Your saved mix designs, newest first.</p>
        </header>

        {loading ? (
          <div className="history-loading" aria-live="polite">Loading history...</div>
        ) : loadError ? (
          <div className="result-alert result-alert--error" role="alert">
            <p>{loadError}</p>
          </div>
        ) : calculations.length === 0 ? (
          <div className="history-empty card">
            <p className="history-empty__title">No calculations yet.</p>
            <p className="history-empty__body">
              Start your first concrete mix design to see it here.
            </p>
            <Link to="/calculator" className="topbar__link history-empty__cta">
              New Mix Design
            </Link>
          </div>
        ) : (
          <div className="history-list">
            {calculations.map((record) => (
              <HistoryCard
                key={record.id}
                record={record}
                onView={setViewRecord}
                onDeleted={handleDeleted}
                onCostUpdated={handleCostUpdated}
              />
            ))}
          </div>
        )}

        {viewRecord ? (
          <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />
        ) : null}
      </main>
    </>
  )
}
