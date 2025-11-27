/**
 * ============================================
 * VACCINE VIAL MAPPING
 * ============================================
 * Maps each vaccine to its doses per vial
 * Used to calculate vials needed from doses
 * ============================================
 */

export const VACCINE_VIAL_MAPPING = {
  // Multi-dose vials (20 doses per vial)
  "BCG": 20,
  "BCG Diluent": 20,
  "bOPV": 20,
  "dropper": 20,

  // Standard vials (10 doses per vial)
  "Pentavalent": 10,
  "IPV 10 dose": 10,
  "PCV10 (4 dose)": 10,
  "Hep B (10 dose)": 10,
  "MMR": 10,
  "MR": 10,
  "HPV": 10,
  "Td10": 10,

  // Single dose or special
  "Tt1": 1,
  "PPV23": 1,
  "FLU vaccines": 1,
  "MMR diluent": 1,
  "MR diluent": 1,

  // N/A (not applicable - supplies)
  "dropper": null,
};

/**
 * Calculate vials needed from doses
 * @param {string} vaccineName - Name of vaccine
 * @param {number} doses - Number of doses needed
 * @returns {number} Number of vials needed
 */
export function calculateVialsNeeded(vaccineName, doses) {
  const dosesPerVial = VACCINE_VIAL_MAPPING[vaccineName];

  // If N/A or not found, return doses as-is
  if (!dosesPerVial || dosesPerVial === null) {
    return doses;
  }

  // Calculate vials needed (round up)
  return Math.ceil(doses / dosesPerVial);
}

/**
 * Get doses per vial for a vaccine
 * @param {string} vaccineName - Name of vaccine
 * @returns {number|null} Doses per vial or null if N/A
 */
export function getDosesPerVial(vaccineName) {
  return VACCINE_VIAL_MAPPING[vaccineName] || null;
}

/**
 * Get all vaccines with their vial info
 * @returns {Array} Array of vaccine info
 */
export function getAllVaccineVialInfo() {
  return Object.entries(VACCINE_VIAL_MAPPING).map(([vaccine, dosesPerVial]) => ({
    vaccine,
    dosesPerVial,
    label: dosesPerVial ? `${dosesPerVial} doses/vial` : "N/A"
  }));
}

export default {
  VACCINE_VIAL_MAPPING,
  calculateVialsNeeded,
  getDosesPerVial,
  getAllVaccineVialInfo
};
