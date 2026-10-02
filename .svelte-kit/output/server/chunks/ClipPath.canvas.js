import { Mt as attr, h as stringify, n as attr_style, o as derived, r as attributes, u as props_id } from "./server.js";
import { t as getChartContext } from "./chart.js";
import { i as createId } from "./Path.canvas.js";
//#region node_modules/layerchart/dist/components/ClipPath/ClipPath.shared.svelte.js
var ClipPathState = class {
	#getProps = () => ({});
	chartCtx = getChartContext();
	#outerRect = derived(() => `M0,0 H${this.chartCtx.width} V${this.chartCtx.height} H0 Z`);
	get outerRect() {
		return this.#outerRect();
	}
	set outerRect($$value) {
		return this.#outerRect($$value);
	}
	#effectivePath = derived(() => {
		const props = this.#getProps();
		return props.invert && props.path ? `${this.outerRect} ${props.path}` : props.path;
	});
	get effectivePath() {
		return this.#effectivePath();
	}
	set effectivePath($$value) {
		return this.#effectivePath($$value);
	}
	constructor(getProps) {
		this.#getProps = getProps;
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/ClipPath/ClipPath.svg.svelte
function ClipPath_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("clipPath-", uid), useId, disabled = false, children, clip, $$slots, $$events, ...rest } = $$props;
		const c = new ClipPathState(() => ({
			id,
			useId,
			disabled,
			children,
			clip,
			...rest
		}));
		const url = derived(() => `url(#${id})`);
		$$renderer.push(`<defs><clipPath${attributes({
			id,
			...rest
		}, void 0, void 0, void 0, 3)}>`);
		if (clip) {
			$$renderer.push("<!--[0-->");
			clip($$renderer, { id });
			$$renderer.push(`<!---->`);
		} else if (c.effectivePath) $$renderer.push(`<!--[1--><path${attr("d", c.effectivePath)}${attr("clip-rule", rest.invert ? "evenodd" : void 0)}></path>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if (useId) $$renderer.push(`<!--[0--><use${attr("href", `#${stringify(useId)}`)}></use>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></clipPath></defs>`);
		if (children) {
			$$renderer.push("<!--[0-->");
			if (disabled) {
				$$renderer.push("<!--[0-->");
				children($$renderer, {
					id,
					url: url(),
					useId
				});
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push(`<!--[-1--><g class="lc-clip-path-g"${attr_style("", { "clip-path": url() })}>`);
				children($$renderer, {
					id,
					url: url(),
					useId
				});
				$$renderer.push(`<!----></g>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/ClipPath/ClipPath.canvas.svelte
function ClipPath_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("clipPath-", uid), useId, disabled = false, invert = false, children, $$slots, $$events, ...rest } = $$props;
		const c = new ClipPathState(() => ({
			id,
			useId,
			disabled,
			invert,
			children,
			...rest
		}));
		const url = derived(() => `url(#${id})`);
		const canvasPath = derived(() => c.effectivePath ? new Path2D(c.effectivePath) : void 0);
		c.chartCtx.registerComponent({
			name: "ClipPath",
			kind: "group",
			canvasRender: {
				render: (ctx) => {
					if (!disabled && canvasPath()) ctx.clip(canvasPath(), invert ? "evenodd" : "nonzero");
				},
				deps: () => [
					disabled,
					canvasPath(),
					invert
				]
			}
		});
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, {
				id,
				url: url(),
				useId
			});
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { ClipPath_svg as n, ClipPathState as r, ClipPath_canvas as t };

//# sourceMappingURL=ClipPath.canvas.js.map