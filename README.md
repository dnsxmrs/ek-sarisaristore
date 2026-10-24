# EK Sari-Sari Store Management System (POS & Price Lookup)

A mobile-first, high-speed Point-of-Sale (POS) and inventory management web application tailored for Philippine Sari-Sari stores. Designed for rapid price lookups, barcode scanning, catalog management, and local area network (LAN) store operations.

---

## 🌟 Key Features

### 1. Embedded Camera Barcode Scanner & Instant Price Checker (Home Page)
- **Inline Viewfinder Screen**: The camera viewfinder is embedded directly into the home screen layout with no disruptive pop-up modals.
- **ON/OFF Master Toggle**:
  - **OFF (Standby)**: Disables camera hardware and stops video tracks to conserve device battery and maintain privacy, showing a sleek "Camera Off" standby screen with a one-tap wake-up button.
  - **ON (Live)**: Activates real-time barcode scanning with an animated laser sweep reticle and target frame.
- **Auditory & Haptic Feedback**: Realistic cash-register supermarket scanner beep (Web Audio API) and vibration pulses upon successful scan.
- **Auto-Debounce**: Prevents runaway database queries when scanning barcodes continuously.
- **Camera Controls**: Instant switching between rear (environment) and front (user) cameras.
- **HTTP / LAN Fallback**: Built-in native camera snapshot capture allowing phones to scan barcodes even across local HTTP networks without SSL restrictions.
- **Hardware Barcode Scanner Support**: Global keystroke listener supporting USB and Bluetooth barcode scanner guns.

### 2. Product Management Catalog
- **Product Listing (`/products`)**: Real-time category filtering, active status badges, and search.
- **Product Registration (`/products/new`)**:
  - Auto-fills scanned barcodes.
  - Automatic real-time profit margin and markup calculator when entering cost and selling prices.
  - Optional modal barcode scanner for registration.
- **Product Editing (`/products/[id]/edit`)**: Update item names, barcodes, prices, stock levels, and descriptions.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Language**: TypeScript 5
- **Database & ORM**: PostgreSQL with [Prisma ORM 7](https://www.prisma.io) (`@prisma/adapter-pg`)
- **Authentication**: [Better Auth](https://better-auth.com)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Barcode Engine**: [html5-qrcode](https://github.com/mebjas/html5-qrcode)
- **Icons**: [Lucide React](https://lucide.dev)
- **Validation**: [Zod](https://zod.dev)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database instance

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sarisaristore?schema=public"
BETTER_AUTH_SECRET="your-better-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial store categories and sample products
npm run seed # or npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your desktop browser, or connect via your local IP (e.g., `http://192.168.x.x:3000`) from a smartphone on the same Wi-Fi network.

### 5. Production Build & Linting
```bash
# Run production build validation
npm run build

# Run code style and ESLint check
npm run lint
```
