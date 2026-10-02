# Development notes

- The application was supplied as a Portuguese HTML/JavaScript prototype. It is now split into `index.html`, `styles.css`, and `app.js`; preserve the prototype's behavior unless a change is requested.
- Run `docker compose -f docker-compose.base44.yml up -d`. The frontend serves live checkout files on port 3000 with polling enabled; the node_modules volume is synchronized with `npm ci` on startup.
- Records use browser localStorage keys `appointments`, `patients`, `walkins`, and `doctors`. There is no backend, shared database, authentication, or external messaging integration. Use fictitious data only. Clearing browser storage removes records.
- The agenda is fixed demonstration content; the supplied dashboard counts and lists all appointments despite its 'today' wording. Messages only display a simulated-send notification. Walk-in notes are not persisted in the supplied behavior.
- Fixed two startup blockers in the supplied code: the unclosed patient-search input and invalid apostrophe escaping. User text is escaped before HTML rendering.
- Verify startup with `curl -fsS http://localhost:3000/` and confirm the response contains `/@vite/client`. Run `docker compose -f docker-compose.base44.yml exec -T web npm run build` for compilation verification.
- Browser checks should cover page navigation, doctor creation, booking validation and creation, walk-in creation, patient search, and simulated messaging. Each created record should also appear in localStorage. Deletes use native confirmation dialogs and require confirmation during testing.
