import { supabase } from './supabase.js'

/**
 * Build the insert payload from the calculator form data and engine result.
 * Maps only to the columns that exist in the calculations table.
 * user_id is taken from the authenticated user — never from the form.
 */
function buildPayload(userId, formData, result) {
  const admixtureEnabled = Boolean(formData.admixture)

  // -- Inputs --
  const inputs = {
    user_id: userId,
    concrete_grade: formData.concreteGrade || null,
    cement_type: formData.cementType || null,
    aggregate_size: formData.aggregateSize || null,
    exposure_condition: formData.exposureCondition || null,
    slump: formData.slump !== '' && formData.slump !== null ? Number(formData.slump) : null,
    water_cement_ratio:
      formData.waterCementRatio !== '' && formData.waterCementRatio !== null
        ? Number(formData.waterCementRatio)
        : null,
    cement_specific_gravity:
      formData.cementSpecificGravity !== '' ? Number(formData.cementSpecificGravity) : null,
    fine_aggregate_specific_gravity:
      formData.fineAggregateSpecificGravity !== ''
        ? Number(formData.fineAggregateSpecificGravity)
        : null,
    coarse_aggregate_specific_gravity:
      formData.coarseAggregateSpecificGravity !== ''
        ? Number(formData.coarseAggregateSpecificGravity)
        : null,
    area: formData.area !== '' ? Number(formData.area) : null,
    thickness: formData.thickness !== '' ? Number(formData.thickness) : null,

    // Admixture inputs — always boolean, null sub-fields when disabled
    admixture: admixtureEnabled === true,
    admixture_type: admixtureEnabled ? formData.admixtureType || null : null,
    admixture_dosage:
      admixtureEnabled && formData.admixtureDosage !== ''
        ? Number(formData.admixtureDosage)
        : null,
    admixture_specific_gravity:
      admixtureEnabled && formData.admixtureSpecificGravity !== ''
        ? Number(formData.admixtureSpecificGravity)
        : null,
    water_reduction_percent:
      admixtureEnabled && formData.admixtureWaterReduction !== ''
        ? Number(formData.admixtureWaterReduction)
        : null,
  }

  // -- Results --
  const results = {
    concrete_volume: result.volume.concreteVolume ?? null,
    target_mean_strength: result.strength.targetMeanStrength ?? null,
    water_content: result.water.contentPerM3 ?? null,
    cement_content: result.cement.adoptedPerM3 ?? null,

    // NOTE: cement_volume, water_volume, aggregate_volume, admixture_volume columns
    // do not exist in the Supabase table yet. Add those columns in Supabase first,
    // then uncomment these four lines:
    // cement_volume: result.cement.volume ?? null,
    // water_volume: result.water.volume ?? null,
    // aggregate_volume: result.aggregates.totalVolumePerM3 ?? null,
    // admixture_volume: result.admixture.volume ?? 0,

    fine_aggregate: result.aggregates.fineKgPerM3 ?? null,
    coarse_aggregate: result.aggregates.coarseKgPerM3 ?? null,
    admixture_quantity: result.admixture.quantity ?? 0,

    mix_ratio: result.mixRatio?.formatted ?? null,
    cement_bags: result.cement.bags ?? null,
  }

  // -- Costs (only save if prices were entered and costs were calculated) --
  const hasCosts = result.cost.totalCost != null
  const costs = hasCosts
    ? {
        cement_price: result.cost.cementCost != null ? Number(formData.cementPrice) || null : null,
        sand_price: result.cost.sandCost != null ? Number(formData.sandPrice) || null : null,
        aggregate_price:
          result.cost.aggregateCost != null ? Number(formData.aggregatePrice) || null : null,
        water_price: result.cost.waterCost != null ? Number(formData.waterPrice) || null : null,
        admixture_price:
          result.cost.admixtureCost != null ? Number(formData.admixturePrice) || null : null,
        total_cost: result.cost.totalCost ?? null,
        cost_per_m3: result.cost.costPerM3 ?? null,
        cost_per_m2: result.cost.costPerM2 ?? null,
      }
    : {
        cement_price: null,
        sand_price: null,
        aggregate_price: null,
        water_price: null,
        admixture_price: null,
        total_cost: null,
        cost_per_m3: null,
        cost_per_m2: null,
      }

  return { ...inputs, ...results, ...costs }
}

/**
 * Save a completed mix design calculation to Supabase.
 * Returns { data, error } — data is the inserted row.
 */
export async function saveCalculation(userId, formData, result) {
  const payload = buildPayload(userId, formData, result)

  const { data, error } = await supabase
    .from('calculations')
    .insert(payload)
    .select()
    .single()

  return { data, error }
}

/**
 * Load all calculations for the authenticated user, newest first.
 * RLS ensures only the user's own rows are returned.
 */
export async function loadCalculations() {
  const { data, error } = await supabase
    .from('calculations')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Delete a single calculation row by ID.
 * RLS ensures only the owner can delete their own row.
 */
export async function deleteCalculation(id) {
  const { error } = await supabase
    .from('calculations')
    .delete()
    .eq('id', id)

  return { error }
}
