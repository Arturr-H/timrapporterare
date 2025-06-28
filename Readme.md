# Timrapport Web Interface

Ett minimalistiskt web-interface för att underlätta timrapportering genom att samla information från GitHub och Asana.

## Features

### GitHub Integration
- 📅 Visar dagens datum centrerat
- ➕ Lägg till repositories manuellt via URL
- 🏢 Visar organisation och Private-taggar
- ⭐ Favoritmarkering av repositories
- 📋 Lista Pull Requests med öppna/kopiera länkar
- ✅ Visa commits för valda PRs med navigering
- 🔗 Kopiera länkar direkt till clipboard

### Asana Integration
- 📝 Sidebar med aktiva Asana-tasks
- 👤 Visar tasks för inloggad användare
- 📅 Visar deadlines för tasks
- 🔗 Kopiera task-länkar med ett klick

### Design
- 🌑 Minimalistisk svart bakgrund
- 💜 Lila accentfärg
- 🔲 Rundade hörn överallt
- ✨ Smooth transitions

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Lucide React för ikoner
- **Backend**: Python FastAPI, httpx för GitHub API-anrop
- **Infrastructure**: Docker Compose
- **Portar**: Frontend (8085), Backend (8086)

## Installation

1. **Klona projektet och skapa filstruktur:**
```bash
mkdir timerapport && cd timerapport
# Skapa alla filer från artifakterna
```

2. **Skapa API Tokens:**

   **GitHub Personal Access Token:**
   - Gå till GitHub → Settings → Developer settings → Personal access tokens
   - Skapa token med `repo` scope
   
   **Asana Personal Access Token:**
   - Gå till Asana → My Settings → Apps → Manage Developer Apps
   - Klicka på "Create New Personal Access Token"
   - Ge den ett namn och kopiera token

3. **Skapa de sista frontend-filerna:**

**frontend/src/index.js:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**frontend/src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**frontend/public/index.html:**
```html
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Timrapport</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

4. **Starta applikationen:**
```bash
docker-compose up --build
```

5. **Öppna i webbläsaren:**
   - Frontend: http://localhost:8085
   - Backend API: http://localhost:8086/docs

## Användning

1. **Första gången:**
   - Ange både GitHub och Asana tokens i popup-fönstret
   - Tokens sparas säkert i localStorage

2. **Lägg till repositories:**
   - Klicka på "Add repo" längst ner i dropdown
   - Klistra in GitHub URL (t.ex. `https://github.com/org/repo`)
   - Repos sparas lokalt och hämtar metadata från GitHub

3. **Arbeta med PRs:**
   - Välj repository från dropdown
   - Klicka på checkboxar för att välja PRs
   - Använd öppna/kopiera-knapparna för snabb åtkomst
   - Navigera mellan commits med pilarna

4. **Asana sidebar:**
   - Se alla dina aktiva tasks
   - Kopiera task-länkar direkt
   - Se deadlines för varje task

## API Endpoints

### Repository Management
- `GET /api/saved-repos` - Hämta sparade repositories med metadata
- `POST /api/saved-repos` - Lägg till nytt repository via URL
- `DELETE /api/saved-repos/{owner}/{repo}` - Ta bort repository

### GitHub Integration
- `GET /api/repos/{owner}/{repo}/pulls` - Hämta PRs för ett repo
- `GET /api/repos/{owner}/{repo}/pulls/{number}/commits` - Hämta commits med detaljerad info

### Favorites
- `GET /api/favorites` - Hämta favoriter
- `POST /api/favorites` - Uppdatera favoriter

### Asana Integration
- `GET /api/asana/me` - Hämta current user
- `GET /api/asana/tasks` - Hämta tasks för current user

## Nästa steg

- [ ] Asana-integration för tasks
- [ ] Koppling mellan GitHub PRs och Asana tasks
- [ ] Generering av timrapport i olika format
- [ ] Export-funktionalitet
- [ ] Bättre felhantering och användarfeedback

## Utveckling

För lokal utveckling utan Docker:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8086
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```
