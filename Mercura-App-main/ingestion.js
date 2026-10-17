/**
 * Mercura AI — Centralized Reactive State & Data Ingestion Engine
 * Handles:
 * 1. Centralized Reactive State (Catalog, KPIs, Alerts, Persistence via localStorage)
 * 2. 3-Tab Data Ingestion Hub Modal (Bulk CSV, Invoice OCR & Thumbnail, Adaptive Manual Entry & Quick Sale)
 * 3. Drag-and-Drop Table Ingestion & Voice Recognition Quick-Sale
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'mercura_store_v2';

  // Fallback category thumbnail mapping
  const CATEGORY_IMAGES = {
    'Essentials': 'img/ts.jpg',
    'Apparel': 'img/jeans.jpg',
    'Outerwear': 'img/jacket.jpg',
    'Footwear': 'img/shoes.jpg',
    'Accessories': 'img/scarf.jpg',
    'Activewear': 'img/pants.jpg',
    'Ethnic Wear': 'img/kurti.jpg',
    'Resort': 'img/wrap.jpg'
  };

  // Default Pristine Demo Data
  const INITIAL_DEMO_DATA = {
    baseInventoryValue: 485000,
    baseMonthlySales: 185400,
    baseProfit: 56200,
    baseDeadCapital: 38000,
    activeSkusCount: 412,
    customProducts: [],
    salesHistory: [],
    alerts: [
      { id: 'SH-102', sku: 'SH-102', name: 'Sports Running Shoes — AirSprint', cat: 'Footwear', vendor: 'Apex Footwear Ltd.', stock: 8, lead: 7, vel: 5.0, days: 1.6, loss: 18400, img: 'img/shoes.jpg', severity: 'critical', note: 'Demand surge detected. Imminent 5-day stockout gap without vendor communication.' },
      { id: 'TP-505', sku: 'TP-505', name: 'Athleisure Track Pants', cat: 'Activewear', vendor: 'Vanguard Garments', stock: 6, lead: 4, vel: 2.0, days: 3.0, loss: 6200, img: 'img/pants.jpg', severity: 'low', note: 'Consistent weekend velocity. Reorder cycle due in 48 hours.' },
      { id: 'KT-204', sku: 'KT-204', name: 'Silk Blend Festive Kurti', cat: 'Ethnic Wear', vendor: 'Banaras House', stock: 5, lead: 6, vel: 3.2, days: 1.5, loss: 9800, img: 'img/kurti.jpg', severity: 'critical', note: 'Festive season spike. Stock buffer depleted.' },
      { id: 'BW-014', sku: 'BW-014', name: 'Beach Wrap', cat: 'Resort', vendor: 'Coastal Steps', stock: 9, lead: 6, vel: 2.2, days: 4.1, loss: 4200, img: 'img/wrap.jpg', severity: 'low', note: 'Pre-holiday cadence check recommended.' },
      { id: 'CP-330', sku: 'CP-330', name: 'Cotton Polo', cat: 'Essentials', vendor: 'Sri Krishna Mills', stock: 10, lead: 5, vel: 2.6, days: 3.8, loss: 4000, img: 'img/polo.jpg', severity: 'low', note: 'Replenishment needed by Thursday.' }
    ]
  };

  class MercuraStore {
    constructor() {
      this.listeners = [];
      this.state = this.loadState();
      this.initListeners();
    }

    loadState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...INITIAL_DEMO_DATA,
            ...parsed,
            customProducts: parsed.customProducts || [],
            salesHistory: parsed.salesHistory || [],
            alerts: parsed.alerts || INITIAL_DEMO_DATA.alerts
          };
        }
      } catch (e) {
        console.warn('Could not read from localStorage, using demo defaults', e);
      }
      return JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn('Could not write to localStorage', e);
      }
      this.notify();
    }

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
      };
    }

    notify() {
      this.listeners.forEach(fn => {
        try { fn(this.state); } catch (e) { console.error(e); }
      });
      this.updateDOM();
    }

    initListeners() {
      // Whenever store initializes, update DOM elements
      setTimeout(() => this.updateDOM(), 50);
    }

    // Helper: Compute SKU Financials & AI Status
    evaluateProduct(p) {
      const stock = Math.max(0, parseInt(p.stock) || 0);
      const cost = Math.max(0, parseFloat(p.cost_price || p.cost) || 0);
      const price = Math.max(0, parseFloat(p.selling_price || p.price) || 0);
      const age = Math.max(0, parseInt(p.inventory_age_days || p.age) || 0);
      const lead = Math.max(1, parseInt(p.supplier_lead_days || p.lead) || 5);
      const monthlySales = Math.max(0, parseFloat(p.monthly_sales) || 0);
      
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
      const invValue = stock * cost;
      const dailyVel = monthlySales > 0 ? (monthlySales / 30) : (parseFloat(p.daily_velocity) || 1.2);
      const daysOfCover = stock / Math.max(dailyVel, 0.05);

      let riskStatus = 'healthy';
      let riskLabel = '✓ HEALTHY';
      let riskBadgeClass = 'bg-[#0EA5A0]/15 text-[#0EA5A0] border-[#0EA5A0]/30';

      if (age > 45 && monthlySales <= 3) {
        riskStatus = 'dead';
        riskLabel = '❗ DEAD STOCK';
        riskBadgeClass = 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30';
      } else if (daysOfCover < lead) {
        riskStatus = 'low';
        riskLabel = '⚠️ LOW STOCK';
        riskBadgeClass = 'bg-[#F59E0B]/15 text-[#D97706] border-[#F59E0B]/30';
      }

      return {
        sku: p.sku || p.id || ('SKU-' + Math.floor(100 + Math.random() * 900)),
        name: p.name || 'Untitled Product',
        cat: p.category || p.cat || 'Apparel',
        vendor: p.supplier || p.vendor || 'Local Vendor',
        stock: stock,
        cost: cost,
        price: price,
        margin: Math.round(margin * 10) / 10,
        value: invValue,
        age: age,
        lead: lead,
        monthlySales: monthlySales,
        dailyVel: Math.round(dailyVel * 10) / 10,
        daysOfCover: Math.round(daysOfCover * 10) / 10,
        status: riskStatus,
        statusLabel: riskLabel,
        badgeClass: riskBadgeClass,
        img: p.image_url || p.img || CATEGORY_IMAGES[p.category || p.cat] || 'img/ts.jpg',
        isNew: true,
        createdAt: p.createdAt || Date.now()
      };
    }

    // Add Products (Single or Array)
    addProducts(productsList) {
      const list = Array.isArray(productsList) ? productsList : [productsList];
      const evaluated = list.map(p => this.evaluateProduct(p));

      // Check if any product triggers a new Low Stock alert
      evaluated.forEach(item => {
        if (item.status === 'low') {
          const existingAlert = this.state.alerts.find(a => a.sku === item.sku);
          if (!existingAlert) {
            this.state.alerts.unshift({
              id: item.sku,
              sku: item.sku,
              name: item.name,
              cat: item.cat,
              vendor: item.vendor,
              stock: item.stock,
              lead: item.lead,
              vel: item.dailyVel,
              days: item.daysOfCover,
              loss: Math.round(item.stock * item.price),
              img: item.img,
              severity: item.daysOfCover < 2 ? 'critical' : 'low',
              note: `Lead time is ${item.lead}d, cover is ~${item.daysOfCover}d. Imminent stockout risk.`
            });
          }
        }
      });

      // Prepend to customProducts list
      this.state.customProducts = [...evaluated, ...this.state.customProducts];
      this.saveState();

      return evaluated;
    }

    // Record a Quick Sale (Deduct Stock & Add Revenue)
    recordSale(sku, qtySold) {
      qtySold = Math.max(1, parseInt(qtySold) || 1);
      
      // Look in customProducts first
      let targetProduct = this.state.customProducts.find(p => p.sku === sku);
      
      // If not in customProducts, look in existing default catalog
      if (!targetProduct && window.Mercura && window.Mercura.RAW) {
        const raw = window.Mercura.RAW.find(r => r.id === sku);
        if (raw) {
          targetProduct = this.evaluateProduct(raw);
          // Add to customProducts to track modified stock
          this.state.customProducts.push(targetProduct);
        }
      }

      if (!targetProduct) {
        throw new Error(`SKU "${sku}" not found in catalog.`);
      }

      // Deduct stock safely
      targetProduct.stock = Math.max(0, targetProduct.stock - qtySold);
      const revenue = Math.round(qtySold * targetProduct.price);
      const cost = Math.round(qtySold * targetProduct.cost);
      const profit = Math.round(revenue - cost);

      // Re-evaluate risk status with updated stock
      const reEvaluated = this.evaluateProduct(targetProduct);
      Object.assign(targetProduct, reEvaluated);

      // Log sale
      this.state.salesHistory.unshift({
        id: 'SALE-' + Date.now(),
        sku: targetProduct.sku,
        name: targetProduct.name,
        qty: qtySold,
        revenue: revenue,
        profit: profit,
        timestamp: Date.now()
      });

      this.saveState();

      return {
        product: targetProduct,
        qtySold,
        revenue,
        profit,
        remainingStock: targetProduct.stock
      };
    }

    // Update Product Thumbnail
    updateProductImage(sku, imageUrl) {
      const target = this.state.customProducts.find(p => p.sku === sku);
      if (target) {
        target.img = imageUrl;
      } else {
        // Create an override entry
        if (window.Mercura && window.Mercura.RAW) {
          const raw = window.Mercura.RAW.find(r => r.id === sku);
          if (raw) {
            const p = this.evaluateProduct(raw);
            p.img = imageUrl;
            this.state.customProducts.push(p);
          }
        }
      }
      this.saveState();
    }

    // Calculate aggregated KPIs across all active items
    getMetrics() {
      let customValue = 0;
      let customDead = 0;
      let salesBoost = 0;
      let profitBoost = 0;

      this.state.customProducts.forEach(p => {
        customValue += (p.stock * p.cost);
        if (p.status === 'dead') {
          customDead += (p.stock * p.cost);
        }
      });

      this.state.salesHistory.forEach(s => {
        salesBoost += s.revenue;
        profitBoost += s.profit;
      });

      const totalInventoryValue = this.state.baseInventoryValue + Math.round(customValue);
      const totalSales = this.state.baseMonthlySales + salesBoost;
      const totalProfit = this.state.baseProfit + profitBoost;
      const totalDeadCapital = this.state.baseDeadCapital + Math.round(customDead);
      const totalSkus = this.state.activeSkusCount + this.state.customProducts.length;

      return {
        totalInventoryValue,
        totalSales,
        totalProfit,
        totalDeadCapital,
        totalSkus,
        activeAlertsCount: this.state.alerts.length
      };
    }

    // Reset to pristine demo data
    resetToDemo() {
      localStorage.removeItem(STORAGE_KEY);
      this.state = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
      this.saveState();
      
      // Re-render table rows to default state
      this.renderTableRows();
      if (window.fireConfetti) window.fireConfetti();
      if (window.HapticAudio) window.HapticAudio.chime();
      if (window.showToast) window.showToast('✓ Reset to Sharma Apparels demo data', 'restart_alt');
    }

    // Update DOM UI elements dynamically across views
    updateDOM() {
      const m = this.getMetrics();
      const inr = n => window.Mercura ? window.Mercura.inr(n) : ('₹' + n.toLocaleString('en-IN'));

      // Dashboard KPIs
      const dInv = document.getElementById('d-kpi-inv');
      const dSales = document.getElementById('d-kpi-sales');
      const dProfit = document.getElementById('d-kpi-profit');
      const dRisk = document.getElementById('d-kpi-risk');
      if (dInv) dInv.textContent = inr(m.totalInventoryValue);
      if (dSales) dSales.textContent = inr(m.totalSales);
      if (dProfit) dProfit.textContent = inr(m.totalProfit);
      if (dRisk) dRisk.textContent = inr(m.totalDeadCapital);

      // Inventory Frame KPIs
      const invSkusEl = document.querySelector('#frame-inventory .glass-card:nth-child(1) .font-mono.text-2xl');
      const invValEl = document.querySelector('#frame-inventory .glass-card:nth-child(2) .font-mono.text-2xl');
      const invDeadEl = document.querySelector('#frame-inventory .glass-card:nth-child(3) .font-mono.text-2xl');
      if (invSkusEl) invSkusEl.innerHTML = `${m.totalSkus} <span class="text-xs text-[#94A3B8] font-normal">Active Now</span>`;
      if (invValEl) invValEl.innerHTML = `${inr(m.totalInventoryValue)} <span class="text-xs text-[#0EA5A0] font-normal">+3.8% MoM</span>`;
      if (invDeadEl) invDeadEl.innerHTML = `${inr(m.totalDeadCapital)} <span class="text-xs text-[#94A3B8] font-normal">${m.totalDeadCapital > 38000 ? '2+ SKUs Flagged' : '1 SKU Flagged'}</span>`;

      // Sales Frame KPIs
      const salesValEl = document.querySelector('#frame-sales .glass-card:nth-child(1) .font-mono.text-3xl');
      const salesProfEl = document.querySelector('#frame-sales .glass-card:nth-child(2) .font-mono.text-3xl');
      if (salesValEl) salesValEl.textContent = inr(m.totalSales);
      if (salesProfEl) salesProfEl.textContent = inr(m.totalProfit);

      // Cash Flow KPIs
      const cashRiskVal = document.getElementById('cash-risk-val');
      const cashChartRisk = document.getElementById('cash-chart-risk');
      if (cashRiskVal) cashRiskVal.textContent = inr(m.totalDeadCapital + 34000); // 72k baseline
      if (cashChartRisk) cashChartRisk.textContent = `${inr(m.totalDeadCapital + 34000)} at risk`;

      // Alert badge in Left Sidebar
      const sidebarBadge = document.querySelector('[data-frame="alerts"] .sidebar-badge');
      if (sidebarBadge) sidebarBadge.textContent = m.activeAlertsCount;

      // Update table rows
      this.renderTableRows();
    }

    // Render newly ingested products at the top of #inv-table-rows
    renderTableRows() {
      const container = document.getElementById('inv-table-rows');
      if (!container) return;

      // Remove previously injected custom rows
      container.querySelectorAll('.custom-ingested-row').forEach(el => el.remove());

      if (!this.state.customProducts || this.state.customProducts.length === 0) return;

      const inr = n => window.Mercura ? window.Mercura.inr(n) : ('₹' + n.toLocaleString('en-IN'));

      // Prepend custom products in reverse order (newest first)
      [...this.state.customProducts].forEach(p => {
        const row = document.createElement('div');
        row.className = `custom-ingested-row grid grid-cols-12 px-5 py-3.5 items-center text-xs hover:bg-[#E6F7F5]/30 transition-all border-l-4 ${p.status === 'dead' ? 'border-l-[#EF4444] bg-[#EF4444]/[0.02]' : p.status === 'low' ? 'border-l-[#F59E0B] bg-[#F59E0B]/[0.02]' : 'border-l-[#0EA5A0] bg-[#0EA5A0]/[0.02]'}`;
        row.setAttribute('data-kind', p.status);

        row.innerHTML = `
          <div class="col-span-5 md:col-span-4 flex items-center gap-3">
            <img src="${p.img}" alt="${p.name}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0">
            <div class="overflow-hidden">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-sm text-[#1F2937] block truncate">${p.name}</span>
                <span class="px-1.5 py-0.2 rounded bg-[#0EA5A0] text-white font-mono text-[9px] font-bold shadow-xs">NEW</span>
              </div>
              <span class="text-[11px] text-[#94A3B8] block truncate font-mono">SKU: ${p.sku} • ${p.cat}</span>
              <span class="text-[10px] text-[#0EA5A0] font-mono block truncate">${p.vendor} · ${p.stock} in stock (${inr(p.value)})</span>
            </div>
          </div>
          <div class="col-span-2 md:col-span-1 text-right">
            <span class="font-mono font-bold text-sm text-[#1F2937] block">${p.stock} units</span>
            <div class="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full rounded-full ${p.status === 'dead' ? 'bg-[#EF4444]' : p.status === 'low' ? 'bg-[#F59E0B]' : 'bg-[#0EA5A0]'}" style="width: ${Math.min(100, Math.max(15, p.stock * 2))}%;"></div>
            </div>
          </div>
          <div class="hidden md:block md:col-span-2 text-right font-mono text-[#4B5563]">
            ${p.monthlySales || Math.round(p.dailyVel * 30)} <span class="text-[#0EA5A0] font-bold">(${p.dailyVel}/day)</span>
          </div>
          <div class="col-span-2 md:col-span-1 text-right font-mono font-bold text-sm text-[#1F2937]">${p.margin}%</div>
          <div class="hidden md:block md:col-span-2 text-right font-mono text-[#4B5563]">🕒 ${p.age} days</div>
          <div class="col-span-3 md:col-span-1 text-center">
            <span class="px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border ${p.badgeClass}">${p.statusLabel}</span>
          </div>
          <div class="hidden md:flex md:col-span-1 items-center justify-end gap-1">
            <button onclick="openQuickSaleForSku('${p.sku}');" class="btn-gold px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer shadow-xs">Sale</button>
            <button onclick="showToast('Viewing ${p.name}');" class="text-xs font-bold text-[#0EA5A0] hover:underline p-1">View</button>
          </div>
        `;

        container.prepend(row);
      });
    }
  }

  // Instantiate Single Global Store
  window.MercuraStore = new MercuraStore();

  /* =========================================================================
     MODAL CONTROLLER: 3-TAB "MERCURA DATA INGESTION HUB"
     ========================================================================= */

  window.openIngestionModal = function (initialTab = 'csv') {
    const modal = document.getElementById('mercura-ingestion-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    switchIngestionTab(initialTab);
    if (window.HapticAudio) window.HapticAudio.click(1200);
  };

  window.closeIngestionModal = function () {
    const modal = document.getElementById('mercura-ingestion-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.switchIngestionTab = function (tabName) {
    // Tab buttons
    document.querySelectorAll('.ingest-tab-btn').forEach(btn => {
      const target = btn.getAttribute('data-tab');
      if (target === tabName) {
        btn.className = 'ingest-tab-btn px-4 py-2.5 text-xs font-bold rounded-xl bg-[#0EA5A0] text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer';
      } else {
        btn.className = 'ingest-tab-btn px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.12] transition-all flex items-center gap-2 cursor-pointer';
      }
    });

    // Tab view panels
    document.querySelectorAll('.ingest-tab-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    const activePanel = document.getElementById(`ingest-panel-${tabName}`);
    if (activePanel) activePanel.classList.remove('hidden');
  };

  /* =========================================================================
     TAB 1: BULK CSV / POS IMPORT LOGIC
     ========================================================================= */

  let parsedCsvCache = [];

  window.downloadSampleCsv = function () {
    const headers = 'sku,name,category,stock,cost_price,selling_price,monthly_sales,inventory_age_days,supplier_lead_days,image_url\n';
    const sampleRows = [
      'KUR-501,Festive Anarkali Kurti,Ethnic Wear,38,550,1499,14,8,5,img/kurti.jpg',
      'SH-205,Ultra Lightweight Trail Runners,Footwear,6,890,2299,22,14,7,img/shoes.jpg',
      'BLZ-102,Italian Wool Slim Blazer,Outerwear,24,1800,4299,2,62,10,img/linen.jpg',
      'ACC-304,Handcrafted Leather Belt,Accessories,45,280,699,15,20,4,img/scarf.jpg',
      'WRP-099,Silk Printed Summer Scarf,Accessories,15,220,599,1,55,6,img/wrap.jpg'
    ].join('\n');

    const blob = new Blob([headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mercura_sample_inventory.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.HapticAudio) window.HapticAudio.chime();
    if (window.showToast) window.showToast('📥 Downloaded sample Mercura CSV', 'download');
  };

  window.downloadSampleExcel = function () {
    if (window.XLSX) {
      const data = [
        { sku: 'KUR-501', name: 'Festive Anarkali Kurti', category: 'Ethnic Wear', stock: 38, cost_price: 550, selling_price: 1499, monthly_sales: 14, inventory_age_days: 8, supplier_lead_days: 5, image_url: 'img/kurti.jpg' },
        { sku: 'SH-205', name: 'Ultra Lightweight Trail Runners', category: 'Footwear', stock: 6, cost_price: 890, selling_price: 2299, monthly_sales: 22, inventory_age_days: 14, supplier_lead_days: 7, image_url: 'img/shoes.jpg' },
        { sku: 'BLZ-102', name: 'Italian Wool Slim Blazer', category: 'Outerwear', stock: 24, cost_price: 1800, selling_price: 4299, monthly_sales: 2, inventory_age_days: 62, supplier_lead_days: 10, image_url: 'img/linen.jpg' },
        { sku: 'ACC-304', name: 'Handcrafted Leather Belt', category: 'Accessories', stock: 45, cost_price: 280, selling_price: 699, monthly_sales: 15, inventory_age_days: 20, supplier_lead_days: 4, image_url: 'img/scarf.jpg' },
        { sku: 'WRP-099', name: 'Silk Printed Summer Scarf', category: 'Accessories', stock: 15, cost_price: 220, selling_price: 599, monthly_sales: 1, inventory_age_days: 55, supplier_lead_days: 6, image_url: 'img/wrap.jpg' }
      ];
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory_Catalog");
      XLSX.writeFile(wb, "mercura_sample_inventory.xlsx");
      if (window.HapticAudio) window.HapticAudio.chime();
      if (window.showToast) window.showToast('📥 Downloaded sample Mercura Excel (.xlsx) workbook', 'download');
    } else {
      window.downloadSampleCsv();
    }
  };

  window.handleSpreadsheetFileSelect = function (file) {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();

    // Route image / PDF documents to OCR tab
    if (type.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.svg') || name.endsWith('.bmp') || name.endsWith('.pdf')) {
      switchIngestionTab('ocr');
      if (window.handleCustomInvoiceUpload) {
        window.handleCustomInvoiceUpload(file);
      } else {
        loadSampleInvoice('apex');
      }
      return;
    }

    // Direct JSON check
    if (name.endsWith('.json') || type === 'application/json') {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const json = JSON.parse(e.target.result);
          parseJsonData(json, file.name);
        } catch (err) {
          console.error('JSON parse error:', err);
          if (window.showToast) window.showToast('Invalid JSON file format.', 'error');
        }
      };
      reader.readAsText(file);
      return;
    }

    // SheetJS Workbook parser (handles XLSX, XLS, XLSM, XLSB, ODS, FODS, CSV, TSV, XML, HTML, etc.)
    if (window.XLSX) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          if (workbook && workbook.SheetNames && workbook.SheetNames.length > 0) {
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvText = XLSX.utils.sheet_to_csv(worksheet);
            if (csvText && csvText.trim().length > 0) {
              parseCsvText(csvText, file.name);
              if (window.HapticAudio) window.HapticAudio.chime();
              if (window.showToast) window.showToast(`📊 Parsed Spreadsheet Sheet "${firstSheetName}" (${file.name})`, 'table_view');
              return;
            }
          }
          // If no sheets or empty, try text fallback
          fallbackTextRead(file);
        } catch (err) {
          console.warn('SheetJS binary parse notice, falling back to text stream:', err);
          fallbackTextRead(file);
        }
      };
      reader.onerror = function () {
        fallbackTextRead(file);
      };
      reader.readAsArrayBuffer(file);
    } else {
      fallbackTextRead(file);
    }
  };

  function fallbackTextRead(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      if (!text || !text.trim()) {
        if (window.showToast) window.showToast('The uploaded file appears to be empty.', 'error');
        return;
      }
      const trimmed = text.trim();
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          const parsed = JSON.parse(trimmed);
          parseJsonData(parsed, file.name);
          return;
        } catch (ignore) {}
      }
      parseCsvText(text, file.name);
    };
    reader.readAsText(file);
  }

  // Backwards compatibility alias
  window.handleCsvFileSelect = window.handleSpreadsheetFileSelect;

  function parseJsonData(jsonObj, fileName = 'upload.json') {
    const list = Array.isArray(jsonObj)
      ? jsonObj
      : (jsonObj.products || jsonObj.items || jsonObj.data || jsonObj.inventory || jsonObj.catalog || []);
    if (!list || !Array.isArray(list) || list.length === 0) {
      if (window.showToast) window.showToast('JSON does not contain a list of products', 'error');
      return;
    }
    const parsedRows = list.map((item, idx) => {
      const pCat = item.category || item.cat || item.department || 'Apparel';
      const pCost = parseFloat(item.cost_price || item.cost || item.unit_cost || item.buy_price) || 350;
      const pPrice = parseFloat(item.selling_price || item.price || item.mrp || item.retail_price) || Math.round(pCost * 1.6);
      return {
        sku: item.sku || item.code || item.id || `SKU-${1000 + idx}`,
        name: item.name || item.title || item.product || `Item #${idx + 1}`,
        category: pCat,
        stock: parseInt(item.stock || item.qty || item.quantity || item.units) || 10,
        cost_price: pCost,
        selling_price: pPrice,
        monthly_sales: parseFloat(item.monthly_sales || item.sales || item.velocity) || 5,
        inventory_age_days: parseInt(item.inventory_age_days || item.age || item.days_in_stock) || 14,
        supplier_lead_days: parseInt(item.supplier_lead_days || item.lead || item.lead_time) || 5,
        image_url: item.image_url || item.image || item.photo || (CATEGORY_IMAGES[pCat] || 'img/ts.jpg')
      };
    });
    parsedCsvCache = parsedRows;
    renderCsvPreviewTable(parsedRows, fileName);
    if (window.HapticAudio) window.HapticAudio.chime();
    if (window.showToast) window.showToast(`✓ Parsed ${parsedRows.length} items from ${fileName}`, 'table_view');
  }

  function detectDelimiter(firstLine) {
    const counts = {
      ',': (firstLine.match(/,/g) || []).length,
      ';': (firstLine.match(/;/g) || []).length,
      '\t': (firstLine.match(/\t/g) || []).length,
      '|': (firstLine.match(/\|/g) || []).length
    };
    let best = ',';
    let max = 0;
    for (const [k, v] of Object.entries(counts)) {
      if (v > max) {
        max = v;
        best = k;
      }
    }
    return best;
  }

  function splitDelimited(line, delim) {
    if (delim === ',') {
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    if (delim === ';') {
      return line.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    if (delim === '\t') {
      return line.split('\t').map(v => v.trim().replace(/^["']|["']$/g, ''));
    }
    return line.split(delim).map(v => v.trim().replace(/^["']|["']$/g, ''));
  }

  function parseCsvText(csvText, fileName = 'upload.csv') {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      if (window.showToast) window.showToast('Spreadsheet must contain a header and at least 1 data row', 'error');
      return;
    }

    const delim = detectDelimiter(lines[0]);
    const rawHeaders = splitDelimited(lines[0], delim).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    
    // Header synonym resolver
    function findIndex(synonyms) {
      return rawHeaders.findIndex(h => synonyms.includes(h));
    }

    const idxSku = findIndex(['sku', 'code', 'id', 'item_code', 'barcode']);
    const idxName = findIndex(['name', 'product', 'title', 'item_name', 'product_name']);
    const idxCat = findIndex(['category', 'cat', 'department', 'type']);
    const idxStock = findIndex(['stock', 'qty', 'units', 'quantity', 'on_hand', 'inventory']);
    const idxCost = findIndex(['cost_price', 'cost', 'unit_cost', 'purchase_cost', 'buy_price']);
    const idxPrice = findIndex(['selling_price', 'price', 'mrp', 'retail_price', 'sale_price']);
    const idxMonthly = findIndex(['monthly_sales', 'sales', 'velocity', 'units_sold_month']);
    const idxAge = findIndex(['inventory_age_days', 'age', 'days_in_stock', 'age_days']);
    const idxLead = findIndex(['supplier_lead_days', 'lead', 'lead_time', 'lead_days']);
    const idxImg = findIndex(['image_url', 'image', 'photo', 'img']);

    const parsedRows = [];

    for (let i = 1; i < lines.length; i++) {
      const row = splitDelimited(lines[i], delim);
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

      const pName = (idxName !== -1 && row[idxName]) ? row[idxName] : `Item #${i}`;
      const pSku = (idxSku !== -1 && row[idxSku]) ? row[idxSku] : `SKU-${1000 + i}`;
      const pCat = (idxCat !== -1 && row[idxCat]) ? row[idxCat] : 'Apparel';
      const pStock = (idxStock !== -1 && parseInt(row[idxStock])) || 10;
      const pCost = (idxCost !== -1 && parseFloat(row[idxCost])) || 350;
      const pPrice = (idxPrice !== -1 && parseFloat(row[idxPrice])) || Math.round(pCost * 1.6);
      const pMonthly = (idxMonthly !== -1 && parseFloat(row[idxMonthly])) || 5;
      const pAge = (idxAge !== -1 && parseInt(row[idxAge])) || 14;
      const pLead = (idxLead !== -1 && parseInt(row[idxLead])) || 5;
      const pImg = (idxImg !== -1 && row[idxImg]) ? row[idxImg] : (CATEGORY_IMAGES[pCat] || 'img/ts.jpg');

      parsedRows.push({
        sku: pSku,
        name: pName,
        category: pCat,
        stock: pStock,
        cost_price: pCost,
        selling_price: pPrice,
        monthly_sales: pMonthly,
        inventory_age_days: pAge,
        supplier_lead_days: pLead,
        image_url: pImg
      });
    }

    parsedCsvCache = parsedRows;
    renderCsvPreviewTable(parsedRows, fileName);
  }

  function renderCsvPreviewTable(rows, fileName) {
    const previewContainer = document.getElementById('csv-preview-container');
    const tableBody = document.getElementById('csv-preview-tbody');
    const summaryText = document.getElementById('csv-summary-text');
    const importBtn = document.getElementById('csv-import-commit-btn');

    if (!previewContainer || !tableBody) return;

    tableBody.innerHTML = '';
    const inr = n => window.Mercura ? window.Mercura.inr(n) : ('₹' + n.toLocaleString('en-IN'));

    rows.forEach((r, idx) => {
      const evaluated = window.MercuraStore.evaluateProduct(r);
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs font-mono';
      tr.innerHTML = `
        <td class="py-2.5 px-3 flex items-center gap-2">
          <img src="${evaluated.img}" class="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0">
          <div>
            <b class="text-[#1F2937] font-sans block truncate max-w-[140px]">${evaluated.name}</b>
            <span class="text-[#94A3B8] text-[10px]">${evaluated.sku}</span>
          </div>
        </td>
        <td class="py-2.5 px-3 text-[#1F2937] font-sans">${evaluated.cat}</td>
        <td class="py-2.5 px-3 text-right font-bold text-[#1F2937]">${evaluated.stock}</td>
        <td class="py-2.5 px-3 text-right text-[#4B5563]">${inr(evaluated.cost)}</td>
        <td class="py-2.5 px-3 text-right font-bold text-[#0EA5A0]">${inr(evaluated.price)}</td>
        <td class="py-2.5 px-3 text-right font-bold ${evaluated.margin < 20 ? 'text-[#EF4444]' : 'text-[#1F2937]'}">${evaluated.margin}%</td>
        <td class="py-2.5 px-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${evaluated.badgeClass}">${evaluated.statusLabel}</span>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    if (summaryText) {
      summaryText.textContent = `✓ Successfully parsed ${rows.length} valid product rows from "${fileName}". Level 1/2 Cold-Start heuristics applied.`;
    }

    if (importBtn) {
      importBtn.textContent = `Import ${rows.length} Products to Catalog`;
      importBtn.disabled = false;
    }

    previewContainer.classList.remove('hidden');
    if (window.HapticAudio) window.HapticAudio.click();
  }

  window.commitCsvImport = function () {
    if (!parsedCsvCache || parsedCsvCache.length === 0) return;
    const added = window.MercuraStore.addProducts(parsedCsvCache);
    
    if (window.HapticAudio) window.HapticAudio.chime();
    if (window.fireConfetti) window.fireConfetti();
    if (window.showToast) window.showToast(`⚡ Successfully ingested ${added.length} products into active catalog!`, 'inventory_2');

    parsedCsvCache = [];
    closeIngestionModal();

    // Auto-switch to Inventory tab to see new items
    if (window.switchFrame) window.switchFrame('inventory');
  };

  /* =========================================================================
     TAB 2: INVOICE OCR & PRODUCT IMAGE PIPELINE LOGIC
     ========================================================================= */

  window.loadSampleInvoice = function (vendorType = 'apex') {
    const ocrScanningBar = document.getElementById('ocr-laser-bar');
    const invoicePreviewImg = document.getElementById('invoice-preview-img');
    const invoiceFormContainer = document.getElementById('invoice-form-container');

    if (ocrScanningBar) ocrScanningBar.classList.remove('hidden');
    if (invoicePreviewImg) {
      invoicePreviewImg.src = vendorType === 'apex' ? 'img/shoes.jpg' : 'img/kurti.jpg';
    }

    if (window.HapticAudio) window.HapticAudio.click(800);

    // Simulate 1.5s scanning pass
    setTimeout(() => {
      if (ocrScanningBar) ocrScanningBar.classList.add('hidden');
      if (invoiceFormContainer) invoiceFormContainer.classList.remove('hidden');

      if (vendorType === 'apex') {
        document.getElementById('inv-ocr-vendor').value = 'Apex Footwear Ltd.';
        document.getElementById('inv-ocr-number').value = 'INV-APX-8891';
        document.getElementById('inv-ocr-date').value = '2024-10-16';

        const lineItems = [
          { name: 'Sports Running Shoes — AirSprint', sku: 'SH-102', qty: 25, cost: 1100, price: 2499, cat: 'Footwear' },
          { name: 'AirSprint Mesh Performance Trainers', sku: 'SH-104', qty: 15, cost: 950, price: 2199, cat: 'Footwear' }
        ];
        renderOcrLineItems(lineItems);
      } else {
        document.getElementById('inv-ocr-vendor').value = 'Banaras Handloom House';
        document.getElementById('inv-ocr-number').value = 'BNR-2024-4102';
        document.getElementById('inv-ocr-date').value = '2024-10-15';

        const lineItems = [
          { name: 'Silk Blend Festive Kurti', sku: 'KT-204', qty: 30, cost: 640, price: 1899, cat: 'Ethnic Wear' },
          { name: 'Chanderi Gold Border Dupatta', sku: 'DP-102', qty: 20, cost: 310, price: 899, cat: 'Ethnic Wear' }
        ];
        renderOcrLineItems(lineItems);
      }

      if (window.HapticAudio) window.HapticAudio.chime();
      if (window.showToast) window.showToast('✓ OCR scan completed. Line items extracted!', 'document_scanner');
    }, 1500);
  };

  window.handleCustomInvoiceUpload = function (file) {
    if (!file) return;

    // If an Excel, CSV, or data file was passed here, redirect smoothly to spreadsheet tab!
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.xlsm') || name.endsWith('.xlsb') || name.endsWith('.ods') || name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.json')) {
      switchIngestionTab('csv');
      handleSpreadsheetFileSelect(file);
      return;
    }

    const ocrScanningBar = document.getElementById('ocr-laser-bar');
    const invoicePreviewImg = document.getElementById('invoice-preview-img');
    const invoiceFormContainer = document.getElementById('invoice-form-container');

    if (invoicePreviewImg) {
      if (file.type && file.type.startsWith('image/')) {
        invoicePreviewImg.src = URL.createObjectURL(file);
      } else {
        invoicePreviewImg.src = 'img/kurti.jpg';
      }
    }

    if (ocrScanningBar) ocrScanningBar.classList.remove('hidden');
    if (window.HapticAudio) window.HapticAudio.click(800);

    // Simulate 1.4s OCR analysis
    setTimeout(() => {
      if (ocrScanningBar) ocrScanningBar.classList.add('hidden');
      if (invoiceFormContainer) invoiceFormContainer.classList.remove('hidden');

      const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

      document.getElementById('inv-ocr-vendor').value = cleanTitle || 'Universal Supplier Hub';
      document.getElementById('inv-ocr-number').value = 'INV-' + Math.floor(10000 + Math.random() * 89999);
      document.getElementById('inv-ocr-date').value = new Date().toISOString().split('T')[0];

      const lineItems = [
        { name: cleanTitle || 'Premium Commercial Stock', sku: 'SKU-' + Math.floor(100 + Math.random() * 899), qty: 25, cost: 420, price: 1199, cat: 'Apparel' },
        { name: 'Velocity Line Item Pack', sku: 'SKU-' + Math.floor(100 + Math.random() * 899), qty: 15, cost: 780, price: 1899, cat: 'Footwear' }
      ];
      renderOcrLineItems(lineItems);

      if (window.HapticAudio) window.HapticAudio.chime();
      if (window.showToast) window.showToast(`✓ Document "${file.name}" scanned. Line items extracted!`, 'document_scanner');
    }, 1400);
  };

  function renderOcrLineItems(items) {
    const tbody = document.getElementById('ocr-line-items-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    items.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 text-xs';
      tr.innerHTML = `
        <td class="py-2 px-2">
          <input type="text" class="ocr-item-name w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" value="${item.name}">
        </td>
        <td class="py-2 px-2">
          <input type="text" class="ocr-item-sku w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono" value="${item.sku}">
        </td>
        <td class="py-2 px-2">
          <input type="number" class="ocr-item-qty w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right" value="${item.qty}">
        </td>
        <td class="py-2 px-2">
          <input type="number" class="ocr-item-cost w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right" value="${item.cost}">
        </td>
        <td class="py-2 px-2">
          <input type="number" class="ocr-item-price w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right" value="${item.price}">
        </td>
        <td class="py-2 px-2 text-center">
          <button type="button" onclick="this.closest('tr').remove();" class="text-rose-500 hover:text-rose-700 text-sm cursor-pointer">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  window.addOcrLineItemRow = function () {
    const tbody = document.getElementById('ocr-line-items-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 text-xs';
    tr.innerHTML = `
      <td class="py-2 px-2">
        <input type="text" class="ocr-item-name w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" placeholder="Product Title">
      </td>
      <td class="py-2 px-2">
        <input type="text" class="ocr-item-sku w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono" placeholder="SKU-NEW">
      </td>
      <td class="py-2 px-2">
        <input type="number" class="ocr-item-qty w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right" value="10">
      </td>
      <td class="py-2 px-2">
        <input type="number" class="ocr-item-cost w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right" value="400">
      </td>
      <td class="py-2 px-2">
        <input type="number" class="ocr-item-price w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-right" value="999">
      </td>
      <td class="py-2 px-2 text-center">
        <button type="button" onclick="this.closest('tr').remove();" class="text-rose-500 hover:text-rose-700 text-sm cursor-pointer">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  };

  window.commitOcrToLedger = function () {
    const vendor = document.getElementById('inv-ocr-vendor')?.value || 'Supplier';
    const rows = document.querySelectorAll('#ocr-line-items-tbody tr');
    if (rows.length === 0) {
      if (window.showToast) window.showToast('No line items to add', 'warning');
      return;
    }

    const products = [];
    rows.forEach(tr => {
      const name = tr.querySelector('.ocr-item-name')?.value;
      const sku = tr.querySelector('.ocr-item-sku')?.value;
      const qty = parseInt(tr.querySelector('.ocr-item-qty')?.value) || 10;
      const cost = parseFloat(tr.querySelector('.ocr-item-cost')?.value) || 300;
      const price = parseFloat(tr.querySelector('.ocr-item-price')?.value) || 800;

      if (name) {
        products.push({
          sku,
          name,
          supplier: vendor,
          stock: qty,
          cost_price: cost,
          selling_price: price,
          inventory_age_days: 0, // Fresh delivery
          supplier_lead_days: 5
        });
      }
    });

    window.MercuraStore.addProducts(products);

    if (window.HapticAudio) window.HapticAudio.chime();
    if (window.fireConfetti) window.fireConfetti();
    if (window.showToast) window.showToast(`✓ Ingested ${products.length} line items from ${vendor}!`, 'verified');

    closeIngestionModal();
    if (window.switchFrame) window.switchFrame('inventory');
  };

  // Thumbnail photo upload for existing SKU
  window.handleThumbnailUpload = function (file) {
    if (!file) return;
    const skuSelect = document.getElementById('thumb-sku-select');
    const previewImg = document.getElementById('thumb-preview-img');
    const sku = skuSelect ? skuSelect.value : 'TS-088';

    const url = URL.createObjectURL(file);
    if (previewImg) previewImg.src = url;

    window.MercuraStore.updateProductImage(sku, url);

    // Update any existing img tags with that SKU
    document.querySelectorAll(`img[alt*="${sku}"]`).forEach(img => img.src = url);

    if (window.HapticAudio) window.HapticAudio.chime();
    if (window.showToast) window.showToast(`✓ Product photo updated for SKU ${sku}!`, 'image');
  };

  /* =========================================================================
     TAB 3: ADAPTIVE MANUAL ENTRY & QUICK SALE (COLD-START)
     ========================================================================= */

  window.generateRandomSku = function () {
    const prefixes = ['KUR', 'TS', 'SH', 'BLZ', 'TP', 'ACC', 'JN'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 899);
    const skuInput = document.getElementById('man-sku-code');
    if (skuInput) skuInput.value = `${p}-${num}`;
    updateManualPreCheck();
    if (window.HapticAudio) window.HapticAudio.click();
  };

  window.updateManualPreCheck = function () {
    const cost = parseFloat(document.getElementById('man-cost')?.value) || 0;
    const price = parseFloat(document.getElementById('man-price')?.value) || 0;
    const stock = parseInt(document.getElementById('man-stock')?.value) || 0;
    const lead = parseInt(document.getElementById('man-lead')?.value) || 5;
    const age = parseInt(document.getElementById('man-age')?.value) || 0;

    const marginEl = document.getElementById('man-calc-margin');
    const valueEl = document.getElementById('man-calc-value');
    const preCheckEl = document.getElementById('man-ai-precheck-box');

    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    const capitalLocked = stock * cost;

    if (marginEl) marginEl.textContent = `${Math.round(margin * 10) / 10}%`;
    if (valueEl) valueEl.textContent = window.Mercura ? window.Mercura.inr(capitalLocked) : `₹${capitalLocked}`;

    if (preCheckEl) {
      let statusColor = 'text-[#0EA5A0]';
      let statusText = '✓ Healthy (Cold-Start Level 2 Active)';

      if (age > 45) {
        statusColor = 'text-[#EF4444]';
        statusText = '❗ Dead Stock Risk Flagged';
      } else if (stock < lead * 2) {
        statusColor = 'text-[#F59E0B]';
        statusText = '⚠️ Low Stock Reorder Buffer Warning';
      }

      preCheckEl.innerHTML = `
        <span class="material-symbols-outlined text-sm ${statusColor}">auto_awesome</span>
        <span>AI Assessment: <strong>${Math.round(margin)}% Margin</strong> • <strong>${window.Mercura ? window.Mercura.inr(capitalLocked) : `₹${capitalLocked}`} Locked</strong> • Status: <strong class="${statusColor}">${statusText}</strong></span>
      `;
    }
  };

  window.commitManualProduct = function (e) {
    if (e) e.preventDefault();
    const name = document.getElementById('man-name')?.value;
    const sku = document.getElementById('man-sku-code')?.value;
    const cat = document.getElementById('man-cat')?.value || 'Apparel';
    const vendor = document.getElementById('man-vendor')?.value || 'Local Mill';
    const stock = parseInt(document.getElementById('man-stock')?.value) || 10;
    const cost = parseFloat(document.getElementById('man-cost')?.value) || 300;
    const price = parseFloat(document.getElementById('man-price')?.value) || 799;
    const age = parseInt(document.getElementById('man-age')?.value) || 0;
    const lead = parseInt(document.getElementById('man-lead')?.value) || 5;

    if (!name || !sku) {
      if (window.showToast) window.showToast('Please provide Product Name and SKU Code', 'warning');
      return;
    }

    window.MercuraStore.addProducts([{
      name,
      sku,
      category: cat,
      supplier: vendor,
      stock,
      cost_price: cost,
      selling_price: price,
      inventory_age_days: age,
      supplier_lead_days: lead,
      image_url: CATEGORY_IMAGES[cat] || 'img/ts.jpg'
    }]);

    if (window.HapticAudio) window.HapticAudio.chime();
    if (window.fireConfetti) window.fireConfetti();
    if (window.showToast) window.showToast(`✓ Added "${name}" (${sku}) to active catalog!`, 'add_circle');

    closeIngestionModal();
    if (window.switchFrame) window.switchFrame('inventory');
  };

  /* =========================================================================
     QUICK SALE & VOICE INPUT LOGIC
     ========================================================================= */

  window.openQuickSaleForSku = function (sku) {
    openIngestionModal('manual');
    const toggleSaleBtn = document.getElementById('subtoggle-sale-btn');
    if (toggleSaleBtn) toggleSaleBtn.click();
    const skuSelect = document.getElementById('quick-sale-sku-select');
    if (skuSelect) {
      skuSelect.value = sku;
      updateQuickSaleCard();
    }
  };

  window.updateQuickSaleCard = function () {
    const skuSelect = document.getElementById('quick-sale-sku-select');
    const qtyInput = document.getElementById('quick-sale-qty');
    const summaryCard = document.getElementById('quick-sale-summary-card');

    if (!skuSelect || !qtyInput || !summaryCard) return;

    const sku = skuSelect.value;
    const qty = parseInt(qtyInput.value) || 1;

    // Price estimates
    let price = 1499;
    let name = 'Catalog Item';
    if (sku === 'SH-102') { price = 2499; name = 'Sports Running Shoes — AirSprint'; }
    else if (sku === 'JKT-409') { price = 1499; name = 'Winter Heavy Jacket'; }
    else if (sku === 'TS-088') { price = 499; name = 'Cotton Crew T-Shirt'; }
    else if (sku === 'JN-204') { price = 1299; name = 'Denim Straight Jeans'; }
    else if (sku === 'KT-204') { price = 1899; name = 'Silk Blend Festive Kurti'; }

    const revenue = price * qty;
    const inr = n => window.Mercura ? window.Mercura.inr(n) : ('₹' + n.toLocaleString('en-IN'));

    summaryCard.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <span class="text-slate-400 font-mono">Action: Quick Sale (Stock Out)</span>
        <span class="font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded font-mono">+${inr(revenue)} Revenue</span>
      </div>
      <div class="font-sans font-bold text-sm text-white mt-1">${name} (${sku})</div>
      <div class="text-xs text-slate-300 font-mono mt-0.5">Deduct: <strong>${qty} units</strong> @ ${inr(price)}/unit</div>
    `;
  };

  window.commitQuickSale = function () {
    const skuSelect = document.getElementById('quick-sale-sku-select');
    const qtyInput = document.getElementById('quick-sale-qty');
    const sku = skuSelect?.value || 'SH-102';
    const qty = parseInt(qtyInput?.value) || 1;

    try {
      const res = window.MercuraStore.recordSale(sku, qty);
      if (window.HapticAudio) window.HapticAudio.chime();
      if (window.fireConfetti) window.fireConfetti();
      if (window.showToast) window.showToast(`⚡ Sale logged: -${qty} units of ${sku} (+₹${res.revenue.toLocaleString('en-IN')} revenue)!`, 'bolt');
      closeIngestionModal();
    } catch (e) {
      if (window.showToast) window.showToast(e.message, 'error');
    }
  };

  // Voice recognition / simulation helper
  window.startVoiceRecognition = function () {
    const voiceStatus = document.getElementById('voice-status-pill');
    if (voiceStatus) {
      voiceStatus.textContent = '🎙️ Listening... Say e.g. "Sold 5 Sports Shoes"';
      voiceStatus.classList.remove('hidden');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN';

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        if (voiceStatus) voiceStatus.textContent = `Heard: "${transcript}"`;
        processVoiceText(transcript);
      };

      recognition.onerror = function () {
        if (voiceStatus) voiceStatus.textContent = 'Voice error. Using simulator fallback.';
      };

      recognition.start();
    } else {
      setTimeout(() => {
        simulateVoiceSale('Sold 5 Sports Shoes');
      }, 700);
    }
  };

  window.simulateVoiceSale = function (phrase) {
    const voiceStatus = document.getElementById('voice-status-pill');
    if (voiceStatus) {
      voiceStatus.textContent = `🎙️ Processed Voice Log: "${phrase}"`;
      voiceStatus.classList.remove('hidden');
    }
    processVoiceText(phrase);
  };

  function processVoiceText(text) {
    const lower = text.toLowerCase();
    let qty = 1;
    const matchQty = lower.match(/\d+/);
    if (matchQty) qty = parseInt(matchQty[0]);

    let sku = 'SH-102';
    if (lower.includes('jacket') || lower.includes('winter')) sku = 'JKT-409';
    else if (lower.includes('shoe') || lower.includes('airsprint')) sku = 'SH-102';
    else if (lower.includes('tee') || lower.includes('shirt')) sku = 'TS-088';
    else if (lower.includes('kurti') || lower.includes('silk')) sku = 'KT-204';

    const skuSelect = document.getElementById('quick-sale-sku-select');
    const qtyInput = document.getElementById('quick-sale-qty');
    if (skuSelect) skuSelect.value = sku;
    if (qtyInput) qtyInput.value = qty;
    updateQuickSaleCard();

    if (window.HapticAudio) window.HapticAudio.chime();
    if (window.showToast) window.showToast(`Voice parsed: ${qty} units of ${sku}`, 'mic');
  }

  window.toggleOcrSubmode = function (mode) {
    const ocrBtn = document.getElementById('submode-ocr-btn');
    const thumbBtn = document.getElementById('submode-thumb-btn');
    const invoiceStage = document.getElementById('ocr-submode-invoice');
    const thumbStage = document.getElementById('ocr-submode-thumbnail');

    if (mode === 'ocr') {
      if (ocrBtn) ocrBtn.className = 'px-2.5 py-1 rounded-lg bg-[#0B1F2A] text-white font-bold cursor-pointer';
      if (thumbBtn) thumbBtn.className = 'px-2.5 py-1 rounded-lg text-[#4B5563] hover:text-[#0B1F2A] font-semibold cursor-pointer';
      if (invoiceStage) invoiceStage.classList.remove('hidden');
      if (thumbStage) thumbStage.classList.add('hidden');
    } else {
      if (thumbBtn) thumbBtn.className = 'px-2.5 py-1 rounded-lg bg-[#0B1F2A] text-white font-bold cursor-pointer';
      if (ocrBtn) ocrBtn.className = 'px-2.5 py-1 rounded-lg text-[#4B5563] hover:text-[#0B1F2A] font-semibold cursor-pointer';
      if (thumbStage) thumbStage.classList.remove('hidden');
      if (invoiceStage) invoiceStage.classList.add('hidden');
    }
    if (window.HapticAudio) window.HapticAudio.click();
  };

  window.toggleManualSubmode = function (mode) {
    const addBtn = document.getElementById('subtoggle-add-btn');
    const saleBtn = document.getElementById('subtoggle-sale-btn');
    const addForm = document.getElementById('manual-add-product-form');
    const saleStage = document.getElementById('manual-quick-sale-stage');

    if (mode === 'add') {
      if (addBtn) addBtn.className = 'px-3 py-1 rounded-lg bg-[#0B1F2A] text-white font-bold cursor-pointer';
      if (saleBtn) saleBtn.className = 'px-3 py-1 rounded-lg text-[#4B5563] hover:text-[#0B1F2A] font-semibold cursor-pointer';
      if (addForm) addForm.classList.remove('hidden');
      if (saleStage) saleStage.classList.add('hidden');
    } else {
      if (saleBtn) saleBtn.className = 'px-3 py-1 rounded-lg bg-[#0B1F2A] text-white font-bold cursor-pointer';
      if (addBtn) addBtn.className = 'px-3 py-1 rounded-lg text-[#4B5563] hover:text-[#0B1F2A] font-semibold cursor-pointer';
      if (saleStage) saleStage.classList.remove('hidden');
      if (addForm) addForm.classList.add('hidden');
      updateQuickSaleCard();
    }
    if (window.HapticAudio) window.HapticAudio.click();
  };

  window.selectDailyVel = function (btn, vel) {
    document.querySelectorAll('.vel-pill').forEach(b => {
      b.className = 'vel-pill px-2 py-1 rounded bg-white border border-slate-200 text-[#4B5563]';
    });
    btn.className = 'vel-pill px-2 py-1 rounded bg-[#0B1F2A] text-white font-bold';
    btn.setAttribute('data-vel', vel);
    updateManualPreCheck();
    if (window.HapticAudio) window.HapticAudio.click();
  };

  /* =========================================================================
     DRAG AND DROP ON INVENTORY TABLE & MODAL DROPZONE
     ========================================================================= */

  function setupTableDragDrop() {
    const tableDropzone = document.getElementById('inv-drag-dropzone');
    const tableContainer = document.getElementById('frame-inventory');
    const modalDropzone = document.getElementById('csv-modal-dropzone');

    // Prevent default window drop navigation
    window.addEventListener('dragover', e => { e.preventDefault(); }, false);
    window.addEventListener('drop', e => { e.preventDefault(); }, false);

    // 1. Inventory Table Dropzone
    if (tableContainer) {
      ['dragenter', 'dragover'].forEach(eventName => {
        tableContainer.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
          if (tableDropzone) tableDropzone.classList.remove('hidden');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        tableContainer.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
          if (tableDropzone) tableDropzone.classList.add('hidden');
        }, false);
      });

      tableContainer.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt && dt.files;
        if (files && files.length > 0) {
          const file = files[0];
          const name = (file.name || '').toLowerCase();
          const type = (file.type || '').toLowerCase();
          if (type.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.pdf')) {
            openIngestionModal('ocr');
            handleCustomInvoiceUpload(file);
          } else {
            openIngestionModal('csv');
            handleSpreadsheetFileSelect(file);
          }
        }
      });
    }

    // 2. Modal Ingestion Tab 1 Dropzone
    if (modalDropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        modalDropzone.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
          modalDropzone.classList.add('border-[#0EA5A0]', 'bg-[#E6F7F5]/40', 'scale-[1.01]');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        modalDropzone.addEventListener(eventName, e => {
          e.preventDefault();
          e.stopPropagation();
          modalDropzone.classList.remove('border-[#0EA5A0]', 'bg-[#E6F7F5]/40', 'scale-[1.01]');
        }, false);
      });

      modalDropzone.addEventListener('drop', e => {
        const dt = e.dataTransfer;
        const files = dt && dt.files;
        if (files && files.length > 0) {
          handleSpreadsheetFileSelect(files[0]);
        }
      });
    }
  }

  // Initialize Drag & Drop when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupTableDragDrop);
  } else {
    setupTableDragDrop();
  }

})(window);
