import { f as spread_props } from "./server.js";
import { C as getLayerContext } from "./key.svelte.js";
import { n as Bar_canvas, r as Bar_svg, t as Bar_html } from "./Bar.html.js";
//#region node_modules/layerchart/dist/components/Bar/Bar.svelte
function Bar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			Bar_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			Bar_canvas($$renderer, spread_props([props]));
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			Bar_html($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Bar as default };

//# sourceMappingURL=Bar.js.map