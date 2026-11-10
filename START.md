# AutoMk — Si të startosh

## 1. Backend (Node.js API)

```bash
cd server
npm run dev
# API runs on http://localhost:3000
```

## 2. Admin Panel (React)

```bash
cd admin
npm run dev
# Admin runs on http://localhost:5173/admin/
```

---

## Login

URL: http://localhost:5173/admin/
- Email:    admin@automk.com
- Password: AutoMk2024!

Ndrysho kredencialet në `server/.env` para prod.

---

## Struktura

```
Automk/
├── autoverse-site/   ← faqja ekzistuese HTML (e pandryshuar)
├── server/           ← Node.js + Express + SQLite
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── seed.js
│   │   ├── routes/   auth, brands, cars, leads, models
│   │   └── middleware/ auth, upload
│   ├── uploads/      ← fotos e kerrave (auto-krijohet)
│   ├── automk.db     ← SQLite database
│   └── .env
└── admin/            ← React admin panel (Vite)
    └── src/
        ├── pages/    Login, Dashboard
        └── components/ CarForm, CarList, ImageUpload
```

---

## API Endpoints

| Method | URL | Kush |
|--------|-----|------|
| POST | /api/auth/login | public |
| GET  | /api/auth/me | public |
| GET  | /api/brands | public |
| GET  | /api/cars | public |
| GET  | /api/cars/:id | public |
| POST | /api/cars | admin |
| PUT  | /api/cars/:id | admin |
| DELETE | /api/cars/:id | admin |
| POST | /api/leads | public |
| GET  | /api/models/detect?q= | public |
| GET  | /api/models/suggestions?q= | public |

---

## Lidhja e faqes HTML me backend

Në `autoverse-site/index.html` gjej CONFIG dhe ndrysho:
```js
api: { baseUrl: 'http://localhost:3000/api' }
```

---

## Si punon brand-detection

Admin shkruan model-in (p.sh. "M3 Competition") →
backend (`/api/models/detect?q=M3 Competition`) e gjen se M3 = BMW →
formi auto-plotëson brandin me "BMW".

116 modele të mapuara: Volkswagen, BMW, Mercedes, Audi, Alfa Romeo,
Lamborghini, Ferrari, Porsche, Maserati, Bentley, Rolls-Royce,
Aston Martin, McLaren, Land Rover, Tesla.
