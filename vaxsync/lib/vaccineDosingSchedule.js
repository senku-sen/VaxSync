/**
 * ============================================
 * VACCINE DOSING SCHEDULE
 * ============================================
 * Maps main vaccines to their individual doses
 * Example: "Pentavalent" → ["PENTA1", "PENTA2", "PENTA3"]
 * ============================================
 */

/**
 * Complete vaccine dosing schedule
 * Defines all vaccines and their corresponding doses
 */
export const VACCINE_DOSING_SCHEDULE = {
  // Multi-dose vaccines
  "Pentavalent": ["PENTA1", "PENTA2", "PENTA3"],
  "bOPV": ["OPV1", "OPV2", "OPV3"],
  "IPV 10 dose": ["IPV1", "IPV2", "IPV3"],
  "PCV10 (4 dose)": ["PCV1", "PCV2", "PCV3", "PCV4"],
  "Hep B (10 dose)": ["HEPB0", "HEPB1", "HEPB2"],
  "MMR": ["MMR1", "MMR2"],
  "MR": ["MR1", "MR2"],
  "HPV": ["HPV1", "HPV2", "HPV3"],
  
  // Single-dose vaccines (but may have multiple doses in schedule)
  "Td10": ["TD"],
  "Tt1": ["TT1", "TT2"],  // Tt1 has 2 doses in the schedule
  "PPV23": ["PPV23"],
  "BCG": ["BCG"],
  "FLU vaccines": ["FLU"],
  
  // Diluents (supplies)
  "BCG Diluent": ["BCG_DILUENT"],
  "MMR diluent": ["MMR_DILUENT"],
  "MR diluent": ["MR_DILUENT"],
  
  // Supplies
  "dropper": ["DROPPER"]
};

/**
 * Get all doses for a vaccine
 * @param {string} vaccineName - Main vaccine name
 * @returns {Array} Array of dose codes
 */
export function getVaccineDoses(vaccineName) {
  return VACCINE_DOSING_SCHEDULE[vaccineName] || [];
}

/**
 * Get the main vaccine from a dose code
 * @param {string} doseCode - Dose code (e.g., "PENTA1")
 * @returns {string} Main vaccine name
 */
export function getMainVaccineFromDose(doseCode) {
  for (const [mainVaccine, doses] of Object.entries(VACCINE_DOSING_SCHEDULE)) {
    if (doses.includes(doseCode)) {
      return mainVaccine;
    }
  }
  return null;
}

/**
 * Get dose number from dose code
 * @param {string} doseCode - Dose code (e.g., "PENTA1")
 * @returns {number} Dose number (0, 1, 2, 3, etc.)
 */
