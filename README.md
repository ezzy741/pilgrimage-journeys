# Pilgrimage Journeys

# SYSTEM INSTRUCTION FOR LOVABLE AI



You are a senior full-stack engineer and UI/UX architect tasked with building a production-ready, highly responsive, multi-region Ride-Hailing & Ziyarat Transport Web Application (React + Vite + Tailwind CSS + Supabase backend).



---



## 1. CORE ARCHITECTURE & SYSTEM ROLES



Implement a strict Role-Based Access Control (RBAC) system with 3 isolated perspectives:



1. **User / Passenger Interface:** High-converting, simple 2-click booking app for pilgrims.

2. **Rider / Driver Interface:** Operational PWA/mobile-first layout for drivers to manage trips, navigate, and view earnings.

3. **Admin Control Panel:** Secure, web-based management dashboard reserved exclusively for system administrators.



---



## 2. USER INTERFACE & HOME PAGE LAYOUT



The Home Page must feature a hero section with a live map background (Google Maps / Leaflet integration) and **3 Primary Cards** prominently rendered:



### Card 1: Makkah Ziyarat (`/ziyarat/makkah`)

* **Visual:** Background image of Makkah landmarks / Kaaba vector.

* **Title:** Makkah Ziyarat (Multi-language string: EN, AR, UR).

* **Direct Price Display:** Prominently renders dynamic dynamic base fare (e.g., "From 150 SAR").

* **Click Action:** Opens modal/page selecting locations (Jabal al-Nour, Jabal Thawr, Mina, Arafat, Muzdalifah) with vehicle type selector (Sedan, SUV/GMC, HiAce Minibus).



### Card 2: Madinah Ziyarat (`/ziyarat/madinah`)

* **Visual:** Background image of Al-Masjid an-Nabawi / Green Dome vector.

* **Title:** Madinah Ziyarat.

* **Direct Price Display:** Prominently renders dynamic base fare (e.g., "From 120 SAR").

* **Click Action:** Opens modal/page selecting locations (Masjid Quba, Mount Uhud, Masjid al-Qiblatayn, Seven Mosques) with vehicle type selector.



### Card 3: Special Ziyarat Offers (`/offers`)

* **Visual:** Promotional banner with discount badge tag.

* **Title:** Special Ziyarat Offers.

* **Badge Tag:** Dynamic text (e.g., "Save 20%" or "Makkah + Madinah Combo").

* **Click Action:** Displays active promotional packages and discounted rides.



---



## 3. KEY FUNCTIONAL MODULES



### A. Booking Engine & Auto-Fare Calculation

* **Fare Formula:** `Total Fare = Base Fare + (Distance in KM * Per KM Rate) + Peak Surge Multiplier - Discount Promo`.

* **OTP Verification:** Generate a 4-digit OTP code upon ride acceptance required for the driver to initiate `Start Ride`.

* **Live GPS Tracking:** Mock/real GPS tracking showing driver location relative to pickup point.



### B. Driver / Rider App Interface

* **Online / Offline Toggle:** Switches driver status in database.

* **Request Pop-up:** 20-second countdown timer showing pickup distance, drop-off area, and estimated driver earnings.

* **Earnings Dashboard:** Detailed breakdown showing total fare collected, admin commission deducted, and net driver payout balance.



### C. Admin Control Panel (`/admin`)

* **Financial Overview & One-Click Split Report:** A dedicated reporting component calculating total gross revenue, total driver earnings, and net admin profit in a single click.

* **Fare Management:** UI inputs to dynamically update Makkah Base Rate, Madinah Base Rate, Per-KM Rates, and Surge Multipliers directly affecting the home page cards.

* **Offer & Promo Manager:** Ability to add/edit promo codes, discount percentages, expiration dates, and banner text on the Home Page Offers Card.

* **Payment API Settings:** Dynamic configuration page storing API credentials for:

  * KSA: Al Rajhi Bank API, Mada, STC Pay.

  * Pakistan: JazzCash, EasyPaisa, 1Link.

  * Global: PayPal, Stripe.



---



## 4. DESIGN & UX SPECIFICATIONS



* **Theme:** Clean modern aesthetic with Islamic geometric accent borders (Emerald Green `#064E3B`, Gold `#D97706`, Slate White `#F8FAFC`).

* **Multi-Language Engine:** i18n support for English (LTR), Arabic (RTL), and Urdu (RTL). Instant language switch toggle in the top navbar.

* **Responsiveness:** Mobile-first design optimized for handheld devices used by pilgrims on the move.



---



## 5. TECHNICAL STACK & BACKEND SCHEMA



* **Frontend:** React (TypeScript), Tailwind CSS, Lucide React Icons, Shadcn UI components.

* **State & Backend:** Supabase (Auth, Postgres DB, Realtime subscriptions).

* **Database Tables Required:**

  1. `profiles` (id, role ['user', 'driver', 'admin'], phone, name, rating)

  2. `drivers` (id, vehicle_type, license_no, status ['online', 'offline', 'busy'], wallet_balance)

  3. `rides` (id, user_id, driver_id, pickup_loc, dropoff_loc, fare, admin_commission, status, otp)

  4. `fares_config` (id, zone_name ['makkah', 'madinah'], base_fare, per_km_rate)

  5. `promotions` (id, code, discount_percentage, target_card ['makkah', 'madinah', 'combo'], active)

  6. `payment_gateways` (id, gateway_name, merchant_id, api_key, secret_key, is_active)



---



Execute this full application structure with 

clean code splitting, sample mock data for all 3 cards, and fully interactive routes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3d7e8e2a-3712-4166-8aff-9716a757ee01).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
