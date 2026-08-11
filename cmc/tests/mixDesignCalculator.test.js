import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateMixDesign } from '../src/lib/mixDesignCalculator.js'

function buildFormData(overrides = {}) {
  return {
    concreteGrade: 'M25',
    cementType: 'OPC 43',
    aggregateSize: '20 mm',
    exposureCondition: 'Moderate',
    slump: '50',
    waterCementRatio: '0.50',
    cementSpecificGravity: '3.15',
    fineAggregateSpecificGravity: '2.65',
    coarseAggregateSpecificGravity: '2.74',
    admixture: false,
    area: '100',
    thickness: '150',
    ...overrides,
  }
}

function assertClose(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not close to ${expected}`)
}

test('TEST 1 - M25 Moderate 20 mm 50 mm slump 0.50 W/C', () => {
  const result = calculateMixDesign(buildFormData())

  assert.equal(result.volume.concreteVolume, 15)
  assert.equal(result.strength.targetMeanStrength, 31.6)
  assert.equal(result.water.baseContentPerM3, 186)
  assert.equal(result.water.contentPerM3, 186)
  assert.equal(result.cement.adoptedPerM3, 372)
  assert.equal(result.waterCementRatio.adoptedValue, 0.5)
  assert.equal(result.durability.minimumGrade, 'M25')
  assert.equal(result.errors.length, 0)
  assert.ok(result.warnings.includes('Fine aggregate Zone II is being used as the default assumption.'))
  assert.ok(result.warnings.includes('Trial mix verification is required.'))
})

test('TEST 2 - M30 Severe 20 mm 75 mm slump 0.45 W/C', () => {
  const result = calculateMixDesign(
    buildFormData({
      concreteGrade: 'M30',
      exposureCondition: 'Severe',
      slump: '75',
      waterCementRatio: '0.45',
    })
  )

  assert.equal(result.volume.concreteVolume, 15)
  assert.equal(result.strength.targetMeanStrength, 38.25)
  assert.equal(result.water.baseContentPerM3, 186)
  assert.ok(result.water.contentPerM3 > 186)
  assert.equal(result.cement.adoptedPerM3 > 320, true)
  assert.equal(result.waterCementRatio.adoptedValue, 0.45)
  assert.equal(result.errors.length, 0)
})

test('TEST 3 - M20 Severe grade error', () => {
  const result = calculateMixDesign(
    buildFormData({
      concreteGrade: 'M20',
      exposureCondition: 'Severe',
    })
  )

  assert.equal(result.durability.minimumGrade, 'M30')
  assert.equal(result.durability.gradeValid, false)
  assert.ok(
    result.errors.includes(
      'Selected concrete grade is below the minimum grade required for the selected exposure condition. Please select a higher grade or adjust the exposure condition.'
    )
  )
})

test('TEST 4 - W/C above exposure maximum returns an error', () => {
  const result = calculateMixDesign(
    buildFormData({
      exposureCondition: 'Moderate',
      waterCementRatio: '0.60',
    })
  )

  assert.ok(
    result.errors.includes(
      'Entered water-cement ratio exceeds the maximum allowed for the selected exposure condition.'
    )
  )
})

test('TEST 5 - 100 m2 and 150 mm yields 15.00 m3', () => {
  const result = calculateMixDesign(buildFormData())

  assert.equal(result.volume.concreteVolume, 15)
})

test('TEST 6 - Changing area scales total materials proportionally', () => {
  const base = calculateMixDesign(buildFormData({ area: '100' }))
  const doubledArea = calculateMixDesign(buildFormData({ area: '200' }))

  assert.equal(doubledArea.volume.concreteVolume, base.volume.concreteVolume * 2)
  assert.equal(doubledArea.cement.totalKg, base.cement.totalKg * 2)
  assert.equal(doubledArea.water.totalLitres, base.water.totalLitres * 2)
  assert.equal(doubledArea.aggregates.fineTotalKg, base.aggregates.fineTotalKg * 2)
  assert.equal(doubledArea.aggregates.coarseTotalKg, base.aggregates.coarseTotalKg * 2)
})

test('TEST 7 - Changing thickness scales total materials proportionally', () => {
  const base = calculateMixDesign(buildFormData({ thickness: '150' }))
  const doubledThickness = calculateMixDesign(buildFormData({ thickness: '300' }))

  assert.equal(doubledThickness.volume.concreteVolume, base.volume.concreteVolume * 2)
  assert.equal(doubledThickness.cement.totalKg, base.cement.totalKg * 2)
  assert.equal(doubledThickness.water.totalLitres, base.water.totalLitres * 2)
  assert.equal(doubledThickness.aggregates.fineTotalKg, base.aggregates.fineTotalKg * 2)
  assert.equal(doubledThickness.aggregates.coarseTotalKg, base.aggregates.coarseTotalKg * 2)
})

test('TEST 8 - Admixture enabled without verified data does not invent water reduction', () => {
  const result = calculateMixDesign(
    buildFormData({
      admixture: true,
    })
  )

  assert.equal(result.admixture.enabled, true)
  assert.equal(result.water.reductionPercent, 0)
  assert.equal(result.admixture.volume, 0)
  assert.ok(
    result.warnings.includes(
      'Admixture dosage and performance must be verified with the manufacturer\'s technical data and laboratory trial mix.'
    )
  )
})

test('TEST 9 - Admixture off keeps admixture quantity and volume at zero', () => {
  const result = calculateMixDesign(buildFormData({ admixture: false }))

  assert.equal(result.admixture.enabled, false)
  assert.equal(result.admixture.quantity, 0)
  assert.equal(result.admixture.volume, 0)
  assert.equal(result.water.reductionPercent, 0)
})

test('TEST 10 - Dosage changes admixture quantity', () => {
  const lowDosage = calculateMixDesign(
    buildFormData({
      admixture: true,
      admixtureType: 'Superplasticizer',
      admixtureDosage: '0.5',
      admixtureSpecificGravity: '1.20',
      admixtureWaterReduction: '12',
    })
  )
  const highDosage = calculateMixDesign(
    buildFormData({
      admixture: true,
      admixtureType: 'Superplasticizer',
      admixtureDosage: '1.0',
      admixtureSpecificGravity: '1.20',
      admixtureWaterReduction: '12',
    })
  )

  assertClose(lowDosage.admixture.quantity, 1.86)
  assertClose(highDosage.admixture.quantity, 3.72)
  assert.equal(highDosage.admixture.quantity, lowDosage.admixture.quantity * 2)
})

test('TEST 11 - Water reduction changes adopted water content', () => {
  const noReduction = calculateMixDesign(
    buildFormData({
      admixture: true,
      admixtureType: 'Plasticizer / Water Reducer',
      admixtureDosage: '0.5',
      admixtureSpecificGravity: '1.10',
      admixtureWaterReduction: '0',
    })
  )
  const reducedWater = calculateMixDesign(
    buildFormData({
      admixture: true,
      admixtureType: 'Plasticizer / Water Reducer',
      admixtureDosage: '0.5',
      admixtureSpecificGravity: '1.10',
      admixtureWaterReduction: '12',
    })
  )

  assertClose(noReduction.water.contentPerM3, 186)
  assertClose(reducedWater.water.contentPerM3, 163.68)
  assert.ok(reducedWater.water.contentPerM3 < noReduction.water.contentPerM3)
})

test('TEST 12 - Admixture volume affects aggregate volume', () => {
  const lowerSpecificGravity = calculateMixDesign(
    buildFormData({
      admixture: true,
      admixtureType: 'Superplasticizer',
      admixtureDosage: '1.0',
      admixtureSpecificGravity: '1.00',
      admixtureWaterReduction: '12',
    })
  )
  const higherSpecificGravity = calculateMixDesign(
    buildFormData({
      admixture: true,
      admixtureType: 'Superplasticizer',
      admixtureDosage: '1.0',
      admixtureSpecificGravity: '2.00',
      admixtureWaterReduction: '12',
    })
  )

  assertClose(lowerSpecificGravity.admixture.volume, 0.00372)
  assertClose(higherSpecificGravity.admixture.volume, 0.00186)
  assert.ok(
    higherSpecificGravity.aggregates.totalVolumePerM3 > lowerSpecificGravity.aggregates.totalVolumePerM3
  )
})
