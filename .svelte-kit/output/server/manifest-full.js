export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	app_dir: "_app",
	app_path: "_app",
	assets: new Set([]),
	mime_types: {},
	client: {start:"_app/immutable/entry/start.wneDHipu.js",app:"_app/immutable/entry/app.B6NN35rN.js",imports:["_app/immutable/entry/start.wneDHipu.js","_app/immutable/entry/payload.DSmR2FwN.js","_app/immutable/chunks/BaNbYf_w.js","_app/immutable/chunks/DmtI8X8K.js","_app/immutable/chunks/BVhaMCeB.js","_app/immutable/chunks/BMrKpEc3.js","_app/immutable/chunks/CEnW-XE8.js","_app/immutable/entry/app.B6NN35rN.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
	
	nodes: [
		__memo(() => import('./nodes/0.js')),
		__memo(() => import('./nodes/1.js')),
		__memo(() => import('./nodes/2.js'))
	],
	remotes: {
		
	},
	routes: [
		{
			id: "/",
			pattern: /^\/$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 2 },
			endpoint: null
		}
	],
	prerendered_routes: new Set([]),
	matchers: async () => {
		return {};
	},
	server_assets: {}
}
})();
