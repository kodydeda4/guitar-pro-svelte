import { Nt as clsx, a as bind_props, c as ensure_array_like, h as stringify, o as derived, r as attributes } from "./server.js";
import "./index-server2.js";
import { n as createDataMotionMap, r as createMotion } from "./motion.svelte.js";
import { t as getChartContext } from "./chart.js";
import { S as resolveStyleProp, T as getGeoContext, a as renderCircle, b as resolveDataProp, f as parseDashArray, h as getMarkData, t as createKey, v as hasAnyDataProp, x as resolveGeoDataPair, y as resolveColorProp } from "./key.svelte.js";
import { merge } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
//#region node_modules/layerchart/dist/components/Circle/Circle.shared.svelte.js
var defaultKey = (_, i) => i;
function resolveCircle(d, props, chartCtx, geo) {
	const cxDefault = typeof props.cx === "number" ? props.cx : props.cx == null && chartCtx.config.x != null ? Number(chartCtx.xGet(d)) || 0 : 0;
	const cyDefault = typeof props.cy === "number" ? props.cy : props.cy == null && chartCtx.config.y != null ? Number(chartCtx.yGet(d)) || 0 : 0;
	const rDefault = typeof props.r === "number" ? props.r : props.r == null && chartCtx.config.r != null ? Number(chartCtx.rGet(d)) || 1 : 1;
	if (geo.projection) {
		const [projX, projY] = resolveGeoDataPair(props.cx, props.cy, d, geo.projection);
		return {
			cx: projX,
			cy: projY,
			r: resolveDataProp(props.r, d, chartCtx.rScale, rDefault)
		};
	}
	return {
		cx: resolveDataProp(props.cx, d, chartCtx.xScale, cxDefault),
		cy: resolveDataProp(props.cy, d, chartCtx.yScale, cyDefault),
		r: resolveDataProp(props.r, d, chartCtx.rScale, rDefault)
	};
}
/**
* Reactive state shared by every per-layer Circle variant. Instantiate from
* each `Circle.svg.svelte` / `Circle.canvas.svelte` / `Circle.html.svelte`
* component setup, passing a getter for the props. Exposes the derived
* computations + motion sources every layer needs.
*
* Per-layer specific bits (e.g. SVG's `bind:this` ref, HTML's
* `staticBorderWidth`, canvas's `render` function and canvas registration)
* stay in their respective `.svelte` files.
*/
var CircleState = class {
	#getProps = () => ({});
	chartCtx = getChartContext();
	markData = getMarkData();
	geo = getGeoContext();
	#dashArrayResolved = derived(() => parseDashArray(this.#getProps().dashArray));
	get dashArrayResolved() {
		return this.#dashArrayResolved();
	}
	set dashArrayResolved($$value) {
		return this.#dashArrayResolved($$value);
	}
	#dashArrayAttr = derived(() => this.dashArrayResolved ? this.dashArrayResolved.join(" ") : void 0);
	get dashArrayAttr() {
		return this.#dashArrayAttr();
	}
	set dashArrayAttr($$value) {
		return this.#dashArrayAttr($$value);
	}
	#dataMode = derived(() => this.#getProps().data != null || hasAnyDataProp(this.#getProps().cx, this.#getProps().cy, this.#getProps().r));
	get dataMode() {
		return this.#dataMode();
	}
	set dataMode($$value) {
		return this.#dataMode($$value);
	}
	#resolvedData = derived(() => this.dataMode ? this.markData(this.#getProps().data) : []);
	#dataMotionMap = null;
	#resolvedItems = derived(() => {
		if (!this.dataMode) return [];
		const props = this.#getProps();
		const keyFn = props.key ?? defaultKey;
		return this.#resolvedData().map((d, i) => {
			const key = keyFn(d, i);
			const resolved = resolveCircle(d, props, this.chartCtx, this.geo);
			const animated = this.#dataMotionMap?.get(key);
			return {
				d,
				key,
				cx: animated?.cx ?? resolved.cx,
				cy: animated?.cy ?? resolved.cy,
				r: animated?.r ?? resolved.r
			};
		});
	});
	get resolvedItems() {
		return this.#resolvedItems();
	}
	set resolvedItems($$value) {
		return this.#resolvedItems($$value);
	}
	#motionCx;
	#motionCy;
	#motionR;
	#staticFill = derived(() => typeof this.#getProps().fill === "string" ? this.#getProps().fill : void 0);
	get staticFill() {
		return this.#staticFill();
	}
	set staticFill($$value) {
		return this.#staticFill($$value);
	}
	#staticFillOpacity = derived(() => typeof this.#getProps().fillOpacity === "number" ? this.#getProps().fillOpacity : void 0);
	get staticFillOpacity() {
		return this.#staticFillOpacity();
	}
	set staticFillOpacity($$value) {
		return this.#staticFillOpacity($$value);
	}
	#staticStroke = derived(() => typeof this.#getProps().stroke === "string" ? this.#getProps().stroke : void 0);
	get staticStroke() {
		return this.#staticStroke();
	}
	set staticStroke($$value) {
		return this.#staticStroke($$value);
	}
	#staticStrokeWidth = derived(() => typeof this.#getProps().strokeWidth === "number" ? this.#getProps().strokeWidth : void 0);
	get staticStrokeWidth() {
		return this.#staticStrokeWidth();
	}
	set staticStrokeWidth($$value) {
		return this.#staticStrokeWidth($$value);
	}
	#staticOpacity = derived(() => typeof this.#getProps().opacity === "number" ? this.#getProps().opacity : void 0);
	get staticOpacity() {
		return this.#staticOpacity();
	}
	set staticOpacity($$value) {
		return this.#staticOpacity($$value);
	}
	#staticClassName = derived(() => typeof this.#getProps().class === "string" ? this.#getProps().class : void 0);
	get staticClassName() {
		return this.#staticClassName();
	}
	set staticClassName($$value) {
		return this.#staticClassName($$value);
	}
	constructor(getProps) {
		this.#getProps = getProps;
		const initial = getProps();
		const initialCx = initial.initialCx ?? (typeof initial.cx === "number" ? initial.cx : 0);
		const initialCy = initial.initialCy ?? (typeof initial.cy === "number" ? initial.cy : 0);
		const initialR = initial.initialR ?? (typeof initial.r === "number" ? initial.r : 1);
		this.#motionCx = createMotion(initialCx, () => typeof getProps().cx === "number" ? getProps().cx : 0, initial.motion);
		this.#motionCy = createMotion(initialCy, () => typeof getProps().cy === "number" ? getProps().cy : 0, initial.motion);
		this.#motionR = createMotion(initialR, () => typeof getProps().r === "number" ? getProps().r : 1, initial.motion);
		this.#dataMotionMap = createDataMotionMap(initial.motion);
		if (this.#dataMotionMap) this.#dataMotionMap;
	}
	get motionCx() {
		return this.#motionCx.current;
	}
	get motionCy() {
		return this.#motionCy.current;
	}
	get motionR() {
		return this.#motionR.current;
	}
};
/** Build the standard `markInfo` payload used by every Circle variant. */
function circleMarkInfo(props, dataMode) {
	if (!dataMode) return {};
	return {
		data: props.data,
		x: typeof props.cx === "string" ? props.cx : void 0,
		y: typeof props.cy === "string" ? props.cy : void 0,
		color: typeof props.fill === "string" ? props.fill : void 0
	};
}
//#endregion
//#region node_modules/layerchart/dist/components/Circle/Circle.svg.svelte
function Circle_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, $$slots, $$events, ...rest } = $$props;
		const c = new CircleState(() => rest);
		c.chartCtx.registerComponent({
			name: "Circle",
			kind: "mark",
			markInfo: () => circleMarkInfo(rest, c.dataMode)
		});
		if (c.dataMode) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				const resolvedFill = resolveColorProp(rest.fill, item.d, c.chartCtx.cScale);
				const resolvedStroke = resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale);
				const resolvedFillOpacity = resolveStyleProp(rest.fillOpacity, item.d);
				const resolvedStrokeWidth = resolveStyleProp(rest.strokeWidth, item.d);
				const resolvedOpacity = resolveStyleProp(rest.opacity, item.d);
				const resolvedClass = resolveStyleProp(rest.class, item.d);
				$$renderer.push(`<circle${attributes({
					...rest,
					cx: item.cx,
					cy: item.cy,
					r: item.r,
					fill: resolvedFill,
					"fill-opacity": resolvedFillOpacity,
					stroke: resolvedStroke,
					"stroke-width": resolvedStrokeWidth,
					opacity: resolvedOpacity,
					"stroke-dasharray": c.dashArrayAttr,
					class: clsx(cls("lc-circle", resolvedClass))
				}, void 0, void 0, void 0, 3)}></circle>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push(`<!--[-1--><circle${attributes({
			...rest,
			cx: c.motionCx,
			cy: c.motionCy,
			r: c.motionR,
			fill: c.staticFill,
			"fill-opacity": c.staticFillOpacity,
			stroke: c.staticStroke,
			"stroke-width": c.staticStrokeWidth,
			opacity: c.staticOpacity,
			"stroke-dasharray": c.dashArrayAttr,
			class: clsx(cls("lc-circle", c.staticClassName))
		}, void 0, void 0, void 0, 3)}></circle>`);
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Circle/Circle.canvas.svelte
function Circle_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...rest } = $$props;
		const c = new CircleState(() => rest);
		function getStyleOptions(styleOverrides, itemFill, itemStroke, itemFillOpacity, itemStrokeWidth, itemOpacity, itemClass) {
			return styleOverrides ? merge({ styles: { strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth } }, styleOverrides) : {
				styles: {
					fill: itemFill ?? rest.fill,
					fillOpacity: itemFillOpacity ?? c.staticFillOpacity,
					stroke: itemStroke ?? rest.stroke,
					strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth,
					opacity: itemOpacity ?? c.staticOpacity
				},
				classes: cls("lc-circle", itemClass ?? c.staticClassName),
				style: [rest.style, c.dashArrayAttr ? `stroke-dasharray: ${c.dashArrayAttr}` : void 0].filter(Boolean).join("; ") || void 0
			};
		}
		function render(ctx, styleOverrides) {
			if (c.dataMode) for (const item of c.resolvedItems) {
				const styleOpts = getStyleOptions(styleOverrides, resolveColorProp(rest.fill, item.d, c.chartCtx.cScale), resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale), resolveStyleProp(rest.fillOpacity, item.d), resolveStyleProp(rest.strokeWidth, item.d), resolveStyleProp(rest.opacity, item.d), resolveStyleProp(rest.class, item.d));
				renderCircle(ctx, item, styleOpts);
			}
			else {
				const styleOpts = getStyleOptions(styleOverrides);
				renderCircle(ctx, {
					cx: c.motionCx,
					cy: c.motionCy,
					r: c.motionR
				}, styleOpts);
			}
		}
		const fillKey = createKey(() => rest.fill);
		const strokeKey = createKey(() => rest.stroke);
		c.chartCtx.registerComponent({
			name: "Circle",
			kind: "mark",
			markInfo: () => circleMarkInfo(rest, c.dataMode),
			canvasRender: {
				render,
				events: {
					click: rest.onclick,
					pointerdown: rest.onpointerdown,
					pointerenter: rest.onpointerenter,
					pointermove: rest.onpointermove,
					pointerleave: rest.onpointerleave
				},
				deps: () => [
					c.dataMode,
					c.dataMode ? c.resolvedItems : null,
					c.motionCx,
					c.motionCy,
					c.motionR,
					fillKey.current,
					rest.fillOpacity,
					strokeKey.current,
					rest.strokeWidth,
					rest.opacity,
					rest.class,
					rest.style,
					c.dashArrayAttr
				]
			}
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Circle/Circle.html.svelte
function Circle_html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, $$slots, $$events, ...rest } = $$props;
		const c = new CircleState(() => rest);
		const staticBorderWidth = derived(() => typeof rest.strokeWidth === "number" ? `${rest.strokeWidth}px` : typeof rest.stroke === "string" ? "1px" : void 0);
		c.chartCtx.registerComponent({
			name: "Circle",
			kind: "mark",
			markInfo: () => circleMarkInfo(rest, c.dataMode)
		});
		if (c.dataMode) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				const resolvedFill = resolveColorProp(rest.fill, item.d, c.chartCtx.cScale);
				const resolvedStroke = resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale);
				const resolvedStrokeWidth = resolveStyleProp(rest.strokeWidth, item.d);
				const resolvedOpacity = resolveStyleProp(rest.opacity, item.d);
				const resolvedClass = resolveStyleProp(rest.class, item.d);
				const resolvedBorderWidth = resolvedStrokeWidth != null ? `${resolvedStrokeWidth}px` : resolvedStroke != null ? "1px" : void 0;
				$$renderer.push(`<div${attributes({
					...rest,
					class: clsx(cls("lc-circle", resolvedClass))
				}, void 0, void 0, {
					position: "absolute",
					left: `${stringify(item.cx)}px`,
					top: `${stringify(item.cy)}px`,
					width: `${stringify(item.r * 2)}px`,
					height: `${stringify(item.r * 2)}px`,
					"border-radius": "50%",
					background: resolvedFill,
					"background-origin": "border-box",
					opacity: resolvedOpacity,
					"border-width": resolvedBorderWidth,
					"border-color": resolvedStroke,
					"border-style": c.dashArrayResolved ? "dashed" : "solid",
					transform: "translate(-50%, -50%)"
				})}></div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({
				...rest,
				class: clsx(cls("lc-circle", c.staticClassName))
			}, void 0, void 0, {
				position: "absolute",
				left: `${stringify(c.motionCx)}px`,
				top: `${stringify(c.motionCy)}px`,
				width: `${stringify(c.motionR * 2)}px`,
				height: `${stringify(c.motionR * 2)}px`,
				"border-radius": "50%",
				background: c.staticFill,
				"background-origin": "border-box",
				opacity: c.staticOpacity,
				"border-width": staticBorderWidth(),
				"border-color": c.staticStroke,
				"border-style": c.dashArrayResolved ? "dashed" : "solid",
				transform: "translate(-50%, -50%)"
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Circle_canvas as n, Circle_svg as r, Circle_html as t };

//# sourceMappingURL=Circle.html.js.map