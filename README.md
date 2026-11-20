# RandSight

A monthly money review for a fictional bank customer: what changed from one month to the next, down to the payments that made the difference.

The engineering docs live in [`docs/`](docs/architecture.md) and are also served at `/docs`.

## Run with Docker

```sh
git clone https://github.com/SimzKubeka/randsight.git
cd randsight
docker build -t randsight .
docker run --rm -p 3000:3000 randsight
```

Open http://localhost:3000 and choose **Get started free**. The sign-in page lists the demo login (Thandi, a fictional customer).

The database is created and seeded inside the container on the first request. To keep it between runs, mount a volume: `-v randsight-data:/app/data`.

If the site will be served from another address, pass it at build time so canonical URLs and the sitemap point there:

```sh
docker build --build-arg SITE_URL=https://randsight.example -t randsight .
```

## Run with Node

Needs Node 24.

```sh
npm ci
npm run build
DATABASE_PATH="$PWD/data/randsight.db" npm start
```

`DATABASE_PATH` must be absolute: the production server changes into `.next/standalone` when it starts.

For development, `npm run dev` serves http://localhost:3000 with the database in `data/`.

## Checks

```sh
npm run typecheck
npm run lint
npm test            # unit tests
npm run test:e2e    # builds, then runs the browser tests at phone and desktop sizes
```

CI runs the same checks on every pull request, plus the dashboard tests against the Docker image.
