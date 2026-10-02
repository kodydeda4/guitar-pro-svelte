import { f as spread_props, o as derived } from "./server.js";
import { s as accessor, t as getChartContext } from "./chart.js";
import { S as resolveStyleProp } from "./key.svelte.js";
import { t as extractLayerProps } from "./attributes.js";
import { n as createDimensionGetter } from "./rect.svelte.js";
import { n as Rect_canvas, r as Rect_svg, t as Rect_html } from "./Rect.html.js";
import { n as Arc_svg, t as Arc_canvas } from "./Arc.canvas.js";
import { greatestAbs } from "@layerstack/utils";
//#region node_modules/layerchart/dist/components/Bar/Bar.shared.svelte.js
var BarState = class {
	#getProps = () => ({});
	/**
	* Memoized props — the component's props closure allocates a fresh object
	* (it spreads `rest`), so calling it once per derived meant one allocation
	* per derived per update. Read it once here instead.
	*/
	#props = derived(() => this.#getProps());
	ctx = getChartContext();
	constructor(getProps) {
		this.#getProps = getProps;
	}
	#series = derived(() => {
		const seriesKey = this.#props().seriesKey;
		return seriesKey ? this.ctx.series.series.find((s) => s.key === seriesKey) : void 0;
	});
	get series() {
		return this.#series();
	}
	set series($$value) {
		return this.#series($$value);
	}
	#seriesAccessor = derived(() => this.series ? this.series.value ?? (this.series.data ? void 0 : this.series.key) : void 0);
	get seriesAccessor() {
		return this.#seriesAccessor();
	}
	set seriesAccessor($$value) {
		return this.#seriesAccessor($$value);
	}
	#stackAccessors = derived(() => this.ctx.stackAccessorsFor({
		seriesKey: this.#props().seriesKey,
		stacksImplicitly: true
	}));
	get stackAccessors() {
		return this.#stackAccessors();
	}
	set stackAccessors($$value) {
		return this.#stackAccessors($$value);
	}
	#x = derived(() => {
		return this.#props().x ?? (this.ctx.valueAxis === "x" ? this.stackAccessors?.value ?? this.seriesAccessor : void 0) ?? this.ctx.x;
	});
	get x() {
		return this.#x();
	}
	set x($$value) {
		return this.#x($$value);
	}
	#y = derived(() => {
		return this.#props().y ?? (this.ctx.valueAxis === "y" ? this.stackAccessors?.value ?? this.seriesAccessor : void 0) ?? this.ctx.y;
	});
	get y() {
		return this.#y();
	}
	set y($$value) {
		return this.#y($$value);
	}
	#x1 = derived(() => this.#props().x1);
	get x1() {
		return this.#x1();
	}
	set x1($$value) {
		return this.#x1($$value);
	}
	#y1 = derived(() => this.#props().y1);
	get y1() {
		return this.#y1();
	}
	set y1($$value) {
		return this.#y1($$value);
	}
	#seriesIndex = derived(() => {
		const seriesKey = this.#props().seriesKey;
		return seriesKey ? this.ctx.series.visibleSeries.findIndex((s) => s.key === seriesKey) : void 0;
	});
	get seriesIndex() {
		return this.#seriesIndex();
	}
	set seriesIndex($$value) {
		return this.#seriesIndex($$value);
	}
	#seriesCount = derived(() => this.ctx.series.visibleSeries.length);
	get seriesCount() {
		return this.#seriesCount();
	}
	set seriesCount($$value) {
		return this.#seriesCount($$value);
	}
	#stackInsets = derived(() => {
		const stackPadding = this.#props().stackPadding ?? 0;
		if (this.ctx.series.stackLayout == null || stackPadding === 0 || this.seriesIndex === void 0) return;
		const isFirst = this.seriesIndex === 0;
		const isLast = this.seriesIndex === this.seriesCount - 1;
		const stackInset = stackPadding / 2;
		if (this.ctx.valueAxis === "y") return {
			bottom: isFirst ? void 0 : stackInset,
			top: isLast ? void 0 : stackInset
		};
		return {
			left: isFirst ? void 0 : stackInset,
			right: isLast ? void 0 : stackInset
		};
	});
	get stackInsets() {
		return this.#stackInsets();
	}
	set stackInsets($$value) {
		return this.#stackInsets($$value);
	}
	#insets = derived(() => this.#props().insets ?? this.stackInsets);
	get insets() {
		return this.#insets();
	}
	set insets($$value) {
		return this.#insets($$value);
	}
	#getDimensions = derived(() => createDimensionGetter(this.ctx, () => ({
		x: this.x,
		y: this.y,
		x1: this.x1,
		y1: this.y1,
		insets: this.insets
	})));
	get getDimensions() {
		return this.#getDimensions();
	}
	set getDimensions($$value) {
		return this.#getDimensions($$value);
	}
	#scaleDimensions = derived(() => this.getDimensions(this.#props().data) ?? {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	});
	get scaleDimensions() {
		return this.#scaleDimensions();
	}
	set scaleDimensions($$value) {
		return this.#scaleDimensions($$value);
	}
	#dimensions = derived(() => {
		let { x, y, width, height } = this.scaleDimensions;
		const props = this.#props();
		if (props.width != null) {
			x = x + (width - props.width) / 2;
			width = props.width;
		}
		if (props.height != null) {
			y = y + (height - props.height) / 2;
			height = props.height;
		}
		return {
			x,
			y,
			width,
			height
		};
	});
	get dimensions() {
		return this.#dimensions();
	}
	set dimensions($$value) {
		return this.#dimensions($$value);
	}
	#valueAccessor = derived(() => accessor(this.ctx.valueAxis === "y" ? this.y : this.x));
	get valueAccessor() {
		return this.#valueAccessor();
	}
	set valueAccessor($$value) {
		return this.#valueAccessor($$value);
	}
	#resolvedValue = derived(() => {
		const value = this.valueAccessor(this.#props().data);
		return Array.isArray(value) ? greatestAbs(value) : value;
	});
	get resolvedValue() {
		return this.#resolvedValue();
	}
	set resolvedValue($$value) {
		return this.#resolvedValue($$value);
	}
	#rounded = derived(() => {
		const roundedProp = resolveStyleProp(this.#props().rounded, this.#props().data) ?? "all";
		if (roundedProp !== "edge") return roundedProp;
		if (this.ctx.valueAxis === "y") return this.resolvedValue >= 0 && this.ctx.yRange[0] > this.ctx.yRange[1] ? "top" : "bottom";
		return this.resolvedValue >= 0 && this.ctx.xRange[0] < this.ctx.xRange[1] ? "right" : "left";
	});
	get rounded() {
		return this.#rounded();
	}
	set rounded($$value) {
		return this.#rounded($$value);
	}
	#corners = derived(() => {
		const radius = this.#props().radius ?? 0;
		const rounded = this.rounded;
		const topLeft = [
			"all",
			"top",
			"left",
			"top-left"
		].includes(rounded);
		const topRight = [
			"all",
			"top",
			"right",
			"top-right"
		].includes(rounded);
		const bottomLeft = [
			"all",
			"bottom",
			"left",
			"bottom-left"
		].includes(rounded);
		const bottomRight = [
			"all",
			"bottom",
			"right",
			"bottom-right"
		].includes(rounded);
		return [
			topLeft ? radius : 0,
			topRight ? radius : 0,
			bottomRight ? radius : 0,
			bottomLeft ? radius : 0
		];
	});
	get corners() {
		return this.#corners();
	}
	set corners($$value) {
		return this.#corners($$value);
	}
	#resolvedInitialY = derived(() => {
		const props = this.#props();
		return props.initialY ?? (props.motion && this.ctx.valueAxis === "y" ? Math.max(this.ctx.yRange[0], this.ctx.yRange[1]) : void 0);
	});
	get resolvedInitialY() {
		return this.#resolvedInitialY();
	}
	set resolvedInitialY($$value) {
		return this.#resolvedInitialY($$value);
	}
	#resolvedInitialHeight = derived(() => {
		const props = this.#props();
		return props.initialHeight ?? (props.motion && this.ctx.valueAxis === "y" ? 0 : void 0);
	});
	get resolvedInitialHeight() {
		return this.#resolvedInitialHeight();
	}
	set resolvedInitialHeight($$value) {
		return this.#resolvedInitialHeight($$value);
	}
	#resolvedInitialX = derived(() => {
		const props = this.#props();
		return props.initialX ?? (props.motion && this.ctx.valueAxis === "x" ? Math.min(this.ctx.xRange[0], this.ctx.xRange[1]) : void 0);
	});
	get resolvedInitialX() {
		return this.#resolvedInitialX();
	}
	set resolvedInitialX($$value) {
		return this.#resolvedInitialX($$value);
	}
	#resolvedInitialWidth = derived(() => {
		const props = this.#props();
		return props.initialWidth ?? (props.motion && this.ctx.valueAxis === "x" ? 0 : void 0);
	});
	get resolvedInitialWidth() {
		return this.#resolvedInitialWidth();
	}
	set resolvedInitialWidth($$value) {
		return this.#resolvedInitialWidth($$value);
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Bar/Bar.base.svelte
function Bar_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Rect, Arc, data, x: xProp, y: yProp, x1: x1Prop, y1: y1Prop, seriesKey, stackPadding = 0, fill, fillOpacity, stroke: strokeProp = "black", strokeWidth = 0, opacity, radius = 0, rounded = "all", motion, insets, initialX, initialY, initialHeight, initialWidth, width, height, tooltip, onpointerenter, onpointermove, onpointerleave, $$slots, $$events, ...restProps } = $$props;
		const stroke = derived(() => strokeProp === null || strokeProp === void 0 ? "black" : strokeProp);
		/**
		* A bar draws one row, so its style props take an accessor the same way `Rect` and `Circle` do.
		* Resolved here rather than passed down, because the `Rect` below is handed computed dimensions
		* and so never sees the row itself.
		*
		* `fill` / `stroke` are left alone — a bar's color comes from `c` / the series, which already
		* resolves per row.
		*/
		const resolvedFillOpacity = derived(() => resolveStyleProp(fillOpacity, data));
		const resolvedStrokeWidth = derived(() => resolveStyleProp(strokeWidth, data));
		const resolvedOpacity = derived(() => resolveStyleProp(opacity, data));
		const c = new BarState(() => ({
			data,
			x: xProp,
			y: yProp,
			x1: x1Prop,
			y1: y1Prop,
			seriesKey,
			stackPadding,
			radius,
			rounded,
			motion,
			insets,
			initialX,
			initialY,
			initialHeight,
			initialWidth,
			width,
			height,
			tooltip
		}));
		const onPointerEnter = (e) => {
			onpointerenter?.(e);
			if (tooltip) c.ctx.tooltip.show(e, data);
		};
		const onPointerMove = (e) => {
			onpointermove?.(e);
			if (tooltip) c.ctx.tooltip.show(e, data);
		};
		const onPointerLeave = (e) => {
			onpointerleave?.(e);
			if (tooltip) c.ctx.tooltip.hide();
		};
		if (c.ctx.radial && Arc) {
			$$renderer.push("<!--[0-->");
			if (Arc) {
				$$renderer.push("<!--[-->");
				Arc($$renderer, spread_props([{
					innerRadius: c.dimensions.y,
					outerRadius: c.dimensions.y + c.dimensions.height,
					startAngle: c.dimensions.x,
					endAngle: c.dimensions.x + c.dimensions.width,
					fill,
					fillOpacity: resolvedFillOpacity(),
					stroke: stroke(),
					strokeWidth: resolvedStrokeWidth(),
					opacity: resolvedOpacity(),
					cornerRadius: radius,
					onpointerenter: onPointerEnter,
					onpointermove: onPointerMove,
					onpointerleave: onPointerLeave
				}, extractLayerProps(restProps, "lc-bar")]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		} else {
			$$renderer.push("<!--[-1-->");
			if (Rect) {
				$$renderer.push("<!--[-->");
				Rect($$renderer, spread_props([
					{
						fill,
						fillOpacity: resolvedFillOpacity(),
						stroke: stroke(),
						strokeWidth: resolvedStrokeWidth(),
						opacity: resolvedOpacity(),
						corners: c.corners,
						motion,
						initialX: c.resolvedInitialX,
						initialY: c.resolvedInitialY,
						initialHeight: c.resolvedInitialHeight,
						initialWidth: c.resolvedInitialWidth
					},
					c.dimensions,
					{
						onpointerenter: onPointerEnter,
						onpointermove: onPointerMove,
						onpointerleave: onPointerLeave
					},
					extractLayerProps(restProps, "lc-bar")
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Bar/Bar.svg.svelte
function Bar_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Bar_base($$renderer, spread_props([{
		Rect: Rect_svg,
		Arc: Arc_svg
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Bar/Bar.canvas.svelte
function Bar_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Bar_base($$renderer, spread_props([{
		Rect: Rect_canvas,
		Arc: Arc_canvas
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Bar/Bar.html.svelte
function Bar_html($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Bar_base($$renderer, spread_props([{ Rect: Rect_html }, props]));
}
//#endregion
export { Bar_canvas as n, Bar_svg as r, Bar_html as t };

//# sourceMappingURL=Bar.html.js.map