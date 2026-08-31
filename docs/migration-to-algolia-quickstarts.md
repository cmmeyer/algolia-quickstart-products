# Migration plan: move this quickstart into `algolia/quickstarts`

Destination: a new directory in
[`algolia/quickstarts`](https://github.com/algolia/quickstarts), beside
[`product-search-react-typescript`](https://github.com/algolia/quickstarts/tree/main/product-search-react-typescript).

**Do this on the work machine.** This repo lives under the personal account `cmmeyer` to
keep Vercel's cross-SaaS provisioning working; pushing to the `algolia` org needs the work
identity instead. Nothing in the migration itself depends on Vercel.

---

## 1. Decide the directory name

The sibling names itself after its stack: `product-search-react-typescript`. This one is
distinguished by the Supabase connector, so something like
`product-search-supabase-connector` or `product-search-supabase-vercel`.

This name then drives:

- the directory in `algolia/quickstarts`
- `package.json` → `name` (the sibling sets it to its directory name)
- every absolute link listed in step 3

## 2. Files that should not travel

| File | Why |
| --- | --- |
| `docs/upstream-search-quickstart-fix.md` | It reports a bug in `product-search-react-typescript`. Filing that *inside* the repo it concerns is odd — raise it as an issue or PR against the sibling instead. |
| `docs/migration-to-algolia-quickstarts.md` | This file. |
| `LICENSE` | `algolia/quickstarts` carries a repo-level MIT license, and the sibling ships no per-directory `LICENSE`. Keep the `"license": "MIT"` field in `package.json`. |

## 3. Absolute links that must be rewritten

Relative links keep working after the move. These do not:

| Location | Currently | Needs |
| --- | --- | --- |
| `README.md` — Deploy button | `repository-url=https://github.com/cmmeyer/algolia-quickstart-products` | `https://github.com/algolia/quickstarts`, plus a way to point at the subdirectory — see step 4 |
| `README.md` — Connect Algolia | `raw.githubusercontent.com/cmmeyer/algolia-quickstart-products/main/demo/transform.js` | `raw.githubusercontent.com/algolia/quickstarts/main/<dir>/demo/transform.js` |
| `README.md` — Local development | `git clone https://github.com/cmmeyer/...` | The sibling uses `npx gitpick algolia/quickstarts/tree/main/<dir>`, which fetches one directory. Worth matching. |

## 4. The Deploy button in a monorepo — the main unknown

`vercel.com/new/clone` clones `repository-url` into a new repo. From a monorepo it also has
to know which subdirectory holds the app, or the build runs at the repo root and fails.

**Unverified:** whether `/new/clone` accepts a root-directory parameter. Confirm before
assuming the button survives the move. If it does not, the options are:

- have the button clone the whole `quickstarts` repo and document setting **Root Directory**
  in Vercel project settings as a manual step, or
- drop the button from this README and describe importing manually plus adding both
  integrations, or
- keep a standalone deployable mirror repo purely to back the button.

For reference, the sibling solves the equivalent problem for Netlify with a `netlify.toml`
declaring `base = "product-search-react-typescript"`. Vercel's counterpart is the project's
Root Directory setting, which is not currently expressible in this repo.

Note also that the button always *clones*, so testing it while owning the source repo
produces a name collision and a `-1` suffix. That is an artifact of ownership, not a bug.

## 5. Converge on the sibling's tooling

Already done in this repo:

- eslint with the sibling's exact `eslint.config.js`, replacing oxlint
- `ora` and `tsx` as devDependencies, not dependencies
- `"license": "MIT"` in `package.json`

Still divergent, decide deliberately:

| Item | Here | Sibling |
| --- | --- | --- |
| `@types/node` | `^24.13.3` | `^26.1.2` |
| `engines` | `node >= 22` | absent |
| `allowScripts` | absent | pins `esbuild`, `fsevents` |
| Hosting config | none | `netlify.toml` |

## 6. Docs side

The sibling's README points at
[Build your first search experience](https://www.algolia.com/doc/guides/get-started/quickstart).
This one is the companion to the Supabase connector quickstart, so that page should link
here once the directory exists.

## 7. Verify after the move

1. `npm install && npm run build && npm run lint` from the new directory.
2. `npm run configure:index` against a scratch Algolia app.
3. Every README link resolves, especially the rewritten absolute ones.
4. The Deploy button end to end, if step 4 resolved in its favour.
5. `--with-records` — untested to date, because running it writes 1,000 records. Try it
   against a scratch app before publishing.
