window.Apollo = window.Apollo || {};

Apollo.App = {
  async init() {
    await Apollo.Storage.open();
    await Apollo.Storage.seedTestTypes();
    this.setupTheme();
    this.setupGlobalSearch();
    this.registerRoutes();
    Apollo.Utils.setupGlobalShortcuts(Apollo.Router);
    Apollo.Utils.setupEnterKeyNavigation();
    Apollo.Router.init();
  },

  setupTheme() {
    const saved = localStorage.getItem('apollo_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('apollo_theme', next);
        btn.textContent = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
      });
      btn.textContent = saved === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  },

  setupGlobalSearch() {
    const input = document.getElementById('globalSearch');
    const gd = document.getElementById('globalResults');
    input.addEventListener('input', Apollo.Utils.debounce(async (e) => {
      const q = e.target.value.trim();
      if (q.length < 2) { gd.classList.remove('active'); return; }
      const patients = await Apollo.Storage.search('patients', 'patient_name', q);
      if (!isNaN(q) || q.startsWith('0')) {
        const byPhone = await Apollo.Storage.search('patients', 'phone_number', q);
        byPhone.forEach(p => { if (!patients.find(x => x.id === p.id)) patients.push(p); });
      }
      if (patients.length === 0) { gd.innerHTML = '<div style="padding:12px; color:var(--text-muted); font-size:12px; text-align:center;">No patients found</div>'; gd.classList.add('active'); return; }
      gd.innerHTML = patients.slice(0, 8).map(p =>
        `<a class="gs-item" href="#/patients/${p.id}" style="display:flex; flex-direction:column; padding:10px 16px; text-decoration:none; color:var(--text); border-bottom:1px solid var(--border-light);">
          <span style="font-weight:600; font-size:14px;">${Apollo.Utils.escapeHtml((p.prefix||'')+ ' ' +p.patient_name)}</span>
          <span style="font-size:11px; color:var(--text-muted);">${p.phone_number||'No Phone'} · Age: ${p.age||'—'}</span>
        </a>`
      ).join('');
      gd.classList.add('active');
    }, 300));
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) gd.classList.remove('active');
    });
  },

  registerRoutes() {
    const R = Apollo.Router;
    R.register('/', () => this.dashboard());
    R.register('/patients', () => this.patientsList());
    R.register('/patients/new', () => this.patientForm());
    R.register('/patients/:id', (p) => this.patientDetail(parseInt(p.id)));
    R.register('/patients/:id/edit', (p) => this.patientForm(parseInt(p.id)));
    R.register('/patients/:id/tests/new', (p) => this.testEntry(parseInt(p.id)));
    R.register('/tests/:id', (p) => this.testDetail(parseInt(p.id)));
    R.register('/tests/:id/edit', (p) => this.testEdit(parseInt(p.id)));
    R.register('/doctors', () => this.doctorsList());
    R.register('/doctors/new', () => this.doctorForm());
    R.register('/doctors/:id/edit', (p) => this.doctorForm(parseInt(p.id)));
    R.register('/reports', () => this.reportsPage());
    R.register('/settings', () => this.settingsPage());
  },

  async dashboard() {
    const stats = await Apollo.Storage.getStats();
    let recentHtml = '';
    if (stats.recentPanels.length > 0) {
      const rows = [];
      for (const p of stats.recentPanels) {
        const patient = await Apollo.Storage.get('patients', p.patient_id);
        const priceInfo = await Apollo.Storage.getPanelPrice(p.id);
        rows.push([
          Apollo.UI.testBadge(p.test_type_code),
          patient ? `<span style="font-weight:600;">${Apollo.Utils.escapeHtml(patient.patient_name)}</span>` : 'Unknown',
          `<span style="color:var(--text-secondary); font-size:13px;">${Apollo.Utils.formatDate(p.test_date)}</span>`,
          priceInfo ? Apollo.UI.paymentBadge(priceInfo.price, priceInfo.amount_paid) : '—',
          `<a href="#/tests/${p.id}" class="btn btn-sm">View Report</a>`
        ]);
      }
      recentHtml = Apollo.UI.table(['Test Code', 'Patient Name', 'Date', 'Payment Status', 'Action'], rows);
    } else {
      recentHtml = Apollo.UI.emptyState('🧪', 'No tests recorded yet', '<a href="#/patients/new" class="btn btn-primary">Register Your First Patient</a>');
    }

    Apollo.UI.render(`
      ${Apollo.UI.pageHeader('Overview Dashboard')}
      
      <div class="stats-grid">
        ${Apollo.UI.statCard('patients', 'Total Patients', stats.patients, '#4f46e5')}
        ${Apollo.UI.statCard('doctors', 'Medical Doctors', stats.doctors, '#8b5cf6')}
        ${Apollo.UI.statCard('tests', 'Lab Test Panels', stats.panels, '#f59e0b')}
        ${Apollo.UI.statCard('results', 'Test Parameters', stats.results, '#10b981')}
      </div>

      ${Apollo.UI.financialCards(stats.totalRevenue, stats.totalPaid, stats.totalUnpaid)}
      
      <div class="dashboard-grid" style="display:grid; grid-template-columns: 1fr; gap:24px;">
        ${Apollo.UI.card('Recently Processed Lab Tests', recentHtml)}
      </div>
    `);
  },

  async patientsList() {
    const patients = await Apollo.Storage.getAll('patients');
    const doctors = await Apollo.Storage.getAll('doctors');
    const docMap = {};
    doctors.forEach(d => { docMap[d.id] = d.doctor_name; });

    const renderList = async (list) => {
      if (list.length === 0) return Apollo.UI.emptyState('👥', 'No patient records found.', '<a href="#/patients/new" class="btn btn-primary">Add New Patient</a>');
      const rows = [];
      for (const p of list) {
        const fin = await Apollo.Storage.getPatientFinancials(p.id);
        rows.push([
          `<a href="#/patients/${p.id}" style="font-weight:700; color:var(--accent); text-decoration:none;">${Apollo.Utils.escapeHtml((p.prefix||'')+' '+p.patient_name)}</a>`,
          `<span style="font-weight:500;">${p.age || '—'}</span>`, 
          `<span style="color:var(--text-secondary);">${p.phone_number || '—'}</span>`,
          `<span style="font-size:12px; color:var(--text-muted);">${docMap[p.referred_by] || 'Self'}</span>`,
          `<span style="font-weight:700; color:${fin.unpaid > 0 ? 'var(--danger)' : 'var(--success)'}">Rs. ${fin.unpaid.toLocaleString()}</span>`,
          `<div style="display:flex; gap:6px;">
            <a href="#/patients/${p.id}" class="btn btn-sm btn-outline">Profile</a>
            <a href="#/patients/${p.id}/tests/new" class="btn btn-sm btn-primary">New Test</a>
          </div>`
        ]);
      }
      return Apollo.UI.table(['Patient Name','Age','Contact','Referred By','Balance','Actions'], rows, 'patientsTable');
    };

    Apollo.UI.render(`
      ${Apollo.UI.pageHeader('Patient Records', '<a href="#/patients/new" class="btn btn-primary"> Register Patient (Alt+N)</a>')}
      <div id="searchWrap" style="margin-bottom:24px;"></div>
      <div id="patientListWrap">${Apollo.UI.loader()}</div>
    `);

    const onSearch = async (criteria) => {
      document.getElementById('patientListWrap').innerHTML = Apollo.UI.loader();
      const filtered = await Apollo.Storage.searchMulti('patients', criteria);
      document.getElementById('patientListWrap').innerHTML = await renderList(filtered);
    };

    const advSearch = Apollo.UI.advancedSearchPanel(onSearch);
    document.getElementById('searchWrap').appendChild(advSearch);
    document.getElementById('patientListWrap').innerHTML = await renderList(patients);
  },

  async patientForm(id) {
    const doctors = await Apollo.Storage.getAll('doctors');
    const patient = id ? await Apollo.Storage.get('patients', id) : null;
    const title = patient ? 'Edit Patient Profile' : 'Register New Patient';
    Apollo.UI.render(`${Apollo.UI.pageHeader(title)}${Apollo.Forms.patientForm(patient, doctors)}`);
    
    setTimeout(() => document.getElementById('fPrefix').focus(), 100);

    document.getElementById('patientForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        prefix: document.getElementById('fPrefix').value,
        patient_name: document.getElementById('fName').value.trim(),
        age: parseInt(document.getElementById('fAge').value) || null,
        gender: document.getElementById('fGender').value,
        phone_number: document.getElementById('fPhone').value.trim(),
        referred_by: parseInt(document.getElementById('fDoctor').value) || null,
        blood_type_antigen: document.getElementById('fBlood').value.trim()
      };
      if (!data.patient_name) { Apollo.Utils.toast('Patient name is required', 'error'); return; }
      try {
        if (patient) { await Apollo.Storage.put('patients', { ...patient, ...data }); Apollo.Utils.toast('Profile updated successfully', 'success'); }
        else { const newId = await Apollo.Storage.add('patients', data); Apollo.Utils.toast('Patient registered successfully', 'success'); Apollo.Router.navigate(`/patients/${newId}`); return; }
        Apollo.Router.navigate(`/patients/${id}`);
      } catch (err) { Apollo.Utils.toast('Error: ' + err.message, 'error'); }
    });
  },

  async patientDetail(id) {
    const patient = await Apollo.Storage.get('patients', id);
    if (!patient) { Apollo.UI.render('<div class="error-page"><h2>Patient record not found.</h2></div>'); return; }
    const doctor = patient.referred_by ? await Apollo.Storage.get('doctors', patient.referred_by) : null;
    const panels = await Apollo.Storage.getByIndex('test_panels', 'patient_id', id);
    const financials = await Apollo.Storage.getPatientFinancials(id);
    panels.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    const testCodes = new Set(panels.map(p => p.test_type_code));
    const indicators = Apollo.TEST_TYPES.map(t =>
      `<span class="badge ${testCodes.has(t.code) ? '' : 'badge-outline'}" style="margin:2px; ${testCodes.has(t.code) ? 'background:var(--accent); color:white;' : 'opacity:0.3;'}" title="${t.name}">${t.code}</span>`
    ).join('');

    let testsHtml = '';
    if (panels.length > 0) {
      const rows = [];
      for (const p of panels) {
        const priceInfo = await Apollo.Storage.getPanelPrice(p.id);
        rows.push([
          Apollo.UI.testBadge(p.test_type_code),
          `<span style="font-weight:600;">${Apollo.getTestType(p.test_type_code)?.name || p.test_type_code}</span>`,
          `<span style="color:var(--text-secondary);">${Apollo.Utils.formatDate(p.test_date)}</span>`,
          priceInfo ? `<span style="font-weight:700;">Rs. ${priceInfo.price}</span>` : '—',
          priceInfo ? Apollo.UI.paymentBadge(priceInfo.price, priceInfo.amount_paid) : '—',
          `<div style="display:flex; gap:6px;">
            <a href="#/tests/${p.id}" class="btn btn-sm btn-outline">View</a>
            <a href="#/tests/${p.id}/edit" class="btn btn-sm">Edit</a>
          </div>`
        ]);
      }
      testsHtml = Apollo.UI.table(['Code','Test Name','Date','Price','Status','Actions'], rows);
    } else {
      testsHtml = Apollo.UI.emptyState('🧪', 'No lab tests found for this patient.');
    }

    Apollo.UI.render(`
      ${Apollo.UI.pageHeader(`${(patient.prefix||'')} ${patient.patient_name}`,
        `
         ${Apollo.UI.smsButton(patient.phone_number, patient.prefix, patient.patient_name)}
         <a href="#/patients/${id}/tests/new" class="btn btn-primary">+ New Lab Test</a>
         <a href="#/patients/${id}/edit" class="btn">Edit Profile</a>
         <button class="btn btn-danger" id="deletePatient">Delete Record</button>`)}
      
      ${Apollo.UI.financialCards(financials.total, financials.paid, financials.unpaid)}

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
        ${Apollo.UI.card('Patient Demographics', `
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
            <div><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Age / Gender</span><span style="font-weight:600;">${patient.age || '—'} / ${patient.gender || '—'}</span></div>
            <div><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Phone Number</span><span style="font-weight:600;">${patient.phone_number || '—'}</span></div>
            <div><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Referred By</span><span style="font-weight:600;">${doctor ? 'Dr. '+Apollo.Utils.escapeHtml(doctor.doctor_name) : 'Self'}</span></div>
            <div><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Blood Type</span><span style="font-weight:600;">${patient.blood_type_antigen || '—'}</span></div>
          </div>
        `)}
        ${Apollo.UI.card('History Overview', `<div style="display:flex; flex-wrap:wrap;">${indicators}</div>`)}
      </div>
      ${Apollo.UI.card(`Laboratory Test History (${panels.length})`, testsHtml)}
    `);

    document.getElementById('deletePatient')?.addEventListener('click', async () => {
      if (await Apollo.Utils.confirm('Are you absolutely sure you want to delete this patient and all their historical test data? This cannot be undone.')) {
        for (const p of panels) {
          const results = await Apollo.Storage.getByIndex('test_results', 'panel_id', p.id);
          for (const r of results) await Apollo.Storage.delete('test_results', r.id);
          const prices = await Apollo.Storage.getByIndex('test_prices', 'panel_id', p.id);
          for (const pr of prices) await Apollo.Storage.delete('test_prices', pr.id);
          await Apollo.Storage.delete('test_panels', p.id);
        }
        await Apollo.Storage.delete('patients', id);
        Apollo.Utils.toast('Patient record deleted', 'success');
        Apollo.Router.navigate('/patients');
      }
    });
  },

  async testEntry(patientId) {
    const patient = await Apollo.Storage.get('patients', patientId);
    if (!patient) { Apollo.UI.render('<div class="error-page"><h2>Patient not found</h2></div>'); return; }
    Apollo.UI.render(`
      ${Apollo.UI.pageHeader(`New Test — ${(patient.prefix||'')} ${patient.patient_name}`)}
      ${Apollo.Forms.testSelectForm(patientId)}
    `);
    let selectedCode = null;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.test-select-btn');
      if (!btn) return;
      document.querySelectorAll('.test-select-btn').forEach(b => {
        b.style.background = 'var(--bg-card)';
        b.style.color = 'var(--text)';
        b.style.borderColor = 'var(--border)';
      });
      btn.style.background = 'var(--accent)';
      btn.style.color = 'white';
      btn.style.borderColor = 'var(--accent)';
      
      selectedCode = btn.dataset.code;
      const tt = Apollo.getTestType(selectedCode);
      document.getElementById('testFormFields').innerHTML = Apollo.Forms.generateTestFields(tt);
      this._setupEGFR(tt, patient);
      document.getElementById('saveTestBtn')?.addEventListener('click', () => this._saveTest(patientId, selectedCode, tt, patient));
      
      setTimeout(() => {
        const firstInput = document.querySelector('.test-input');
        if (firstInput) firstInput.focus();
      }, 50);
    });
  },

  _setupEGFR(tt, patient) {
    if (!tt.calcEGFR) return;
    const crInput = document.querySelector('[data-param="Serum Creatinine"]');
    if (!crInput) return;
    crInput.addEventListener('input', () => {
      const cr = parseFloat(crInput.value);
      const egfr = Apollo.Utils.calcEGFR(cr, patient.age, patient.gender);
      const el = document.getElementById('egfrValue');
      if (el) {
        el.textContent = egfr != null ? egfr : '—';
        el.style.color = egfr < 60 ? 'var(--danger)' : (egfr < 90 ? 'var(--warning)' : 'var(--success)');
      }
    });
  },

  async _saveTest(patientId, code, testType, patient) {
    const dateEl = document.getElementById('fTestDate');
    if (!dateEl || !dateEl.value) { Apollo.Utils.toast('Please select a valid test date', 'error'); return; }
    const results = Apollo.Forms.collectTestResults(testType, patient.gender);
    const price = parseFloat(document.getElementById('fTestPrice')?.value) || 0;
    const paid = parseFloat(document.getElementById('fTestPaid')?.value) || 0;
    
    if (results.length === 0) { Apollo.Utils.toast('At least one parameter result must be entered.', 'error'); return; }
    try {
      const panelId = await Apollo.Storage.add('test_panels', { patient_id: patientId, test_type_code: code, test_date: dateEl.value });
      await Apollo.Storage.add('test_prices', { panel_id: panelId, patient_id: patientId, price, amount_paid: paid });
      
      if (testType.calcEGFR) {
        const cr = results.find(r => r.parameter_name === 'Serum Creatinine');
        if (cr && cr.value_numeric) {
          const egfr = Apollo.Utils.calcEGFR(cr.value_numeric, patient.age, patient.gender);
          if (egfr != null) results.push({ parameter_name: 'eGFR', value_numeric: egfr, value_text: null, unit: 'mL/min/1.73m²', ref_range_low: 90, ref_range_high: null, flag: egfr < 60 ? 'L' : (egfr < 90 ? 'L' : 'N') });
        }
      }
      for (const r of results) { await Apollo.Storage.add('test_results', { panel_id: panelId, ...r }); }
      Apollo.Utils.toast('Lab test results saved successfully', 'success');
      Apollo.Router.navigate(`/tests/${panelId}`);
    } catch (err) { Apollo.Utils.toast('Error saving record: ' + err.message, 'error'); }
  },

  async testDetail(panelId) {
    const report = await Apollo.Reports.generateTestReport(panelId);
    const panel = await Apollo.Storage.get('test_panels', panelId);
    const patient = panel ? await Apollo.Storage.get('patients', panel.patient_id) : null;
    
    Apollo.UI.render(`
      ${Apollo.UI.pageHeader('Laboratory Report', `
        ${patient ? Apollo.UI.smsButton(patient.phone_number, patient.prefix, patient.patient_name) : ''}
        <button class="btn btn-primary" id="printBtn"> Print Report</button>
        <button class="btn" id="exportJSON">Export JSON</button>
        <a href="#/tests/${panelId}/edit" class="btn">Edit Results</a>
        <button class="btn btn-danger" id="deleteTest">Delete</button>
        <a href="#/patients/${panel?.patient_id}" class="btn btn-outline">← Back to Patient</a>
      `)}${report}`);
    document.getElementById('printBtn').onclick = () => Apollo.Reports.printReport();
    document.getElementById('exportJSON').onclick = () => Apollo.Reports.exportTestJSON(panelId);
    document.getElementById('deleteTest').addEventListener('click', async () => {
      if (await Apollo.Utils.confirm('Delete this lab test record permanently?')) {
        const results = await Apollo.Storage.getByIndex('test_results', 'panel_id', panelId);
        for (const r of results) await Apollo.Storage.delete('test_results', r.id);
        const prices = await Apollo.Storage.getByIndex('test_prices', 'panel_id', panelId);
        for (const pr of prices) await Apollo.Storage.delete('test_prices', pr.id);
        await Apollo.Storage.delete('test_panels', panelId);
        Apollo.Utils.toast('Record deleted', 'success');
        Apollo.Router.navigate(`/patients/${panel.patient_id}`);
      }
    });
  },

  async testEdit(panelId) {
    const panel = await Apollo.Storage.get('test_panels', panelId);
    if (!panel) { Apollo.UI.render('<div class="error-page"><h2>Test record not found.</h2></div>'); return; }
    const patient = await Apollo.Storage.get('patients', panel.patient_id);
    const tt = Apollo.getTestType(panel.test_type_code);
    const existingResults = await Apollo.Storage.getByIndex('test_results', 'panel_id', panelId);
    const priceInfo = await Apollo.Storage.getPanelPrice(panelId);
    
    if (priceInfo) { existingResults._price = priceInfo.price; existingResults._paid = priceInfo.amount_paid; }

    Apollo.UI.render(`
      ${Apollo.UI.pageHeader(`Edit Test — ${tt ? tt.name : panel.test_type_code}`)}
      <div class="card" style="margin-bottom:24px;"><div class="card-body">
        <div class="form-group" style="max-width:300px;"><label>Test Date</label><input type="date" id="fTestDate" value="${panel.test_date}"></div>
      </div></div>
      <form id="editTestForm">
        ${Apollo.Forms.generateTestFields(tt, existingResults)}
      </form>`);
    this._setupEGFR(tt, patient);
    document.getElementById('saveTestBtn')?.addEventListener('click', async () => {
      const dateVal = document.getElementById('fTestDate').value;
      const results = Apollo.Forms.collectTestResults(tt, patient?.gender);
      const price = parseFloat(document.getElementById('fTestPrice')?.value) || 0;
      const paid = parseFloat(document.getElementById('fTestPaid')?.value) || 0;
      
      try {
        await Apollo.Storage.put('test_panels', { ...panel, test_date: dateVal });
        if (priceInfo) await Apollo.Storage.put('test_prices', { ...priceInfo, price, amount_paid: paid });
        else await Apollo.Storage.add('test_prices', { panel_id: panelId, patient_id: panel.patient_id, price, amount_paid: paid });
        
        for (const r of existingResults) await Apollo.Storage.delete('test_results', r.id);
        if (tt.calcEGFR && patient) {
          const cr = results.find(r => r.parameter_name === 'Serum Creatinine');
          if (cr?.value_numeric) {
            const egfr = Apollo.Utils.calcEGFR(cr.value_numeric, patient.age, patient.gender);
            if (egfr != null) results.push({ parameter_name: 'eGFR', value_numeric: egfr, value_text: null, unit: 'mL/min/1.73m²', ref_range_low: 90, ref_range_high: null, flag: egfr < 90 ? 'L' : 'N' });
          }
        }
        for (const r of results) await Apollo.Storage.add('test_results', { panel_id: panelId, ...r });
        Apollo.Utils.toast('Record updated successfully', 'success');
        Apollo.Router.navigate(`/tests/${panelId}`);
      } catch (err) { Apollo.Utils.toast('Update failed: ' + err.message, 'error'); }
    });
  },

  async doctorsList() {
    const doctors = await Apollo.Storage.getAll('doctors');
    let html;
    if (doctors.length === 0) {
      html = Apollo.UI.emptyState('🩺', 'No doctors registered yet.', '<a href="#/doctors/new" class="btn btn-primary">Register New Doctor</a>');
    } else {
      const rows = doctors.map(d => [
        `<span style="font-weight:600; font-size:16px;">${Apollo.Utils.escapeHtml(d.doctor_name)}</span>`,
        `<div style="display:flex; gap:8px;">
          <a href="#/doctors/${d.id}/edit" class="btn btn-sm btn-outline">Edit</a>
          <button class="btn btn-sm btn-danger delete-doc" data-id="${d.id}">Delete</button>
        </div>`
      ]);
      html = Apollo.UI.table(['Doctor Name', 'Actions'], rows);
    }
    Apollo.UI.render(`${Apollo.UI.pageHeader('Medical Doctors', '<a href="#/doctors/new" class="btn btn-primary">+ Register Doctor</a>')}${html}`);
    document.querySelectorAll('.delete-doc').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (await Apollo.Utils.confirm('Remove this doctor from your system?')) {
          await Apollo.Storage.delete('doctors', parseInt(btn.dataset.id));
          Apollo.Utils.toast('Doctor removed', 'success');
          this.doctorsList();
        }
      });
    });
  },

  async doctorForm(id) {
    const doctor = id ? await Apollo.Storage.get('doctors', id) : null;
    Apollo.UI.render(`${Apollo.UI.pageHeader(doctor ? 'Update Doctor Details' : 'Register New Doctor')}${Apollo.Forms.doctorForm(doctor)}`);
    document.getElementById('doctorForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('fDocName').value.trim();
      if (!name) { Apollo.Utils.toast('Doctor name is required', 'error'); return; }
      try {
        if (doctor) { await Apollo.Storage.put('doctors', { ...doctor, doctor_name: name }); }
        else { await Apollo.Storage.add('doctors', { doctor_name: name }); }
        Apollo.Utils.toast('Doctor details saved', 'success');
        Apollo.Router.navigate('/doctors');
      } catch (err) { Apollo.Utils.toast('Error: ' + err.message, 'error'); }
    });
  },

  async reportsPage() {
    const patients = await Apollo.Storage.getAll('patients');
    const opts = patients.map(p => `<option value="${p.id}">${Apollo.Utils.escapeHtml((p.prefix||'')+' '+p.patient_name)}</option>`).join('');
    Apollo.UI.render(`
      ${Apollo.UI.pageHeader('System Reports')}
      <div class="card"><div class="card-header"><h3>Comprehensive Patient Summary</h3></div><div class="card-body">
        <div style="display:flex; gap:16px; align-items:flex-end; margin-bottom:24px;">
          <div class="form-group" style="flex:1;"><label>Search & Select Patient</label><select id="reportPatient" style="width:100%"><option value="">Choose a patient...</option>${opts}</select></div>
          <button class="btn btn-primary" id="genReport" style="height:44px;">Generate Full Report</button>
        </div>
        <div id="reportOutput"></div>
      </div></div>`);
    document.getElementById('genReport').onclick = async () => {
      const pid = parseInt(document.getElementById('reportPatient').value);
      if (!pid) { Apollo.Utils.toast('Please select a patient first.', 'error'); return; }
      document.getElementById('reportOutput').innerHTML = Apollo.UI.loader();
      const report = await Apollo.Reports.generatePatientSummary(pid);
      document.getElementById('reportOutput').innerHTML = `<div style="margin-top:20px; display:flex; justify-content:flex-end;"><button class="btn btn-primary" id="rpPrint"> Print Summary Report</button></div>${report}`;
      document.getElementById('rpPrint').onclick = () => Apollo.Reports.printReport();
    };
  },

  async settingsPage() {
    const stats = await Apollo.Storage.getStats();
    Apollo.UI.render(`
      ${Apollo.UI.pageHeader('System Settings')}
      <div class="settings-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
        ${Apollo.UI.card('System Database Statistics', `
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
            <div style="background:var(--bg-hover); padding:12px; border-radius:var(--radius-md);"><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700;">PATIENTS</span><span style="font-size:20px; font-weight:700;">${stats.patients}</span></div>
            <div style="background:var(--bg-hover); padding:12px; border-radius:var(--radius-md);"><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700;">DOCTORS</span><span style="font-size:20px; font-weight:700;">${stats.doctors}</span></div>
            <div style="background:var(--bg-hover); padding:12px; border-radius:var(--radius-md);"><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700;">PANELS</span><span style="font-size:20px; font-weight:700;">${stats.panels}</span></div>
            <div style="background:var(--bg-hover); padding:12px; border-radius:var(--radius-md);"><span style="display:block; font-size:11px; color:var(--text-muted); font-weight:700;">RESULTS</span><span style="font-size:20px; font-weight:700;">${stats.results}</span></div>
          </div>`)}
        ${Apollo.UI.card('Maintenance & Backups', `
          <p style="font-size:13px; color:var(--text-secondary); margin-bottom:20px;">Download your entire database as a JSON file for backup. Use the import function to restore data from a previous backup.</p>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <button class="btn btn-primary" id="exportBtn" style="width:100%; justify-content:center;">📦 Download Database Backup</button>
            <label class="btn" for="importFile" style="width:100%; justify-content:center; cursor:pointer;">📂 Upload & Restore Backup</label>
            <input type="file" id="importFile" accept=".json" style="display:none">
          </div>`)}
        ${Apollo.UI.card('Danger Zone', `
          <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">This will permanently wipe all patient records, doctor data, and test results from your local computer.</p>
          <button class="btn btn-danger" id="clearBtn" style="width:100%; justify-content:center;">🗑️ FACTORY RESET DATABASE</button>
        `)}
      </div>`);

    document.getElementById('exportBtn').onclick = async () => {
      const data = await Apollo.Storage.exportAll();
      Apollo.Utils.downloadJSON(data, `apollo_lims_backup_${new Date().toISOString().slice(0,10)}.json`);
      Apollo.Utils.toast('Backup file generated', 'success');
    };
    document.getElementById('importFile').onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (await Apollo.Utils.confirm('WARNING: This will replace your entire current database with the backup data. Do you want to proceed?')) {
        try {
          const text = await Apollo.Utils.readFile(file);
          const data = JSON.parse(text);
          await Apollo.Storage.importAll(data);
          Apollo.Utils.toast('Database restored successfully', 'success');
          setTimeout(() => location.reload(), 1000);
        } catch (err) { Apollo.Utils.toast('Restore failed: ' + err.message, 'error'); }
      }
    };
    document.getElementById('clearBtn').onclick = async () => {
      if (await Apollo.Utils.confirm('CRITICAL: ARE YOU SURE? ALL DATA WILL BE DELETED FOREVER!')) {
        const stores = ['test_results','test_panels','patients','doctors','test_prices'];
        for (const s of stores) await Apollo.Storage.clear(s);
        Apollo.Utils.toast('Database reset complete', 'success');
        setTimeout(() => location.reload(), 1000);
      }
    };
  }
};

document.addEventListener('DOMContentLoaded', () => Apollo.App.init());
