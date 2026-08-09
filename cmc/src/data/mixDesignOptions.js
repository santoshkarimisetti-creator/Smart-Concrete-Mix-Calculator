export const mixDesignOptions = {
  concreteGrade: [
    { value: 'M15', label: 'M15' },
    { value: 'M20', label: 'M20' },
    { value: 'M25', label: 'M25' },
    { value: 'M30', label: 'M30' },
    { value: 'M35', label: 'M35' },
    { value: 'M40', label: 'M40' },
    { value: 'M45', label: 'M45' },
    { value: 'M50', label: 'M50' },
  ],
  cementType: [
    { value: 'OPC 33', label: 'OPC 33' },
    { value: 'OPC 43', label: 'OPC 43' },
    { value: 'OPC 53', label: 'OPC 53' },
    { value: 'PPC', label: 'PPC' },
    { value: 'PSC', label: 'PSC' },
  ],
  aggregateSize: [
    { value: '10 mm', label: '10 mm' },
    { value: '20 mm', label: '20 mm' },
    { value: '40 mm', label: '40 mm' },
  ],
  exposureCondition: [
    { value: 'Mild', label: 'Mild' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Severe', label: 'Severe' },
    { value: 'Very Severe', label: 'Very Severe' },
    { value: 'Extreme', label: 'Extreme' },
  ],
}

export const mixDesignDefaults = {
  area: null,
  thickness: null,
  concreteGrade: null,
  cementType: null,
  aggregateSize: null,
  exposureCondition: null,
  slump: null,
  waterCementRatio: null,
  cementSpecificGravity: null,
  fineAggregateSpecificGravity: null,
  coarseAggregateSpecificGravity: null,
  admixture: false,
}