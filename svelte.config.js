import adapterAuto from "@sveltejs/adapter-auto";
import adapterCloudflare from "@sveltejs/adapter-cloudflare";

const isCloudflare = process.env.CF_PAGES === '1';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// Cloudflare-Adapter nur beim echten Deployment, lokal adapter-auto
		adapter: isCloudflare ? adapterCloudflare() : adapterAuto()
	}
};

export default config;