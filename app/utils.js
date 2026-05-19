window.Apollo = window.Apollo || {};

Apollo.Utils = {
  calcEGFR(creatinine, age, gender) {
    if (!creatinine || !age) return null;
    let egfr = 186.3 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
    if (gender === 'Female') egfr *= 0.742;
    return Math.round(egfr * 10) / 10;
  },

  calcFlag(value, refLow, refHigh, gender, param) {
    if (value == null || value === '') return null;
    const v = parseFloat(value);
    if (isNaN(v)) return null;
    let low = refLow, high = refHigh;
    if (param && param.genderRef && gender && param.genderRef[gender]) {
      if (param.genderRef[gender].refLow != null) low = param.genderRef[gender].refLow;
      if (param.genderRef[gender].refHigh != null) high = param.genderRef[gender].refHigh;
    }
    if (low != null && v < low) return 'L';
    if (high != null && v > high) return 'H';
    return 'N';
  },

  flagBadge(flag) {
    if (flag === 'H') return '<span class="flag flag-high">HIGH</span>';
    if (flag === 'L') return '<span class="flag flag-low">LOW</span>';
    if (flag === 'N') return '<span class="flag flag-normal">Normal</span>';
    return '';
  },

  formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateTime(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  todayISO() {
    return new Date().toISOString().split('T')[0];
  },

  escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  downloadTXT(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },

  toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
  },

  confirm(msg) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';
      overlay.innerHTML = `<div class="modal confirm-modal">
        <div class="modal-header"><h3>Confirm</h3></div>
        <div class="modal-body"><p>${msg}</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="confirmNo">Cancel</button>
          <button class="btn btn-danger" id="confirmYes">Confirm</button>
        </div></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#confirmYes').onclick = () => { overlay.remove(); resolve(true); };
      overlay.querySelector('#confirmNo').onclick = () => { overlay.remove(); resolve(false); };
    });
  },

  refRangeText(param, gender) {
    let low = param.refLow, high = param.refHigh;
    if (param.genderRef && gender && param.genderRef[gender]) {
      if (param.genderRef[gender].refLow != null) low = param.genderRef[gender].refLow;
      if (param.genderRef[gender].refHigh != null) high = param.genderRef[gender].refHigh;
    }
    if (low != null && high != null) return `${low} - ${high}`;
    if (high != null) return `< ${high}`;
    if (low != null) return `> ${low}`;
    return '';
  },

  async sendSMS(phone, prefix, name) {
    if (!phone) {
      this.toast('No phone number provided', 'error');
      return;
    }
    const message = `Dear ${prefix||''} ${name}, Hello perya aala nee nan ine sirikka matan`;
    const userId = "104230";
    const apiKey = "dm25u04bfhnyde8tu";
    const senderId = "Rifnas";
    
    // Using a proxy or direct fetch if CORS allows, usually these APIs need a backend or CORS proxy
    // For this local app, we'll try direct fetch first.
    const url = `https://send.ozonedesk.com/api/v2/send.php?user_id=${userId}&api_key=${apiKey}&sender_id=${encodeURIComponent(senderId)}&to=${phone}&message=${encodeURIComponent(message)}`;
    
    try {
      this.toast('Sending SMS...', 'info');
      const response = await fetch(url, { mode: 'no-cors' }); // 'no-cors' because these simple APIs often don't have CORS headers
      this.toast('SMS sent request triggered', 'success');
    } catch (err) {
      console.error('SMS Error:', err);
      this.toast('Failed to send SMS', 'error');
    }
  },

  setupGlobalShortcuts(router) {
    document.addEventListener('keydown', (e) => {
      // Alt + N for New Patient
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        router.navigate('/patients/new');
      }
      // Alt + S for Search
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearch') || document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
      }
      // Alt + D for Dashboard
      if (e.altKey && e.key === 'd') {
        e.preventDefault();
        router.navigate('/');
      }
      // Alt + P for Patients list
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        router.navigate('/patients');
      }
    });
  },

  setupEnterKeyNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
          if (target.id === 'globalSearch') return;

          e.preventDefault();
          const form = target.form || target.closest('.form') || target.closest('.card-body');
          if (!form) return;

          const elements = Array.from(form.querySelectorAll('input, select, textarea, button.btn-primary, button[type="submit"]')).filter(el => 
            !el.disabled && el.type !== 'hidden' && el.style.display !== 'none' && el.offsetParent !== null
          );
          
          const index = elements.indexOf(target);
          if (index > -1 && index < elements.length - 1) {
            const next = elements[index + 1];
            if (next.type === 'submit' || next.classList.contains('btn-primary')) {
               next.click();
            } else {
               next.focus();
               if (next.tagName === 'INPUT') next.select();
            }
          } else if (index === elements.length - 1) {
            const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
            if (submitBtn) submitBtn.click();
          }
        }
      }
    });
  }
};
