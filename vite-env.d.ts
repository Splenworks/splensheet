/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
declare const APP_VERSION: string
declare module "virtual:commit-hash" {
  const CommitHash: string
  export default CommitHash
}
