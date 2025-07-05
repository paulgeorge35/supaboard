/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMAMI_APP_ID?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