export function getDoseNumber(doseCode) {
  const match = doseCode.match(/(\d+)$/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Get dose label for display
 * @param {string} doseCode - Dose code
 * @returns {string} Display label
 */
export function getDoseLabel(doseCode) {
  const doseNum = getDoseNumber(doseCode);
  if (doseNum === null) return doseCode;
  
  const labels = {
    0: "Birth Dose",
    1: "1st Dose",
    2: "2nd Dose",
    3: "3rd Dose",
    4: "4th Dose"
  };
  
  return labels[doseNum] || `${doseNum}th Dose`;
}

/**
 * Get all available vaccine doses for requests
 * @returns {Array} Array of {label, value, mainVaccine}
 */
export function getAllAvailableDoses() {
  const doses = [];
  
  for (const [mainVaccine, doseList] of Object.entries(VACCINE_DOSING_SCHEDULE)) {
    for (const doseCode of doseList) {
      doses.push({
        label: `${doseCode} (${mainVaccine})`,
        value: doseCode,
        mainVaccine: mainVaccine,
        doseCode: doseCode,
        doseLabel: getDoseLabel(doseCode)
      });
    }
  }
  
  return doses.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get doses grouped by main vaccine
 * @returns {Object} Grouped doses
 */
export function getDosesGroupedByVaccine() {
  const grouped = {};
  
  for (const [mainVaccine, doseList] of Object.entries(VACCINE_DOSING_SCHEDULE)) {
    grouped[mainVaccine] = doseList.map((doseCode, index) => ({
      code: doseCode,
      label: getDoseLabel(doseCode),
      fullLabel: `${doseCode} - ${getDoseLabel(doseCode)}`,
      number: index + 1
    }));
  }
  
  return grouped;
}

/**
 * Validate dose code
 * @param {string} doseCode - Dose code to validate
 * @returns {boolean} True if valid
 */
export function isValidDoseCode(doseCode) {
  for (const doses of Object.values(VACCINE_DOSING_SCHEDULE)) {
    if (doses.includes(doseCode)) {
      return true;
    }
  }
  return false;
}

/**
 * Get dose information
 * @param {string} doseCode - Dose code
 * @returns {Object} Dose information
 */
export function getDoseInfo(doseCode) {
  const mainVaccine = getMainVaccineFromDose(doseCode);
  if (!mainVaccine) return null;
  
  const doses = VACCINE_DOSING_SCHEDULE[mainVaccine];
  const doseIndex = doses.indexOf(doseCode);
  
  return {
    doseCode: doseCode,
    mainVaccine: mainVaccine,
    doseNumber: doseIndex + 1,
    doseLabel: getDoseLabel(doseCode),
    totalDosesForVaccine: doses.length,
    isLastDose: doseIndex === doses.length - 1
  };
}

/**
 * Calculate quantity per dose
 * @param {number} totalQuantity - Total quantity
 * @param {number} numberOfDoses - Number of doses
 * @returns {Object} {quantityPerDose, remainder}
 */
export function calculateQuantityPerDose(totalQuantity, numberOfDoses) {
  const quantityPerDose = Math.floor(totalQuantity / numberOfDoses);
  const remainder = totalQuantity % numberOfDoses;
  
  return {
    quantityPerDose,
    remainder,
    distribution: Array.from({ length: numberOfDoses }, (_, i) => 
      quantityPerDose + (i === numberOfDoses - 1 ? remainder : 0)
    )
  };
}

/**
 * Get dose distribution for a vaccine
 * @param {string} vaccineName - Vaccine name
 * @param {number} totalQuantity - Total quantity
 * @returns {Array} Array of {doseCode, doseLabel, quantity}
 */
export function getDoseDistribution(vaccineName, totalQuantity) {
  const doses = getVaccineDoses(vaccineName);
  if (doses.length === 0) return [];
  
  const { distribution } = calculateQuantityPerDose(totalQuantity, doses.length);
  
  return doses.map((doseCode, index) => ({
    doseCode,
    doseLabel: getDoseLabel(doseCode),
    quantity: distribution[index],
    doseNumber: index + 1
  }));
}

/**
 * Get vaccine summary
 * @returns {Object} Summary of all vaccines and doses
 */
export function getVaccineSummary() {
  const summary = {
    totalVaccines: Object.keys(VACCINE_DOSING_SCHEDULE).length,
    totalDoses: 0,
    multiDoseVaccines: [],
    singleDoseVaccines: [],
    supplies: []
  };
  
  for (const [vaccine, doses] of Object.entries(VACCINE_DOSING_SCHEDULE)) {
    summary.totalDoses += doses.length;
    
    if (doses.length > 1) {
      summary.multiDoseVaccines.push({
        name: vaccine,
        doses: doses.length,
        doseList: doses
      });
    } else {
      if (vaccine.includes("Diluent") || vaccine === "dropper") {
        summary.supplies.push({
          name: vaccine,
          doseCode: doses[0]
        });
      } else {
        summary.singleDoseVaccines.push({
          name: vaccine,
          doseCode: doses[0]
        });
      }
    }
  }
  
  return summary;
}

export default {
  VACCINE_DOSING_SCHEDULE,
  getVaccineDoses,
  getMainVaccineFromDose,
  getDoseNumber,
  getDoseLabel,
  getAllAvailableDoses,
  getDosesGroupedByVaccine,
  isValidDoseCode,
  getDoseInfo,
  calculateQuantityPerDose,
  getDoseDistribution,
  getVaccineSummary
};
