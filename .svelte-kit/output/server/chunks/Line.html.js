import { Nt as clsx, c as ensure_array_like, h as stringify, n as attr_style, o as derived, r as attributes, t as attr_class, u as props_id } from "./server.js";
import "./index-server2.js";
import { n as createDataMotionMap, r as createMotion } from "./motion.svelte.js";
import { t as getChartContext } from "./chart.js";
import { S as resolveStyleProp, T as getGeoContext, b as resolveDataProp, f as parseDashArray, h as getMarkData, o as renderPathData, t as createKey, u as dashArrayToGradient, v as hasAnyDataProp, x as resolveGeoDataPair, y as resolveColorProp } from "./key.svelte.js";
import { i as createId, r as MarkerWrapper } from "./Path.canvas.js";
import { i as pointsToAngleAndLength } from "./math.js";
import { merge } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
//#region node_modules/layerchart/dist/components/Line/Line.shared.svelte.js
var defaultKey = (_, i) => i;
function lineMarkInfo(props, dataMode) {
	if (!dataMode) return {};
	return {
		data: props.data,
		x: typeof props.x1 === "string" ? props.x1 : typeof props.x2 === "string" ? props.x2 : void 0,
		y: typeof props.y1 === "string" ? props.y1 : typeof props.y2 === "string" ? props.y2 : void 0,
		color: typeof props.stroke === "string" ? props.stroke : typeof props.fill === "string" ? props.fill : void 0
	};
}
/**
* Reactive state shared by every per-layer Line variant.
*/
var LineState = class {
	#getProps = () => ({});
	/**
	* Memoized props — the component's props closure allocates a fresh object
	* (it spreads `rest`), so calling it once per derived meant one allocation
	* per derived per update. Read it once here instead.
	*/
	#props = derived(() => this.#getProps());
	chartCtx = getChartContext();
	markData = getMarkData();
	geo = getGeoContext();
	#dataMode = derived(() => hasAnyDataProp(this.#props().x1, this.#props().y1, this.#props().x2, this.#props().y2));
	get dataMode() {
		return this.#dataMode();
	}
	set dataMode($$value) {
		return this.#dataMode($$value);
	}
	#resolvedData = derived(() => this.dataMode ? this.markData(this.#props().data) : []);
	#resolvedItems = derived(() => {
		if (!this.dataMode) return [];
		const keyFn = this.#props().key ?? defaultKey;
		return this.#resolvedData().map((d, i) => {
			const key = keyFn(d, i);
			const resolved = this.#resolveLine(d);
			const animated = this.#dataMotionMap?.get(key);
			return {
				d,
				key,
				x1: animated?.x1 ?? resolved.x1,
				y1: animated?.y1 ?? resolved.y1,
				x2: animated?.x2 ?? resolved.x2,
				y2: animated?.y2 ?? resolved.y2
			};
		});
	});
	get resolvedItems() {
		return this.#resolvedItems();
	}
	set resolvedItems($$value) {
		return this.#resolvedItems($$value);
	}
	#resolveLine(d) {
		const props = this.#props();
		if (this.geo.projection) {
			const [projX1, projY1] = resolveGeoDataPair(props.x1, props.y1, d, this.geo.projection);
			const [projX2, projY2] = resolveGeoDataPair(props.x2, props.y2, d, this.geo.projection);
			return {
				x1: projX1,
				y1: projY1,
				x2: projX2,
				y2: projY2
			};
		}
		return {
			x1: resolveDataProp(props.x1, d, this.chartCtx.xScale, 0),
			y1: resolveDataProp(props.y1, d, this.chartCtx.yScale, 0),
			x2: resolveDataProp(props.x2, d, this.chartCtx.xScale, 0),
			y2: resolveDataProp(props.y2, d, this.chartCtx.yScale, 0)
		};
	}
	#dashArrayResolved = derived(() => parseDashArray(this.#props().dashArray));
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
	#dataMotionMap = null;
	#motionX1;
	#motionY1;
	#motionX2;
	#motionY2;
	get motionX1() {
		return this.#motionX1.current;
	}
	get motionY1() {
		return this.#motionY1.current;
	}
	get motionX2() {
		return this.#motionX2.current;
	}
	get motionY2() {
		return this.#motionY2.current;
	}
	#staticFill = derived(() => typeof this.#props().fill === "string" ? this.#props().fill : void 0);
	get staticFill() {
		return this.#staticFill();
	}
	set staticFill($$value) {
		return this.#staticFill($$value);
	}
	#staticFillOpacity = derived(() => typeof this.#props().fillOpacity === "number" ? this.#props().fillOpacity : void 0);
	get staticFillOpacity() {
		return this.#staticFillOpacity();
	}
	set staticFillOpacity($$value) {
		return this.#staticFillOpacity($$value);
	}
	#staticStroke = derived(() => typeof this.#props().stroke === "string" ? this.#props().stroke : void 0);
	get staticStroke() {
		return this.#staticStroke();
	}
	set staticStroke($$value) {
		return this.#staticStroke($$value);
	}
	#staticStrokeWidth = derived(() => typeof this.#props().strokeWidth === "number" ? this.#props().strokeWidth : void 0);
	get staticStrokeWidth() {
		return this.#staticStrokeWidth();
	}
	set staticStrokeWidth($$value) {
		return this.#staticStrokeWidth($$value);
	}
	#staticOpacity = derived(() => typeof this.#props().opacity === "number" ? this.#props().opacity : void 0);
	get staticOpacity() {
		return this.#staticOpacity();
	}
	set staticOpacity($$value) {
		return this.#staticOpacity($$value);
	}
	#staticClassName = derived(() => typeof this.#props().class === "string" ? this.#props().class : void 0);
	get staticClassName() {
		return this.#staticClassName();
	}
	set staticClassName($$value) {
		return this.#staticClassName($$value);
	}
	#staticHeight = derived(() => typeof this.#props().strokeWidth === "number" ? `${this.#props().strokeWidth}px` : "1px");
	get staticHeight() {
		return this.#staticHeight();
	}
	set staticHeight($$value) {
		return this.#staticHeight($$value);
	}
	constructor(getProps) {
		this.#getProps = getProps;
		const initial = getProps();
		const initialX1 = initial.initialX1 ?? (typeof initial.x1 === "number" ? initial.x1 : 0);
		const initialY1 = initial.initialY1 ?? (typeof initial.y1 === "number" ? initial.y1 : 0);
		const initialX2 = initial.initialX2 ?? (typeof initial.x2 === "number" ? initial.x2 : 0);
		const initialY2 = initial.initialY2 ?? (typeof initial.y2 === "number" ? initial.y2 : 0);
		this.#motionX1 = createMotion(initialX1, () => typeof this.#props().x1 === "number" ? this.#props().x1 : 0, initial.motion);
		this.#motionY1 = createMotion(initialY1, () => typeof this.#props().y1 === "number" ? this.#props().y1 : 0, initial.motion);
		this.#motionX2 = createMotion(initialX2, () => typeof this.#props().x2 === "number" ? this.#props().x2 : 0, initial.motion);
		this.#motionY2 = createMotion(initialY2, () => typeof this.#props().y2 === "number" ? this.#props().y2 : 0, initial.motion);
		this.#dataMotionMap = createDataMotionMap(initial.motion);
		if (this.#dataMotionMap) this.#dataMotionMap;
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Line/Line.svg.svelte
function Line_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { x1, y1, x2, y2, marker, markerStart, markerMid, markerEnd, $$slots, $$events, ...rest } = $$props;
		const c = new LineState(() => ({
			x1,
			y1,
			x2,
			y2,
			marker,
			markerStart,
			markerMid,
			markerEnd,
			...rest
		}));
		const markerStartId = derived(() => markerStart || marker ? createId("marker-start", uid) : "");
		const markerMidId = derived(() => markerMid || marker ? createId("marker-mid", uid) : "");
		const markerEndId = derived(() => markerEnd || marker ? createId("marker-end", uid) : "");
		c.chartCtx.registerComponent({
			name: "Line",
			kind: "mark",
			markInfo: () => lineMarkInfo({
				x1,
				y1,
				x2,
				y2,
				...rest
			}, c.dataMode)
		});
		if (c.dataMode) {
			$$renderer.push("<!--[0-->");
			MarkerWrapper($$renderer, {
				id: markerStartId(),
				marker: markerStart ?? marker
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerMidId(),
				marker: markerMid ?? marker
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerEndId(),
				marker: markerEnd ?? marker
			});
			$$renderer.push(`<!----><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				const resolvedFill = resolveColorProp(rest.fill, item.d, c.chartCtx.cScale);
				const resolvedStroke = resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale);
				const resolvedFillOpacity = resolveStyleProp(rest.fillOpacity, item.d);
				const resolvedStrokeWidth = resolveStyleProp(rest.strokeWidth, item.d);
				const resolvedOpacity = resolveStyleProp(rest.opacity, item.d);
				const resolvedClass = resolveStyleProp(rest.class, item.d);
				$$renderer.push(`<line${attributes({
					...rest,
					x1: item.x1,
					y1: item.y1,
					x2: item.x2,
					y2: item.y2,
					fill: resolvedFill,
					stroke: resolvedStroke,
					"fill-opacity": resolvedFillOpacity,
					"stroke-width": resolvedStrokeWidth,
					opacity: resolvedOpacity,
					"marker-start": markerStartId() ? `url(#${markerStartId()})` : void 0,
					"marker-mid": markerMidId() ? `url(#${markerMidId()})` : void 0,
					"marker-end": markerEndId() ? `url(#${markerEndId()})` : void 0,
					"stroke-dasharray": c.dashArrayAttr,
					class: clsx(cls("lc-line", resolvedClass))
				}, void 0, void 0, void 0, 3)}></line>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><line${attributes({
				...rest,
				x1: c.motionX1,
				y1: c.motionY1,
				x2: c.motionX2,
				y2: c.motionY2,
				fill: c.staticFill,
				stroke: c.staticStroke,
				"fill-opacity": c.staticFillOpacity,
				"stroke-width": c.staticStrokeWidth,
				opacity: c.staticOpacity,
				"marker-start": markerStartId() ? `url(#${markerStartId()})` : void 0,
				"marker-mid": markerMidId() ? `url(#${markerMidId()})` : void 0,
				"marker-end": markerEndId() ? `url(#${markerEndId()})` : void 0,
				"stroke-dasharray": c.dashArrayAttr,
				class: clsx(cls("lc-line", c.staticClassName))
			}, void 0, void 0, void 0, 3)}></line>`);
			MarkerWrapper($$renderer, {
				id: markerStartId(),
				marker: markerStart ?? marker
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerMidId(),
				marker: markerMid ?? marker
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerEndId(),
				marker: markerEnd ?? marker
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Line/Line.canvas.svelte
function Line_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...rest } = $$props;
		const c = new LineState(() => rest);
		function getStyleOptions(styleOverrides, itemFill, itemStroke, itemFillOpacity, itemStrokeWidth, itemOpacity, itemClass) {
			return styleOverrides ? merge({ styles: { strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth } }, styleOverrides) : {
				styles: {
					fill: itemFill ?? rest.fill,
					fillOpacity: itemFillOpacity ?? c.staticFillOpacity,
					stroke: itemStroke ?? rest.stroke,
					strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth,
					opacity: itemOpacity ?? c.staticOpacity
				},
				classes: cls("lc-line", itemClass ?? c.staticClassName),
				style: [rest.style, c.dashArrayAttr ? `stroke-dasharray: ${c.dashArrayAttr}` : void 0].filter(Boolean).join("; ") || void 0
			};
		}
		function render(ctx, styleOverrides) {
			if (c.dataMode) for (const item of c.resolvedItems) {
				const styleOpts = getStyleOptions(styleOverrides, resolveColorProp(rest.fill, item.d, c.chartCtx.cScale), resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale), resolveStyleProp(rest.fillOpacity, item.d), resolveStyleProp(rest.strokeWidth, item.d), resolveStyleProp(rest.opacity, item.d), resolveStyleProp(rest.class, item.d));
				const pathData = `M ${item.x1},${item.y1} L ${item.x2},${item.y2}`;
				renderPathData(ctx, pathData, styleOpts);
			}
			else {
				const styleOpts = getStyleOptions(styleOverrides);
				const pathData = `M ${c.motionX1},${c.motionY1} L ${c.motionX2},${c.motionY2}`;
				renderPathData(ctx, pathData, styleOpts);
			}
		}
		const fillKey = createKey(() => rest.fill);
		const strokeKey = createKey(() => rest.stroke);
		c.chartCtx.registerComponent({
			name: "Line",
			kind: "mark",
			markInfo: () => lineMarkInfo(rest, c.dataMode),
			canvasRender: {
				render,
				events: {
					click: rest.onclick,
					pointerenter: rest.onpointerenter,
					pointermove: rest.onpointermove,
					pointerleave: rest.onpointerleave
				},
				deps: () => [
					c.dataMode,
					c.dataMode ? c.resolvedItems : null,
					c.motionX1,
					c.motionY1,
					c.motionX2,
					c.motionY2,
					fillKey.current,
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
//#region node_modules/layerchart/dist/components/Line/Line.html.svelte
function Line_html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...rest } = $$props;
		const c = new LineState(() => rest);
		c.chartCtx.registerComponent({
			name: "Line",
			kind: "mark",
			markInfo: () => lineMarkInfo(rest, c.dataMode)
		});
		if (c.dataMode) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				const resolvedStroke = resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale);
				const resolvedStrokeWidth = resolveStyleProp(rest.strokeWidth, item.d);
				const resolvedOpacity = resolveStyleProp(rest.opacity, item.d);
				const resolvedClass = resolveStyleProp(rest.class, item.d);
				const { angle, length } = pointsToAngleAndLength({
					x: item.x1,
					y: item.y1
				}, {
					x: item.x2,
					y: item.y2
				});
				$$renderer.push(`<div${attr_class(clsx(cls("lc-line", resolvedClass)))}${attr_style(rest.style, {
					position: "absolute",
					left: `${stringify(item.x1)}px`,
					top: `${stringify(item.y1)}px`,
					width: `${stringify(length)}px`,
					height: `${stringify(resolvedStrokeWidth ?? 1)}px`,
					transform: `translateY(-50%) rotate(${stringify(angle)}deg)`,
					"transform-origin": "0 50%",
					opacity: resolvedOpacity,
					background: c.dashArrayResolved ? dashArrayToGradient(c.dashArrayResolved, resolvedStroke ?? "var(--stroke-color)") : void 0,
					"background-color": c.dashArrayResolved ? void 0 : resolvedStroke
				})}></div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			const { angle, length } = pointsToAngleAndLength({
				x: c.motionX1,
				y: c.motionY1
			}, {
				x: c.motionX2,
				y: c.motionY2
			});
			$$renderer.push(`<div${attr_class(clsx(cls("lc-line", c.staticClassName)))}${attr_style(rest.style, {
				position: "absolute",
				left: `${stringify(c.motionX1)}px`,
				top: `${stringify(c.motionY1)}px`,
				width: `${stringify(length)}px`,
				height: c.staticHeight,
				transform: `translateY(-50%) rotate(${stringify(angle)}deg)`,
				"transform-origin": "0 50%",
				opacity: c.staticOpacity,
				background: c.dashArrayResolved ? dashArrayToGradient(c.dashArrayResolved, c.staticStroke ?? "var(--stroke-color)") : void 0,
				"background-color": c.dashArrayResolved ? void 0 : c.staticStroke
			})}></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Line_canvas as n, Line_svg as r, Line_html as t };

//# sourceMappingURL=Line.html.js.map