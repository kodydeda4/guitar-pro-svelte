import { Nt as clsx, a as bind_props, c as ensure_array_like, h as stringify, o as derived, r as attributes } from "./server.js";
import { i as createSubscriber, s as on } from "./index-server.js";
import { r as createMotion } from "./motion.svelte.js";
import { f as isEqualValue, t as getChartContext } from "./chart.js";
import { i as isScaleBand } from "./scales.svelte.js";
import { sortFunc } from "@layerstack/utils";
import { bisector } from "d3-array";
import { cls } from "@layerstack/tailwind";
//#region node_modules/layerchart/dist/utils/tooltip.js
/**
* Whether a mode resolves to one specific row, by proximity in both axes, rather than to every
* series at a position on one — which is what decides whether a hover marks a point or a column.
*/
function isSinglePointMode(mode) {
	return mode === "quadtree" || mode === "voronoi";
}
/**
* Value used for bisecting. `x`/`y` accessors can return an array (ex. `x={['start', 'end']}`),
* in which case the first value is used.
*/
function bisectValue(accessor, d) {
	const value = accessor(d);
	return Array.isArray(value) ? value[0] : value;
}
/** Pick between the two data points surrounding `value` */
function pickNearest(previousValue, currentValue, value, accessor, find = "closest") {
	switch (find) {
		case "closest": if (currentValue === void 0) return previousValue;
		else if (previousValue === void 0) return currentValue;
		else return Number(value) - Number(accessor(previousValue)) > Number(accessor(currentValue)) - Number(value) ? currentValue : previousValue;
		case "left": return previousValue;
		default: return currentValue;
	}
}
/**
* Find the data point matching `value` using a binary search.
*
* Requires `data` to be sorted by `accessor`.
*/
function bisectData(data, accessor, value, find = "closest") {
	const index = bisector((d) => bisectValue(accessor, d)).left(data, value, 1);
	return pickNearest(data[index - 1], data[index], value, accessor, find);
}
/**
* Which axis to bisect on for a given tooltip mode.
*
* Modes that resolve by pixel proximity (`quadtree`, `voronoi`, ...) have no value-based
* equivalent, so they fall back to whichever axis the caller supplied a value for. This is what
* makes `tooltip.show({ value: { x } })` work on charts using any mode (ex. `LineChart` defaults
* to `quadtree-x`).
*/
function bisectAxis(mode, value) {
	switch (mode) {
		case "bisect-band": return "band";
		case "bisect-x":
		case "quadtree-x": return "x";
		case "bisect-y":
		case "quadtree-y": return "y";
		default: return value.x != null ? "x" : "y";
	}
}
/**
* Find the data point at the given domain value(s), using the chart's own data and accessors.
*
* Unlike pixel-based lookup (quadtree/voronoi), this resolves purely from domain values, so it
* works across charts with different sizes, padding, and data — the basis for showing a tooltip
* programmatically or synchronizing tooltips between charts.
*
* Requires `ctx.flatData` to be sorted by the bisected accessor.
*/
function findDatumByValue(ctx, value, options = {}) {
	const find = options.findTooltipData ?? "closest";
	switch (bisectAxis(options.mode, value)) {
		case "x": return bisectData(ctx.flatData, ctx.x, value.x, find);
		case "y": return bisectData(ctx.flatData, ctx.y, value.y, find);
		case "band": if (isScaleBand(ctx.xScale)) return bisectData(ctx.flatData.filter((d) => ctx.x(d) === value.x).sort(sortFunc(ctx.y)), ctx.y, value.y, find);
		else if (isScaleBand(ctx.yScale)) return bisectData(ctx.flatData.filter((d) => ctx.y(d) === value.y).sort(sortFunc(ctx.x)), ctx.x, value.x, find);
		else return;
	}
}
/** Offset to the center of a band, or `0` for non-band scales */
function bandCenterOffset(scale) {
	return isScaleBand(scale) ? scale.step() / 2 - scale.padding() * scale.step() / 2 : 0;
}
/** Midpoint of a scaled value, which can be an array for multi-value accessors */
function coordCenter(value) {
	return Array.isArray(value) ? (value[0] + value[value.length - 1]) / 2 : value;
}
/**
* Center of the span a data point occupies along one axis, in that axis' pixel space.
*
* Three ways a value can occupy a span rather than a point, in the order they take precedence:
* a band scale, a multi-value accessor (ex. `x={['start', 'end']}`), and an interval — which gives
* a time scale a band-like width, the same span `Rect` draws a bar across. All three place the
* value at the leading edge, so a tooltip anchored to the raw coordinate sits off to one side.
*/
function axisCenter(scale, interval, scaled, value) {
	if (isScaleBand(scale)) return coordCenter(scaled) + bandCenterOffset(scale);
	if (Array.isArray(scaled)) return coordCenter(scaled);
	if (interval && value != null) {
		const start = interval.floor(value);
		return (scale(start) + scale(interval.offset(start))) / 2;
	}
	return coordCenter(scaled);
}
/**
* Container-relative pixel coordinates of a data point, derived from the chart's own scales.
*
* Band scales resolve to the center of the band, and multi-value accessors
* (ex. `x={['start', 'end']}`) to the midpoint of the scaled values.
*/
function dataCoords(ctx, data) {
	const panel = ctx.facet?.enabled ? ctx.facet.panels.find((p) => p.has(data)) : void 0;
	return {
		x: axisCenter(ctx.xScale, ctx.xInterval, ctx.xGet(data), ctx.x?.(data)) + ctx.padding.left + (panel?.x ?? 0),
		y: axisCenter(ctx.yScale, ctx.yInterval, ctx.yGet(data), ctx.y?.(data)) + ctx.padding.top + (panel?.y ?? 0)
	};
}
/**
* The row in `panel` at the same position as `data`, or `undefined` when it has none there.
*
* The facet counterpart of `findDatumByValue`: panels share the position scales, so "the same
* position" is the same domain value on the category axis — which is how a panel shows *its*
* value at the spot another panel was hovered.
*
* Matches exactly rather than to the nearest, so a panel with nothing at that position shows
* nothing rather than a value from somewhere else.
*/
function panelDatum(ctx, panel, data) {
	if (data == null) return void 0;
	const accessor = ctx.valueAxis === "y" ? ctx.x : ctx.y;
	if (!accessor) return void 0;
	const value = accessor(data);
	return panel.data.find((d) => isEqualValue(accessor(d), value));
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/Tooltip.svelte
function Tooltip($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { anchor = "top-left", classes = {}, contained = "container", fadeDuration = 100, motion = "spring", pointerEvents = false, portal: portalProp = true, variant = "default", data: dataProp, facetAll = false, x = "pointer", xOffset = x === "pointer" || facetAll ? 10 : 0, y = "pointer", yOffset = y === "pointer" || facetAll ? 10 : 0, children, rootRef: rootRefProp = void 0, props = {
			root: {},
			container: {},
			content: {}
		}, class: className } = $$props;
		const ctx = getChartContext();
		/** The row this tooltip shows — its own when given, else whatever the pointer resolved */
		const tooltipData = derived(() => dataProp ?? ctx.tooltip.data);
		let tooltipWidth = null;
		let tooltipHeight = null;
		function alignValue(value, align, additionalOffset, tooltipSize) {
			const alignOffset = align === "center" ? tooltipSize / 2 : align === "end" ? tooltipSize : 0;
			return value + (align === "end" ? -additionalOffset : additionalOffset) - alignOffset;
		}
		/**
		* Keep a flipped tooltip within `[min, max]`, as flipping to the other side can overflow that
		* side instead (ex. a wide tooltip on a narrow chart).  `min` (the left/top edge) wins when the
		* tooltip doesn't fit either way.
		*/
		function clampToEdges(value, min, max) {
			return Math.max(min, Math.min(value, max));
		}
		const isPortaled = derived(() => typeof portalProp === "boolean" ? portalProp : portalProp?.enabled !== false);
		/**
		* Makes reading the container's viewport rect reactive to scrolling and resizing.
		*
		* A portaled tooltip is positioned from the chart container's *viewport* rect, and
		* `getBoundingClientRect()` is not reactive — scrolling moves the chart out from under a
		* tooltip that never re-measures.  Pointer-driven tooltips mostly dodge this (scrolling fires
		* `pointercancel`, or a pointer event as content moves under the cursor), but one shown
		* programmatically — keyboard navigation, a chart group, `locked` — has no pointer to cancel it
		* and must follow the chart.
		*
		* `createSubscriber` ties the listeners to whether anything is actually reading: they attach
		* when `positions` starts depending on this and detach when it stops, so an idle chart costs
		* nothing.
		*
		* `capture` is what catches scrolling of any *ancestor* (ex. a dashboard inside a scrolling
		* panel), not just the window — which is also why `scrollY` from `svelte/reactivity/window`
		* isn't enough here, and why runed's `ScrollState` (bound to one element) doesn't fit either.
		*/
		const subscribeToViewport = createSubscriber((update) => {
			const offScroll = on(window, "scroll", update, {
				capture: true,
				passive: true
			});
			const offResize = on(window, "resize", update, { passive: true });
			return () => {
				offScroll();
				offResize();
			};
		});
		const positions = derived(() => {
			if (!tooltipData() || true) return {
				x: null,
				y: null
			};
			if (isPortaled()) subscribeToViewport();
			const containerRect = isPortaled() ? ctx.containerRef?.getBoundingClientRect() : null;
			if (isPortaled() && !containerRect) return {
				x: null,
				y: null
			};
			const coords = x === "data" || y === "data" ? dataCoords(ctx, tooltipData()) : null;
			const xValue = typeof x === "number" ? x : x === "data" ? coords.x : ctx.tooltip.x;
			let xAlign = "start";
			switch (anchor) {
				case "top-left":
				case "left":
				case "bottom-left":
					xAlign = "start";
					break;
				case "top":
				case "center":
				case "bottom":
					xAlign = "center";
					break;
				case "top-right":
				case "right":
				case "bottom-right": xAlign = "end";
			}
			const yValue = typeof y === "number" ? y : y === "data" ? coords.y : ctx.tooltip.y;
			let yAlign = "start";
			switch (anchor) {
				case "top-left":
				case "top":
				case "top-right":
					yAlign = "start";
					break;
				case "left":
				case "center":
				case "right":
					yAlign = "center";
					break;
				case "bottom-left":
				case "bottom":
				case "bottom-right": yAlign = "end";
			}
			const rect = {
				top: alignValue(yValue, yAlign, yOffset, tooltipHeight),
				left: alignValue(xValue, xAlign, xOffset, tooltipWidth),
				bottom: 0,
				right: 0
			};
			rect.bottom = rect.top + tooltipHeight;
			rect.right = rect.left + tooltipWidth;
			if (contained === "container") {
				if (isPortaled() && containerRect) {
					if (typeof x !== "number") {
						if ((xAlign === "start" || xAlign === "center") && containerRect.left + rect.right > containerRect.right) rect.left = alignValue(xValue, "end", xOffset, tooltipWidth);
						if ((xAlign === "end" || xAlign === "center") && containerRect.left + rect.left < containerRect.left + ctx.padding.left) rect.left = alignValue(xValue, "start", xOffset, tooltipWidth);
						rect.left = clampToEdges(rect.left, ctx.padding.left, containerRect.width - tooltipWidth);
					}
					rect.right = rect.left + tooltipWidth;
					if (typeof y !== "number") {
						if ((yAlign === "start" || yAlign === "center") && containerRect.top + rect.bottom > containerRect.bottom) rect.top = alignValue(yValue, "end", yOffset, tooltipHeight);
						if ((yAlign === "end" || yAlign === "center") && containerRect.top + rect.top < containerRect.top + ctx.padding.top) rect.top = alignValue(yValue, "start", yOffset, tooltipHeight);
						rect.top = clampToEdges(rect.top, ctx.padding.top, containerRect.height - tooltipHeight);
					}
					rect.bottom = rect.top + tooltipHeight;
				} else {
					if (typeof x !== "number") {
						if ((xAlign === "start" || xAlign === "center") && rect.right > ctx.containerWidth) rect.left = alignValue(xValue, "end", xOffset, tooltipWidth);
						if ((xAlign === "end" || xAlign === "center") && rect.left < ctx.padding.left) rect.left = alignValue(xValue, "start", xOffset, tooltipWidth);
						rect.left = clampToEdges(rect.left, ctx.padding.left, ctx.containerWidth - tooltipWidth);
					}
					rect.right = rect.left + tooltipWidth;
					if (typeof y !== "number") {
						if ((yAlign === "start" || yAlign === "center") && rect.bottom > ctx.containerHeight) rect.top = alignValue(yValue, "end", yOffset, tooltipHeight);
						if ((yAlign === "end" || yAlign === "center") && rect.top < ctx.padding.top) rect.top = alignValue(yValue, "start", yOffset, tooltipHeight);
						rect.top = clampToEdges(rect.top, ctx.padding.top, ctx.containerHeight - tooltipHeight);
					}
					rect.bottom = rect.top + tooltipHeight;
				}
			} else if (contained === "window") {
				if (isPortaled() && containerRect) {
					if (typeof x !== "number") {
						if ((xAlign === "start" || xAlign === "center") && containerRect.left + rect.right > window.innerWidth) rect.left = alignValue(xValue, "end", xOffset, tooltipWidth);
						if ((xAlign === "end" || xAlign === "center") && containerRect.left + rect.left < 0) rect.left = alignValue(xValue, "start", xOffset, tooltipWidth);
						rect.left = clampToEdges(rect.left, -containerRect.left, window.innerWidth - containerRect.left - tooltipWidth);
					}
					rect.right = rect.left + tooltipWidth;
					if (typeof y !== "number") {
						if ((yAlign === "start" || yAlign === "center") && containerRect.top + rect.bottom > window.innerHeight) rect.top = alignValue(yValue, "end", yOffset, tooltipHeight);
						if ((yAlign === "end" || yAlign === "center") && containerRect.top + rect.top < 0) rect.top = alignValue(yValue, "start", yOffset, tooltipHeight);
						rect.top = clampToEdges(rect.top, -containerRect.top, window.innerHeight - containerRect.top - tooltipHeight);
					}
					rect.bottom = rect.top + tooltipHeight;
				}
			}
			const offsetX = isPortaled() && containerRect ? containerRect.left : 0;
			const offsetY = isPortaled() && containerRect ? containerRect.top : 0;
			return {
				x: rect.left + offsetX,
				y: rect.top + offsetY
			};
		});
		const motionX = createMotion(null, () => positions().x, motion);
		const motionY = createMotion(null, () => positions().y, motion);
		if (facetAll && ctx.facet.enabled && dataProp === void 0) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(ctx.facet.panels);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let panel = each_array[$$index];
				const row = panelDatum(ctx, panel, ctx.tooltip.data);
				if (row) {
					$$renderer.push("<!--[0-->");
					Tooltip($$renderer, {
						data: row,
						x: x === "pointer" ? "data" : x,
						y: y === "pointer" ? "data" : y,
						anchor,
						xOffset,
						yOffset,
						classes,
						contained,
						fadeDuration,
						motion,
						pointerEvents,
						portal: portalProp,
						variant,
						props,
						class: className,
						children
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		} else if (tooltipData() && !ctx.tooltip.suppressed) {
			$$renderer.push(`<!--[1--><div${attributes({
				...props.root,
				class: clsx(cls("lc-tooltip-root", classes.root, props.root?.class))
			}, "svelte-crp5m6", {
				disablePointerEvents: pointerEvents === false,
				portaled: isPortaled()
			}, {
				top: `${stringify(motionY.current)}px`,
				left: `${stringify(motionX.current)}px`
			})}><div${attributes({
				...props.container,
				class: clsx(cls("lc-tooltip-container", classes.container, props.container?.class, className)),
				"data-variant": variant
			}, "svelte-crp5m6")}>`);
			if (children) {
				$$renderer.push(`<!--[0--><div${attributes({
					...props.content,
					class: clsx(cls("lc-tooltip-content", classes.content))
				}, "svelte-crp5m6")}>`);
				children($$renderer, { data: tooltipData() });
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { rootRef: rootRefProp });
	});
}
//#endregion
export { panelDatum as a, isSinglePointMode as i, dataCoords as n, findDatumByValue as r, Tooltip as t };

//# sourceMappingURL=Tooltip2.js.map