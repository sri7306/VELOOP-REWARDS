# VELOOP Rewards Management and Exchange Center

A responsive rewards web application built with HTML5, CSS3, vanilla JavaScript, Node.js, Express, and SQLite. The platform supports user accounts, Gems earning activities, Gems-to-VEs conversion, a rewards marketplace, wallet balances, transactions, offers, notifications, profile management, security, and support tickets.

## Important reward rules

The application uses exactly two reward units: **Gems** and **VEs**. The supplied `gem(4).svg` and `ve(4).svg` assets are stored in `assets/svg/` and should not be edited. The platform is a demo rewards application and does not represent real-money exchange.

## Requirements

- Node.js 18 or newer
- npm
- A terminal such as PowerShell or Windows Terminal

## Run locally

1. Extract the project folder.
2. Open a terminal in `VELOOP-REWARDS`.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Set a long random `SESSION_SECRET` in `.env`.
6. Start the application:

   ```bash
   npm start
   ```

7. Open `http://localhost:3000`.

The database and sample reward records are initialized automatically when the server starts.

## Create an account

Open `http://localhost:3000/register.html`, complete the registration form, and log in with the account you created. A new account starts with demo balances of 171.95 Gems and 968.62 VEs. These values are demonstration data, not real assets.

## Main modules

- Landing page and authentication pages
- Dashboard and shared responsive navigation
- Exchange Center with preview and confirmation
- Gems earning activities with duplicate-claim protection
- Rewards marketplace with VE redemption
- Wallet and transaction history
- Offers and notifications
- Profile and password management
- Help and support tickets

## API

The backend exposes REST endpoints under `/api`. You can check the service using `GET /api/health`. Protected endpoints require a valid server session.

## Security and production limitations

This is a learning and demonstration project. Before production use:

- Configure HTTPS and a strong secret in environment variables.
- Use a persistent session store and persistent database storage.
- Configure a real email provider before enabling verification and password-reset flows.
- Review CSRF protection, rate limits, input validation, monitoring, backups, and deployment settings.
- Add automated integration and end-to-end tests.
- Review all security decisions before accepting real users.

Password hashes use bcrypt. Login sessions are server-side and stored in SQLite. Password reset and email verification delivery are explicitly not implemented because no email provider or token delivery is configured. The app does not falsely claim that these emails have been sent.

## Tests

Run:

```bash
npm test
```

These basic tests check project configuration and the presence of the supplied SVG assets. They are not a substitute for complete integration or end-to-end testing.

## Folder overview

- `css/` — global styles, app layout, page styles, responsive rules
- `js/` — frontend behavior and API client
- `server/` — Express server, routes, database helpers
- `database/` — SQLite schema and seed data
- `assets/svg/` — official Gem and VE artwork
- `tests/` — basic project tests

## Deployment

Deploy the Node.js application to a host that supports Node.js and persistent SQLite storage, or adapt the database layer to a managed database. Configure environment variables on the host and use HTTPS. Do not deploy the app with the development session secret or treat this demo as a production-ready financial platform.
