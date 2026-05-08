window.Apollo = window.Apollo || {};

Apollo.Forms = {
  patientForm(patient, doctors) {
    const p = patient || {};
    const docOptions = doctors.map(d => `<option value="${d.id}" ${p.referred_by == d.id ? 'selected':''}>${Apollo.Utils.escapeHtml(d.doctor_name)}</option>`).join('');
    const prefixOpts = Apollo.PATIENT_PREFIXES.map(pr => `<option ${p.prefix === pr ? 'selected':''}>${pr}</option>`).join('');
    return `<div class="card"><div class="card-body">
      <form id="patientForm" class="form">
        <div class="form-grid">
          <div class="form-group"><label>Prefix</label><select name="prefix" id="fPrefix">${prefixOpts}</select></div>
          <div class="form-group span-2"><label>Patient Name *</label><input type="text" name="patient_name" id="fName" value="${Apollo.Utils.escapeHtml(p.patient_name||'')}" required placeholder="Full Name"></div>
          <div class="form-group"><label>Age</label><input type="number" name="age" id="fAge" min="0" max="150" value="${p.age||''}" placeholder="Years"></div>
          <div class="form-group"><label>Gender</label><select name="gender" id="fGender"><option value="">Select Gender</option>${Apollo.GENDERS.map(g=>`<option ${p.gender===g?'selected':''}>${g}</option>`).join('')}</select></div>
          <div class="form-group"><label>Phone Number</label><input type="tel" name="phone_number" id="fPhone" value="${Apollo.Utils.escapeHtml(p.phone_number||'')}" placeholder="07xxxxxxxx"></div>
          <div class="form-group"><label>Referred By</label><select name="referred_by" id="fDoctor"><option value="">Self / Walk-in</option>${docOptions}</select></div>
          <div class="form-group"><label>Blood Type Antigen</label><input type="text" name="blood_type_antigen" id="fBlood" value="${Apollo.Utils.escapeHtml(p.blood_type_antigen||'')}" placeholder="e.g. Rho"></div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" onclick="history.back()">Cancel</button>
          <button type="submit" class="btn btn-primary">${patient ? 'Update' : 'Register'} Patient Record</button>
        </div></form></div></div>`;
  },

  doctorForm(doctor) {
    const d = doctor || {};
    return `<div class="card"><div class="card-body">
      <form id="doctorForm" class="form">
        <div class="form-grid">
          <div class="form-group span-3"><label>Doctor Full Name *</label><input type="text" name="doctor_name" id="fDocName" value="${Apollo.Utils.escapeHtml(d.doctor_name||'')}" required placeholder="e.g. Dr. Mohammed Rifnas"></div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" onclick="history.back()">Cancel</button>
          <button type="submit" class="btn btn-primary">${doctor ? 'Update' : 'Save'} Doctor Details</button>
        </div></form></div></div>`;
  },

  testSelectForm(patientId) {
    let html = `<div class="card" style="margin-bottom:24px;"><div class="card-body">
      <div class="form-group" style="max-width:300px; margin-bottom:24px;"><label>Test Date *</label><input type="date" name="test_date" id="fTestDate" value="${Apollo.Utils.todayISO()}" required></div>
      <div class="test-category-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">`;
    
    Apollo.TEST_CATEGORIES.forEach(cat => {
      const tests = Apollo.getTestsByCategory(cat.id);
      if (tests.length === 0) return;
      html += `<div class="test-category-card" style="background:var(--bg-hover); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <h4 style="margin-bottom:12px; font-size:12px; color:var(--text-secondary); text-transform:uppercase;">${cat.name}</h4>
        <div class="test-buttons" style="display:flex; flex-wrap:wrap; gap:8px;">`;
      tests.forEach(t => { 
        html += `<button type="button" class="btn btn-sm test-select-btn" data-code="${t.code}" title="${t.name}" style="flex:1; min-width:60px; justify-content:center;">${t.code}</button>`; 
      });
      html += '</div></div>';
    });
    html += '</div></div></div><div id="testFormFields"></div>';
    return html;
  },

  generateTestFields(testType, existingResults) {
    const results = {};
    if (existingResults) existingResults.forEach(r => { results[r.parameter_name] = r; });
    
    let html = `<div class="card"><div class="card-header"><h3 style="display:flex; align-items:center; gap:10px;">${testType.name} <span class="badge" style="background:var(--accent); color:white;">${testType.code}</span></h3></div>
      <div class="card-body">`;
    
    html += '<div class="form-grid">';
    testType.parameters.forEach(p => {
      const existing = results[p.name];
      if (p.type === 'numeric') {
        const val = existing ? existing.value_numeric : '';
        const refText = p.refLow != null || p.refHigh != null ? `<span style="color:var(--text-muted); font-size:11px; font-weight:normal;">(${Apollo.Utils.refRangeText(p)})</span>` : '';
        html += `<div class="form-group"><label>${p.name} ${p.unit ? '<small>('+p.unit+')</small>' : ''} ${refText}</label><input type="number" step="any" name="param_${p.name}" value="${val}" data-param="${p.name}" data-type="numeric" class="test-input" placeholder="0.00"></div>`;
      } else if (p.type === 'select') {
        const val = existing ? existing.value_text : '';
        const opts = p.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
        html += `<div class="form-group"><label>${p.name}</label><select name="param_${p.name}" data-param="${p.name}" data-type="select" class="test-input"><option value="">Select Value</option>${opts}</select></div>`;
      } else {
        const val = existing ? existing.value_text : '';
        html += `<div class="form-group"><label>${p.name}</label><input type="text" name="param_${p.name}" value="${Apollo.Utils.escapeHtml(val)}" data-param="${p.name}" data-type="text" class="test-input" placeholder="Result text"></div>`;
      }
    });
    html += '</div>';
    
    if (testType.calcEGFR) {
      html += `<div class="egfr-display" id="egfrDisplay" style="margin-top:20px; padding:16px; background:var(--accent-light); border-radius:var(--radius-md); border-left:4px solid var(--accent);">
        <strong style="color:var(--accent);">Calculated eGFR:</strong> <span id="egfrValue" style="font-size:18px; font-weight:700; color:var(--text);">—</span> <small>mL/min/1.73m²</small>
      </div>`;
    }
    
    // Financial fields
    const priceVal = existingResults && existingResults._price ? existingResults._price : '';
    const paidVal = existingResults && existingResults._paid ? existingResults._paid : '';
    
    html += `
      <div style="margin-top:32px; padding-top:24px; border-top:1px solid var(--border);">
        <h4 style="margin-bottom:16px; font-size:14px; color:var(--text-secondary);">Billing & Payments</h4>
        <div class="form-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div class="form-group"><label>Total Test Price (LKR)</label><input type="number" id="fTestPrice" class="price-input" value="${priceVal}" placeholder="0.00" style="font-weight:700; color:var(--accent);"></div>
          <div class="form-group"><label>Amount Paid (LKR)</label><input type="number" id="fTestPaid" class="price-input" value="${paidVal}" placeholder="0.00" style="font-weight:700; color:var(--success);"></div>
        </div>
      </div>
    `;
    
    html += `<div class="form-actions"><button type="button" class="btn" onclick="history.back()">Cancel</button><button type="button" class="btn btn-primary" id="saveTestBtn">Save Final Results</button></div></div></div>`;
    return html;
  },

  collectTestResults(testType, gender) {
    const inputs = document.querySelectorAll('.test-input');
    const results = [];
    inputs.forEach(inp => {
      const paramName = inp.dataset.param;
      const paramDef = testType.parameters.find(p => p.name === paramName);
      if (!paramDef) return;
      const result = { parameter_name: paramName, unit: paramDef.unit || '', value_numeric: null, value_text: null, ref_range_low: null, ref_range_high: null, flag: null };
      if (paramDef.type === 'numeric') {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) {
          result.value_numeric = v;
          result.ref_range_low = paramDef.genderRef && gender && paramDef.genderRef[gender] ? (paramDef.genderRef[gender].refLow ?? paramDef.refLow) : paramDef.refLow;
          result.ref_range_high = paramDef.genderRef && gender && paramDef.genderRef[gender] ? (paramDef.genderRef[gender].refHigh ?? paramDef.refHigh) : paramDef.refHigh;
          result.flag = Apollo.Utils.calcFlag(v, result.ref_range_low, result.ref_range_high, gender, paramDef);
        }
      } else {
        result.value_text = inp.value || null;
      }
      results.push(result);
    });
    return results;
  }
};
