# 🏗️ Smart Concrete Mix Calculator

An IS 10262:2019 compliant web application for concrete mix design proportioning, quantity estimation, material cost analysis, Excel export, and calculation history tracking.

---

## 📌 Features

### 🧮 Standard-Compliant Mix Design Engine (IS 10262:2019)
- **Target Strength Calculation**: Computes target mean strength ($f'_{ck}$) considering standard deviation ($s$) and $X$-factor tolerances according to Table 1 & Table 2 of IS 10262:2019.
- **Water Content & Slump Adjustment**: Calculates nominal water content based on maximum aggregate size ($10\text{ mm}, 20\text{ mm}, 40\text{ mm}$), adjusting automatically for workability/slump ($+3\%$ per $25\text{ mm}$ over baseline $50\text{ mm}$) and chemical admixture water reduction percentage.
- **Cement Content Optimization**: Determines minimum cement requirement based on exposure conditions (Mild, Moderate, Severe, Very Severe, Extreme) per IS 456 / IS 10262, enforcing maximum W/C ratio caps.
- **Aggregate Proportioning**: Derives coarse and fine aggregate volume fractions for Zone II sand with automatic adjustments for lower or higher water-cement ratios ($\pm 0.01$ per $0.05$ change from $0.50$ baseline).
- **Absolute Volume Verification**: Verifies volume balance sanity across all constituent phases:
  $$\text{Volume}_{\text{cement}} + \text{Volume}_{\text{water}} + \text{Volume}_{\text{air}} + \text{Volume}_{\text{admixture}} + \text{Volume}_{\text{fine agg}} + \text{Volume}_{\text{coarse agg}} \approx 1.000\text{ m}^3$$

### 💰 Integrated Material Cost Estimation
- Inline price entry panel for Cement, Fine Aggregate (Sand), Coarse Aggregate, Water, and Chemical Admixture.
- Computes **Total Project Cost**, **Cost per m³**, and **Cost per m²**.
- Instant recalculation on price changes and automatic reset when modifying mix design parameters.

### 📊 Client-Side Excel Export (.xlsx)
- Generates valid, multi-sheet `.xlsx` workbooks directly in the browser using `fflate` ZIP compression.
- Exports structured sheets for **Project Inputs**, **Mix Design Results**, **Absolute Volumes**, and **Cost Estimation**.

### 🔒 User Authentication & Cloud History (Supabase)
- User sign-up, login, and secure session management via Supabase Auth.
- Row-Level Security (RLS) protected calculation database storing complete mix designs and cost records.
- One-click history loading and transfer back into the active mix calculator for fast iteration.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS with modern CSS custom properties and dynamic responsive layouts
- **Backend / Database**: Supabase (PostgreSQL with RLS, Auth)
- **Excel Generation**: `fflate` (high-performance client-side zip library)
- **Linter & Test Runner**: Oxlint, Node.js Native Test Runner (`node --test`)

---

## 📂 Project Structure

```text
cmc/
├── public/                 # Static assets (Icon.png, favicon)
├── src/
│   ├── assets/             # Images and branding assets
│   ├── components/         # Reusable UI components (Navbar, Form fields, etc.)
│   ├── context/            # AuthContext for Supabase session state
│   ├── data/               # IS 10262 default values and select option specs
│   ├── lib/                # Core calculation engine & Supabase data services
│   │   ├── mixDesignCalculator.js  # IS 10262:2019 calculation engine
│   │   ├── calculations.js         # Supabase CRUD operations
│   │   └── supabase.js             # Supabase client initialization
│   ├── pages/              # Application views
│   │   ├── Calculator.jsx          # Interactive mix design calculator
│   │   ├── History.jsx             # Saved calculations history & transfer
│   │   ├── Home.jsx                # User dashboard & quick launcher
│   │   ├── Landing.jsx             # Public landing page
│   │   ├── Login.jsx               # User authentication (Login)
│   │   └── Signup.jsx              # User registration
│   ├── utils/              # Export utilities (exportExcel.js)
│   ├── App.css             # Main design system & responsive styling
│   ├── App.jsx             # App layout & routes
│   └── main.jsx            # Entry point
├── tests/                  # Engine unit tests (mixDesignCalculator.test.js)
├── index.html              # HTML shell & favicon reference
├── package.json            # Project dependencies & scripts
└── vite.config.js          # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/santoshkarimisetti-creator/Smart-Concrete-Mix-Calculator.git
   cd Smart-Concrete-Mix-Calculator/cmc
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the `cmc/` root directory:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🧪 Testing & Verification

Run the automated test suite for the IS 10262:2019 calculation engine:

```bash
npm test
```

To run code linting:

```bash
npm run lint
```

To create a production build:

```bash
npm run build
```

---

## 📖 Calculation Standard Compliance

The engine follows **IS 10262:2019** (*Concrete Mix Proportioning — Guidelines*):

1. **Target Strength**: $f'_{ck} = \max(f_{ck} + 1.65 \times s,\; f_{ck} + X)$
2. **Water Content**: Base water from Table 4, modified by slump adjustment and chemical admixture water reduction.
3. **Cement Content**: Derived from W/C ratio and verified against minimum exposure limits in IS 456 / IS 10262.
4. **Coarse & Fine Aggregate Proportions**: Table 5 base coarse fraction adjusted for actual W/C ratio ($\text{Fine Fraction} = 1 - \text{Coarse Fraction}$).
5. **Absolute Volume Proportions**: Materials converted to cubic metres using specific gravities:
   $$\text{Volume} = \frac{\text{Mass}}{\text{Specific Gravity} \times 1000}$$

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
