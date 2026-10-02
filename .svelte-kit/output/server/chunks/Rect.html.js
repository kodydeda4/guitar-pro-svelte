import { Nt as clsx, a as bind_props, c as ensure_array_like, h as stringify, o as derived, r as attributes } from "./server.js";
import "./index-server2.js";
import { n as createDataMotionMap, o as parseMotionProp, r as createMotion } from "./motion.svelte.js";
import { t as getChartContext } from "./chart.js";
import { S as resolveStyleProp, T as getGeoContext, b as resolveDataProp, f as parseDashArray, h as getMarkData, p as roundedRectPath, s as renderRect, t as createKey, v as hasAnyDataProp, x as resolveGeoDataPair, y as resolveColorProp } from "./key.svelte.js";
import { i as resolveInsets, r as resolveCorners, t as cornersUniform } from "./rect.svelte.js";
import { merge } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
//#region node_modules/layerchart/dist/components/Rect/Rect.shared.svelte.js
var defaultKey = (_, i) => i;
function rectMarkInfo(props, dataMode) {
	if (!dataMode) return {};
	return {
		data: props.data,
		x: typeof props.x === "string" ? props.x : void 0,
		y: typeof props.y === "string" ? props.y : void 0,
		color: typeof props.fill === "string" ? props.fill : typeof props.stroke === "string" ? props.stroke : void 0
	};
}
/**
* Reactive state shared by every per-layer Rect variant.
*/
var RectState = class {
	#getProps = () => ({});
	/**
	* Memoized props. `#getProps()` allocates a fresh object (it spreads `rest`),
	* so calling it once per derived meant ~30 allocations per instance per update.
	*/
	#props = derived(() => this.#getProps());
	chartCtx = getChartContext();
	markData = getMarkData();
	geo = getGeoContext();
	#hasEdgeProps = derived(() => hasAnyDataProp(this.#props().x0, this.#props().y0, this.#props().x1, this.#props().y1));
	get hasEdgeProps() {
		return this.#hasEdgeProps();
	}
	set hasEdgeProps($$value) {
		return this.#hasEdgeProps($$value);
	}
	#dataMode = derived(() => hasAnyDataProp(this.#props().x, this.#props().y, this.#props().width, this.#props().height) || this.hasEdgeProps);
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
			const resolved = this.#resolveRect(d);
			const animated = this.#dataMotionMap?.get(key);
			return {
				d,
				key,
				x: animated?.x ?? resolved.x,
				y: animated?.y ?? resolved.y,
				width: animated?.width ?? resolved.width,
				height: animated?.height ?? resolved.height
			};
		});
	});
	get resolvedItems() {
		return this.#resolvedItems();
	}
	set resolvedItems($$value) {
		return this.#resolvedItems($$value);
	}
	#resolveRect(d) {
		const props = this.#props();
		const resolvedInsets = resolveInsets(props.insets);
		if (this.hasEdgeProps) {
			let rx0, rx1p, ry0, ry1p;
			if (this.geo.projection) {
				[rx0, ry0] = resolveGeoDataPair(props.x0, props.y0, d, this.geo.projection);
				[rx1p, ry1p] = resolveGeoDataPair(props.x1, props.y1, d, this.geo.projection);
			} else {
				rx0 = resolveDataProp(props.x0, d, this.chartCtx.xScale, 0);
				rx1p = resolveDataProp(props.x1, d, this.chartCtx.xScale, 0);
				ry0 = resolveDataProp(props.y0, d, this.chartCtx.yScale, 0);
				ry1p = resolveDataProp(props.y1, d, this.chartCtx.yScale, 0);
			}
			const left = Math.min(rx0, rx1p) + resolvedInsets.left;
			const right = Math.max(rx0, rx1p) - resolvedInsets.right;
			const top = Math.min(ry0, ry1p) + resolvedInsets.top;
			const bottom = Math.max(ry0, ry1p) - resolvedInsets.bottom;
			return {
				x: left,
				y: top,
				width: Math.max(0, right - left),
				height: Math.max(0, bottom - top)
			};
		} else {
			let resolvedX, resolvedY;
			if (this.geo.projection) [resolvedX, resolvedY] = resolveGeoDataPair(props.x, props.y, d, this.geo.projection);
			else {
				resolvedX = resolveDataProp(props.x, d, this.chartCtx.xScale, 0);
				resolvedY = resolveDataProp(props.y, d, this.chartCtx.yScale, 0);
			}
			return {
				x: resolvedX + resolvedInsets.left,
				y: resolvedY + resolvedInsets.top,
				width: Math.max(0, resolveDataProp(props.width, d, void 0, 0) - resolvedInsets.left - resolvedInsets.right),
				height: Math.max(0, resolveDataProp(props.height, d, void 0, 0) - resolvedInsets.top - resolvedInsets.bottom)
			};
		}
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
	#cornersUniformValue = derived(() => {
		const corners = this.#props().corners;
		if (corners === void 0) return void 0;
		if (typeof corners === "number") return corners;
		const resolved = resolveCorners(corners, Infinity, Infinity);
		return cornersUniform(resolved) ? resolved[0] : void 0;
	});
	get cornersUniformValue() {
		return this.#cornersUniformValue();
	}
	set cornersUniformValue($$value) {
		return this.#cornersUniformValue($$value);
	}
	#cornersNonUniform = derived(() => this.#props().corners !== void 0 && this.cornersUniformValue === void 0);
	get cornersNonUniform() {
		return this.#cornersNonUniform();
	}
	set cornersNonUniform($$value) {
		return this.#cornersNonUniform($$value);
	}
	#rx = derived(() => Number(this.#props().rx ?? this.#props().ry ?? this.cornersUniformValue) || 0);
	get rx() {
		return this.#rx();
	}
	set rx($$value) {
		return this.#rx($$value);
	}
	#ry = derived(() => Number(this.#props().ry ?? this.#props().rx ?? this.cornersUniformValue) || 0);
	get ry() {
		return this.#ry();
	}
	set ry($$value) {
		return this.#ry($$value);
	}
	#dataMotionMap = null;
	#motionX;
	#motionY;
	#motionWidth;
	#motionHeight;
	get motionX() {
		return this.#motionX.current;
	}
	get motionY() {
		return this.#motionY.current;
	}
	get motionWidth() {
		return this.#motionWidth.current;
	}
	get motionHeight() {
		return this.#motionHeight.current;
	}
	resolveCorners(width, height) {
		const corners = this.#props().corners;
		if (corners === void 0) return void 0;
		return resolveCorners(corners, width, height);
	}
	roundedRectPath(x, y, width, height) {
		const corners = this.resolveCorners(width, height);
		if (!corners || !this.cornersNonUniform) return void 0;
		return roundedRectPath(x, y, width, height, corners);
	}
	borderRadius(width, height) {
		const corners = this.resolveCorners(width, height);
		return corners ? corners.map((c) => `${c}px`).join(" ") : void 0;
	}
	#resolvedCorners = derived(() => {
		return this.resolveCorners(this.motionWidth, this.motionHeight);
	});
	get resolvedCorners() {
		return this.#resolvedCorners();
	}
	set resolvedCorners($$value) {
		return this.#resolvedCorners($$value);
	}
	#borderRadiusStyle = derived(() => this.resolvedCorners ? this.resolvedCorners.map((c) => `${c}px`).join(" ") : void 0);
	get borderRadiusStyle() {
		return this.#borderRadiusStyle();
	}
	set borderRadiusStyle($$value) {
		return this.#borderRadiusStyle($$value);
	}
	#pixelPathData = derived(() => {
		if (this.resolvedCorners && this.cornersNonUniform) return roundedRectPath(this.motionX, this.motionY, this.motionWidth, this.motionHeight, this.resolvedCorners);
	});
	get pixelPathData() {
		return this.#pixelPathData();
	}
	set pixelPathData($$value) {
		return this.#pixelPathData($$value);
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
	#staticStrokeOpacity = derived(() => typeof this.#props().strokeOpacity === "number" ? this.#props().strokeOpacity : void 0);
	get staticStrokeOpacity() {
		return this.#staticStrokeOpacity();
	}
	set staticStrokeOpacity($$value) {
		return this.#staticStrokeOpacity($$value);
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
	#staticBorderWidth = derived(() => {
		const props = this.#props();
		if (typeof props.strokeWidth === "number") return `${props.strokeWidth}px`;
		if (typeof props.stroke === "string") return "1px";
	});
	get staticBorderWidth() {
		return this.#staticBorderWidth();
	}
	set staticBorderWidth($$value) {
		return this.#staticBorderWidth($$value);
	}
	constructor(getProps) {
		this.#getProps = getProps;
		const initial = getProps();
		const initialX = initial.initialX ?? (typeof initial.x === "number" ? initial.x : 0);
		const initialY = initial.initialY ?? (typeof initial.y === "number" ? initial.y : 0);
		const initialWidth = initial.initialWidth ?? (typeof initial.width === "number" ? initial.width : 0);
		const initialHeight = initial.initialHeight ?? (typeof initial.height === "number" ? initial.height : 0);
		const motion = initial.motion;
		this.#motionX = createMotion(initialX, () => typeof this.#props().x === "number" ? this.#props().x : 0, motion === void 0 ? void 0 : parseMotionProp(motion, "x"));
		this.#motionY = createMotion(initialY, () => typeof this.#props().y === "number" ? this.#props().y : 0, motion === void 0 ? void 0 : parseMotionProp(motion, "y"));
		this.#motionWidth = createMotion(initialWidth, () => typeof this.#props().width === "number" ? this.#props().width : 0, motion === void 0 ? void 0 : parseMotionProp(motion, "width"));
		this.#motionHeight = createMotion(initialHeight, () => typeof this.#props().height === "number" ? this.#props().height : 0, motion === void 0 ? void 0 : parseMotionProp(motion, "height"));
		this.#dataMotionMap = createDataMotionMap(motion);
		if (this.#dataMotionMap) this.#dataMotionMap;
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Rect/Rect.svg.svelte
function Rect_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, x, y, width, height, rx: rxProp, ry: ryProp, children, $$slots, $$events, ...rest } = $$props;
		const c = new RectState(() => ({
			x,
			y,
			width,
			height,
			rx: rxProp,
			ry: ryProp,
			...rest
		}));
		c.chartCtx.registerComponent({
			name: "Rect",
			kind: "mark",
			markInfo: () => rectMarkInfo({
				x,
				y,
				width,
				height,
				rx: rxProp,
				ry: ryProp,
				...rest
			}, c.dataMode)
		});
		if (c.dataMode) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				const resolvedFill = resolveColorProp(rest.fill, item.d, c.chartCtx.cScale);
				const resolvedStroke = resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale);
				const resolvedFillOpacity = resolveStyleProp(rest.fillOpacity, item.d);
				const resolvedStrokeOpacity = resolveStyleProp(rest.strokeOpacity, item.d);
				const resolvedStrokeWidth = resolveStyleProp(rest.strokeWidth, item.d);
				const resolvedOpacity = resolveStyleProp(rest.opacity, item.d);
				const resolvedClass = resolveStyleProp(rest.class, item.d);
				const pathData = c.roundedRectPath(item.x, item.y, item.width, item.height);
				if (pathData) $$renderer.push(`<!--[0--><path${attributes({
					...rest,
					d: pathData,
					fill: resolvedFill,
					"fill-opacity": resolvedFillOpacity,
					stroke: resolvedStroke,
					"stroke-opacity": resolvedStrokeOpacity,
					"stroke-width": resolvedStrokeWidth,
					opacity: resolvedOpacity,
					"stroke-dasharray": c.dashArrayAttr,
					class: clsx(cls("lc-rect", resolvedClass))
				}, void 0, void 0, void 0, 3)}></path>`);
				else $$renderer.push(`<!--[-1--><rect${attributes({
					...rest,
					x: item.x,
					y: item.y,
					width: item.width,
					height: item.height,
					fill: resolvedFill,
					"fill-opacity": resolvedFillOpacity,
					stroke: resolvedStroke,
					"stroke-opacity": resolvedStrokeOpacity,
					"stroke-width": resolvedStrokeWidth,
					opacity: resolvedOpacity,
					rx: c.rx,
					ry: c.ry,
					"stroke-dasharray": c.dashArrayAttr,
					class: clsx(cls("lc-rect", resolvedClass))
				}, void 0, void 0, void 0, 3)}></rect>`);
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		} else if (c.pixelPathData) $$renderer.push(`<!--[1--><path${attributes({
			...rest,
			d: c.pixelPathData,
			fill: c.staticFill,
			"fill-opacity": c.staticFillOpacity,
			stroke: c.staticStroke,
			"stroke-opacity": c.staticStrokeOpacity,
			"stroke-width": c.staticStrokeWidth,
			opacity: c.staticOpacity,
			"stroke-dasharray": c.dashArrayAttr,
			class: clsx(cls("lc-rect", c.staticClassName))
		}, void 0, void 0, void 0, 3)}></path>`);
		else $$renderer.push(`<!--[-1--><rect${attributes({
			...rest,
			x: c.motionX,
			y: c.motionY,
			width: c.motionWidth,
			height: c.motionHeight,
			fill: c.staticFill,
			"fill-opacity": c.staticFillOpacity,
			stroke: c.staticStroke,
			"stroke-opacity": c.staticStrokeOpacity,
			"stroke-width": c.staticStrokeWidth,
			opacity: c.staticOpacity,
			rx: c.rx,
			ry: c.ry,
			"stroke-dasharray": c.dashArrayAttr,
			class: clsx(cls("lc-rect", c.staticClassName))
		}, void 0, void 0, void 0, 3)}></rect>`);
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Rect/Rect.canvas.svelte
function Rect_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: _ref = void 0, $$slots, $$events, ...rest } = $$props;
		const c = new RectState(() => rest);
		function getStyleOptions(styleOverrides, itemFill, itemStroke, itemFillOpacity, itemStrokeOpacity, itemStrokeWidth, itemOpacity, itemClass) {
			return styleOverrides ? merge({ styles: { strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth } }, styleOverrides) : {
				styles: {
					fill: itemFill ?? rest.fill,
					fillOpacity: itemFillOpacity ?? c.staticFillOpacity,
					stroke: itemStroke ?? rest.stroke,
					strokeOpacity: itemStrokeOpacity ?? c.staticStrokeOpacity,
					strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth,
					opacity: itemOpacity ?? c.staticOpacity
				},
				classes: cls("lc-rect", itemClass ?? c.staticClassName),
				style: [rest.style, c.dashArrayAttr ? `stroke-dasharray: ${c.dashArrayAttr}` : void 0].filter(Boolean).join("; ") || void 0
			};
		}
		function render(ctx, styleOverrides) {
			if (c.dataMode) for (const item of c.resolvedItems) {
				const styleOpts = getStyleOptions(styleOverrides, resolveColorProp(rest.fill, item.d, c.chartCtx.cScale), resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale), resolveStyleProp(rest.fillOpacity, item.d), resolveStyleProp(rest.strokeOpacity, item.d), resolveStyleProp(rest.strokeWidth, item.d), resolveStyleProp(rest.opacity, item.d), resolveStyleProp(rest.class, item.d));
				renderRect(ctx, {
					x: item.x,
					y: item.y,
					width: item.width,
					height: item.height,
					rx: c.rx,
					ry: c.ry,
					corners: c.resolveCorners(item.width, item.height)
				}, styleOpts);
			}
			else {
				const styleOpts = getStyleOptions(styleOverrides);
				renderRect(ctx, {
					x: c.motionX,
					y: c.motionY,
					width: c.motionWidth,
					height: c.motionHeight,
					rx: c.rx,
					ry: c.ry,
					corners: c.resolvedCorners
				}, styleOpts);
			}
		}
		const fillKey = createKey(() => rest.fill);
		const strokeKey = createKey(() => rest.stroke);
		c.chartCtx.registerComponent({
			name: "Rect",
			kind: "mark",
			markInfo: () => rectMarkInfo(rest, c.dataMode),
			canvasRender: {
				render,
				events: {
					click: rest.onclick,
					dblclick: rest.ondblclick,
					pointerdown: rest.onpointerdown,
					pointerenter: rest.onpointerenter,
					pointermove: rest.onpointermove,
					pointerleave: rest.onpointerleave,
					pointerover: rest.onpointerover,
					pointerout: rest.onpointerout
				},
				deps: () => [
					c.dataMode,
					c.dataMode ? c.resolvedItems : null,
					c.motionX,
					c.motionY,
					c.motionWidth,
					c.motionHeight,
					fillKey.current,
					strokeKey.current,
					rest.fillOpacity,
					rest.strokeOpacity,
					rest.strokeWidth,
					rest.opacity,
					rest.class,
					rest.style,
					c.rx,
					c.ry,
					c.resolvedCorners,
					c.dashArrayAttr
				]
			}
		});
		bind_props($$props, { ref: _ref });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Rect/Rect.html.svelte
