<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" alt="TrustLens Logo" width="120" />
  <h1>TrustLens</h1>
  <p><strong>AI-Powered E-Commerce Product Audit & Cross-Platform Comparison Engine</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  </p>
</div>

<br />

## 🚀 Overview
TrustLens is a next-generation product analysis engine designed to protect consumers from e-commerce scams, fake reviews, and artificial discounts. Simply paste a product URL from major marketplaces (Amazon, Flipkart, Myntra, etc.), and TrustLens will instantly:

- **Extract and analyze** the product, seller, and reviews.
- **Compute a Trust Score** evaluating price reality, review authenticity, and seller trust.
- **Perform Cross-Platform Comparison** to find the exact same product on competing platforms.
- **Recommend** the safest and best value option.

---

## ✨ Key Features
- **Scam Detection:** Analyzes seller age, return policies, and review velocity to detect fly-by-night operations.
- **Fake Discount Recognition:** Compares current prices and MRP against market medians to identify artificial anchor pricing.
- **Bot Review Analysis:** Uses LLMs to analyze review linguistics, detecting bot phrases and coordinated review bursts.
- **Cross-Platform Matching:** Utilizes NVIDIA embedding similarities to accurately match products across disparate e-commerce catalogs.
- **Interactive AI Assistant:** Ask contextual follow-up questions about the specific audit.

---

## 🏗 Architecture
TrustLens utilizes a decoupled architecture with a Vite/React frontend and a Node/Express backend. 
- **Scraping Layer:** Headless browsing and data extraction via Anakin workflows.
- **Intelligence Layer:** Groq/Gemini for semantic analysis, NVIDIA for vector similarities.
- **Storage Layer:** MongoDB with transient LRU caching.

*For detailed architecture, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).*

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (optional for local dev with `DEMO_MODE=true`)
- API Keys: Groq, Gemini, NVIDIA, Anakin (for live scraping)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/trustlens.git
   cd trustlens
   ```
2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. **Environment Setup:**
   Create a `.env` file in the `/backend` directory (see [ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)).
4. **Run Locally:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

---

## 📚 Documentation
Comprehensive documentation is available in the `docs/` directory:

### Core Docs
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)

### AI & Workflows
- [AI Workflow Overview](docs/AI_WORKFLOW.md)
- [Risk Analysis Engine](docs/RISK_ANALYSIS_ENGINE.md)
- [Product Matching Engine](docs/PRODUCT_MATCHING_ENGINE.md)

---

## 🔮 Roadmap
- **Browser Extension:** One-click audits directly on Amazon/Flipkart.
- **Price Tracking:** Historical price graphs for products.
- **Auth Integration:** User accounts to save past audits and set price alerts.

---

<div align="center">
  <p>Built for the future of transparent e-commerce.</p>
</div>
