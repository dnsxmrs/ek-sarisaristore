# 🏪 EK Sari-Sari Store Management System

> **A high-speed, mobile-first Point-of-Sale (POS) and inventory management system purpose-built for Philippine Sari-Sari stores.**  
> Designed for lightning-fast price lookups, embedded camera barcode scanning, USB scanner gun support, and seamless local area network (LAN) store operations.

---

## 📌 Overview

In typical Philippine sari-sari stores, storekeepers manage hundreds of fast-moving consumer goods (FMCG) with fluctuating distributor prices. Answering customer inquiries (*"Ate/Kuya, magkano po ito?"*) requires instant, sub-second price verification without flipping through notebooks, guessing, or breaking cashier flow.

**EK Sari-Sari Store** solves this with an intuitive, touch-friendly web application running on local hardware (PC, laptop, tablet, or smartphone) across the store's Wi-Fi network.

---

## 🌟 Key Features

### 1. 📷 Embedded Camera Barcode Scanner
* **No Disruptive Modals**: The camera viewfinder is embedded directly into the home screen layout, keeping the cashier focused and ready.
* **Tactile ON / OFF Master Toggle**:
  * **OFF (Standby)**: Completely cuts video streams and releases camera hardware tracks to preserve battery life and prevent device overheating. Displays a sleek standby screen with a one-tap wake button.
  * **ON (Live Stream)**: Activates real-time barcode scanning with an animated laser-sweep reticle and corner brackets.
* **Supermarket Beep & Haptic Feedback**: Realistic 940Hz supermarket cash-register beep via Web Audio API and vibration pulses upon successful scan.
* **Runaway Query Debounce**: Prevents duplicate database queries when a product is held in front of the lens.
* **Camera Flipping**: Seamless 1-tap toggling between Rear (*Environment*) and Front (*User*) cameras.
* **HTTP / LAN Fallback**: Includes a native phone camera photo snap fallback that bypasses browser HTTPS/SSL restrictions when accessing via local IP address.

### 2. 🔫 Hardware Barcode Scanner Gun Support
* **Zero-Click Scanning**: Global temporal keystroke buffer listener detects high-speed inputs from USB and Bluetooth barcode scanner guns.
* **Automated Price Display**: Cashiers can scan items from anywhere on the page without clicking into an input field first.

### 3. ⚡ 1-Tap Quick Registration Flow
* When an unregistered barcode is scanned, the system displays an alert with a 1-tap **"I-rehistro ang Bagong Produkto"** button.
* Automatically pre-fills the barcode in the product registration form so inventory can be added on the fly during active sales.

### 4. 📦 Product Catalog & Price Management (`/products`)
* **Real-Time Search & Category Filters**: Filter items by category (Beverages, Snacks, Canned Goods, Condiments, Toiletries, etc.) or search by product name and barcode.
* **Selling Price Display**: Prominent Philippine Peso (`₱`) price formatting with clear Tagalog labels.
* **Catalog Edit & Stock Management**: Activate/deactivate items, adjust prices, and update product notes.

