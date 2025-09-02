# Expense Tracker PWA

Istruzioni:
1. Crea una cartella e salva i file: `index.html`, `styles.css`, `app.js`, `manifest.json`, `service-worker.js`, e le icone in `/icons/` (icon-192.png e icon-512.png).
2. Apri `index.html` in un server locale (consigliato) o pubblicalo su un hosting statico.
   - Per test locale: `npx serve .` oppure `python -m http.server 8080` dalla cartella.
3. Apri l'URL, il browser ti suggerirà di installare la PWA (Chrome/Edge/Firefox mobile con supporto).

Note tecniche:
- I dati sono salvati in `localStorage` (offline). Per backup/esportazione usa il pulsante Esporta CSV.
- Il service worker fornisce caching statico per offline basico. Se vuoi supporto offline completo (modifiche salvate quando offline e sincronizzate), serve una logica addizionale (background sync / server).

Personalizzazioni possibili (posso farle io su richiesta):
- Aggiungere autenticazione e sincronizzazione cloud (Firebase)
- Import/backup da file JSON
- Migliorare UI/UX e icone professionali
