import { useContext, useEffect, useMemo, useRef, useState } from 'react'

import FormSection from '../components/FormSection.jsx'
import InputField from '../components/InputField.jsx'
import SelectField from '../components/SelectField.jsx'
import { AuthContext } from '../context/AuthContext.jsx'
import { saveCalculation } from '../lib/calculations.js'
import { calculateMixDesign } from '../lib/mixDesignCalculator.js'
import { downloadResultExcel } from '../utils/exportExcel.js'
import {
  getAdmixtureRecommendedValues,
  mixDesignDefaults,
  mixDesignOptions,
} from '../data/mixDesignOptions.js'
import { useLocation } from 'react-router-dom'

const initialFormData = {
  concreteGrade: '',
  cementType: '',
  aggregateSize: '',
  exposureCondition: '',
  slump: '',
  waterCementRatio: '',
  cementSpecificGravity: '',
  fineAggregateSpecificGravity: '',
  coarseAggregateSpecificGravity: '',
  admixture: false,
  admixtureType: '',
  admixtureDosage: '',
  admixtureSpecificGravity: '',
  admixtureWaterReduction: '',
  area: '',
  thickness: '',
}

function ToggleButton({ active, variant = 'default', children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-variant={variant}
      className="admix-toggle-btn"
    >
      <span className="admix-toggle-btn__dot" aria-hidden="true" />
      {children}
    </button>
  )
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return Number(value).toFixed(digits)
}

function ResultMetric({ label, value, unit }) {
  return (
    <div className="result-metric">
      <span className="result-metric__label">{label}</span>
      <strong className="result-metric__value">
        {value}
        {unit ? <span className="result-metric__unit"> {unit}</span> : null}
      </strong>
    </div>
  )
}

function CalculationDetails({ title, children, defaultOpen = false }) {
  return (
    <details className="result-details" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="result-details__body">{children}</div>
    </details>
  )
}

function validateFormData(formData) {
  const errors = {}

  const requiredSelectFields = [
    ['concreteGrade', 'Concrete Grade is required.'],
    ['cementType', 'Cement Type is required.'],
    ['aggregateSize', 'Maximum Aggregate Size is required.'],
    ['exposureCondition', 'Exposure Condition is required.'],
  ]

  requiredSelectFields.forEach(([fieldName, message]) => {
    if (!formData[fieldName]) {
      errors[fieldName] = message
    }
  })

  if (!formData.area) {
    errors.area = 'Area is required.'
  } else if (Number(formData.area) <= 0) {
    errors.area = 'Area must be greater than 0.'
  }

  if (!formData.thickness) {
    errors.thickness = 'Thickness is required.'
  } else if (Number(formData.thickness) <= 0) {
    errors.thickness = 'Thickness must be greater than 0.'
  }

  if (!formData.slump) {
    errors.slump = 'Slump is required.'
  } else if (Number(formData.slump) < 0) {
    errors.slump = 'Slump must be greater than or equal to 0.'
  }

  if (!formData.waterCementRatio) {
    errors.waterCementRatio = 'Water-Cement Ratio is required.'
  } else if (Number(formData.waterCementRatio) <= 0) {
    errors.waterCementRatio = 'Water-Cement Ratio must be greater than 0.'
  }

  if (!formData.cementSpecificGravity) {
    errors.cementSpecificGravity = 'Cement Specific Gravity is required.'
  } else if (Number(formData.cementSpecificGravity) <= 0) {
    errors.cementSpecificGravity = 'Cement Specific Gravity must be greater than 0.'
  }

  if (!formData.fineAggregateSpecificGravity) {
    errors.fineAggregateSpecificGravity = 'Fine Aggregate Specific Gravity is required.'
  } else if (Number(formData.fineAggregateSpecificGravity) <= 0) {
    errors.fineAggregateSpecificGravity = 'Fine Aggregate Specific Gravity must be greater than 0.'
  }

  if (!formData.coarseAggregateSpecificGravity) {
    errors.coarseAggregateSpecificGravity = 'Coarse Aggregate Specific Gravity is required.'
  } else if (Number(formData.coarseAggregateSpecificGravity) <= 0) {
    errors.coarseAggregateSpecificGravity = 'Coarse Aggregate Specific Gravity must be greater than 0.'
  }

  if (formData.admixture) {
    if (!formData.admixtureType) {
      errors.admixtureType = 'Admixture Type is required.'
    }

    if (!formData.admixtureDosage) {
      errors.admixtureDosage = 'Admixture Dosage is required.'
    } else if (Number(formData.admixtureDosage) <= 0) {
      errors.admixtureDosage = 'Admixture Dosage must be greater than 0.'
    }

    if (!formData.admixtureSpecificGravity) {
      errors.admixtureSpecificGravity = 'Admixture Specific Gravity is required.'
    } else if (Number(formData.admixtureSpecificGravity) <= 0) {
      errors.admixtureSpecificGravity = 'Admixture Specific Gravity must be greater than 0.'
    }

    if (formData.admixtureWaterReduction === '' || formData.admixtureWaterReduction === null || formData.admixtureWaterReduction === undefined) {
      errors.admixtureWaterReduction = 'Admixture Water Reduction is required.'
    } else if (Number(formData.admixtureWaterReduction) < 0) {
      errors.admixtureWaterReduction = 'Admixture Water Reduction must be greater than or equal to 0.'
    }
  }

  return errors
}

