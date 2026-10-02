import { f as spread_props } from "./server.js";
import { C as getLayerContext } from "./key.svelte.js";
import { n as Points_canvas, r as Points_svg, t as Points_html } from "./Points.html.js";
//#region node_modules/layerchart/dist/components/Points/Points.svelte
function Points($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			Points_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			Points_canvas($$renderer, spread_props([props]));
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			Points_html($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Points as default };

//# sourceMappingURL=Points.js.map