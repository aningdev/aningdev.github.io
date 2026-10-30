import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import expressiveCode from "astro-expressive-code";
import { defineConfig, svgoOptimizer } from "astro/config";
import { expressiveCodeOptions, siteConfig } from "./src/site.config";

import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import { rehypeBasePath } from "./src/plugins/rehype-base-path";
import { remarkAdmonitions } from "./src/plugins/remark-admonitions";
import { remarkReadingTime } from "./src/plugins/remark-reading-time";
import { rehypeTableScroll } from "./src/plugins/rehype-table-scroll";
import { getExternalPostIds, getPostLastModified } from "./src/utils/sitemap";
import { remarkMermaid } from "./src/plugins/remark-mermaid";
import { remarkHasMath } from "./src/plugins/remark-has-math";

import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeUnwrapImages from "rehype-unwrap-images";

// Defaults to root; the deploy workflow sets BASE_PATH for subpath hosts
// (GitHub Pages project sites). See "Base path" in the README.
const BASE_PATH = process.env.BASE_PATH || "/";
const START_URL = BASE_PATH.endsWith("/") ? BASE_PATH : `${BASE_PATH}/`;
const postLastModified = getPostLastModified();
const externalPostIds = getExternalPostIds();

export default defineConfig({
	site: process.env.SITE_URL || "https://anjay-goel.github.io",
	base: BASE_PATH,
	build: {
		inlineStylesheets: "always",
	},
	integrations: [
		...(siteConfig.analytics?.googleAnalyticsId
			? [partytown({ config: { forward: ["dataLayer.push"] } })]
			: []),
		expressiveCode(expressiveCodeOptions),
		sitemap({
			changefreq: "weekly",
			priority: 0.7,
			filter(page) {
				const path = new URL(page).pathname.slice(START_URL.length);
				const id = path.match(/^posts\/(.+?)\/?$/)?.[1];
				return !(id && externalPostIds.has(decodeURIComponent(id)));
			},
			serialize(item) {
				const path = new URL(item.url).pathname.slice(START_URL.length);
				const id = path.match(/^posts\/(.+?)\/?$/)?.[1];
				const lastmod = id && postLastModified.get(decodeURIComponent(id));
				if (lastmod) item.lastmod = lastmod.toISOString();
				return item;
			},
		}),
		mdx(),
		(await import("@playform/compress")).default(),
	],
	// Astro 7 defaults to Sätteri; opt back into remark/rehype. Plugins go
	// inside unified() only — top-level arrays would double-run them.
	markdown: {
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},
		processor: unified({
			rehypePlugins: [
				rehypeUnwrapImages,
				rehypeTableScroll,
				[rehypeBasePath, { base: BASE_PATH }],
				// rehype-katex must run before rehype-external-links so the latter
				// doesn't rewrite anchors inside katex's emitted DOM.
				rehypeKatex,
				[
					rehypeExternalLinks,
					{
						rel: ["nofollow", "noreferrer"],
						target: "_blank",
					},
				],
			],
			remarkPlugins: [
				remarkMermaid,
				remarkReadingTime,
				remarkDirective,
				remarkAdmonitions,
				remarkMath,
				remarkHasMath,
			],
			remarkRehype: {
				footnoteLabelProperties: {
					className: [""],
				},
			},
		}),
	},

	vite: {
		optimizeDeps: {
			exclude: ["@resvg/resvg-js"],
		},
		plugins: [tailwindcss()],
	},
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "viewport",
	},
	experimental: {
		clientPrerender: true,
		incrementalBuild: true,
		parallelPrerender: true,
		redirectPage: true,
		svgOptimizer: svgoOptimizer(),
	},
});
