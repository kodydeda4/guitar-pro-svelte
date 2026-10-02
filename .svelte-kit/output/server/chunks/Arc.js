import { f as spread_props } from "./server.js";
import { C as getLayerContext } from "./key.svelte.js";
import { n as Arc_svg, t as Arc_canvas } from "./Arc.canvas.js";
//#region node_modules/layerchart/dist/components/Arc/Arc.svelte
function Arc($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			Arc_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			Arc_canvas($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Arc as default };

//# sourceMappingURL=Arc.js.map