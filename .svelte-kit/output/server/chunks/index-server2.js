import { C as lifecycle_function_unavailable, S as ssr_context } from "./server.js";
//#region node_modules/svelte/src/index-server.js
/** @import { SSRContext } from '#server' */
/** @import { Renderer } from './internal/server/renderer.js' */
/** @param {() => void} fn */
function onDestroy(fn) {
	/** @type {Renderer} */ ssr_context.r.on_destroy(fn);
}
function mount() {
	lifecycle_function_unavailable("mount");
}
function unmount() {
	lifecycle_function_unavailable("unmount");
}
async function tick() {}
//#endregion
export { unmount as i, onDestroy as n, tick as r, mount as t };

//# sourceMappingURL=index-server2.js.map