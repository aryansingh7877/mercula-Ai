# mercula-Ai

> **Mercura AI** — Smarter Inventory. Stronger Tomorrow.  
> Transforming dormant inventory into liquid working capital for retail and boutique merchants.

---

## 🚀 Overview

**Mercura AI** is an AI-driven, human-authorized Working Capital & POS Ingestion Engine designed for retail store merchants. It gives merchants mathematical guidance on what to reorder, what to stop buying, which slow-moving SKUs to discount, and where their working capital will yield the highest return.

### Key Features
- **Multi-Format Ingestion**: Ingest data via Excel (.xlsx, .xls), CSV, or OCR receipt scanning.
- **Dead Capital Diagnosis**: Identify dormant stock and calculate real capital recovery potential.
- **Intelligent Liquidation Engine**: Proactive markdown recommendations and bundle strategies.
- **Reorder Guardrails & Capital Allocation**: 100% human-authorized reordering with predictive safety stock alerts.
- **Real-Time Dashboards**: Reactive working capital telemetry, sales trends, stock alerts, and cash flow simulations.

---

## 🛠️ Quick Start

### 1. Prerequisites
- Python 3.8+ (or Node.js)
- Modern web browser (Chrome, Edge, Firefox, Safari)

### 2. Running Locally

Using Python:
```bash
python server.py
```
Or with npm:
```bash
npm start
```

Open your browser at:
```
http://localhost:8000
```

---

## 📁 Project Structure

```
.
├── Mercura-App-main/          # Core web application assets
│   ├── index.html             # Landing & Vision page
│   ├── dashboard.html         # Main Merchant KPI Dashboard
│   ├── inventory.html         # SKU management & stock analysis
│   ├── alerts.html            # Urgent stock & dead capital alerts
│   ├── cash.html              # Working capital & cash flow simulation
│   ├── insights.html          # AI recommendations & margin telemetry
│   ├── sales.html             # Multi-channel POS sync & demand
│   ├── settings.html          # Store settings & demo data controls
│   ├── ingestion.js           # Multi-format invoice/POS ingestion engine
│   ├── app.js                 # UI controllers & state management
│   ├── engine.js              # Working capital & inventory logic
│   └── img/                   # Storefront, persona & product catalog media
├── server.py                  # Local development server with clean routing
└── package.json               # Script definitions
```

---

## 📄 License
ISC
