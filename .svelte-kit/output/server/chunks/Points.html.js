import { c as ensure_array_like, f as spread_props, o as derived } from "./server.js";
import { s as accessor, t as getChartContext } from "./chart.js";
import { i as isScaleBand } from "./scales.svelte.js";
import { T as getGeoContext, h as getMarkData } from "./key.svelte.js";
import { t as extractLayerProps } from "./attributes.js";
import { n as Circle_canvas, r as Circle_svg, t as Circle_html } from "./Circle.html.js";
import { pointRadial } from "d3-shape";
//#region node_modules/layerchart/dist/components/Points/Points.shared.svelte.js
var PointsState = class {
	#getProps = () => ({});
	/**
	* Memoized props — the component's props closure allocates a fresh object
	* (it spreads `rest`), so calling it once per derived meant one allocation
	* per derived per update. Read it once here instead.
	*/
	#props = derived(() => this.#getProps());
	ctx = getChartContext();
	markData = getMarkData();
	geo = getGeoContext();
	constructor(getProps) {
		this.#getProps = getProps;
		this.ctx.registerComponent({
			name: "Points",
			kind: "mark",
			markInfo: () => {
				const p = this.#props();
				return {
					data: p.data,
					x: p.x,
					y: p.y,
					seriesKey: p.seriesKey,
					color: p.fill ?? p.stroke
				};
			}
		});
	}
	#series = derived(() => this.ctx.series.series.find((s) => s.key === this.#props().seriesKey));
	get series() {
		return this.#series();
	}
	set series($$value) {
		return this.#series($$value);
	}
	#seriesAccessor = derived(() => this.series?.value ?? (this.series?.data ? void 0 : this.series?.key));
	get seriesAccessor() {
		return this.#seriesAccessor();
	}
	set seriesAccessor($$value) {
		return this.#seriesAccessor($$value);
	}
	#stackAccessors = derived(() => this.ctx.stackAccessorsFor({
		seriesKey: this.#props().seriesKey,
		ownData: this.#props().data != null
	}));
	get stackAccessors() {
		return this.#stackAccessors();
	}
	set stackAccessors($$value) {
		return this.#stackAccessors($$value);
	}
	#xAccessor = derived(() => accessor(this.#props().x ?? (this.ctx.valueAxis === "x" ? this.seriesAccessor : void 0) ?? this.ctx.x));
	get xAccessor() {
		return this.#xAccessor();
	}
	set xAccessor($$value) {
		return this.#xAccessor($$value);
	}
	#yAccessor = derived(() => {
		const props = this.#props();
		if (props.y) return accessor(props.y);
		if (this.stackAccessors) return this.stackAccessors.y1;
		if (Array.isArray(this.seriesAccessor) && this.ctx.valueAxis === "y") return accessor(this.seriesAccessor[1]);
		return accessor((this.ctx.valueAxis === "y" ? this.seriesAccessor : void 0) ?? this.ctx.y);
	});
	get yAccessor() {
		return this.#yAccessor();
	}
	set yAccessor($$value) {
		return this.#yAccessor($$value);
	}
	#pointsData = derived(() => this.markData(this.#props().data ?? this.series?.data));
	get pointsData() {
		return this.#pointsData();
	}
	set pointsData($$value) {
		return this.#pointsData($$value);
	}
	#getOffset(value, offset, scale, subScale) {
		const seriesKey = this.#props().seriesKey;
		if (typeof offset === "function") return offset(value, this.ctx);
		else if (offset != null) return offset;
		else if (subScale && seriesKey) return subScale(seriesKey) + (subScale.bandwidth?.() ?? 0) / 2;
		else if (isScaleBand(scale) && !this.ctx.radial) return scale.bandwidth() / 2;
		return 0;
	}
	#getPointObject(xVal, yVal, d, edgeIndex) {
		const props = this.#props();
		if (this.geo.projection) {
			const [projX, projY] = this.geo.projection([xVal, yVal]) ?? [0, 0];
			return {
				x: projX,
				y: projY,
				r: this.ctx.config.r ? this.ctx.rGet(d) : props.r ?? 5,
				xValue: xVal,
				yValue: yVal,
				data: d,
				edgeIndex
			};
		}
		const scaledX = this.ctx.xScale(xVal);
		const scaledY = this.ctx.yScale(yVal);
		const x = scaledX + this.#getOffset(scaledX, props.offsetX, this.ctx.xScale, this.ctx.x1Scale ?? void 0);
		const y = scaledY + this.#getOffset(scaledY, props.offsetY, this.ctx.yScale, this.ctx.y1Scale ?? void 0);
		const radialPoint = pointRadial(x, y);
		return {
			x: this.ctx.radial ? radialPoint[0] : x,
			y: this.ctx.radial ? radialPoint[1] : y,
			r: this.ctx.config.r ? this.ctx.rGet(d) : props.r ?? 5,
			xValue: xVal,
			yValue: yVal,
			data: d,
			edgeIndex
		};
	}
	#points = derived(() => {
		return this.pointsData.flatMap((d) => {
			const xValue = this.xAccessor(d);
			const yValue = this.yAccessor(d);
			if (Array.isArray(xValue)) return xValue.filter(Boolean).map((xVal, i) => this.#getPointObject(xVal, yValue, d, i));
			else if (Array.isArray(yValue)) return yValue.filter(Boolean).map((yVal, i) => this.#getPointObject(xValue, yVal, d, i));
			else if (xValue != null && yValue != null) return this.#getPointObject(xValue, yValue, d);
			return [];
		});
	});
	get points() {
		return this.#points();
	}
	set points($$value) {
		return this.#points($$value);
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Points/Points.base.svelte
function Points_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Circle, data, x, y, seriesKey, r = 5, offsetX, offsetY, fill, fillOpacity, stroke, strokeWidth, opacity, children, $$slots, $$events, ...restProps } = $$props;
		const c = new PointsState(() => ({
			data,
			x,
			y,
			seriesKey,
			r,
			offsetX,
			offsetY,
			fill,
			fillOpacity,
			stroke,
			strokeWidth,
			opacity
		}));
		/**
		* Faded when something else is highlighted — the row's `c` category when the legend names
		* those, and the point's series otherwise.  A single series names nothing to tell apart, so it
		* never fades on its own account.
		*/
		function highlightOpacity(d) {
			const category = c.ctx.cKey(d);
			if (category != null) return c.ctx.series.isHighlighted(category, true) ? 1 : .1;
			return c.series?.key == null || c.ctx.series.visibleSeries.length <= 1 || c.ctx.series.isHighlighted(c.series.key, true) ? 1 : .1;
		}
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, { points: c.points });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><!--[-->`);
			const each_array = ensure_array_like(c.points);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let point = each_array[$$index];
				if (Circle) {
					$$renderer.push("<!--[-->");
					Circle($$renderer, spread_props([
						{
							cx: point.x,
							cy: point.y,
							r: point.r,
							fill: fill ?? c.series?.color ?? (c.ctx.config.c ? c.ctx.cGet(point.data) : null),
							fillOpacity,
							stroke,
							strokeWidth,
							opacity: opacity ?? highlightOpacity(point.data)
						},
						c.series?.props,
						extractLayerProps(restProps, "lc-point")
					]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Points/Points.svg.svelte
function Points_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Points_base($$renderer, spread_props([{ Circle: Circle_svg }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Points/Points.canvas.svelte
function Points_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Points_base($$renderer, spread_props([{ Circle: Circle_canvas }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Points/Points.html.svelte
function Points_html($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Points_base($$renderer, spread_props([{ Circle: Circle_html }, props]));
}
//#endregion
export { Points_canvas as n, Points_svg as r, Points_html as t };

//# sourceMappingURL=Points.html.js.map