window.Apollo = window.Apollo || {};

Apollo.PATIENT_PREFIXES = ['Mr.','Miss.','Mrs.','Master.','Baby.','Dr.','Hon.','Rev.'];
Apollo.GENDERS = ['Male','Female'];
Apollo.BLOOD_GROUPS = ['A','B','AB','O'];
Apollo.RHESUS_OPTIONS = ['Positive','Negative'];

Apollo.URINE_VALUES = {
  colour: ['Pale Yellow','Yellow','Dark Yellow','Amber','Red','Brown','Clear'],
  appearance: ['Clear','Slightly Turbid','Turbid','Cloudy'],
  sugar: ['Nil','Trace','+','++','+++','++++'],
  protein: ['Nil','Trace','+','++','+++','++++'],
  rbc: ['Nil','1-2','2-4','4-6','6-8','Field Full'],
  pus: ['Nil','1-2','2-4','4-6','6-8','10-12','Field Full'],
  epithelialCell: ['Nil','Few','Moderate','Many'],
  crystals: ['Nil','Calcium Oxalate','Uric Acid','Triple Phosphate','Amorphous'],
  cast: ['Nil','Hyaline','Granular','WBC','RBC'],
  organisms: ['Nil','Few','Moderate','Many']
};

Apollo.TEST_CATEGORIES = [
  { id: 'blood_sugar', name: 'Blood Sugar Tests' },
  { id: 'lipid', name: 'Lipid Profile' },
  { id: 'haematology', name: 'Haematology' },
  { id: 'liver', name: 'Liver Function' },
  { id: 'renal', name: 'Renal Function' },
  { id: 'urine', name: 'Urine Analysis' },
  { id: 'serology', name: 'Serology' },
  { id: 'special', name: 'Special Tests' }
];

