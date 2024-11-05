interface ImportMetaEnv {
  readonly MAIN_VITE_DATABASE_URL: string;
  readonly MAIN_VITE_OPENAI_API_KEY: string;
  readonly MAIN_VITE_APP_DATABASE_URL4: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