export default function Calculator() {
  const { user } = useContext(AuthContext)
  const location = useLocation()

  // Pre-fill form when navigated from History via Transfer button
  const transferData = location.state?.transfer ?? null

  const [formData, setFormData] = useState(() => {
    if (!transferData) return initialFormData
    return {
      concreteGrade:                 transferData.concrete_grade                  ?? '',
      cementType:                    transferData.cement_type                     ?? '',
      aggregateSize:                 transferData.aggregate_size                  ?? '',
      exposureCondition:             transferData.exposure_condition              ?? '',
      slump:                         transferData.slump            != null ? String(transferData.slump)            : '',
      waterCementRatio:              transferData.water_cement_ratio != null ? String(transferData.water_cement_ratio) : '',
      cementSpecificGravity:         transferData.cement_specific_gravity != null ? String(transferData.cement_specific_gravity) : '',
      fineAggregateSpecificGravity:  transferData.fine_aggregate_specific_gravity != null ? String(transferData.fine_aggregate_specific_gravity) : '',
      coarseAggregateSpecificGravity:transferData.coarse_aggregate_specific_gravity != null ? String(transferData.coarse_aggregate_specific_gravity) : '',
      admixture:                     Boolean(transferData.admixture),
      admixtureType:                 transferData.admixture_type                  ?? '',
      admixtureDosage:               transferData.admixture_dosage != null ? String(transferData.admixture_dosage) : '',
      admixtureSpecificGravity:      transferData.admixture_specific_gravity != null ? String(transferData.admixture_specific_gravity) : '',
      admixtureWaterReduction:       transferData.water_reduction_percent != null ? String(transferData.water_reduction_percent) : '',
      area:                          transferData.area      != null ? String(transferData.area)      : '',
      thickness:                     transferData.thickness != null ? String(transferData.thickness) : '',
    }
  })

  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedResult, setSubmittedResult] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [savedId, setSavedId] = useState(null)

  // Cost estimation — available as soon as submittedResult exists
  const [showCostPanel, setShowCostPanel] = useState(false)
  const [costPrices, setCostPrices] = useState({ cementPrice: '', sandPrice: '', aggregatePrice: '', waterPrice: '', admixturePrice: '' })
  const [costResult, setCostResult] = useState(null) // computed cost; null = not yet calculated
  const [costMessage, setCostMessage] = useState('')

  // Clear transfer state from history so a back-navigation doesn't re-apply it
  useEffect(() => {
    if (transferData) {
      window.history.replaceState({}, '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const savingRef = useRef(false)

  const calculationResult = useMemo(
    () => calculateMixDesign(formData),
    [formData]
  )

  const updateField = (name, value) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }))

    setSuccessMessage('')
    setSubmittedResult(null)
    setSaveMessage('')
    setSavedId(null)
  }

  const handleInputChange = (event) => {
    const { name, type, value, checked } = event.target
    updateField(name, type === 'checkbox' ? checked : value)
  }

  const useDefaultValue = (name, defaultValue) => {
    if (defaultValue === null || defaultValue === undefined || defaultValue === '') {
      return
    }

    setFormData((current) => {
      if (current[name] !== '') {
        return current
      }

      return {
        ...current,
        [name]: String(defaultValue),
      }
    })

    setErrors((current) => ({
      ...current,
      [name]: undefined,
    }))

    setSuccessMessage('')
    setSubmittedResult(null)
  }

  const useRecommendedAdmixtureValues = () => {
    const selectedType =
      formData.admixtureType || mixDesignOptions.admixtureType[0]?.value || ''
    const recommendedValues = getAdmixtureRecommendedValues(selectedType)

    if (!recommendedValues) {
      return
    }

    setFormData((current) => ({
      ...current,
      admixture: true,
      admixtureType: selectedType,
      admixtureDosage: String(recommendedValues.dosage),
      admixtureWaterReduction: String(recommendedValues.waterReduction),
    }))

    setErrors((current) => ({
      ...current,
      admixtureType: undefined,
      admixtureDosage: undefined,
      admixtureSpecificGravity: undefined,
      admixtureWaterReduction: undefined,
    }))

    setSuccessMessage('')
    setSubmittedResult(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const nextErrors = validateFormData(formData)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    setSaveMessage('')
    setSavedId(null)

    try {
      setSubmittedResult(calculationResult)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = async () => {
    if (savingRef.current || savedId || !submittedResult || !user) {
      return
    }

    savingRef.current = true
    setIsSaving(true)
    setSaveMessage('')

    try {
      // Pass costResult if the user has already calculated cost — saves in one INSERT
      const { data, error } = await saveCalculation(user.id, formData, submittedResult, costResult ?? undefined)

      if (error) {
        console.error('Save calculation error:', error.message, error.details, error.hint)
        setSaveMessage('Unable to save this calculation. Please try again.')
        return
      }

      setSavedId(data?.id ?? true)
      setSaveMessage('Calculation saved successfully.')
      setShowCostPanel(false) // collapse price inputs after save
    } catch (err) {
      console.error('Unexpected save error:', err)
      setSaveMessage('Unable to save this calculation. Please try again.')
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  const handleCostPriceChange = (e) => {
    const { name, value } = e.target
    setCostPrices((p) => ({ ...p, [name]: value }))
    setCostMessage('')
    setCostResult(null)
  }

  // Compute cost LOCALLY from submittedResult quantities — no DB call
  const handleCostCalculate = () => {
    if (!submittedResult) return

    const admixtureEnabled = submittedResult.admixture.enabled
    const cp  = Number(costPrices.cementPrice)
    const sp  = Number(costPrices.sandPrice)
    const ap  = Number(costPrices.aggregatePrice)
    const wp  = Number(costPrices.waterPrice)
    const adp = Number(costPrices.admixturePrice)

    const requiredOk = [cp, sp, ap, wp].every((v) => Number.isFinite(v) && v > 0) &&
      (!admixtureEnabled || (Number.isFinite(adp) && adp >= 0))

    if (!requiredOk) {
      setCostMessage('Enter all material prices to calculate cost.')
      return
    }

    const cementTotal    = submittedResult.cement.totalKg         ?? 0
    const fineTotal      = submittedResult.aggregates.fineTotalKg  ?? 0
    const coarseTotal    = submittedResult.aggregates.coarseTotalKg ?? 0
    const waterLitres    = submittedResult.water.totalLitres       ?? 0
    const admixtureKg   = submittedResult.admixture.quantity       ?? 0
    const concreteVol   = submittedResult.volume.concreteVolume    ?? 0
    const area          = submittedResult.volume.area              ?? 0
    const admixturePrice = admixtureEnabled ? adp : 0

    const totalCost = cementTotal * cp + fineTotal * sp + coarseTotal * ap +
                      waterLitres * wp + admixtureKg * admixturePrice

    setCostResult({
      cementPrice:    cp,
      sandPrice:      sp,
      aggregatePrice: ap,
      waterPrice:     wp,
      admixturePrice: admixtureEnabled ? adp : null,
      totalCost,
      costPerM3: concreteVol > 0 ? totalCost / concreteVol : null,
      costPerM2: area > 0        ? totalCost / area        : null,
    })
    setCostMessage('')
  }

  return (
    <main className="page-shell calculator-page">
      <header className="page-hero card">
        <div>
          <p className="eyebrow">Smart Concrete Mix Calculator</p>
          <h1>Mix design inputs</h1>
          <p className="page-copy">
            Enter the project, material, and exposure details needed for the next calculation task.
          </p>
        </div>

        <section className="summary-card" aria-live="polite">
          <div className="summary-card__label">Estimated Concrete Volume</div>
          <strong>{(calculationResult.volume.concreteVolume ?? 0).toFixed(2)} m³</strong>
        </section>
      </header>

      {successMessage ? <p role="status">{successMessage}</p> : null}

      <form className="calculator-form" onSubmit={handleSubmit} noValidate>
        <FormSection
          title="Project Details"
          description="Basic geometry used to estimate the concrete volume."
        >
          <InputField
            label="Area"
            name="area"
            type="number"
            unit="m²"
            value={formData.area}
            onChange={handleInputChange}
            error={errors.area}
            min="0"
            defaultValue={mixDesignDefaults.area}
            onUseDefault={useDefaultValue}
            placeholder="Enter area"
          />

          <InputField
            label="Thickness"
            name="thickness"
            type="number"
            unit="mm"
            value={formData.thickness}
            onChange={handleInputChange}
            error={errors.thickness}
            min="0"
            defaultValue={mixDesignDefaults.thickness}
            onUseDefault={useDefaultValue}
            placeholder="Enter thickness"
          />
        </FormSection>

        <FormSection
          title="Concrete Parameters"
          description="Core mix design inputs and exposure conditions."
        >
          <SelectField
            label="Concrete Grade"
            name="concreteGrade"
            value={formData.concreteGrade}
            onChange={handleInputChange}
            error={errors.concreteGrade}
            options={mixDesignOptions.concreteGrade}
            defaultValue={mixDesignDefaults.concreteGrade}
            onUseDefault={useDefaultValue}
          />

          <SelectField
            label="Cement Type"
            name="cementType"
            value={formData.cementType}
            onChange={handleInputChange}
            error={errors.cementType}
            options={mixDesignOptions.cementType}
            defaultValue={mixDesignDefaults.cementType}
            onUseDefault={useDefaultValue}
          />

          <SelectField
            label="Maximum Aggregate Size"
            name="aggregateSize"
            value={formData.aggregateSize}
            onChange={handleInputChange}
            error={errors.aggregateSize}
            options={mixDesignOptions.aggregateSize}
            defaultValue={mixDesignDefaults.aggregateSize}
            onUseDefault={useDefaultValue}
          />

          <SelectField
            label="Exposure Condition"
            name="exposureCondition"
            value={formData.exposureCondition}
            onChange={handleInputChange}
            error={errors.exposureCondition}
            options={mixDesignOptions.exposureCondition}
            defaultValue={mixDesignDefaults.exposureCondition}
            onUseDefault={useDefaultValue}
          />

          <InputField
            label="Slump"
            name="slump"
            type="number"
            unit="mm"
            value={formData.slump}
            onChange={handleInputChange}
            error={errors.slump}
            min="0"
            defaultValue={mixDesignDefaults.slump}
            onUseDefault={useDefaultValue}
            placeholder="Enter slump"
          />

          <InputField
            label="Water-Cement Ratio"
            name="waterCementRatio"
            type="number"
            unit=""
            value={formData.waterCementRatio}
            onChange={handleInputChange}
            error={errors.waterCementRatio}
            min="0"
            defaultValue={mixDesignDefaults.waterCementRatio}
            onUseDefault={useDefaultValue}
            placeholder="Enter ratio"
          />
        </FormSection>

        <FormSection
          title="Material Properties"
          description="Specific gravities used by the volume and proportioning workflow."
        >
          <InputField
            label="Cement Specific Gravity"
            name="cementSpecificGravity"
            type="number"
            unit=""
            value={formData.cementSpecificGravity}
            onChange={handleInputChange}
            error={errors.cementSpecificGravity}
            min="0"
            defaultValue={mixDesignDefaults.cementSpecificGravity}
            onUseDefault={useDefaultValue}
            placeholder="Enter specific gravity"
          />

          <InputField
            label="Fine Aggregate Specific Gravity"
            name="fineAggregateSpecificGravity"
            type="number"
            unit=""
            value={formData.fineAggregateSpecificGravity}
            onChange={handleInputChange}
            error={errors.fineAggregateSpecificGravity}
            min="0"
            defaultValue={mixDesignDefaults.fineAggregateSpecificGravity}
            onUseDefault={useDefaultValue}
            placeholder="Enter specific gravity"
          />

          <InputField
            label="Coarse Aggregate Specific Gravity"
            name="coarseAggregateSpecificGravity"
            type="number"
            unit=""
            value={formData.coarseAggregateSpecificGravity}
            onChange={handleInputChange}
            error={errors.coarseAggregateSpecificGravity}
            min="0"
            defaultValue={mixDesignDefaults.coarseAggregateSpecificGravity}
            onUseDefault={useDefaultValue}
            placeholder="Enter specific gravity"
          />
        </FormSection>

        <FormSection
          title="Admixture"
          description="Toggle admixture inputs on or off."
        >
          <div className="field field--toggle">
            <span className="field__label">Use Admixture?</span>
            <div className="field__control field__control--toggle">
              <ToggleButton
                active={!formData.admixture}
                variant="no"
                onClick={() => updateField('admixture', false)}
              >
                No
              </ToggleButton>
              <ToggleButton
                active={formData.admixture}
                variant="yes"
                onClick={() => updateField('admixture', true)}
              >
                Yes
              </ToggleButton>
            </div>
          </div>

          {formData.admixture ? (
            <>
              <SelectField
                label="Admixture Type"
                name="admixtureType"
                value={formData.admixtureType}
                onChange={handleInputChange}
                error={errors.admixtureType}
                options={mixDesignOptions.admixtureType}
                placeholder="Select admixture type"
                required={false}
              />

              <InputField
                label="Dosage"
                name="admixtureDosage"
                type="number"
                unit="% of cement mass"
                value={formData.admixtureDosage}
                onChange={handleInputChange}
                error={errors.admixtureDosage}
                min="0"
                placeholder="Enter dosage"
              />

              <InputField
                label="Specific Gravity"
                name="admixtureSpecificGravity"
                type="number"
                unit=""
                value={formData.admixtureSpecificGravity}
                onChange={handleInputChange}
                error={errors.admixtureSpecificGravity}
                min="0"
                placeholder="Enter specific gravity"
              />

              <InputField
                label="Water Reduction"
                name="admixtureWaterReduction"
                type="number"
                unit="%"
                value={formData.admixtureWaterReduction}
                onChange={handleInputChange}
                error={errors.admixtureWaterReduction}
                min="0"
                placeholder="Enter water reduction"
              />

              <div className="field admixture-actions-field">
                <span className="field__label">Starting Values</span>
                <div className="field__control">
                  <button
                    type="button"
                    className="admixture-recommend-btn"
                    onClick={useRecommendedAdmixtureValues}
                    title={`Apply recommended starting values for the selected admixture type`}
                  >
                    Use Recommended Starting Value
                  </button>
                </div>
                <p className="field__hint">Values are starting assumptions only — not universal manufacturer values.</p>
              </div>

              <div className="admixture-warning" role="alert">
                <svg className="admixture-warning__icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.345 0-2.189-1.458-1.515-2.625L8.485 2.495z" stroke="currentColor" strokeWidth="1.5" fill="rgba(245,158,11,0.12)"/>
                  <path d="M10 7v4M10 13.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p>
                  Admixture dosage and performance must be verified with the
                  manufacturer&apos;s technical data and laboratory trial mix.
                </p>
              </div>
            </>
          ) : null}
        </FormSection>

        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? 'Calculating...' : 'Calculate Mix Design'}
        </button>
      </form>

      {submittedResult ? (
        <section className="results-section card" aria-live="polite">
          <header className="results-section__header">
            <p className="eyebrow">Mix Design Result</p>
            <h2>Preliminary mix-design estimate</h2>

            <div className="results-save-row">
              {submittedResult.errors.length > 0 && (
                <p role="alert" className="save-message save-message--err calc-error-notice">
                  ⚠ Resolve the calculation errors below before saving or downloading.
                </p>
              )}
              <button
                type="button"
                className="save-button"
                onClick={handleSave}
                disabled={isSaving || Boolean(savedId) || submittedResult.errors.length > 0 || showCostPanel}
                title={
                  submittedResult.errors.length > 0
                    ? 'Resolve calculation errors first'
                    : showCostPanel
                    ? 'Complete or cancel cost estimation first'
                    : undefined
                }
              >
                {isSaving ? 'Saving...' : savedId ? 'Saved ✓' : 'Save Calculation'}
              </button>

              {/* ── Calculate Cost button lives here, between Save and Excel ── */}
              {!savedId && (
                <button
                  type="button"
                  className="cost-inline-btn"
                  onClick={() => {
                    setShowCostPanel((prev) => !prev)
                    setCostMessage('')
                  }}
                  disabled={submittedResult.errors.length > 0}
                  title={submittedResult.errors.length > 0 ? 'Resolve calculation errors first' : undefined}
                >
                  {showCostPanel
                    ? '✕ Cancel Cost'
                    : costResult
                    ? '✎ Edit Prices'
                    : '₹ Calculate Cost'}
                </button>
              )}
              {savedId && costResult && (
                <span className="save-message save-message--ok">Cost saved ✓</span>
              )}

              <button
                type="button"
                className="excel-download-btn"
                onClick={() => downloadResultExcel(formData, submittedResult, costResult)}
                disabled={submittedResult.errors.length > 0 || showCostPanel}
                title={
                  submittedResult.errors.length > 0
                    ? 'Resolve calculation errors first'
                    : showCostPanel
                    ? 'Complete or cancel cost estimation first'
                    : undefined
                }
              >
                ↓ Download Excel
              </button>
              {saveMessage ? (
                <p
                  role="status"
                  className={`save-message ${
                    saveMessage.includes('successfully') ? 'save-message--ok' : 'save-message--err'
                  }`}
                >
                  {saveMessage}
                </p>
              ) : null}
            </div>

            {/* ── Cost panel: appears immediately below the button row ── */}
            {showCostPanel && (
              <div className="cost-panel-inline">
                <div className="cost-price-grid">
                  <label className="cost-price-label">
                    Cement (₹/kg)
                    <input type="number" name="cementPrice" value={costPrices.cementPrice}
                      onChange={handleCostPriceChange} min="0" placeholder="e.g. 8" className="cost-price-input" />
                  </label>
                  <label className="cost-price-label">
                    Fine Aggregate / Sand (₹/kg)
                    <input type="number" name="sandPrice" value={costPrices.sandPrice}
                      onChange={handleCostPriceChange} min="0" placeholder="e.g. 2" className="cost-price-input" />
                  </label>
                  <label className="cost-price-label">
                    Coarse Aggregate (₹/kg)
                    <input type="number" name="aggregatePrice" value={costPrices.aggregatePrice}
                      onChange={handleCostPriceChange} min="0" placeholder="e.g. 1.5" className="cost-price-input" />
                  </label>
                  <label className="cost-price-label">
                    Water (₹/litre)
                    <input type="number" name="waterPrice" value={costPrices.waterPrice}
                      onChange={handleCostPriceChange} min="0" placeholder="e.g. 0.05" className="cost-price-input" />
                  </label>
                  {submittedResult.admixture.enabled && (
                    <label className="cost-price-label">
                      Admixture (₹/kg)
                      <input type="number" name="admixturePrice" value={costPrices.admixturePrice}
                        onChange={handleCostPriceChange} min="0" placeholder="e.g. 120" className="cost-price-input" />
                    </label>
                  )}
                </div>

                <div className="cost-panel__actions">
                  <button type="button" className="submit-button" onClick={handleCostCalculate}>
                    Calculate Cost
                  </button>
                  <button
                    type="button"
                    className="history-delete-btn"
                    onClick={() => { setShowCostPanel(false); setCostMessage('') }}
                  >
                    Cancel
                  </button>
                </div>

                {costMessage && (
                  <p role="status" className="save-message save-message--err">{costMessage}</p>
                )}

                {costResult && (
                  <div className="cost-results">
                    <div className="cost-result-item">
                      <span>Total Cost</span>
                      <strong>₹ {Number(costResult.totalCost).toFixed(2)}</strong>
                    </div>
                    <div className="cost-result-item">
                      <span>Cost / m³</span>
                      <strong>{costResult.costPerM3 != null ? `₹ ${Number(costResult.costPerM3).toFixed(2)}` : '—'}</strong>
                    </div>
                    <div className="cost-result-item">
                      <span>Cost / m²</span>
                      <strong>{costResult.costPerM2 != null ? `₹ ${Number(costResult.costPerM2).toFixed(2)}` : '—'}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Compact cost result strip when panel is closed ── */}
            {!showCostPanel && costResult && (
              <div className="cost-results cost-results--compact">
                <div className="cost-result-item">
                  <span>Total Cost</span>
                  <strong>₹ {Number(costResult.totalCost).toFixed(2)}</strong>
                </div>
                <div className="cost-result-item">
                  <span>Cost / m³</span>
                  <strong>{costResult.costPerM3 != null ? `₹ ${Number(costResult.costPerM3).toFixed(2)}` : '—'}</strong>
                </div>
                <div className="cost-result-item">
                  <span>Cost / m²</span>
                  <strong>{costResult.costPerM2 != null ? `₹ ${Number(costResult.costPerM2).toFixed(2)}` : '—'}</strong>
                </div>
              </div>
            )}
          </header>

          {submittedResult.warnings.length > 0 ? (
            <section className="result-alert result-alert--warning">
              <h3>Warnings</h3>
              <ul>
                {submittedResult.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {submittedResult.errors.length > 0 ? (
            <section className="result-alert result-alert--error">
              <h3>Calculation Issues</h3>
              <ul>
                {submittedResult.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="results-grid">
            <ResultMetric
              label="Concrete Volume"
              value={formatNumber(submittedResult.volume.concreteVolume, 2)}
              unit="m³"
            />
            <ResultMetric
              label="Target Mean Strength"
              value={formatNumber(submittedResult.strength.targetMeanStrength, 2)}
              unit="MPa"
            />
            <ResultMetric
              label="Adopted W/C Ratio"
              value={formatNumber(submittedResult.waterCementRatio.adoptedValue, 2)}
            />
            <ResultMetric
              label="Water"
              value={formatNumber(submittedResult.water.contentPerM3, 2)}
              unit="kg/m³"
            />
            <ResultMetric
              label="Cement"
              value={formatNumber(submittedResult.cement.adoptedPerM3, 2)}
              unit="kg/m³"
            />
            <ResultMetric
              label="Fine Aggregate"
              value={formatNumber(submittedResult.aggregates.fineKgPerM3, 2)}
              unit="kg/m³"
            />
            <ResultMetric
              label="Coarse Aggregate"
              value={formatNumber(submittedResult.aggregates.coarseKgPerM3, 2)}
              unit="kg/m³"
            />
            <ResultMetric
              label="Mix Ratio"
              value={submittedResult.mixRatio.formatted ?? '—'}
            />
          </div>

          <section className="results-subsection">
            <h3>Required Materials</h3>
            <div className="results-grid results-grid--materials">
              <div className="result-metric">
                <span className="result-metric__label">Cement</span>
                <strong className="result-metric__value">
                  {formatNumber(submittedResult.cement.totalKg, 0)} kg
                  <span className="result-metric__unit">
                    {' '}
                    ({formatNumber(submittedResult.cement.bags, 2)} bags)
                  </span>
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Water</span>
                <strong className="result-metric__value">
                  {formatNumber(submittedResult.water.totalLitres, 0)} litres
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Sand</span>
                <strong className="result-metric__value">
                  {formatNumber(submittedResult.aggregates.fineTotalKg, 0)} kg
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Coarse Aggregate</span>
                <strong className="result-metric__value">
                  {formatNumber(submittedResult.aggregates.coarseTotalKg, 0)} kg
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Admixture Quantity</span>
                <strong className="result-metric__value">
                  {submittedResult.admixture.enabled && submittedResult.admixture.quantity > 0
                    ? `${formatNumber(submittedResult.admixture.quantity, 2)} kg`
                    : 'Not used'}
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Admixture Volume</span>
                <strong className="result-metric__value">
                  {submittedResult.admixture.enabled && submittedResult.admixture.volume > 0
                    ? `${formatNumber(submittedResult.admixture.volume, 4)} m³`
                    : 'Not used'}
                </strong>
              </div>
            </div>
          </section>

          <section className="results-subsection">
            <h3>Calculation Details</h3>

            <CalculationDetails title="1. Target Mean Strength" defaultOpen>
              <div className="detail-grid">
                <div><span>Characteristic Strength</span><strong>{formatNumber(submittedResult.strength.characteristicStrength, 2)} MPa</strong></div>
                <div><span>Standard Deviation</span><strong>{formatNumber(submittedResult.strength.standardDeviation, 2)} MPa</strong></div>
                <div><span>X Factor</span><strong>{formatNumber(submittedResult.strength.xFactor, 2)} MPa</strong></div>
                <div><span>Target from SD</span><strong>{formatNumber(submittedResult.strength.targetStrengthFromSD, 2)} MPa</strong></div>
                <div><span>Target from X</span><strong>{formatNumber(submittedResult.strength.targetStrengthFromX, 2)} MPa</strong></div>
                <div><span>Target Mean Strength</span><strong>{formatNumber(submittedResult.strength.targetMeanStrength, 2)} MPa</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="2. Water-Cement Ratio">
              <div className="detail-grid">
                <div><span>User Value</span><strong>{formatNumber(submittedResult.waterCementRatio.userValue, 2)}</strong></div>
                <div><span>Maximum Allowed</span><strong>{formatNumber(submittedResult.waterCementRatio.maximumAllowed, 2)}</strong></div>
                <div><span>Adopted Value</span><strong>{formatNumber(submittedResult.waterCementRatio.adoptedValue, 2)}</strong></div>
                <div><span>Source</span><strong>{submittedResult.waterCementRatio.source ?? '—'}</strong></div>
                <div><span>Actual Value After Cement Adjustment</span><strong>{formatNumber(submittedResult.waterCementRatio.actualValueAfterCementAdjustment, 2)}</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="3. Water Content">
              <div className="detail-grid">
                <div><span>Base Content per m³</span><strong>{formatNumber(submittedResult.water.baseContentPerM3, 2)} kg</strong></div>
                <div><span>Slump Adjustment</span><strong>{formatNumber(submittedResult.water.slumpAdjustmentPercent, 2)}%</strong></div>
                <div><span>Reduction Percent</span><strong>{formatNumber(submittedResult.water.reductionPercent, 2)}%</strong></div>
                <div><span>Content per m³</span><strong>{formatNumber(submittedResult.water.contentPerM3, 2)} kg</strong></div>
                <div><span>Total Water</span><strong>{formatNumber(submittedResult.water.totalLitres, 2)} litres</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="4. Cement Content">
              <div className="detail-grid">
                <div><span>Calculated per m³</span><strong>{formatNumber(submittedResult.cement.calculatedPerM3, 2)} kg</strong></div>
                <div><span>Minimum per m³</span><strong>{formatNumber(submittedResult.cement.minimumPerM3, 2)} kg</strong></div>
                <div><span>Adopted per m³</span><strong>{formatNumber(submittedResult.cement.adoptedPerM3, 2)} kg</strong></div>
                <div><span>Total Cement</span><strong>{formatNumber(submittedResult.cement.totalKg, 2)} kg</strong></div>
                <div><span>Bags</span><strong>{formatNumber(submittedResult.cement.bags, 2)}</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="5. Absolute Volume">
              <div className="detail-grid">
                <div><span>Cement Volume</span><strong>{formatNumber(submittedResult.cement.volume, 4)}</strong></div>
                <div><span>Water Volume</span><strong>{formatNumber(submittedResult.water.volume, 4)}</strong></div>
                <div><span>Air Volume</span><strong>{formatNumber(submittedResult.air.volume, 4)}</strong></div>
                <div><span>Admixture Volume</span><strong>{formatNumber(submittedResult.admixture.volume, 4)}</strong></div>
                <div><span>Aggregate Volume</span><strong>{formatNumber(submittedResult.aggregates.totalVolumePerM3, 4)}</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="6. Fine Aggregate">
              <div className="detail-grid">
                <div><span>Fraction</span><strong>{formatNumber(submittedResult.aggregates.fineFraction, 2)}</strong></div>
                <div><span>Volume per m³</span><strong>{formatNumber(submittedResult.aggregates.fineVolumePerM3, 4)}</strong></div>
                <div><span>Kg per m³</span><strong>{formatNumber(submittedResult.aggregates.fineKgPerM3, 2)} kg</strong></div>
                <div><span>Total Kg</span><strong>{formatNumber(submittedResult.aggregates.fineTotalKg, 2)} kg</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="7. Coarse Aggregate">
              <div className="detail-grid">
                <div><span>Fraction</span><strong>{formatNumber(submittedResult.aggregates.coarseFraction, 2)}</strong></div>
                <div><span>Volume per m³</span><strong>{formatNumber(submittedResult.aggregates.coarseVolumePerM3, 4)}</strong></div>
                <div><span>Kg per m³</span><strong>{formatNumber(submittedResult.aggregates.coarseKgPerM3, 2)} kg</strong></div>
                <div><span>Total Kg</span><strong>{formatNumber(submittedResult.aggregates.coarseTotalKg, 2)} kg</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="8. Mix Ratio">
              <div className="detail-grid">
                <div><span>Cement</span><strong>{submittedResult.mixRatio.cement}</strong></div>
                <div><span>Fine Aggregate</span><strong>{formatNumber(submittedResult.mixRatio.fineAggregate, 2)}</strong></div>
                <div><span>Coarse Aggregate</span><strong>{formatNumber(submittedResult.mixRatio.coarseAggregate, 2)}</strong></div>
                <div><span>Formatted</span><strong>{submittedResult.mixRatio.formatted ?? '—'}</strong></div>
              </div>
            </CalculationDetails>

            <CalculationDetails title="9. Concrete Quantity">
              <div className="detail-grid">
                <div><span>Area</span><strong>{formatNumber(submittedResult.volume.area, 2)} m²</strong></div>
                <div><span>Thickness</span><strong>{formatNumber(submittedResult.volume.thickness, 2)} mm</strong></div>
                <div><span>Thickness in metres</span><strong>{formatNumber(submittedResult.volume.thickness === null ? null : submittedResult.volume.thickness / 1000, 4)} m</strong></div>
                <div><span>Concrete Volume</span><strong>{formatNumber(submittedResult.volume.concreteVolume, 2)} m³</strong></div>
              </div>
            </CalculationDetails>
          </section>


        </section>
      ) : null}
    </main>
  )
}
