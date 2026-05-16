import { defineConfig } from "vite";
import { readFileSync } from "fs";
import { resolve } from "path";
import { specifyJsSeoPlugin } from "@asymmetric-effort/specifyjs/build";
import { specifyJsNoscriptPlugin } from "@asymmetric-effort/specifyjs/build";

const VERSION = readFileSync(resolve(__dirname, "../VERSION"), "utf-8").trim();

export default defineConfig({
  base: "/",
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
  },
  build: {
    outDir: "dist",
  },
  plugins: [
    specifyJsSeoPlugin({
      siteUrl: "https://jsonlint.asymmetric-effort.com",
      title: "@asymmetric-effort/jsonlint",
      description:
        "A zero-dependency JSON parser, linter, and validator with detailed error reporting",
      npmPackage: "@asymmetric-effort/jsonlint",
      author: "Asymmetric Effort, LLC",
      license: "MIT",
      repository: "https://github.com/asymmetric-effort/jsonlint",
      routes: ["/", "/#/validator", "/#/cli", "/#/api"],
      robotsRules: ["Disallow: /private/"],
      jsonLd: {
        "@type": "SoftwareSourceCode",
        name: "@asymmetric-effort/jsonlint",
        description:
          "A zero-dependency JSON parser, linter, and validator with detailed error reporting",
        codeRepository: "https://github.com/asymmetric-effort/jsonlint",
        programmingLanguage: "TypeScript",
        license: "https://opensource.org/licenses/MIT",
        author: {
          "@type": "Organization",
          name: "Asymmetric Effort, LLC",
        },
      },
    }),
    specifyJsNoscriptPlugin({
      title: "@asymmetric-effort/jsonlint",
      description:
        "A zero-dependency JSON parser, linter, and validator with detailed error reporting",
      copyright: `MIT License \u00A9 2026 Asymmetric Effort, LLC`,
      sections: [
        {
          id: "installation",
          title: "Installation",
          html: "<pre><code>npm install @asymmetric-effort/jsonlint</code></pre>",
        },
        {
          id: "cli",
          title: "CLI Usage",
          html: "<pre><code>jsonlint [OPTIONS] [FILE]</code></pre><p>Validates, formats, and optionally transforms JSON files.</p>",
        },
        {
          id: "api",
          title: "API",
          html: '<pre><code>import { parse } from "@asymmetric-effort/jsonlint";</code></pre>',
        },
      ],
    }),
  ],
});
