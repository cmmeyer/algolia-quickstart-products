import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The empty prefix reads every variable from .env files and process.env. This call
  // exposes nothing on its own -- only the values hand-picked into `define` below are
  // inlined into the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')

  const pick = (...names: string[]) => names.map((name) => env[name]).find(Boolean) ?? ''

  return {
    plugins: [react()],
    // The Vercel Algolia integration injects its own variable names, and none of them
    // are VITE_-prefixed, so Vite cannot see them. Map the public values onto the VITE_
    // names the app reads. VITE_ is checked first, so setting those directly still wins.
    //
    // NEVER map ALGOLIA_WRITE_API_KEY or POSTGRES_URL here. Anything defined on
    // import.meta.env is inlined into the public bundle.
    define: {
      'import.meta.env.VITE_ALGOLIA_APPLICATION_ID': JSON.stringify(
        pick(
          'VITE_ALGOLIA_APPLICATION_ID',
          'ALGOLIA_APP_ID',
          'ALGOLIA_APPLICATION_ID',
          'NEXT_PUBLIC_ALGOLIA_APP_ID',
        ),
      ),
      'import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY': JSON.stringify(
        pick(
          'VITE_ALGOLIA_SEARCH_API_KEY',
          'ALGOLIA_SEARCH_API_KEY',
          'NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY',
        ),
      ),
      'import.meta.env.VITE_ALGOLIA_INDEX_NAME': JSON.stringify(
        pick('VITE_ALGOLIA_INDEX_NAME', 'ALGOLIA_INDEX_NAME'),
      ),
    },
  }
})
