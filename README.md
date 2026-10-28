An expenses tracker built with React, served and bundled by [Vite](https://vite.dev/).

Use the Node version pinned in `.nvmrc` (`nvm use`) for everything in this
repository: the app, the sync server in `server/`, CI and `deploy.sh`.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

### `npm test`

Runs the unit and integration tests once with Jest. Use `npm run test:watch`
for the interactive watch mode, and pass Jest options after `--`, e.g.
`npm test -- --testPathPatterns="integrationTests"`.

### `npm run build`

Builds the app for production to the `build` folder, then generates its
service worker (`workbox-config.js`).

The build is minified and the filenames include the hashes.<br />
`npm run preview` serves the finished build locally.

### `npm run sync-server`

Compiles and runs the multi-user sync server (see `server/README.md`).

### `./deploy.sh` and `./stop.sh`

Deploy the app and the sync server behind Tailscale, and stop them again
(see `docs/deployment/tailscale-sync.md`).
