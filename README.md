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

Download the
[Algolia apparel sample data](https://raw.githubusercontent.com/algolia/quickstarts/main/sample-data/apparel.csv)
(1,000 products) and import it in Supabase via **Table Editor** → **Insert** → **Import
data from CSV**. Name the table `apparel`, and select `objectID` as the primary key — the
connector requires it.

The importer creates the table and infers the column types, so there is no schema to run.

## Connect Algolia

Create the connector from the Algolia dashboard → **Data sources** → **Connectors** →
**Supabase**:

1. **Connect Supabase** — connect directly to prefill the database values.
2. **Transformation** — paste [`demo/transform.js`](demo/transform.js) into the wizard's
   transformation editor. Grab it as
   [raw text](https://raw.githubusercontent.com/cmmeyer/algolia-quickstart-products/main/demo/transform.js)
   to copy it cleanly. It maps `objectID`, returns only the attributes the index needs, and
   **derives `price_range` from `price`** — a transformation can compute fields, not just
   strip them. Check the preview: `weight`, `taxable`, `color`, `tags`, and
   `hierarchical_categories` should be gone, and `price_range` should be present.
   `units_sold` is kept on purpose — the ranking below uses it.
3. **Destination** — set the index name to `quickstart-products`. If you use a different
   name, set `VITE_ALGOLIA_INDEX_NAME` in your Vercel project settings to match.
4. **Task** — run a full reindex. Add a schedule if you want recurring syncs.

Redeploy, and search is live.

## Configure the index

The index needs four settings. The search UI reads all of them, and the first two fail
silently if unset.

No local checkout required. Grab `ALGOLIA_APP_ID` and `ALGOLIA_WRITE_API_KEY` from
**Environment Variables** in your Vercel project's left-hand menu, and apply all four in
one call:

```bash
curl -X PUT "https://YOUR_APP_ID.algolia.net/1/indexes/quickstart-products/settings" \
  -H "X-Algolia-API-Key: YOUR_WRITE_API_KEY" \
  -H "X-Algolia-Application-Id: YOUR_APP_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "attributesForFaceting": ["product_type", "price_range"],
    "attributesToSnippet": ["description:30"],
    "searchableAttributes": ["unordered(title)", "unordered(product_type)", "unordered(description)"],
    "customRanking": ["desc(units_sold)", "desc(price)"]
  }'
```

Then refresh the page. No redeploy is needed — the credentials and index name are already
in the built bundle, and only the index changed.

Or set them by hand in the Algolia dashboard on index `quickstart-products`, which needs no
key at all:

| Setting | Dashboard location | Value | If unset |
| --- | --- | --- | --- |
| `attributesForFaceting` | **Configuration** → **Facets** | `product_type`, `price_range` | Sidebar filters render empty |
| `attributesToSnippet` | **Configuration** → **Snippeting** | `description`, length `30` | Every card shows no description |
| `searchableAttributes` | **Configuration** → **Searchable attributes** | `title`, `product_type`, `description` | Defaults to all attributes |
| `customRanking` | **Configuration** → **Ranking and Sorting** | `desc(units_sold)`, `desc(price)` | Popular products no longer surface first |

`customRanking` is why [`demo/transform.js`](demo/transform.js) keeps `units_sold` despite
it being an internal column. Strip it from the transformation and that criterion silently
stops mattering.

## Local development

```bash
git clone https://github.com/cmmeyer/algolia-quickstart-products && cd algolia-quickstart-products
npm install
```

Then get credentials into `.env.local`, either way:

**From the CLI** — pulls them from the project you deployed:

```bash
npx vercel link
npx vercel env pull .env.local
```

**From the dashboard** — no CLI needed. Open **Environment Variables** in your Vercel
project's left-hand menu and reveal these:

| Variable | Needed for |
| --- | --- |
| `ALGOLIA_APP_ID` | the search UI |
| `ALGOLIA_SEARCH_API_KEY` | the search UI |

Paste them into `.env.local` as-is. There is no need to rename anything to `VITE_` — the
app accepts either shape. (`vercel env pull` also brings down `ALGOLIA_WRITE_API_KEY` and
`POSTGRES_URL`, neither of which the app reads.)

Then:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How it works

The Algolia integration injects three bare variables: `ALGOLIA_APP_ID`,
`ALGOLIA_SEARCH_API_KEY` and `ALGOLIA_WRITE_API_KEY`. Vite only exposes
`VITE_`-prefixed variables to the browser, so [`vite.config.ts`](vite.config.ts) maps the
two public ones onto `VITE_` names. The write key is never mapped.

| Variable                      | Purpose                              | Browser-safe?                                          |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------ |
| `VITE_ALGOLIA_APPLICATION_ID` | Identifies your Algolia application  | ✅ inlined into the bundle                              |
| `VITE_ALGOLIA_SEARCH_API_KEY` | Search key used by the frontend      | ✅ inlined into the bundle                              |
| `VITE_ALGOLIA_INDEX_NAME`     | Optional index override              | ✅ already `VITE_`-prefixed, so no mapping needed       |
| `ALGOLIA_WRITE_API_KEY`       | Indexing key                         | ❌ injected on Vercel, never mapped, never read by the app |
| `POSTGRES_URL`                | Supabase connection string           | ❌ never mapped; the frontend never reads Postgres       |

⚠️ Anything mapped onto `import.meta.env` is inlined into public JavaScript. Never add
`ALGOLIA_WRITE_API_KEY` or `POSTGRES_URL` to the `define` block in `vite.config.ts`. The
integration does inject the write key into the build environment, so this is a live
hazard, not a hypothetical one — it stays safe only because nothing maps it.

### About the search key's permissions

The key the integration provisions is broader than search-only. Its ACL is
`search, listIndexes, settings, browse`, scoped to **all indexes** in the application.
Those are all read permissions — it cannot write or delete — but `browse` plus
application-wide scope means anyone reading your public bundle can enumerate every index
in that Algolia application and export its full contents.

That is harmless for this sample dataset. Before pointing this template at an Algolia
application that also holds real data, create a dedicated key restricted to `search` on
just the one index (**Settings** → **API keys** → **New API key**) and set it as
`VITE_ALGOLIA_SEARCH_API_KEY` in your Vercel project, which overrides the injected value.

Internal columns never reach Algolia at all — the transformation strips them, so
`weight`, `taxable`, and the JSON columns stay in Supabase. `units_sold` is the one
deliberate exception, because the index ranks by it.

Key files:

- [`src/App.tsx`](src/App.tsx) — the InstantSearch UI (`algoliasearch` lite client)
- [`vite.config.ts`](vite.config.ts) — maps the injected Algolia values onto `VITE_` names
- [`demo/transform.js`](demo/transform.js) — canonical copy of the dashboard transformation

## Going to production

- Add authentication before exposing any write path — this template is read-only.
- Enable incremental sync with a soft-delete column so removals propagate to the index.
- Trigger the connector task from the [Ingestion API](https://www.algolia.com/doc/rest-api/ingestion/)
  as a server-side extension instead of the dashboard schedule.

## License

[MIT](LICENSE)
