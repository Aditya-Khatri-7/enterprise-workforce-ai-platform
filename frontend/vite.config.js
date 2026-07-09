import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from the current directory (frontend)
  const env = loadEnv(mode, process.cwd(), '');

  // Support both RECAPTCHA_SITE_KEY (from Render environment) and VITE_RECAPTCHA_SITE_KEY (from local .env)
  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || env.VITE_RECAPTCHA_SITE_KEY || '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify(recaptchaSiteKey.trim())
    }
  }
})

