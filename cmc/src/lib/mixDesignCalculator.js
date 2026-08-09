function toNumericValue(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function normalizeKey(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function clampFraction(value) {
  if (!Number.isFinite(value)) {
    return null
  }

  return Math.min(0.999999, Math.max(0.000001, value))
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function getZoneIIFraction(aggregateSize) {
  const normalizedAggregate = normalizeKey(aggregateSize)

  const baseFractionMap = {
    '10 mm': 0.5,
    '20 mm': 0.62,
    '40 mm': 0.71,
  }

  return baseFractionMap[normalizedAggregate] ?? null
}

export function parseConcreteGrade(grade) {
  if (typeof grade !== 'string') {
    return null
  }

  const match = grade.trim().match(/^M\s*(\d+(?:\.\d+)?)$/i)

  if (!match) {
    return null
  }

  return Number(match[1])
}

export function getStandardDeviation(grade) {
  const fck = parseConcreteGrade(grade)

  if (fck === null) {
    return null
  }

  if (fck <= 15) {
    return 3.5
  }

  if (fck <= 25) {
    return 4.0
  }

  if (fck <= 60) {
    return 5.0
  }

  return 6.0
}

export function getXFactor(grade) {
  const fck = parseConcreteGrade(grade)

  if (fck === null) {
    return null
  }

  if (fck <= 15) {
    return 5.0
  }

  if (fck <= 25) {
    return 5.5
  }

  if (fck <= 60) {
    return 6.5
  }

  return 8.0
}

export function getExposureLimits(exposureCondition) {
  const normalizedExposure = normalizeKey(exposureCondition)

  const exposureMap = {
    mild: {
      minimumCementContent: 300,
      maximumWaterCementRatio: 0.55,
      minimumGrade: 'M20',
    },
    moderate: {
      minimumCementContent: 300,
      maximumWaterCementRatio: 0.5,
      minimumGrade: 'M25',
    },
    severe: {
      minimumCementContent: 320,
      maximumWaterCementRatio: 0.45,
      minimumGrade: 'M30',
    },
    'very severe': {
      minimumCementContent: 340,
      maximumWaterCementRatio: 0.45,
      minimumGrade: 'M35',
    },
    extreme: {
      minimumCementContent: 360,
      maximumWaterCementRatio: 0.4,
      minimumGrade: 'M40',
    },
  }

  return (
    exposureMap[normalizedExposure] || {
      minimumCementContent: null,
      maximumWaterCementRatio: null,
      minimumGrade: null,
    }
  )
}

export function getEntrappedAir(aggregateSize) {
  const normalizedAggregate = normalizeKey(aggregateSize)

  const airMap = {
    '10 mm': 1.5,
    '20 mm': 1.0,
    '40 mm': 0.8,
  }

  const airPercentage = airMap[normalizedAggregate] ?? null

  return {
    airPercentage,
    airVolume: airPercentage === null ? null : airPercentage / 100,
  }
}

export function getBaseWaterContent(aggregateSize) {
  const normalizedAggregate = normalizeKey(aggregateSize)

  const waterMap = {
    '10 mm': 208,
    '20 mm': 186,
    '40 mm': 165,
  }

  return waterMap[normalizedAggregate] ?? null
}

export function calculateTargetStrength(characteristicStrength, standardDeviation, xFactor) {
  const targetStrengthFromSD =
    characteristicStrength === null || standardDeviation === null
      ? null
      : characteristicStrength + 1.65 * standardDeviation

  const targetStrengthFromX =
    characteristicStrength === null || xFactor === null
      ? null
      : characteristicStrength + xFactor

  return {
    targetStrengthFromSD,
    targetStrengthFromX,
    targetMeanStrength:
      targetStrengthFromSD === null || targetStrengthFromX === null
        ? null
        : Math.max(targetStrengthFromSD, targetStrengthFromX),
  }
}

export function calculateWaterContent({
  baseWaterContent,
  slump,
  waterReductionPercent = 0,
  concreteVolume = null,
}) {
  if (!Number.isFinite(baseWaterContent) || !Number.isFinite(slump)) {
    return {
      baseContentPerM3: baseWaterContent ?? null,
      slumpAdjustmentPercent: null,
      reductionPercent: waterReductionPercent,
      contentPerM3: null,
      totalLitres: null,
      slumpDifference: null,
      slumpSteps: null,
      adjustedWaterAfterSlump: null,
      warning: null,
    }
  }

  const slumpDifference = slump - 50
  const slumpSteps = slumpDifference / 25
  const slumpAdjustmentPercent = slumpSteps * 3
  const adjustedWaterAfterSlump = baseWaterContent * (1 + slumpAdjustmentPercent / 100)
  const contentPerM3 = adjustedWaterAfterSlump * (1 - waterReductionPercent / 100)

  return {
    baseContentPerM3: baseWaterContent,
    slumpAdjustmentPercent,
    reductionPercent: waterReductionPercent,
    contentPerM3,
    totalLitres: concreteVolume === null ? null : contentPerM3 * concreteVolume,
    slumpDifference,
    slumpSteps,
    adjustedWaterAfterSlump,
    warning:
      slump > 100
        ? 'Very high slump values require trial testing and admixture selection verification.'
        : null,
  }
}

export function calculateAggregateFractions({ aggregateSize, adoptedWaterCementRatio }) {
  const baseFraction = getZoneIIFraction(aggregateSize)

  if (baseFraction === null || adoptedWaterCementRatio === null) {
    return {
      baseFraction,
      fineFraction: null,
      coarseFraction: null,
      warnings: [],
    }
  }

  // baseFraction is the IS 10262 table value = proportion of FINE aggregate to total
  // aggregate by absolute volume (Zone II), at W/C = 0.5.
  // As W/C decreases below 0.5, fine fraction increases (more fine needed for workability).
  const fineFraction = clampFraction(
    baseFraction + ((0.5 - adoptedWaterCementRatio) / 0.05) * 0.01
  )
  const coarseFraction = fineFraction === null ? null : clampFraction(1 - fineFraction)

  return {
    baseFraction,
    fineFraction,
    coarseFraction,
    warnings: [
      'Fine aggregate Zone II is being used as the default assumption.',
      'Trial mix verification is required.',
    ],
  }
}

export function formatMixRatio(cementContentPerM3, fineKgPerM3, coarseKgPerM3) {
  if (
    !isPositiveNumber(cementContentPerM3) ||
    fineKgPerM3 === null ||
    coarseKgPerM3 === null
  ) {
    return null
  }

  const fineAggregate = fineKgPerM3 / cementContentPerM3
  const coarseAggregate = coarseKgPerM3 / cementContentPerM3

  return {
    cement: 1,
    fineAggregate,
    coarseAggregate,
    formatted: `1 : ${fineAggregate.toFixed(2)} : ${coarseAggregate.toFixed(2)}`,
  }
}

function calculateCostBreakdown({
  cementTotal,
  fineAggregateTotal,
  coarseAggregateTotal,
  waterTotalLitres,
  admixtureQuantity,
  concreteVolume,
  area,
  prices,
}) {
  const hasAllPrices = [
    prices.cementPrice,
    prices.sandPrice,
    prices.aggregatePrice,
    prices.waterPrice,
    prices.admixturePrice,
  ].every((price) => Number.isFinite(price))

  if (!hasAllPrices) {
    return {
      cementCost: null,
      sandCost: null,
      aggregateCost: null,
      waterCost: null,
      admixtureCost: null,
      totalCost: null,
      costPerM3: null,
      costPerM2: null,
    }
  }

  const cementCost = cementTotal * prices.cementPrice
  const sandCost = fineAggregateTotal * prices.sandPrice
  const aggregateCost = coarseAggregateTotal * prices.aggregatePrice
  const waterCost = waterTotalLitres * prices.waterPrice
  const admixtureCost = admixtureQuantity * prices.admixturePrice
  const totalCost = cementCost + sandCost + aggregateCost + waterCost + admixtureCost

  return {
    cementCost,
    sandCost,
    aggregateCost,
    waterCost,
    admixtureCost,
    totalCost,
    costPerM3: concreteVolume > 0 ? totalCost / concreteVolume : null,
    costPerM2: area > 0 ? totalCost / area : null,
  }
}

export function calculateMixDesign(formData = {}) {
  const warnings = []
  const errors = []

  const area = toNumericValue(formData.area)
  const thickness = toNumericValue(formData.thickness)
  const thicknessM = thickness === null ? null : thickness / 1000
  const concreteVolume =
    area === null || thicknessM === null ? null : area * thicknessM

  if (area === null) {
    errors.push('Missing area.')
  } else if (area <= 0) {
    errors.push('Area must be greater than 0.')
  }

  if (thickness === null) {
    errors.push('Missing thickness.')
  } else if (thickness <= 0) {
    errors.push('Thickness must be greater than 0.')
  }

  const characteristicStrength = parseConcreteGrade(formData.concreteGrade)
  const standardDeviation = getStandardDeviation(formData.concreteGrade)
  const xFactor = getXFactor(formData.concreteGrade)
  const targetStrength = calculateTargetStrength(
    characteristicStrength,
    standardDeviation,
    xFactor
  )

  if (!formData.concreteGrade) {
    errors.push('Missing concrete grade.')
  } else if (characteristicStrength === null) {
    errors.push('Invalid concrete grade.')
  }

  const exposureLimits = getExposureLimits(formData.exposureCondition)
  const minimumGradeValue = parseConcreteGrade(exposureLimits.minimumGrade)
  const gradeValid =
    characteristicStrength === null || minimumGradeValue === null
      ? null
      : characteristicStrength >= minimumGradeValue

  if (!formData.exposureCondition) {
    errors.push('Missing exposure condition.')
  } else if (minimumGradeValue === null) {
    errors.push('Invalid exposure condition.')
  }

  if (gradeValid === false) {
    warnings.push(
      'Selected concrete grade is below the minimum grade required for the selected RCC exposure condition.'
    )
  }

  const userWaterCementRatio = toNumericValue(formData.waterCementRatio)
  const exposureMaximumWaterCementRatio = exposureLimits.maximumWaterCementRatio

  if (userWaterCementRatio !== null && userWaterCementRatio <= 0) {
    errors.push('Invalid water-cement ratio.')
  }

  if (
    userWaterCementRatio !== null &&
    exposureMaximumWaterCementRatio !== null &&
    userWaterCementRatio > exposureMaximumWaterCementRatio
  ) {
    errors.push(
      'Entered water-cement ratio exceeds the maximum allowed for the selected exposure condition.'
    )
  }

  const adoptedWaterCementRatio =
    userWaterCementRatio !== null
      ? userWaterCementRatio
      : exposureMaximumWaterCementRatio

  const waterCementRatioSource =
    userWaterCementRatio !== null ? 'user input' : 'exposure default'

  const aggregateSize = formData.aggregateSize
  const baseWaterContent = getBaseWaterContent(aggregateSize)
  const entrappedAir = getEntrappedAir(aggregateSize)

  if (!aggregateSize) {
    errors.push('Missing aggregate size.')
  } else if (baseWaterContent === null || entrappedAir.airPercentage === null) {
    errors.push('Invalid aggregate size.')
  }

  const slump = toNumericValue(formData.slump)
  if (slump === null) {
    errors.push('Missing slump.')
  } else if (slump < 0) {
    errors.push('Slump must be greater than or equal to 0.')
  }

  const admixtureEnabled = Boolean(formData.admixture)
  const admixtureType = formData.admixtureType ?? ''
  const admixtureDosage = toNumericValue(formData.admixtureDosage)
  const admixtureSpecificGravity = toNumericValue(formData.admixtureSpecificGravity)
  const admixtureWaterReduction = toNumericValue(formData.admixtureWaterReduction)
  const waterReductionPercent =
    admixtureEnabled && admixtureWaterReduction !== null && admixtureWaterReduction >= 0
      ? admixtureWaterReduction
      : 0

  const waterContent = calculateWaterContent({
    baseWaterContent,
    slump,
    waterReductionPercent,
    concreteVolume,
  })

  if (waterContent.warning) {
    warnings.push(waterContent.warning)
  }

  const waterContentPerM3 = waterContent.contentPerM3
  const waterContentTotal = waterContent.totalLitres

  // Nominal water and cement content derived from pre-admixture water (water without reduction).
  // The admixture dosage is determined by the design cement content, which is based on
  // the unreduced water content — this is consistent with engineering practice.
  const minimumCementContent = exposureLimits.minimumCementContent
  const nominalWaterContentPerM3 = waterContent.adjustedWaterAfterSlump  // water before admixture reduction
  const nominalCalculatedCementContent =
    nominalWaterContentPerM3 === null || adoptedWaterCementRatio === null || adoptedWaterCementRatio <= 0
      ? null
      : nominalWaterContentPerM3 / adoptedWaterCementRatio
  const nominalAdoptedCementContent =
    nominalCalculatedCementContent === null || minimumCementContent === null
      ? null
      : Math.max(nominalCalculatedCementContent, minimumCementContent)

  const calculatedCementContent =
    waterContentPerM3 === null || adoptedWaterCementRatio === null || adoptedWaterCementRatio <= 0
      ? null
      : waterContentPerM3 / adoptedWaterCementRatio

  const adoptedCementContent =
    calculatedCementContent === null || minimumCementContent === null
      ? null
      : Math.max(calculatedCementContent, minimumCementContent)

  const actualWaterCementRatio =
    waterContentPerM3 === null || adoptedCementContent === null || adoptedCementContent === 0
      ? null
      : waterContentPerM3 / adoptedCementContent

  if (adoptedCementContent !== null && adoptedCementContent > 450) {
    warnings.push(
      'Adopted cement content exceeds 450 kg/m³. Special consideration and project-specific verification are required.'
    )
  }

  if (concreteVolume !== null && concreteVolume <= 0) {
    errors.push('Calculated concrete volume is not physically valid. Check the input assumptions.')
  }

  // Admixture quantity and volume — quantity uses nominal (pre-reduction) cement content
  // as the dosage basis is the design cement, not the post-reduction value.
  const admixtureQuantity =
    admixtureEnabled && isPositiveNumber(nominalAdoptedCementContent) && isPositiveNumber(admixtureDosage)
      ? (nominalAdoptedCementContent * admixtureDosage) / 100
      : 0
  const admixtureVolume =
    admixtureEnabled && isPositiveNumber(admixtureQuantity) && isPositiveNumber(admixtureSpecificGravity)
      ? admixtureQuantity / (admixtureSpecificGravity * 1000)
      : 0

  const admixtureNote = admixtureEnabled
    ? 'Admixture dosage and performance must be verified with the manufacturer\'s technical data and laboratory trial mix.'
    : null

  if (admixtureNote) {
    warnings.push(admixtureNote)
  }

  const cementSpecificGravity = toNumericValue(formData.cementSpecificGravity)
  const fineAggregateSpecificGravity = toNumericValue(formData.fineAggregateSpecificGravity)
  const coarseAggregateSpecificGravity = toNumericValue(formData.coarseAggregateSpecificGravity)

  if (!isPositiveNumber(cementSpecificGravity)) {
    errors.push('Missing specific gravity for cement.')
  }

  if (!isPositiveNumber(fineAggregateSpecificGravity)) {
    errors.push('Missing specific gravity for fine aggregate.')
  }

  if (!isPositiveNumber(coarseAggregateSpecificGravity)) {
    errors.push('Missing specific gravity for coarse aggregate.')
  }

  const cementVolume =
    adoptedCementContent === null || !isPositiveNumber(cementSpecificGravity)
      ? null
      : adoptedCementContent / (cementSpecificGravity * 1000)

  const waterVolume = waterContentPerM3 === null ? null : waterContentPerM3 / 1000
  const aggregateVolume =
    cementVolume === null || waterVolume === null || entrappedAir.airVolume === null
      ? null
      : 1 - cementVolume - waterVolume - entrappedAir.airVolume - admixtureVolume

  if (aggregateVolume !== null && aggregateVolume <= 0) {
    errors.push('Calculated aggregate volume is not physically valid. Check the input assumptions.')
  }

  const aggregateFractions = calculateAggregateFractions({
    aggregateSize,
    adoptedWaterCementRatio,
  })

  warnings.push(...aggregateFractions.warnings)

  const totalVolumePerM3 = aggregateVolume
  const fineVolumePerM3 =
    totalVolumePerM3 === null || aggregateFractions.fineFraction === null
      ? null
      : totalVolumePerM3 * aggregateFractions.fineFraction
  const coarseVolumePerM3 =
    totalVolumePerM3 === null || aggregateFractions.coarseFraction === null
      ? null
      : totalVolumePerM3 * aggregateFractions.coarseFraction

  const fineKgPerM3 =
    fineVolumePerM3 === null || !isPositiveNumber(fineAggregateSpecificGravity)
      ? null
      : fineVolumePerM3 * fineAggregateSpecificGravity * 1000
  const coarseKgPerM3 =
    coarseVolumePerM3 === null || !isPositiveNumber(coarseAggregateSpecificGravity)
      ? null
      : coarseVolumePerM3 * coarseAggregateSpecificGravity * 1000

  // ── Absolute volume sanity check ─────────────────────────────────────────
  // The sum of all component volumes must equal approximately 1.0 m³.
  // A violation indicates invalid material properties or a logic error.
  if (
    cementVolume !== null &&
    waterVolume !== null &&
    entrappedAir.airVolume !== null &&
    fineVolumePerM3 !== null &&
    coarseVolumePerM3 !== null
  ) {
    const totalAbsoluteVolume =
      cementVolume +
      waterVolume +
      entrappedAir.airVolume +
      admixtureVolume +
      fineVolumePerM3 +
      coarseVolumePerM3

    if (Math.abs(totalAbsoluteVolume - 1) > 0.01) {
      errors.push(
        `Absolute volume balance is invalid (sum = ${totalAbsoluteVolume.toFixed(4)} m\u00b3). ` +
        'Please check material properties and calculation inputs.'
      )
    }
  }

  const fineTotalKg =
    fineKgPerM3 === null || concreteVolume === null ? null : fineKgPerM3 * concreteVolume
  const coarseTotalKg =
    coarseKgPerM3 === null || concreteVolume === null ? null : coarseKgPerM3 * concreteVolume

  const cementTotal =
    adoptedCementContent === null || concreteVolume === null
      ? null
      : adoptedCementContent * concreteVolume
  const cementBags = cementTotal === null ? null : cementTotal / 50
  const waterTotalLitres = waterContentTotal

  const mixRatio = formatMixRatio(adoptedCementContent, fineKgPerM3, coarseKgPerM3)

  const prices = {
    cementPrice: toNumericValue(formData.cementPrice),
    sandPrice: toNumericValue(formData.sandPrice),
    aggregatePrice: toNumericValue(formData.aggregatePrice),
    waterPrice: toNumericValue(formData.waterPrice),
    admixturePrice: toNumericValue(formData.admixturePrice),
  }

  const cost = calculateCostBreakdown({
    cementTotal: cementTotal ?? 0,
    fineAggregateTotal: fineTotalKg ?? 0,
    coarseAggregateTotal: coarseTotalKg ?? 0,
    waterTotalLitres: waterTotalLitres ?? 0,
    admixtureQuantity,
    concreteVolume: concreteVolume ?? 0,
    area: area ?? 0,
    prices,
  })

  return {
    inputSummary: {
      area,
      thickness,
      thicknessM,
      concreteGrade: formData.concreteGrade ?? '',
      cementType: formData.cementType ?? '',
      aggregateSize: formData.aggregateSize ?? '',
      exposureCondition: formData.exposureCondition ?? '',
      slump,
      waterCementRatio: userWaterCementRatio,
      cementSpecificGravity,
      fineAggregateSpecificGravity,
      coarseAggregateSpecificGravity,
      admixture: admixtureEnabled,
      admixtureType,
      admixtureDosage,
      admixtureSpecificGravity,
      admixtureWaterReduction,
      cementPrice: prices.cementPrice,
      sandPrice: prices.sandPrice,
      aggregatePrice: prices.aggregatePrice,
      waterPrice: prices.waterPrice,
      admixturePrice: prices.admixturePrice,
    },
    volume: {
      area,
      thickness,
      concreteVolume,
    },
    strength: {
      characteristicStrength,
      standardDeviation,
      xFactor,
      targetStrengthFromSD: targetStrength.targetStrengthFromSD,
      targetStrengthFromX: targetStrength.targetStrengthFromX,
      targetMeanStrength: targetStrength.targetMeanStrength,
    },
    durability: {
      exposureCondition: formData.exposureCondition ?? '',
      minimumGrade: exposureLimits.minimumGrade,
      minimumCementContent,
      maximumWaterCementRatio: exposureMaximumWaterCementRatio,
      gradeValid,
    },
    waterCementRatio: {
      userValue: userWaterCementRatio,
      adoptedValue: adoptedWaterCementRatio,
      maximumAllowed: exposureMaximumWaterCementRatio,
      source: waterCementRatioSource,
      actualValueAfterCementAdjustment: actualWaterCementRatio,
    },
    air: {
      percentage: entrappedAir.airPercentage,
      volume: entrappedAir.airVolume,
    },
    water: {
      baseContentPerM3: waterContent.baseContentPerM3,
      slumpAdjustmentPercent: waterContent.slumpAdjustmentPercent,
      reductionPercent: waterReductionPercent,
      contentPerM3: waterContentPerM3,
      volume: waterVolume,
      totalLitres: waterTotalLitres,
    },
    cement: {
      calculatedPerM3: calculatedCementContent,
      minimumPerM3: minimumCementContent,
      adoptedPerM3: adoptedCementContent,
      volume: cementVolume,
      totalKg: cementTotal,
      bags: cementBags,
    },
    aggregates: {
      totalVolumePerM3: aggregateVolume,
      fineFraction: aggregateFractions.fineFraction,
      coarseFraction: aggregateFractions.coarseFraction,
      fineVolumePerM3,
      coarseVolumePerM3,
      fineKgPerM3,
      coarseKgPerM3,
      fineTotalKg,
      coarseTotalKg,
    },
    admixture: {
      enabled: admixtureEnabled,
      quantity: admixtureQuantity,
      volume: admixtureVolume,
      note: admixtureNote,
    },
    mixRatio,
    cost,
    warnings,
    errors,
  }
}