### 5. 🌐 Local Network (LAN) Ready
* Host the system on a single counter PC and access the POS interface from any smartphone or tablet connected to the same local Wi-Fi router.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) | High-performance React framework with Partial Prerendering and Server Actions |
| **Frontend** | [React 19](https://react.dev) & TypeScript 5 | Modern UI architecture with transition hooks and type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first CSS engine with custom animations and design tokens |
| **Database** | [PostgreSQL](https://www.postgresql.org) | Robust relational database for inventory and transaction records |
| **ORM** | [Prisma ORM 7](https://www.prisma.io) (`@prisma/adapter-pg`) | Type-safe database queries and automated schema migrations |
| **Barcode Engine** | [html5-qrcode](https://github.com/mebjas/html5-qrcode) | Multi-format barcode scanning (EAN-13, EAN-8, UPC-A, UPC-E, Code 128, QR) |
| **Icons** | [Lucide React](https://lucide.dev) | Crisp, modern iconography |
| **Validation** | [Zod 4](https://zod.dev) | Strict runtime schema validation for forms and server actions |
| **Auth** | [Better Auth](https://better-auth.com) | Integrated authentication infrastructure |

---

## 📁 Repository Structure

```text
ek-sarisaristore/
├── prisma/
│   ├── migrations/            # Version-controlled SQL migration scripts
│   ├── schema.prisma          # Prisma schema definition (Category, Product, Auth)
│   └── seed.ts                # Database seeder with sample sari-sari store goods
├── public/                    # Static assets, branding, and icons
├── src/
│   ├── app/                   # Next.js App Router routes & endpoints
│   │   ├── api/auth/          # Better Auth route handlers
│   │   ├── products/          # Product catalog, registration, and edit routes
│   │   ├── globals.css        # Tailwind v4 theme, laser animations, and layout
│   │   ├── layout.tsx         # Root layout with mobile-first typography
│   │   └── page.tsx           # Home page (Price Lookup & Embedded Camera Scanner)
│   ├── components/
│   │   ├── lookup/            # Price lookup view and result cards
│   │   ├── navigation/        # Header with LAN status and BottomNav bar
│   │   ├── products/          # Product list, form components, and cards
│   │   └── scanner/           # InlineCameraScanner and BarcodeScannerModal
│   ├── lib/                   # Database client, auth client, money formatters, Zod schemas
│   ├── proxy.ts               # Next.js 16 proxy / route guards
│   └── server/actions/        # Server actions for product queries and mutations
├── next.config.ts             # Next.js configuration and allowed dev origins
├── package.json               # Dependencies and build scripts
└── prisma7.config.ts          # Prisma 7 configuration file
```

---

## 🗄️ Database Schema Overview

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : contains
    CATEGORY {
        string id PK
        string name UK
        datetime createdAt
        datetime updatedAt
    }
    PRODUCT {
        string id PK
        string barcode UK
        string name
        decimal sellingPrice
        string categoryId FK
        string description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **PostgreSQL**: A running PostgreSQL instance (local or hosted)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/ek-sarisaristore.git
cd ek-sarisaristore
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/sarisaristore?schema=public"

# Better Auth Secret (Generate via: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-secure-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Database Setup & Seeding
Generate the Prisma client and apply database migrations:
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Seed database with initial categories and popular sari-sari store products
npm run seed
```

### 5. Running in Development
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📱 Operating Over Local Network (LAN)

To use a smartphone as a handheld barcode scanner at the store counter:

1. **Find Host PC IP**:
   * On Windows, run `ipconfig` in Command Prompt (e.g., `192.168.1.100`).
2. **Configure Allowed Origins**:
   * In [next.config.ts](file:///c:/all%20programming/ek-sarisaristore/next.config.ts), ensure your local IP is included in `allowedDevOrigins`:
     ```ts
     allowedDevOrigins: ['192.168.1.100'],
     ```
3. **Run Dev Server on all Interfaces**:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
4. **Connect from Mobile Phone**:
   * Connect your phone to the same Wi-Fi router.
   * Open `http://192.168.1.100:3000` in Chrome or Safari.
   * *Tip for HTTP networks*: Modern mobile browsers restrict live camera video feeds over insecure HTTP. Use the built-in **"Kumuha ng Litrato"** button to snap photos of barcodes directly using your phone's native camera without needing HTTPS!

---

## 🛠️ CLI Commands & Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs Prisma generate and starts Next.js Turbopack dev server |
| `npm run build` | Compiles optimized production bundle with TypeScript validation |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint analysis across all project files |
| `npm run seed` | Seeds the database with starter categories and items |

---

## 💡 Cashier Best Practices

* **Live Camera Toggle**: Keep the camera **OFF** during idle moments to save phone battery; flip to **ON** when scanning a batch of items.
* **Barcode Gun**: Leave the scanner gun plugged into the USB port. Scan any barcode directly without needing to touch the screen or keyboard.
* **Name Lookup**: If a product has a torn or missing barcode, type keywords (e.g., *"Coke"*, *"Pansit"*, *"Bear Brand"*) into the search field for instant price results.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
