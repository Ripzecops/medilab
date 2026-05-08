window.Apollo = window.Apollo || {};

Apollo.UI = {
  el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      if (k === 'className') e.className = attrs[k];
      else if (k === 'innerHTML') e.innerHTML = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (k === 'dataset') Object.assign(e.dataset, attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    children.flat().forEach(c => {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  },

  main() { return document.getElementById('mainContent'); },

  render(html) { 
    const main = this.main();
    main.innerHTML = `<div class="page-fade-in">${html}</div>`; 
  },

  pageHeader(title, actions = '') {
    return `<div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding-bottom:12px; border-bottom:1px solid var(--border-light);">
      <h1 style="font-size:24px; font-weight:700; color:var(--text); letter-spacing:-0.5px;">${title}</h1>
      <div class="page-actions" style="display:flex; gap:12px;">${actions}</div>
    </div>`;
  },

  card(title, content, cls = '') {
    return `<div class="card ${cls}">
      ${title ? `<div class="card-header"><h3>${title}</h3></div>` : ''}
      <div class="card-body">${content}</div>
    </div>`;
  },

  statCard(icon, label, value, color) {
    const icons = { patients: '', doctors: '', tests: '', results: '' };
    return `<div class="stat-card" style="--accent:${color}">
      <div class="stat-icon" style="background:${color}20; color:${color}">${icons[icon] || ''}</div>
      <div class="stat-info">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
      </div>
    </div>`;
  },

  emptyState(icon, msg, action = '') {
    return `<div style="text-align:center; padding:48px 24px; background:var(--bg-card); border-radius:var(--radius-lg); border:2px dashed var(--border);">
      <div style="font-size:48px; margin-bottom:16px; filter: grayscale(1); opacity:0.5;">${icon}</div>
      <p style="margin-bottom:20px; color:var(--text-secondary); font-weight:500;">${msg}</p>
      ${action}
    </div>`;
  },

  table(headers, rows, id = '') {
    const hd = headers.map(h => `<th>${h}</th>`).join('');
    const bd = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<div style="overflow-x:auto; background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border);">
      <table id="${id}"><thead><tr>${hd}</tr></thead><tbody>${bd}</tbody></table>
    </div>`;
  },

  badge(text, type = 'default') {
    const styles = {
      success: 'background:#dcfce7; color:#166534;',
      danger: 'background:#fee2e2; color:#991b1b;',
      warning: 'background:#fef3c7; color:#92400e;',
      primary: 'background:var(--accent-light); color:var(--accent);',
      default: 'background:#f1f5f9; color:#475569;'
    };
    return `<span class="badge" style="${styles[type] || styles.default}">${text}</span>`;
  },

  loader() { 
    return `<div style="padding:40px; text-align:center; color:var(--text-muted);">
      <div class="spinner" style="margin-bottom:12px;">⌛</div>
      <div style="font-weight:500;">Processing Request...</div>
    </div>`; 
  },

  testBadge(code) {
    return `<span style="background:var(--accent); color:white; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700;">${code}</span>`;
  },

  financialCards(total, paid, unpaid) {
    return `
      <div class="finance-grid">
        <div class="finance-tile">
          <span class="finance-label">Total Revenue</span>
          <span class="finance-value">Rs. ${total.toLocaleString()}</span>
        </div>
        <div class="finance-tile paid">
          <span class="finance-label">Total Collections</span>
          <span class="finance-value">Rs. ${paid.toLocaleString()}</span>
        </div>
        <div class="finance-tile unpaid">
          <span class="finance-label">Total Outstanding</span>
          <span class="finance-value">Rs. ${unpaid.toLocaleString()}</span>
        </div>
      </div>
    `;
  },

  smsButton(phone, prefix, name) {
    return `<button class="btn btn-whatsapp" onclick="Apollo.Utils.sendSMS('${phone}', '${prefix}', '${name}')"> Send SMS</button>`;
  },

  advancedSearchPanel(onSearch) {
    const panel = document.createElement('div');
    panel.className = 'card';
    panel.style.border = '2px solid var(--accent)';
    panel.innerHTML = `
      <div class="card-header" style="background:var(--accent); color:white;"><h3>🔍 ADVANCED SEARCH FILTER</h3></div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-group"><label>Patient Name</label><input type="text" id="advSearchName" placeholder="Full name or part..."></div>
          <div class="form-group"><label>Phone Number</label><input type="text" id="advSearchPhone" placeholder="07xxxxxxxx"></div>
          <div class="form-group"><label>Registered After</label><input type="date" id="advSearchFrom"></div>
          <div class="form-group"><label>Registered Before</label><input type="date" id="advSearchTo"></div>
        </div>
        <div style="margin-top:20px; display:flex; gap:12px;">
          <button class="btn btn-primary" id="advSearchBtn">Apply Filters</button>
          <button class="btn" onclick="location.reload()">Reset</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      panel.querySelector('#advSearchBtn').onclick = () => {
        const criteria = {
          name: panel.querySelector('#advSearchName').value,
          phone: panel.querySelector('#advSearchPhone').value,
          dateFrom: panel.querySelector('#advSearchFrom').value,
          dateTo: panel.querySelector('#advSearchTo').value
        };
        onSearch(criteria);
      };
    }, 0);
    return panel;
  },

  paymentBadge(total, paid) {
    const unpaid = total - paid;
    if (unpaid <= 0) return this.badge('PAID', 'success');
    if (paid > 0) return this.badge('PARTIAL', 'warning');
    return this.badge('UNPAID', 'danger');
  }
};
