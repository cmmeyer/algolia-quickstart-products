/* Configure the Algolia index used by this quickstart.
 *
 * Record import and index configuration are separate functions so either can run on its
 * own. By default only the index is configured, because the Supabase connector supplies
 * the records. Pass --with-records to load the sample apparel data straight into Algolia
 * and skip Supabase entirely:
 *
 *   npm run configure:index -- --with-records
 *
 * Needs ALGOLIA_WRITE_API_KEY. Treat that key as a secret; never commit it.
 */
import { algoliasearch } from "algoliasearch";
import ora from "ora";
import { loadEnv } from "vite";

const env = loadEnv(process.env.MODE ?? "dev", process.cwd(), "");

const appId = env.VITE_ALGOLIA_APPLICATION_ID || env.ALGOLIA_APP_ID;
const writeApiKey = env.ALGOLIA_WRITE_API_KEY;
const indexName = env.VITE_ALGOLIA_INDEX_NAME || "quickstart-products";

if (!appId) {
  throw new Error(
    "Missing VITE_ALGOLIA_APPLICATION_ID (or ALGOLIA_APP_ID) environment variable.",
  );
}

if (!writeApiKey) {
  throw new Error("Missing ALGOLIA_WRITE_API_KEY environment variable.");
}

const withRecords = process.argv.includes("--with-records");

const client = algoliasearch(appId, writeApiKey);
const spinner = ora();

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
  spinner.text = `Add configuration to ${indexName}...`;

  const { taskID } = await client.setSettings({
    indexName,
    indexSettings: {
      attributesForFaceting: ["product_type", "price_range"],
      searchableAttributes: [
        "unordered(title)",
        "unordered(product_type)",
        "unordered(description)",
      ],
      attributesToSnippet: ["description:30"],
      customRanking: ["desc(units_sold)", "desc(price)"],
    },
  });

  await client.waitForTask({ indexName, taskID });
}

try {
  spinner.start("Beginning index setup...");

  if (withRecords) {
    await indexProducts();
  }

  await configureIndex();
  spinner.succeed(
    withRecords
      ? "Successfully indexed and configured products."
      : "Successfully configured index.",
  );
} catch (error) {
  spinner.fail("Index configuration failed.");
  console.error(error);
  process.exitCode = 1;
}
