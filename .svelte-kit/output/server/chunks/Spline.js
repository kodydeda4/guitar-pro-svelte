import { c as ensure_array_like, f as spread_props, o as derived } from "./server.js";
import "./index-server2.js";
import { a as extractTweenConfig, i as createPathMotionMap, r as createMotion } from "./motion.svelte.js";
import { s as accessor, t as getChartContext } from "./chart.js";
import { i as isScaleBand } from "./scales.svelte.js";
import { C as getLayerContext, S as resolveStyleProp, T as getGeoContext, _ as colorPropDataKey, h as getMarkData, y as resolveColorProp } from "./key.svelte.js";
import { n as Path_svg, t as Path_canvas } from "./Path.canvas.js";
import { group, max } from "d3-array";
import { line, lineRadial } from "d3-shape";
import { interpolatePath } from "d3-interpolate-path";
import { geoPath } from "d3-geo";
//#region node_modules/layerchart/dist/components/Spline/Spline.shared.svelte.js
var SplineState = class {
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
	#tweenState;
	/** One tween per path this mark draws — see `#segmentTargets` for what identifies each */
	#segmentTweens = null;
	constructor(getProps) {
		this.#getProps = getProps;
		const initial = getProps();
		this.ctx.registerComponent({
			name: "Spline",
			kind: "mark",
			markInfo: () => {
				const p = this.#props();
				return {
					data: p.data,
					x: p.x,
					y: p.y,
					seriesKey: p.seriesKey,
					color: typeof p.stroke === "string" ? p.stroke : void 0
				};
			}
		});
		const tween = extractTweenConfig(this.#props().motion);
		this.#tweenState = createMotion(this.#defaultPathData(), () => this.d, tween ? {
			type: "tween",
			interpolate: interpolatePath,
			...tween.options
		} : void 0);
		this.#segmentTweens = createPathMotionMap(initial.motion, interpolatePath);
		if (this.#segmentTweens) this.#segmentTweens;
	}
	#getScaleValue(data, scale, accessorFn) {
		let value = accessorFn(data);
		if (Array.isArray(value)) value = max(value);
		if (scale.domain().length) return scale(value);
		return value;
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
	#xAccessor = derived(() => accessor(this.#props().x ?? (this.ctx.valueAxis === "x" ? this.seriesAccessor : void 0) ?? this.ctx.x));
	get xAccessor() {
		return this.#xAccessor();
	}
	set xAccessor($$value) {
		return this.#xAccessor($$value);
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
	#yAccessor = derived(() => {
		const props = this.#props();
		if (props.y) return accessor(props.y);
		if (this.ctx.valueAxis === "y") {
			if (this.stackAccessors) return this.stackAccessors.y1;
			if (this.seriesAccessor) return accessor(this.seriesAccessor);
		}
		return accessor(this.ctx.y);
	});
	get yAccessor() {
		return this.#yAccessor();
	}
	set yAccessor($$value) {
		return this.#yAccessor($$value);
	}
	#resolvedData = derived(() => this.markData(this.#props().data ?? this.series?.data));
	get resolvedData() {
		return this.#resolvedData();
	}
	set resolvedData($$value) {
		return this.#resolvedData($$value);
	}
	#zAccessor = derived(() => {
		const props = this.#props();
		const z = props.z ?? this.ctx.props.z;
		if (z != null) return accessor(z);
		const first = this.resolvedData?.[0];
		const implied = colorPropDataKey(props.stroke, first) ?? colorPropDataKey(props.fill, first);
		if (implied != null) return accessor(implied);
		if (props.data != null || this.series?.data != null) return null;
		return first != null && this.ctx.cKey(first) != null ? this.ctx.cKey : null;
	});
	get zAccessor() {
		return this.#zAccessor();
	}
	set zAccessor($$value) {
		return this.#zAccessor($$value);
	}
	#lines = derived(() => {
		if (!this.zAccessor) return [this.resolvedData];
		return Array.from(group(this.resolvedData, this.zAccessor).values()).filter((lineData) => this.#isShown(lineData[0]));
	});
	get lines() {
		return this.#lines();
	}
	set lines($$value) {
		return this.#lines($$value);
	}
	#xOffset = derived(() => isScaleBand(this.ctx.xScale) ? this.ctx.xScale.bandwidth() / 2 : 0);
	get xOffset() {
		return this.#xOffset();
	}
	set xOffset($$value) {
		return this.#xOffset($$value);
	}
	#yOffset = derived(() => isScaleBand(this.ctx.yScale) ? this.ctx.yScale.bandwidth() / 2 : 0);
	get yOffset() {
		return this.#yOffset();
	}
	set yOffset($$value) {
		return this.#yOffset($$value);
	}
	#buildPath(resolvedData) {
		const props = this.#props();
		const path = this.ctx.radial ? lineRadial().angle((d) => this.#getScaleValue(d, this.ctx.xScale, this.xAccessor) + 0).radius((d) => this.#getScaleValue(d, this.ctx.yScale, this.yAccessor) + this.yOffset) : line().x((d) => this.#getScaleValue(d, this.ctx.xScale, this.xAccessor) + this.xOffset).y((d) => this.#getScaleValue(d, this.ctx.yScale, this.yAccessor) + this.yOffset);
		path.defined(props.defined ?? ((d) => this.xAccessor(d) != null && this.yAccessor(d) != null));
		if (props.curve) path.curve(props.curve);
		return path(resolvedData) ?? "";
	}
	#hasAnyStyleFn = derived(() => {
		const p = this.#props();
		return typeof p.stroke === "function" || typeof p.fill === "function" || typeof p.opacity === "function" || typeof p.class === "function";
	});
	get hasAnyStyleFn() {
		return this.#hasAnyStyleFn();
	}
	set hasAnyStyleFn($$value) {
		return this.#hasAnyStyleFn($$value);
	}
	#d = derived(() => {
		const props = this.#props();
		if ((this.hasAnyStyleFn || this.zAccessor) && !this.geo.projection) return "";
		const resolvedData = this.resolvedData;
		if (this.geo.projection) {
			const lineString = {
				type: "LineString",
				coordinates: resolvedData.filter((d) => {
					if (props.defined) return props.defined(d, 0, resolvedData);
					return this.xAccessor(d) != null && this.yAccessor(d) != null;
				}).map((d) => [this.xAccessor(d), this.yAccessor(d)])
			};
			return geoPath(this.geo.projection)(lineString) ?? "";
		}
		return this.#buildPath(resolvedData);
	});
	get d() {
		return this.#d();
	}
	set d($$value) {
		return this.#d($$value);
	}
	#segmentTargets = derived(() => {
		if (!this.hasAnyStyleFn && !this.zAccessor) return null;
		const props = this.#props();
		if (this.geo.projection) return null;
		const out = [];
		for (const lineData of this.lines) {
			const lineOpacity = this.#lineOpacity(lineData);
			if (this.hasAnyStyleFn) {
				const groups = groupConsecutive(lineData, (d, i, arr) => {
					const s = resolveColorProp(props.stroke, d, this.ctx.cScale, i, arr);
					const f = resolveColorProp(props.fill, d, this.ctx.cScale, i, arr);
					const o = resolveStyleProp(props.opacity, d, i, arr);
					const c = resolveStyleProp(props.class, d, i, arr);
					return {
						key: `${s}\0${f}\0${o}\0${c}`,
						style: {
							stroke: s,
							fill: f,
							opacity: o,
							class: c
						}
					};
				});
				const lineStroke = this.#colorFromC(lineData[0]) ?? this.series?.color;
				const lineKey = this.zAccessor ? this.zAccessor(lineData[0]) : "";
				const seen = /* @__PURE__ */ new Map();
				groups.forEach((group, index) => {
					const ordinal = seen.get(group.key) ?? 0;
					seen.set(group.key, ordinal + 1);
					out.push({
						...group.style,
						stroke: group.style.stroke ?? lineStroke,
						opacity: group.style.opacity ?? lineOpacity,
						d: this.#buildPath(group.data),
						data: group.data,
						key: `${lineKey}\0${group.key}\0${ordinal}`,
						lineKey,
						lineStart: index === 0,
						lineEnd: index === groups.length - 1
					});
				});
			} else out.push({
				stroke: resolveColorProp(props.stroke, lineData[0], this.ctx.cScale) ?? this.#colorFromC(lineData[0]) ?? this.series?.color,
				fill: resolveColorProp(props.fill, lineData[0], this.ctx.cScale),
				opacity: resolveStyleProp(props.opacity, lineData[0]) ?? lineOpacity,
				class: resolveStyleProp(props.class, lineData[0]),
				d: this.#buildPath(lineData),
				data: lineData,
				key: this.zAccessor ? this.zAccessor(lineData[0]) : void 0,
				lineStart: true,
				lineEnd: true
			});
		}
		return out;
	});
	#segments = derived(
		/** `#segmentTargets` with each path swapped for its in-flight tween */
		() => {
			const targets = this.#segmentTargets();
			const tweens = this.#segmentTweens;
			if (!targets || !tweens) return targets;
			return targets.map((seg) => seg.key === void 0 ? seg : {
				...seg,
				d: tweens.get(seg.key) ?? seg.d
			});
		}
	);
	get segments() {
		return this.#segments();
	}
	set segments($$value) {
		return this.#segments($$value);
	}
	#colorFromC(d) {
		return d != null && this.ctx.cKey(d) != null ? this.ctx.cGet(d) : void 0;
	}
	/**
	* Fade for one line when the legend names `c` categories, or `undefined` when it names series.
	*
	* `seriesOpacity` can't tell these apart — a single series draws every line here, so the whole
	* mark would fade as one.  Read from the line's first point, the way its `stroke` is.
	*/
	#lineOpacity(lineData) {
		const key = this.#groupKey(lineData[0]);
		if (key == null) return void 0;
		return this.ctx.series.isHighlighted(key, true) ? 1 : .1;
	}
	/**
	* What the legend calls this line, or `null` when nothing names it.
	*
	* The chart's `c` first, since that is the chart's own channel.  Otherwise the mark's own
	* grouping — `stroke="fruit"` splits the lines, and where a series is declared per fruit the
	* legend is already listing exactly those names, so hovering one should single that line out.
	* A `z` the legend knows nothing about stays anonymous rather than reacting to unrelated keys.
	*/
	#groupKey(d) {
		const category = this.ctx.cKey(d);
		if (category != null) return category;
		if (!this.zAccessor || d == null) return null;
		const key = this.zAccessor(d);
		return this.#namesSeries(key) ? key : null;
	}
	#namesSeries(key) {
		return key != null && this.ctx.series.series.some((s) => s.key === key);
	}
	/** Whether a line's group is currently shown, for groups the legend names */
	#isShown(d) {
		if (d == null || !this.zAccessor) return true;
		const key = this.zAccessor(d);
		if (!this.#namesSeries(key)) return true;
		return this.ctx.series.visibleSeries.some((s) => s.key === key);
	}
	/** The path flattened to the baseline — what a line tweens out of when it first appears */
	#defaultPathData(data) {
		const props = this.#props();
		if (!extractTweenConfig(props.motion)) return "";
		if (this.ctx.config.x) {
			const resolvedData = data ?? this.resolvedData;
			const baseline = Math.min(this.ctx.yScale(0) ?? this.ctx.yRange[0], this.ctx.yRange[0]);
			const path = this.ctx.radial ? lineRadial().angle((d) => this.#getScaleValue(d, this.ctx.xScale, this.xAccessor) + 0).radius(() => baseline) : line().x((d) => this.#getScaleValue(d, this.ctx.xScale, this.xAccessor) + this.xOffset).y(() => baseline);
			path.defined(props.defined ?? ((d) => this.xAccessor(d) != null && this.yAccessor(d) != null));
			if (props.curve) path.curve(props.curve);
			return path(resolvedData) ?? "";
		}
		return "";
	}
	/**
	* The segment collapsed onto its own first point — what a run tweens out of when it appears in
	* a line that is already on screen.
	*
	* Consecutive runs share their boundary point, so a run's first point is the last point of the
	* run before it: a dashed bridge that appears mid-line grows out along the line, rather than
	* rising from the baseline the way a line drawn for the first time does.
	*/
	#collapsedPathData(data) {
		const props = this.#props();
		if (!extractTweenConfig(props.motion) || data[0] == null) return "";
		const x = this.#getScaleValue(data[0], this.ctx.xScale, this.xAccessor);
		const y = this.#getScaleValue(data[0], this.ctx.yScale, this.yAccessor);
		if (!Number.isFinite(x) || !Number.isFinite(y)) return "";
		const path = this.ctx.radial ? lineRadial().angle(() => x).radius(() => y + this.yOffset) : line().x(() => x + this.xOffset).y(() => y + this.yOffset);
		path.defined(props.defined ?? ((d) => this.xAccessor(d) != null && this.yAccessor(d) != null));
		if (props.curve) path.curve(props.curve);
		return path(data) ?? "";
	}
	#resolvedStroke = derived(() => resolveColorProp(this.#props().stroke, this.lines[0]?.[0], this.ctx.cScale) ?? this.#colorFromC(this.lines[0]?.[0]) ?? this.series?.color);
	get resolvedStroke() {
		return this.#resolvedStroke();
	}
	set resolvedStroke($$value) {
		return this.#resolvedStroke($$value);
	}
	#resolvedFill = derived(() => resolveColorProp(this.#props().fill, this.lines[0]?.[0], this.ctx.cScale));
	get resolvedFill() {
		return this.#resolvedFill();
	}
	set resolvedFill($$value) {
		return this.#resolvedFill($$value);
	}
	#resolvedClass = derived(() => resolveStyleProp(this.#props().class, this.lines[0]?.[0]));
	get resolvedClass() {
		return this.#resolvedClass();
	}
	set resolvedClass($$value) {
		return this.#resolvedClass($$value);
	}
	#isTweened = derived(() => extractTweenConfig(this.#props().motion) != null);
	get isTweened() {
		return this.#isTweened();
	}
	set isTweened($$value) {
		return this.#isTweened($$value);
	}
	get tweenedPath() {
		return this.#tweenState.current;
	}
	#seriesOpacity = derived(() => {
		if (this.series?.key == null || this.ctx.series.visibleSeries.length <= 1 || this.ctx.series.isHighlighted(this.series.key, true)) return 1;
		return .1;
	});
	get seriesOpacity() {
		return this.#seriesOpacity();
	}
	set seriesOpacity($$value) {
		return this.#seriesOpacity($$value);
	}
};
function groupConsecutive(data, keyFn) {
	if (data.length < 2) return [];
	const groups = [];
	let current = keyFn(data[0], 0, data);
	let startIdx = 0;
	for (let i = 1; i < data.length; i++) {
		const next = keyFn(data[i], i, data);
		if (next.key !== current.key) {
			groups.push({
				key: current.key,
				style: current.style,
				data: data.slice(startIdx, i + 1)
			});
			startIdx = i;
			current = next;
		}
	}
	if (data.length - startIdx >= 2) groups.push({
		key: current.key,
		style: current.style,
		data: data.slice(startIdx)
	});
	return groups;
}
//#endregion
//#region node_modules/layerchart/dist/components/Spline/Spline.base.svelte
function Spline_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Path, data, x, y, z, seriesKey, defined, curve, stroke, fill, opacity, class: className, motion, marker, markerStart, markerMid, markerEnd, startContent, endContent, $$slots, $$events, ...restProps } = $$props;
		const c = new SplineState(() => ({
			data,
			x,
			y,
			z,
			seriesKey,
			defined,
			curve,
			stroke,
			fill,
			opacity,
			class: className,
			motion
		}));
		if (c.segments) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(c.segments);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let seg = each_array[i];
				if (Path) {
					$$renderer.push("<!--[-->");
					Path($$renderer, spread_props([
						{
							pathData: seg.d,
							stroke: seg.stroke,
							fill: seg.fill,
							opacity: seg.opacity ?? (c.seriesOpacity === 1 ? void 0 : c.seriesOpacity),
							class: seg.class,
							markerMid: markerMid ?? marker,
							markerStart: seg.lineStart ? markerStart ?? marker : markerMid ?? marker,
							markerEnd: seg.lineEnd ? markerEnd ?? marker : void 0,
							startContent: seg.lineStart ? startContent : void 0,
							endContent: seg.lineEnd ? endContent : void 0
						},
						c.series?.props,
						restProps
					]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			if (Path) {
				$$renderer.push("<!--[-->");
				Path($$renderer, spread_props([
					{
						pathData: c.isTweened ? c.tweenedPath : c.d,
						stroke: c.resolvedStroke,
						fill: c.resolvedFill,
						opacity: (typeof opacity === "number" ? opacity : void 0) ?? (c.seriesOpacity === 1 ? void 0 : c.seriesOpacity),
						class: c.resolvedClass,
						marker,
						markerStart,
						markerMid,
						markerEnd,
						startContent,
						endContent
					},
					c.series?.props,
					restProps
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
//#region node_modules/layerchart/dist/components/Spline/Spline.svg.svelte
function Spline_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Spline_base($$renderer, spread_props([{ Path: Path_svg }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Spline/Spline.canvas.svelte
function Spline_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Spline_base($$renderer, spread_props([{ Path: Path_canvas }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Spline/Spline.svelte
function Spline($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			Spline_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			Spline_canvas($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Spline as default };

//# sourceMappingURL=Spline.js.map