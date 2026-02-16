# SoleMate Frontend

## 📄 Description - Exercise Statement
SoleMate Frontend is an academic project from IT Academy.  
The exercise consists of building the client-side application for a feet-focused social platform connected to a separate backend API.

Main features implemented in this repository:
- User authentication (register, login, session token handling).
- Feet gallery and detail pages.
- Create, edit, and delete reviews.
- Admin users panel (search, edit role/email, delete users and reviews).
- Mini-game image library and swipe interaction.

## 💻 Technologies Used
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- ESLint 9
- Node.js / npm
- REST API integration with a Spring Boot backend

## 📋 Requirements
- Node.js 20+ (recommended LTS)
- npm 10+
- Running backend API (default expected at `http://localhost:8080`)
- Environment variable in this frontend:
  - `NEXT_PUBLIC_API_URL=http://localhost:8080`

Optional (for one-command local startup with backend + frontend):
- Java (for Spring Boot backend)
- Backend repository available at `../S5.t02SoleMate` (default path used by `scripts/start-solemate.sh`)

## 🛠️ Installation
1. Clone this repository.
2. Install dependencies:

```bash
npm install
```

3. Create or update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## ▶️ Execution
Run frontend only:

```bash
npm run dev
```

Frontend will be available at:
- `http://localhost:3000`

Useful additional commands:

```bash
npm run build
npm run start
npm run lint
```

Run backend + frontend together (if backend repo is present and configured):

```bash
bash scripts/start-solemate.sh
```

## 🌐 Deployment
Production deployment steps:
1. Set `NEXT_PUBLIC_API_URL` to your production backend URL.
2. Build the app:

```bash
npm run build
```

3. Start production server:

```bash
npm run start
```

You can deploy on platforms like Vercel or any Node.js hosting provider.  
Make sure the frontend can reach the backend API and CORS is properly configured on the backend.

## 🤝 Contributions
This repository is academic, but contributions are welcome.

Recommended flow:
1. Create a feature branch.
2. Keep code style consistent and run `npm run lint`.
3. Open a Pull Request with a clear description of the change.
4. Include testing notes and screenshots for UI changes when relevant.
