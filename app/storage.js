window.Apollo = window.Apollo || {};

Apollo.DB_NAME = 'apollo_labs_db';
Apollo.DB_VERSION = 2;

Apollo.Storage = {
  db: null,

  open() {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      const req = indexedDB.open(Apollo.DB_NAME, Apollo.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('patients')) {
          const ps = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
          ps.createIndex('patient_name', 'patient_name', { unique: false });
          ps.createIndex('referred_by', 'referred_by', { unique: false });
          ps.createIndex('phone_number', 'phone_number', { unique: false });
        }
        if (!db.objectStoreNames.contains('doctors')) {
          const ds = db.createObjectStore('doctors', { keyPath: 'id', autoIncrement: true });
          ds.createIndex('doctor_name', 'doctor_name', { unique: false });
        }
        if (!db.objectStoreNames.contains('test_types')) {
          const ts = db.createObjectStore('test_types', { keyPath: 'id', autoIncrement: true });
          ts.createIndex('code', 'code', { unique: true });
          ts.createIndex('category', 'category', { unique: false });
        }
        if (!db.objectStoreNames.contains('test_panels')) {
          const tp = db.createObjectStore('test_panels', { keyPath: 'id', autoIncrement: true });
          tp.createIndex('patient_id', 'patient_id', { unique: false });
          tp.createIndex('test_type_code', 'test_type_code', { unique: false });
          tp.createIndex('test_date', 'test_date', { unique: false });
        }
        if (!db.objectStoreNames.contains('test_results')) {
          const tr = db.createObjectStore('test_results', { keyPath: 'id', autoIncrement: true });
          tr.createIndex('panel_id', 'panel_id', { unique: false });
        }
        // v2: test_prices store for pricing & payment tracking
        if (!db.objectStoreNames.contains('test_prices')) {
          const pr = db.createObjectStore('test_prices', { keyPath: 'id', autoIncrement: true });
          pr.createIndex('panel_id', 'panel_id', { unique: false });
          pr.createIndex('patient_id', 'patient_id', { unique: false });
        }
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
      req.onerror = (e) => reject(e.target.error);
    });
  },

  _tx(store, mode) {
    const tx = this.db.transaction(store, mode);
    return tx.objectStore(store);
  },

  add(store, data) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readwrite');
      const req = s.add({ ...data, created_at: data.created_at || new Date().toISOString() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  put(store, data) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readwrite');
      const req = s.put({ ...data, updated_at: new Date().toISOString() });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  get(store, id) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readonly');
      const req = s.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  getAll(store) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readonly');
      const req = s.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  delete(store, id) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readwrite');
      const req = s.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  getByIndex(store, indexName, value) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readonly');
      const idx = s.index(indexName);
      const req = idx.getAll(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  count(store) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readonly');
      const req = s.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  clear(store) {
    return new Promise((resolve, reject) => {
      const s = this._tx(store, 'readwrite');
      const req = s.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async search(store, field, query) {
    const all = await this.getAll(store);
    const q = query.toLowerCase();
    return all.filter(item => item[field] && item[field].toString().toLowerCase().includes(q));
  },

  // Enhanced multi-field search: name, phone, date range
  async searchMulti(store, { name, phone, dateFrom, dateTo }) {
    const all = await this.getAll(store);
    let results = all;

    if (name && name.trim()) {
      const q = name.trim().toLowerCase();
      results = results.filter(item => item.patient_name && item.patient_name.toLowerCase().includes(q));
    }
    if (phone && phone.trim()) {
      const q = phone.trim().toLowerCase();
      results = results.filter(item => item.phone_number && item.phone_number.toLowerCase().includes(q));
    }
    if (dateFrom || dateTo) {
      // Filter by created_at date range
      results = results.filter(item => {
        const itemDate = item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : null;
        if (!itemDate) return true;
        if (dateFrom && itemDate < dateFrom) return false;
        if (dateTo && itemDate > dateTo) return false;
        return true;
      });
    }

    return results;
  },

  async seedTestTypes() {
    const existing = await this.count('test_types');
    if (existing > 0) return;
    for (const tt of Apollo.TEST_TYPES) {
      await this.add('test_types', { code: tt.code, name: tt.name, category: tt.category });
    }
  },

  async exportAll() {
    const data = {};
    const stores = ['patients','doctors','test_types','test_panels','test_results','test_prices'];
    for (const s of stores) {
      try { data[s] = await this.getAll(s); } catch(e) { data[s] = []; }
    }
    data.exported_at = new Date().toISOString();
    data.version = Apollo.DB_VERSION;
    return data;
  },

  async importAll(data) {
    const stores = ['test_results','test_panels','test_types','doctors','patients','test_prices'];
    for (const s of stores) { try { await this.clear(s); } catch(e) {} }
    const importOrder = ['patients','doctors','test_types','test_panels','test_results','test_prices'];
    for (const s of importOrder) {
      if (data[s]) {
        for (const item of data[s]) {
          try {
            const st = this._tx(s, 'readwrite');
            st.put(item);
          } catch(e) {}
        }
      }
    }
  },

  async getStats() {
    const [patients, doctors, panels, results] = await Promise.all([
      this.count('patients'), this.count('doctors'),
      this.count('test_panels'), this.count('test_results')
    ]);
    const recentPanels = await this.getAll('test_panels');
    recentPanels.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    // Financial stats
    let totalRevenue = 0, totalPaid = 0, totalUnpaid = 0;
    try {
      const allPrices = await this.getAll('test_prices');
      allPrices.forEach(p => {
        const price = parseFloat(p.price) || 0;
        const paid = parseFloat(p.amount_paid) || 0;
        totalRevenue += price;
        totalPaid += paid;
        totalUnpaid += (price - paid);
      });
    } catch(e) {}

    return {
      patients, doctors, panels, results,
      recentPanels: recentPanels.slice(0, 10),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalUnpaid: Math.round(totalUnpaid * 100) / 100
    };
  },

  // Get financial data for a patient
  async getPatientFinancials(patientId) {
    try {
      const prices = await this.getByIndex('test_prices', 'patient_id', patientId);
      let total = 0, paid = 0;
      prices.forEach(p => {
        total += parseFloat(p.price) || 0;
        paid += parseFloat(p.amount_paid) || 0;
      });
      return {
        total: Math.round(total * 100) / 100,
        paid: Math.round(paid * 100) / 100,
        unpaid: Math.round((total - paid) * 100) / 100,
        records: prices
      };
    } catch(e) {
      return { total: 0, paid: 0, unpaid: 0, records: [] };
    }
  },

  // Get price info for a specific test panel
  async getPanelPrice(panelId) {
    try {
      const prices = await this.getByIndex('test_prices', 'panel_id', panelId);
      return prices.length > 0 ? prices[0] : null;
    } catch(e) {
      return null;
    }
  }
};
