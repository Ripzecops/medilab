window.Apollo = window.Apollo || {};

Apollo.Reports = {
  async generateTestReport(panelId) {
    const panel = await Apollo.Storage.get('test_panels', panelId);
    if (!panel) return '<p>Test not found</p>';
    const patient = await Apollo.Storage.get('patients', panel.patient_id);
    const results = await Apollo.Storage.getByIndex('test_results', 'panel_id', panelId);
    const testType = Apollo.getTestType(panel.test_type_code);
    const doctor = patient && patient.referred_by ? await Apollo.Storage.get('doctors', patient.referred_by) : null;

    let html = `<div class="report" id="printableReport">
      <div class="report-header">
        <div class="report-logo">
          <h1>Appolo Medi Lab</h1>
          <p class="report-subtitle">Zaviya Lane, Katiyar Road, Eravur</p>
          <p class="report-subtitle" style="font-size:10px">PHSRC Certified Lab · Regd No: PHSRC/L/2035</p>
        </div>
        <div class="report-meta">
          <p><strong>Report ID:</strong> ${panelId}</p>
          <p><strong>Date:</strong> ${Apollo.Utils.formatDate(panel.test_date)}</p>
          <p><strong>WhatsApp:</strong> 076 482 7277</p>
          <p><strong>Email:</strong> Officialappololabservices@gmail.com</p>
        </div>
      </div>
      <div class="report-patient-info">
        <div class="report-info-grid">
          <p><strong>Patient:</strong> ${patient ? (patient.prefix||'') + ' ' + patient.patient_name : 'Unknown'}</p>
          <p><strong>Age:</strong> ${patient ? patient.age || '—' : '—'}</p>
          <p><strong>Gender:</strong> ${patient ? patient.gender || '—' : '—'}</p>
          <p><strong>Phone:</strong> ${patient ? patient.phone_number || '—' : '—'}</p>
          ${doctor ? `<p><strong>Referred By:</strong> Dr. ${Apollo.Utils.escapeHtml(doctor.doctor_name)}</p>` : ''}
        </div>
      </div>
      <div class="report-test-title"><h2>${testType ? testType.name : panel.test_type_code}</h2></div>
      <table class="report-table">
        <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Status</th></tr></thead><tbody>`;

    results.forEach(r => {
      const val = r.value_numeric != null ? r.value_numeric : (r.value_text || '—');
      const ref = r.ref_range_low != null || r.ref_range_high != null ? `${r.ref_range_low ?? ''} - ${r.ref_range_high ?? ''}` : '—';
      const flag = r.flag ? Apollo.Utils.flagBadge(r.flag) : '—';
      html += `<tr class="${r.flag === 'H' || r.flag === 'L' ? 'abnormal-row' : ''}">
        <td>${r.parameter_name}</td><td class="result-val">${val}</td><td>${r.unit || ''}</td><td>${ref}</td><td>${flag}</td></tr>`;
    });

    html += '</tbody></table>';
    if (testType && testType.calcEGFR && patient) {
      const cr = results.find(r => r.parameter_name === 'Serum Creatinine');
      if (cr && cr.value_numeric) {
        const egfr = Apollo.Utils.calcEGFR(cr.value_numeric, patient.age, patient.gender);
        if (egfr != null) {
          html += `<div class="report-egfr"><strong>eGFR:</strong> ${egfr} mL/min/1.73m² <small>(MDRD formula${patient.gender === 'Female' ? ', female adjusted' : ''})</small></div>`;
        }
      }
    }
    
    // Add price info if available
    const priceInfo = await Apollo.Storage.getPanelPrice(panelId);
    if (priceInfo) {
      html += `<div style="margin-top:20px; border-top:1px dashed #ccc; padding-top:10px;">
        <p style="font-size:12px; margin:0;"><strong>Test Price:</strong> Rs. ${priceInfo.price || 0} &nbsp;&nbsp; <strong>Paid:</strong> Rs. ${priceInfo.amount_paid || 0}</p>
      </div>`;
    }

    html += `<div class="report-footer"><p>This report is electronically generated.</p><div class="report-signature"><p>_________________________</p><p>Authorized Signatory</p></div></div></div>`;
    return html;
  },

  async generatePatientSummary(patientId) {
    const patient = await Apollo.Storage.get('patients', patientId);
    if (!patient) return '<p>Patient not found</p>';
    const panels = await Apollo.Storage.getByIndex('test_panels', 'patient_id', patientId);
    const doctor = patient.referred_by ? await Apollo.Storage.get('doctors', patient.referred_by) : null;
    panels.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    let html = `<div class="report" id="printableReport">
      <div class="report-header">
        <div class="report-logo">
          <h1>Appolo Medi Lab</h1>
          <p class="report-subtitle">Patient Summary Report</p>
        </div>
        <div class="report-meta">
          <p><strong>Generated:</strong> ${Apollo.Utils.formatDateTime(new Date())}</p>
          <p><strong>WhatsApp:</strong> 076 482 7277</p>
        </div>
      </div>
      <div class="report-patient-info"><div class="report-info-grid">
        <p><strong>Patient:</strong> ${(patient.prefix||'')} ${patient.patient_name}</p>
        <p><strong>Age:</strong> ${patient.age || '—'} &nbsp; <strong>Gender:</strong> ${patient.gender || '—'}</p>
        <p><strong>Phone:</strong> ${patient.phone_number || '—'}</p>
        ${doctor ? `<p><strong>Referred By:</strong> Dr. ${Apollo.Utils.escapeHtml(doctor.doctor_name)}</p>` : ''}
      </div></div><h3 class="report-section-title">Test History (${panels.length} tests)</h3>`;

    for (const panel of panels) {
      const results = await Apollo.Storage.getByIndex('test_results', 'panel_id', panel.id);
      const tt = Apollo.getTestType(panel.test_type_code);
      html += `<div class="report-test-block"><h4>${tt ? tt.name : panel.test_type_code} — ${Apollo.Utils.formatDate(panel.test_date)}</h4><table class="report-table compact"><thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Status</th></tr></thead><tbody>`;
      results.forEach(r => {
        const val = r.value_numeric != null ? r.value_numeric : (r.value_text || '—');
        const flag = r.flag ? Apollo.Utils.flagBadge(r.flag) : '';
        html += `<tr class="${r.flag === 'H' || r.flag === 'L' ? 'abnormal-row' : ''}"><td>${r.parameter_name}</td><td>${val}</td><td>${r.unit||''}</td><td>${flag}</td></tr>`;
      });
      html += '</tbody></table></div>';
    }
    html += '</div>';
    return html;
  },

  printReport() {
    const content = document.getElementById('printableReport');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Appolo Medi Lab Report</title><style>
      body{font-family:'Segoe UI',sans-serif;margin:20px;color:#1e293b}
      .report-header{display:flex;justify-content:space-between;border-bottom:3px solid #0ea5e9;padding-bottom:15px;margin-bottom:15px}
      .report-logo h1{color:#0ea5e9;margin:0;font-size:28px}.report-subtitle{color:#64748b;margin:4px 0 0}
      .report-meta{text-align:right;font-size:13px;color:#475569}.report-meta p{margin:2px 0}
      .report-patient-info{background:#f8fafc;padding:15px;border-radius:8px;margin-bottom:20px}
      .report-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.report-info-grid p{margin:3px 0;font-size:14px}
      .report-test-title h2{color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:8px}
      .report-table{width:100%;border-collapse:collapse;margin:15px 0}.report-table th{background:#f1f5f9;padding:10px;text-align:left;font-size:13px;border-bottom:2px solid #e2e8f0}
      .report-table td{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:13px}.result-val{font-weight:600}
      .abnormal-row{background:#fef2f2}.flag{padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
      .flag-high{background:#fee2e2;color:#dc2626}.flag-low{background:#dbeafe;color:#2563eb}.flag-normal{background:#dcfce7;color:#16a34a}
      .report-egfr{margin:15px 0;padding:12px;background:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a}
      .report-footer{margin-top:40px;padding-top:15px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#64748b}
      .report-signature{text-align:center}.report-test-block{margin:20px 0;page-break-inside:avoid}.report-section-title{color:#334155;margin:25px 0 10px}
      .compact td,.compact th{padding:5px 8px;font-size:12px}
      @media print{body{margin:10px}}
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  },

  async exportTestJSON(panelId) {
    const panel = await Apollo.Storage.get('test_panels', panelId);
    const results = await Apollo.Storage.getByIndex('test_results', 'panel_id', panelId);
    const patient = await Apollo.Storage.get('patients', panel.patient_id);
    Apollo.Utils.downloadJSON({ patient, panel, results }, `test_${panelId}_${panel.test_type_code}.json`);
  },

  async exportTestTXT(panelId) {
    const panel = await Apollo.Storage.get('test_panels', panelId);
    const results = await Apollo.Storage.getByIndex('test_results', 'panel_id', panelId);
    const patient = await Apollo.Storage.get('patients', panel.patient_id);
    const tt = Apollo.getTestType(panel.test_type_code);
    let txt = `APOLLO LABS - TEST REPORT\n${'='.repeat(40)}\n`;
    txt += `Patient: ${patient ? (patient.prefix||'') + ' ' + patient.patient_name : 'Unknown'}\n`;
    txt += `Age: ${patient?.age || '—'}  Gender: ${patient?.gender || '—'}\n`;
    txt += `Test: ${tt ? tt.name : panel.test_type_code}\nDate: ${Apollo.Utils.formatDate(panel.test_date)}\n`;
    txt += `${'-'.repeat(40)}\n`;
    results.forEach(r => {
      const val = r.value_numeric != null ? r.value_numeric : (r.value_text || '');
      txt += `${r.parameter_name}: ${val} ${r.unit || ''} ${r.flag ? '['+r.flag+']' : ''}\n`;
    });
    Apollo.Utils.downloadTXT(txt, `test_${panelId}.txt`);
  }
};
