# Algolia × Supabase × Vercel Quickstart

A minimal [Vite](https://vite.dev) + React starter for instant, typo-tolerant search over
Postgres data. [Supabase](https://supabase.com) stores the products,
[Algolia](https://www.algolia.com) searches them, and the
[Algolia Supabase connector](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data/connectors/supabase)
keeps the index in sync — no sync code in the app.

This is the deployable companion to the connector quickstart: finish the quickstart, click
Deploy, and search runs over your own data.

## Deploy your own

The button installs both integrations on your new project — Supabase provisions a Postgres
database, Algolia provisions an application — and injects their environment variables.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?from=templates&project-name=Algolia%20Supabase%20Quickstart&repository-name=algolia-quickstart-products&repository-url=https%3A%2F%2Fgithub.com%2Fcmmeyer%2Falgolia-quickstart-products&products=%255B%257B%2522type%2522%253A%2522integration%2522%252C%2522protocol%2522%253A%2522other%2522%252C%2522productSlug%2522%253A%2522application%2522%252C%2522integrationSlug%2522%253A%2522algolia%2522%257D%252C%257B%2522type%2522%253A%2522integration%2522%252C%2522protocol%2522%253A%2522storage%2522%252C%2522productSlug%2522%253A%2522supabase%2522%252C%2522integrationSlug%2522%253A%2522supabase%2522%257D%255D)

The first deploy renders a "Search is not configured yet" panel until you complete the two
steps below. That is expected — the index does not exist yet.

## Set up the database

Order matters here. Create the table first, then import the data.

1. **Create the table.** Paste [`demo/schema.sql`](demo/schema.sql) into the Supabase
   **SQL Editor** and run it.
2. **Import the data.** Download the
   [Algolia apparel sample data](https://raw.githubusercontent.com/algolia/quickstarts/main/sample-data/apparel.csv)
   (1,000 products) and import it into the `apparel` table via **Table Editor** →
   **Insert** → **Import data from CSV**, following Supabase's
   [import instructions](https://supabase.com/docs/guides/database/import-data).

Letting the CSV import create the table instead would store the JSON columns as `text` and
leave `objectID` without a primary key — which the connector requires.

## Connect Algolia

Create the connector from the Algolia dashboard → **Data sources** → **Connectors** →
**Supabase**:

1. **Connect Supabase** — connect directly to prefill the database values.
2. **Transformation** — paste [`demo/transform.js`](demo/transform.js) into the wizard's
   transformation editor. It maps `objectID`, returns only the attributes the UI needs, and
   **derives `price_range` from `price`** — a transformation can compute fields, not just
   strip them. Check the preview: `units_sold`, `weight`, `taxable`, `color`, `tags`, and
   `hierarchical_categories` should all be gone, and `price_range` should be present.
3. **Destination** — set the index name to `quickstart-products`. If you use a different
   name, set `VITE_ALGOLIA_INDEX_NAME` in your Vercel project settings to match.
4. **Task** — run a full reindex. Add a schedule if you want recurring syncs.

Redeploy, and search is live.

## Configure the index

Two settings, in the Algolia dashboard on index `quickstart-products`.

**Facets** — **Configuration** → **Facets** → *Attributes for faceting*. The sidebar
filters read these:

- `product_type`
- `price_range`

**Snippeting** — **Configuration** → **Snippeting** → *Attributes to snippet*. The product
cards render a truncated description through InstantSearch's `Snippet` widget, which
returns nothing at all unless the attribute is snippeted:

- `description`, length `30`

Skip this step and search still works, but the sidebar renders empty and every card shows
no description.

## Local development

```bash
git clone https://github.com/cmmeyer/algolia-quickstart-products && cd algolia-quickstart-products
npm install
npx vercel link              # link to the project you deployed
npx vercel env pull .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Without a Vercel project, copy [`.env.example`](.env.example) to `.env.local` and fill in
your Algolia credentials by hand.

## How it works

The integrations inject these environment variables. Vite only exposes `VITE_`-prefixed
variables to the browser, and the Algolia integration does not use that prefix — so
[`vite.config.ts`](vite.config.ts) maps the values it needs onto `VITE_` names. Only the
two public Algolia values are mapped.

| Variable                        | Purpose                                     | Browser-safe?                                     |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `VITE_ALGOLIA_APPLICATION_ID`   | Identifies your Algolia application         | ✅ inlined into the bundle                        |
| `VITE_ALGOLIA_SEARCH_API_KEY`   | Search-only key used by the frontend        | ✅ inlined into the bundle                        |
| `VITE_ALGOLIA_INDEX_NAME`       | Optional index override                     | ✅ inlined; defaults to `quickstart-products`     |
| `POSTGRES_URL`                  | Supabase connection string                  | ❌ never mapped; the frontend never reads Postgres |
| `ALGOLIA_WRITE_API_KEY`         | Indexing key                                | ❌ local-only; the connector indexes from the dashboard |

⚠️ Anything mapped onto `import.meta.env` is inlined into public JavaScript. Never add the
write key or `POSTGRES_URL` to the `define` block in `vite.config.ts`. The write key is
deliberately left unprefixed so it cannot reach the browser even by accident.

Internal columns never reach Algolia at all — the transformation strips them, so
`units_sold`, `weight`, `taxable`, and the JSON columns stay in Supabase.

Key files:

- [`src/App.tsx`](src/App.tsx) — the InstantSearch UI (`algoliasearch` lite client)
- [`vite.config.ts`](vite.config.ts) — maps integration-injected env vars onto `VITE_` names
- [`demo/schema.sql`](demo/schema.sql) — table definition for the sample dataset
- [`demo/transform.js`](demo/transform.js) — canonical copy of the dashboard transformation

### Seeding without the connector

`npm run index:products` pushes records straight to Algolia using
[`scripts/indexing.ts`](scripts/indexing.ts) and `ALGOLIA_WRITE_API_KEY`. It is an escape
hatch for trying the UI before setting up a connector; the connector is the intended path.

## Going to production

- Add authentication before exposing any write path — this template is read-only.
- Enable incremental sync with a soft-delete column so removals propagate to the index.
- Trigger the connector task from the [Ingestion API](https://www.algolia.com/doc/rest-api/ingestion/)
  as a server-side extension instead of the dashboard schedule.

## License

[MIT](LICENSE)
