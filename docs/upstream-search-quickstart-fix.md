# Upstream: proposed fixes to the core search quickstart

Found while building this template against
[`algolia/quickstarts`](https://github.com/algolia/quickstarts) →
`product-search-react-typescript`. 

None of this concerns the Supabase connector quickstart.

---

## 1. `attributesToSnippet` is never set, so descriptions render empty

- `src/App.tsx:52` renders `<Snippet attribute="description" hit={hit} />`
- `scripts/indexing.ts` sets only `attributesForFaceting: ["product_type"]`

`Snippet` reads `_snippetResult`, which Algolia omits entirely unless the attribute is
listed in `attributesToSnippet`. The widget renders nothing — no error, no warning, no
console output. Every product card simply shows an empty description.

`<Highlight>` in the same card works fine, because Algolia highlights all searchable
attributes by default. That asymmetry makes the failure easy to miss: one widget works,
its neighbour doesn't.

### Fix

```diff
   const { taskID } = await client.setSettings({
     indexName,
     indexSettings: {
       attributesForFaceting: ["product_type"],
+      attributesToSnippet: ["description:30"],
     },
   });
```

### Why it likely went unnoticed

The script's header notes the app "already uses a hosted demo index and runs without it."
If that hosted index has `attributesToSnippet` configured, the app looks correct to anyone
who skips indexing — and breaks only for readers who index their own data, which is what
the README tells them to do. **Worth confirming the hosted index's settings.**

---

## 2. `setSettings` is coupled to the record import

**Not a bug, but it blocks a real use case.**

In the current script, `setSettings` lives *inside* `indexProducts()`. There is no way to
configure an index without also re-importing every record.

That matters for anyone whose records arrive from somewhere else — a connector, an
existing pipeline, their own data. They need the quickstart's index settings, but running
the script would overwrite their records with the sample apparel data.

### Proposed shape

Two independent functions. Same default behaviour, but each step is separately callable:

```ts
async function indexProducts() {
  spinner.text = "Fetching the products dataset...";

  const response = await fetch(
    "https://dashboard.algolia.com/api/1/sample_datasets?type=apparel",
  );

  if (!response.ok) {
    throw new Error(
      `Error fetching products dataset: ${response.status} ${response.statusText}`,
    );
  }

  const products = await response.json();

  spinner.text = `Indexing ${products.length.toLocaleString()} products into ${indexName}...`;

  await client.saveObjects({
    indexName,
    objects: products,
    waitForTasks: true,
  });
}

async function configureIndex() {
  spinner.text = `Configuring ${indexName}...`;

  const { taskID } = await client.setSettings({
    indexName,
    indexSettings: {
      attributesForFaceting: ["product_type"],
      attributesToSnippet: ["description:30"],
    },
  });

  await client.waitForTask({ indexName, taskID });
}

try {
  spinner.start("Beginning index setup...");
  await indexProducts();
  await configureIndex();
  spinner.succeed("Successfully indexed and configured products.");
} catch (error) {
  spinner.fail("Indexing failed.");
  console.error(error);
  process.exitCode = 1;
}
```

This template used exactly that split — calling only `configureIndex()`, because the
Supabase connector supplied the records. Without the split it would have had to choose
between correct index settings and its own data.

---

## Out of scope: connector-only seams

Recorded for completeness. Neither belongs in the search quickstart, since its dataset does
not contain `price_range` — verified against
`dashboard.algolia.com/api/1/sample_datasets?type=apparel`, which returns the same 12
attributes as the CSV and no `price_range`.

- **`price_range` faceting.** Exists only because the Supabase connector's transformation
  derives it. Combining the two quickstarts requires adding it to `attributesForFaceting`
  yourself.

---

## Reproduction

Verified end to end on a freshly provisioned Algolia application:

1. Imported the 1,000-row apparel dataset into Supabase, synced to Algolia via the
   connector.
2. Queried the index: `_snippetResult` absent from every hit, `_highlightResult` present.
   `facets` returned `{}`.
3. Deployed app showed results with images, titles and prices — no description text, and
   both facet headers rendering with nothing beneath them.
4. Applied `attributesToSnippet` and `attributesForFaceting`, re-queried:
   `_snippetResult` populated, facet values returned, UI correct.
