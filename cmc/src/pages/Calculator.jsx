import { useMemo, useState } from 'react'

import FormSection from '../components/FormSection.jsx'
import InputField from '../components/InputField.jsx'
import SelectField from '../components/SelectField.jsx'
import { calculateMixDesign } from '../lib/mixDesignCalculator.js'
import {
  mixDesignDefaults,
  mixDesignOptions,
} from '../data/mixDesignOptions.js'

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
  area: '',
  thickness: '',
}

const admixtureInputs = [
  {
    name: 'admixtureType',
    label: 'Admixture Type',
    type: 'text',
    placeholder: 'To be defined',
  },
  {
    name: 'admixtureDosage',
    label: 'Admixture Dosage',
    type: 'text',
    placeholder: 'To be defined',
  },
]

function ToggleButton({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}>
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

  return errors
}

export default function Calculator() {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedResult, setSubmittedResult] = useState(null)

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

    try {
      setSubmittedResult(calculationResult)
      console.log('formData:', formData)
      console.log('calculationResult:', calculationResult)
      setSuccessMessage('Inputs are valid. Mix design calculation will be performed in the next task.')
    } finally {
      setIsSubmitting(false)
    }
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
                onClick={() => updateField('admixture', false)}
              >
                No
              </ToggleButton>
              <ToggleButton
                active={formData.admixture}
                onClick={() => updateField('admixture', true)}
              >
                Yes
              </ToggleButton>
            </div>
          </div>

          {formData.admixture ? (
            <div className="admixture-placeholder">
              <p>
                Additional admixture inputs will be added when the final design requirements are defined.
              </p>
              {admixtureInputs.map((field) => (
                <label key={field.name} className="field">
                  <span className="field__label">{field.label}</span>
                  <div className="field__control">
                    <input type={field.type} placeholder={field.placeholder} disabled />
                  </div>
                </label>
              ))}
            </div>
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
                  {formatNumber(submittedResult.materials.cementKg, 0)} kg
                  <span className="result-metric__unit">
                    {' '}
                    ({formatNumber(submittedResult.materials.cementBags, 2)} bags)
                  </span>
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Water</span>
                <strong className="result-metric__value">
                  {formatNumber(submittedResult.materials.waterLitres, 0)} litres
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Sand</span>
                <strong className="result-metric__value">
                  {formatNumber(submittedResult.materials.fineAggregateKg, 0)} kg
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Coarse Aggregate</span>
                <strong className="result-metric__value">
                  {formatNumber(submittedResult.materials.coarseAggregateKg, 0)} kg
                </strong>
              </div>

              <div className="result-metric">
                <span className="result-metric__label">Admixture</span>
                <strong className="result-metric__value">
                  {submittedResult.admixture.enabled && submittedResult.admixture.quantity > 0
                    ? `${formatNumber(submittedResult.admixture.quantity, 2)} kg/L`
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
                <div><span>Cement Volume</span><strong>{formatNumber(submittedResult.cement.adoptedPerM3 === null ? null : submittedResult.cement.adoptedPerM3 / (Number(formData.cementSpecificGravity) * 1000), 4)}</strong></div>
                <div><span>Water Volume</span><strong>{formatNumber(submittedResult.water.contentPerM3 === null ? null : submittedResult.water.contentPerM3 / 1000, 4)}</strong></div>
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