function Rect_html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, ref: refProp = void 0, $$slots, $$events, ...rest } = $$props;
		const c = new RectState(() => rest);
		const htmlRest = derived(() => rest);
		c.chartCtx.registerComponent({
			name: "Rect",
			kind: "mark",
			markInfo: () => rectMarkInfo(rest, c.dataMode)
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
					...htmlRest(),
					class: clsx(cls("lc-rect", resolvedClass))
				}, void 0, void 0, {
					position: "absolute",
					left: `${stringify(item.x)}px`,
					top: `${stringify(item.y)}px`,
					width: `${stringify(item.width)}px`,
					height: `${stringify(item.height)}px`,
					background: resolvedFill,
					"background-origin": "border-box",
					opacity: resolvedOpacity,
					"border-width": resolvedBorderWidth,
					"border-style": c.dashArrayResolved ? "dashed" : "solid",
					"border-color": resolvedStroke,
					"border-radius": c.borderRadius(item.width, item.height) ?? `${c.rx}px`
				})}></div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({
				...htmlRest(),
				class: clsx(cls("lc-rect", c.staticClassName))
			}, void 0, void 0, {
				position: "absolute",
				left: `${stringify(c.motionX)}px`,
				top: `${stringify(c.motionY)}px`,
				width: `${stringify(c.motionWidth)}px`,
				height: `${stringify(c.motionHeight)}px`,
				background: c.staticFill,
				"background-origin": "border-box",
				opacity: c.staticOpacity,
				"border-width": c.staticBorderWidth,
				"border-style": c.dashArrayResolved ? "dashed" : "solid",
				"border-color": c.staticStroke,
				"border-radius": c.borderRadiusStyle ?? `${c.rx}px`
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
export { Rect_canvas as n, Rect_svg as r, Rect_html as t };

//# sourceMappingURL=Rect.html.js.map