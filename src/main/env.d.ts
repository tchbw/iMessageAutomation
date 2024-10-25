interface ImportMetaEnv {
  readonly MAIN_VITE_DATABASE_URL: string
  readonly MAIN_VITE_OPENAI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
