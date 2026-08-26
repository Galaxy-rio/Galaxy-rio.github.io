// @ts-check
import { defineConfig } from "astro/config";

const [owner = "", repository = ""] =
  (process.env.GITHUB_REPOSITORY ?? "").split("/");

const isProjectPage =
  Boolean(owner && repository) && repository !== `${owner}.github.io`;

export default defineConfig({
  output: "static",
  site: owner ? `https://${owner}.github.io` : undefined,
  base: isProjectPage ? `/${repository}` : "/",
  trailingSlash: "always",
});
