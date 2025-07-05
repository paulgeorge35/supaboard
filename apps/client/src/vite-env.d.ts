/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMAMI_APP_ID?: string;
  readonly VITE_UMAMI_HOST_URL?: string;
  readonly VITE_UMAMI_SCRIPT_PATH?: string;
  readonly VITE_ANALYTICS_ENABLED?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