Apollo.TEST_TYPES = [
  {
    code: 'FBS', name: 'Fasting Blood Sugar', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 }
    ]
  },
  {
    code: 'RBS', name: 'Random Blood Sugar', category: 'blood_sugar',
    parameters: [
      { name: 'Random Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 }
    ]
  },
  {
    code: 'PPBS', name: 'Post-Prandial Blood Sugar', category: 'blood_sugar',
    parameters: [
      { name: 'Post-Prandial Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 }
    ]
  },
  {
    code: 'FBSPPBS', name: 'FBS + Post-Prandial Blood Sugar', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 },
      { name: 'Post-Prandial Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 }
    ]
  },
  {
    code: 'FBSTT', name: 'FBS + Triglyceride', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 },
      { name: 'Triglyceride', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 150 }
    ]
  },
  {
    code: 'FBSCT', name: 'FBS + Total Cholesterol', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 },
      { name: 'Total Cholesterol', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 200 }
    ]
  },
  {
    code: 'FBSSGPTT', name: 'FBS + SGPT', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 },
      { name: 'SGPT (ALT)', type: 'numeric', unit: 'U/L', refLow: 12, refHigh: 40 }
    ]
  },
  {
    code: 'OGTT', name: 'Oral Glucose Tolerance Test', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 },
      { name: 'OGTT 1hr', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 180 },
      { name: 'OGTT 2hr', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 140 }
    ]
  },
  {
    code: 'HBA1C', name: 'HbA1c (Glycated Haemoglobin)', category: 'blood_sugar',
    parameters: [
      { name: 'HbA1c', type: 'numeric', unit: '%', refLow: 4.0, refHigh: 6.0 }
    ]
  },
  {
    code: 'BSS1H', name: 'Blood Sugar Series 1hr (with FBS)', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 },
      { name: '1hr After Breakfast', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 },
      { name: '1hr After Lunch', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 },
      { name: '1hr After Dinner', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 }
    ]
  },
  {
    code: 'BSS1H2', name: 'Blood Sugar Series 1hr (no FBS)', category: 'blood_sugar',
    parameters: [
      { name: '1hr After Breakfast', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 },
      { name: '1hr After Lunch', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 },
      { name: '1hr After Dinner', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 }
    ]
  },
  {
    code: 'BSS2H', name: 'Blood Sugar Series 2hr', category: 'blood_sugar',
    parameters: [
      { name: 'Fasting Blood Sugar', type: 'numeric', unit: 'mg/dL', refLow: 60, refHigh: 110 },
      { name: '2hr After Breakfast', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 },
      { name: '2hr After Lunch', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 },
      { name: '2hr After Dinner', type: 'numeric', unit: 'mg/dL', refLow: 70, refHigh: 140 }
    ]
  },
  {
    code: 'LPT', name: 'Lipid Profile', category: 'lipid',
    parameters: [
      { name: 'Total Cholesterol', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 200 },
      { name: 'HDL Cholesterol', type: 'numeric', unit: 'mg/dL', refLow: 40, refHigh: 60, genderRef: { Male: { refLow: 40 }, Female: { refLow: 50 } } },
      { name: 'LDL Cholesterol', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 100 },
      { name: 'Total Triglyceride', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 150 },
      { name: 'VLDL Cholesterol', type: 'numeric', unit: 'mg/dL', refLow: 2, refHigh: 30 }
    ]
  },
  {
    code: 'TCT', name: 'Total Cholesterol', category: 'lipid',
    parameters: [
      { name: 'Total Cholesterol', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 200 }
    ]
  },
  {
    code: 'TRI', name: 'Triglyceride', category: 'lipid',
    parameters: [
      { name: 'Triglyceride', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 150 }
    ]
  },
  {
    code: 'FBC', name: 'Full Blood Count', category: 'haematology',
    parameters: [
      { name: 'WBC', type: 'numeric', unit: '×10³/µL', refLow: 4.0, refHigh: 11.0 },
      { name: 'Neutrophils', type: 'numeric', unit: '%', refLow: 40, refHigh: 70 },
      { name: 'Lymphocytes', type: 'numeric', unit: '%', refLow: 20, refHigh: 40 },
      { name: 'Eosinophils', type: 'numeric', unit: '%', refLow: 1, refHigh: 6 },
      { name: 'Monocytes', type: 'numeric', unit: '%', refLow: 2, refHigh: 8 },
      { name: 'RBC', type: 'numeric', unit: '×10⁶/µL', refLow: 4.0, refHigh: 5.5 },
      { name: 'Haemoglobin', type: 'numeric', unit: 'g/dL', refLow: 11, refHigh: 15 },
      { name: 'HCT', type: 'numeric', unit: '%', refLow: 36, refHigh: 54 },
      { name: 'MCV', type: 'numeric', unit: 'fL', refLow: 80, refHigh: 100 },
      { name: 'MCH', type: 'numeric', unit: 'pg', refLow: 27, refHigh: 33 },
      { name: 'MCHC', type: 'numeric', unit: 'g/dL', refLow: 32, refHigh: 36 },
      { name: 'Platelets', type: 'numeric', unit: '×10³/µL', refLow: 150, refHigh: 400 },
      { name: 'MPV', type: 'numeric', unit: 'fL', refLow: 7.5, refHigh: 11.5 },
      { name: 'PDW', type: 'numeric', unit: 'fL', refLow: 9, refHigh: 17 },
      { name: 'RDW', type: 'numeric', unit: '%', refLow: 11.5, refHigh: 14.5 }
    ]
  },
  {
    code: 'WBCDCPL', name: 'WBC Differential + Platelet Count', category: 'haematology',
    parameters: [
      { name: 'WBC', type: 'numeric', unit: '×10³/µL', refLow: 4.0, refHigh: 11.0 },
      { name: 'Neutrophils', type: 'numeric', unit: '%', refLow: 40, refHigh: 70 },
      { name: 'Lymphocytes', type: 'numeric', unit: '%', refLow: 20, refHigh: 40 },
      { name: 'Eosinophils', type: 'numeric', unit: '%', refLow: 1, refHigh: 6 },
      { name: 'Monocytes', type: 'numeric', unit: '%', refLow: 2, refHigh: 8 },
      { name: 'Basophils', type: 'numeric', unit: '%', refLow: 0, refHigh: 1 },
      { name: 'Platelet Count', type: 'numeric', unit: '×10³/µL', refLow: 150, refHigh: 400 }
    ]
  },
  {
    code: 'HB', name: 'Haemoglobin', category: 'haematology',
    parameters: [
      { name: 'Haemoglobin', type: 'numeric', unit: 'g/dL', refLow: 11, refHigh: 15 }
    ]
  },
  {
    code: 'ESR', name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'haematology',
    parameters: [
      { name: 'ESR', type: 'numeric', unit: 'mm/hr', refLow: 0, refHigh: 20 }
    ]
  },
  {
    code: 'BGT', name: 'Blood Group', category: 'haematology',
    parameters: [
      { name: 'Blood Group', type: 'select', options: ['A','B','AB','O'] },
      { name: 'Rhesus', type: 'select', options: ['Positive','Negative'] }
    ]
  },
  {
    code: 'BGWH', name: 'Blood Group + Weight + Height', category: 'haematology',
    parameters: [
      { name: 'Blood Group', type: 'select', options: ['A','B','AB','O'] },
      { name: 'Rhesus', type: 'select', options: ['Positive','Negative'] },
      { name: 'Height', type: 'numeric', unit: 'cm' },
      { name: 'Weight', type: 'numeric', unit: 'kg' }
    ]
  },
  {
    code: 'CRP', name: 'C-Reactive Protein', category: 'serology',
    parameters: [
      { name: 'CRP', type: 'numeric', unit: 'mg/L', refLow: 0, refHigh: 6 },
      { name: 'CRP Sign', type: 'select', options: ['Positive','Negative'] }
    ]
  },
  {
    code: 'SST', name: 'SGOT + SGPT', category: 'liver',
    parameters: [
      { name: 'SGOT (AST)', type: 'numeric', unit: 'U/L', refLow: 5, refHigh: 37 },
      { name: 'SGPT (ALT)', type: 'numeric', unit: 'U/L', refLow: 12, refHigh: 40 }
    ]
  },
  {
    code: 'SGOT', name: 'SGOT (AST)', category: 'liver',
    parameters: [
      { name: 'SGOT (AST)', type: 'numeric', unit: 'U/L', refLow: 5, refHigh: 37 }
    ]
  },
  {
    code: 'SGPT', name: 'SGPT (ALT)', category: 'liver',
    parameters: [
      { name: 'SGPT (ALT)', type: 'numeric', unit: 'U/L', refLow: 12, refHigh: 40 }
    ]
  },
  {
    code: 'CSGPT', name: 'Serum Creatinine + SGPT', category: 'liver',
    parameters: [
      { name: 'Serum Creatinine', type: 'numeric', unit: 'mg/dL', refLow: 0.6, refHigh: 1.3, genderRef: { Male: { refLow: 0.7, refHigh: 1.3 }, Female: { refLow: 0.6, refHigh: 1.0 } } },
      { name: 'SGPT (ALT)', type: 'numeric', unit: 'U/L', refLow: 12, refHigh: 40 }
    ],
    calcEGFR: true
  },
  {
    code: 'CT', name: 'Serum Creatinine + eGFR', category: 'renal',
    parameters: [
      { name: 'Serum Creatinine', type: 'numeric', unit: 'mg/dL', refLow: 0.6, refHigh: 1.3, genderRef: { Male: { refLow: 0.7, refHigh: 1.3 }, Female: { refLow: 0.6, refHigh: 1.0 } } }
    ],
    calcEGFR: true
  },
  {
    code: 'CTT', name: 'Serum Creatinine + Triglyceride', category: 'renal',
    parameters: [
      { name: 'Serum Creatinine', type: 'numeric', unit: 'mg/dL', refLow: 0.6, refHigh: 1.3, genderRef: { Male: { refLow: 0.7, refHigh: 1.3 }, Female: { refLow: 0.6, refHigh: 1.0 } } },
      { name: 'Triglyceride', type: 'numeric', unit: 'mg/dL', refLow: 0, refHigh: 150 }
    ],
    calcEGFR: true
  },
  {
    code: 'CHT', name: 'Serum Creatinine + Haemoglobin', category: 'renal',
    parameters: [
      { name: 'Serum Creatinine', type: 'numeric', unit: 'mg/dL', refLow: 0.6, refHigh: 1.3, genderRef: { Male: { refLow: 0.7, refHigh: 1.3 }, Female: { refLow: 0.6, refHigh: 1.0 } } },
      { name: 'Haemoglobin', type: 'numeric', unit: 'g/dL', refLow: 11, refHigh: 15 }
    ],
    calcEGFR: true
  },
  {
    code: 'UCT', name: 'Urea + Creatinine + eGFR', category: 'renal',
    parameters: [
      { name: 'Blood Urea', type: 'numeric', unit: 'mg/dL', refLow: 13, refHigh: 43 },
      { name: 'Serum Creatinine', type: 'numeric', unit: 'mg/dL', refLow: 0.6, refHigh: 1.3, genderRef: { Male: { refLow: 0.7, refHigh: 1.3 }, Female: { refLow: 0.6, refHigh: 1.0 } } }
    ],
    calcEGFR: true
  },
  {
    code: 'UCCRP', name: 'Urea + Creatinine + CRP', category: 'renal',
    parameters: [
      { name: 'Blood Urea', type: 'numeric', unit: 'mg/dL', refLow: 13, refHigh: 43 },
      { name: 'Serum Creatinine', type: 'numeric', unit: 'mg/dL', refLow: 0.6, refHigh: 1.3, genderRef: { Male: { refLow: 0.7, refHigh: 1.3 }, Female: { refLow: 0.6, refHigh: 1.0 } } },
      { name: 'C-Reactive Protein', type: 'numeric', unit: 'mg/L', refLow: 0, refHigh: 6 }
    ],
    calcEGFR: true
  },
  {
    code: 'UT', name: 'Blood Urea', category: 'renal',
    parameters: [
      { name: 'Blood Urea', type: 'numeric', unit: 'mg/dL', refLow: 13, refHigh: 43 }
    ]
  },
  {
    code: 'RFT', name: 'Rheumatoid Factor', category: 'serology',
    parameters: [
      { name: 'Rheumatoid Factor', type: 'numeric', unit: 'IU/mL', refLow: 0, refHigh: 14 }
    ]
  },
  {
    code: 'UFR', name: 'Urine Full Report', category: 'urine',
    parameters: [
      { name: 'Colour', type: 'select', options: ['Pale Yellow','Yellow','Dark Yellow','Amber','Red','Brown','Clear'] },
      { name: 'Appearance', type: 'select', options: ['Clear','Slightly Turbid','Turbid','Cloudy'] },
      { name: 'Sugar', type: 'select', options: ['Nil','Trace','+','++','+++','++++'] },
      { name: 'Protein', type: 'select', options: ['Nil','Trace','+','++','+++','++++'] },
      { name: 'RBC', type: 'select', options: ['Nil','1-2','2-4','4-6','6-8','Field Full'] },
      { name: 'Pus Cells', type: 'select', options: ['Nil','1-2','2-4','4-6','6-8','10-12','Field Full'] },
      { name: 'Epithelial Cells', type: 'select', options: ['Nil','Few','Moderate','Many'] },
      { name: 'Crystals', type: 'select', options: ['Nil','Calcium Oxalate','Uric Acid','Triple Phosphate','Amorphous'] },
      { name: 'Cast', type: 'select', options: ['Nil','Hyaline','Granular','WBC','RBC'] },
      { name: 'Organisms', type: 'select', options: ['Nil','Few','Moderate','Many'] }
    ]
  },
  {
    code: 'SFAT', name: 'Semen Analysis', category: 'special',
    parameters: [
      { name: 'Appearance', type: 'text' },
      { name: 'Liquefaction Time', type: 'text' },
      { name: 'Viscosity', type: 'text' },
      { name: 'Volume', type: 'numeric', unit: 'mL', refLow: 1.5, refHigh: 5.0 },
      { name: 'pH', type: 'numeric', unit: '', refLow: 7.2, refHigh: 8.0 },
      { name: 'Concentration', type: 'numeric', unit: '×10⁶/mL', refLow: 15, refHigh: 200 },
      { name: 'Active Motility', type: 'numeric', unit: '%', refLow: 32, refHigh: 100 },
      { name: 'Sluggish Motility', type: 'numeric', unit: '%' },
      { name: 'Immotile', type: 'numeric', unit: '%' },
      { name: 'Pus Cells', type: 'text' },
      { name: 'Red Cells', type: 'text' }
    ]
  },
  {
    code: 'DABT', name: 'Dengue Antibody', category: 'serology',
    parameters: [
      { name: 'Dengue IgG', type: 'select', options: ['Positive','Negative'] },
      { name: 'Dengue IgM', type: 'select', options: ['Positive','Negative'] }
    ]
  },
  {
    code: 'DNS1A', name: 'Dengue NS-1 Antigen', category: 'serology',
    parameters: [
      { name: 'NS-1 Antigen', type: 'select', options: ['Positive','Negative'] }
    ]
  },
  {
    code: 'VDRL', name: 'VDRL (Syphilis)', category: 'serology',
    parameters: [
      { name: 'VDRL', type: 'select', options: ['Reactive','Non-Reactive'] }
    ]
  },
  {
    code: 'URINEHCG', name: 'Urine HCG (Pregnancy)', category: 'special',
    parameters: [
      { name: 'Urine HCG', type: 'select', options: ['Positive','Negative'] }
    ]
  },
  {
    code: 'BHCG', name: 'Serum Beta-HCG', category: 'special',
    parameters: [
      { name: 'Serum Beta-HCG', type: 'numeric', unit: 'mIU/mL', refLow: 0, refHigh: 5.42 }
    ]
  }
];

Apollo.getTestType = function(code) {
  return Apollo.TEST_TYPES.find(t => t.code === code);
};

Apollo.getTestsByCategory = function(categoryId) {
  return Apollo.TEST_TYPES.filter(t => t.category === categoryId);
};
