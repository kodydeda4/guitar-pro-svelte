import { Mt as attr, Nt as clsx, Wt as escape_html, a as bind_props, c as ensure_array_like, h as stringify, n as attr_style, o as derived, r as attributes, t as attr_class } from "./server.js";
import { p as resolveMaybeFn, t as getChartContext } from "./chart.js";
import { t as extractLayerProps } from "./attributes.js";
import { t as asAny } from "./types.js";
import { format } from "@layerstack/utils";
import { scaleBand, scaleLinear } from "d3-scale";
import { quantile, range } from "d3-array";
import { cls } from "@layerstack/tailwind";
import { interpolate, interpolateRound, quantize } from "d3-interpolate";
//#region node_modules/layerchart/dist/components/ColorRamp.svelte
function ColorRamp($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { interpolator, steps = 10, height = "20px", width = "100%", ref: refProp = void 0, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<image${attributes({
			href: "",
			preserveAspectRatio: "none",
			height,
			width,
			...extractLayerProps(restProps, "lc-color-ramp")
		}, void 0, void 0, void 0, 3)}></image>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Legend.svelte
function Legend($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { scale: scaleProp, title = "", width = 320, height = 10, ticks = width / 64, tickFormat: tickFormatProp, tickValues: tickValuesProp, tickFontSize = 10, tickLength: tickLengthProp = 4, placement, orientation = "horizontal", onclick: onclickProp, onpointerenter: onpointerenterProp, onpointerleave: onpointerleaveProp, variant: variantProp, selected: selectedProp, value: valueProp, classes = {}, ref: refProp = void 0, class: className, children, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const hasSeriesWithColors = derived(() => {
			if (!ctx.series) return false;
			const allSeries = ctx.series.series ?? [];
			if (ctx.cGroups) return false;
			return allSeries.length > 0 && !ctx.series.isDefaultSeries && allSeries.some((s) => s.color);
		});
		const scale = derived(() => hasSeriesWithColors() ? null : scaleProp ?? ctx.cScale);
		const seriesItems = derived(() => {
			if (!hasSeriesWithColors() || !ctx.series) return null;
			const allSeries = ctx.series.series ?? [];
			if (allSeries.length === 0) return null;
			return allSeries.filter((s) => s && s.key).map((s) => {
				let label = s.label ?? s.key;
				if (typeof label !== "string") label = String(s.key);
				return {
					key: s.key,
					label,
					color: s.color ?? "currentColor"
				};
			});
		});
		const scaleConfig = derived(() => {
			if (!scale()) return {
				xScale: void 0,
				interpolator: void 0,
				swatches: void 0,
				tickLabelOffset: 0,
				tickLine: true,
				tickLength: tickLengthProp,
				tickFormat: tickFormatProp,
				tickValues: tickValuesProp
			};
			else if (scale().interpolate) {
				const n = Math.min(scale().domain().length, scale().range().length);
				const xScale = scale().copy().rangeRound?.(quantize(interpolate(0, width), n));
				return {
					xScale,
					interpolator: scale().copy().domain(quantize(interpolate(0, 1), n)),
					tickFormat: tickFormatProp ?? xScale?.tickFormat?.(),
					tickLabelOffset: 0,
					tickLine: true,
					tickValues: tickValuesProp,
					tickLength: tickLengthProp,
					swatches: void 0
				};
			} else if (scale().interpolator) {
				const xScale = Object.assign(scale().copy().interpolator(interpolateRound(0, width)), { range() {
					return [0, width];
				} });
				const interpolator = scale().interpolator();
				let tickValues = tickValuesProp;
				if (!xScale.ticks) {
					if (tickValues === void 0) {
						const n = Math.round(ticks + 1);
						tickValues = range(n).map((i) => quantile(scale().domain(), i / (n - 1)));
					}
				}
				const tickFormat = tickFormatProp ?? xScale.tickFormat?.();
				return {
					interpolator,
					tickValues,
					tickFormat,
					swatches: void 0,
					tickLabelOffset: 0,
					tickLine: true,
					tickLength: tickLengthProp,
					xScale
				};
			} else if (scale().invertExtent) {
				const thresholds = scale().thresholds ? scale().thresholds() : scale().quantiles ? scale().quantiles() : scale().domain();
				const xScale = scaleLinear().domain([-1, scale().range().length - 1]).rangeRound([0, width]);
				const swatches = scale().range().map((d, i) => {
					return {
						x: xScale(i - 1),
						y: 0,
						width: xScale(i) - xScale(i - 1),
						height,
						fill: d
					};
				});
				const tickValues = range(thresholds.length);
				const tickFormat = (i) => {
					const value = thresholds[i];
					return tickFormatProp ? format(value, tickFormatProp) : value;
				};
				return {
					xScale,
					swatches,
					tickValues,
					tickFormat,
					tickLabelOffset: 0,
					tickLine: true,
					tickLength: tickLengthProp,
					interpolator: void 0
				};
			} else {
				const xScale = scaleBand().domain(scale().domain()).rangeRound([0, width]);
				const swatches = scale().domain().map((d) => {
					return {
						x: xScale(d),
						y: 0,
						width: Math.max(0, xScale.bandwidth() - 1),
						height,
						fill: scale()(d)
					};
				});
				const tickValues = scale().domain();
				const tickLabelOffset = xScale.bandwidth() / 2;
				return {
					xScale,
					tickFormat: tickFormatProp,
					tickLabelOffset,
					tickLine: false,
					tickLength: 0,
					tickValues,
					swatches,
					interpolator: void 0
				};
			}
		});
		/**
		* An ordinal scale is the `else` of `scaleConfig` above — it interpolates nothing and inverts to
		* no extent.
		*/
		const isOrdinalScale = derived(() => !!scale() && !scale().interpolate && !scale().interpolator && !scale().invertExtent);
		const variant = derived(() => variantProp ?? (seriesItems() || isOrdinalScale() ? "swatches" : "ramp"));
		const selected = derived(() => selectedProp ?? ctx.series?.selectedKeys?.current ?? []);
		const indicatorX = derived(() => {
			if (variant() !== "ramp" || !scale()) return null;
			let value = valueProp;
			if (value == null) {
				const data = ctx.tooltip?.data;
				if (data == null) return null;
				value = ctx.c?.(data);
			}
			if (value == null) return null;
			if (scale().invertExtent) {
				const i = scale().range().indexOf(scale()(value));
				if (i < 0) return null;
				const x0 = scaleConfig().xScale?.(i - 1);
				const x1 = scaleConfig().xScale?.(i);
				if (typeof x0 !== "number" || typeof x1 !== "number") return null;
				return (x0 + x1) / 2;
			}
			const x = scaleConfig().xScale?.(value);
			if (typeof x !== "number" || !Number.isFinite(x)) return null;
			return x + scaleConfig().tickLabelOffset;
		});
		const swatchItems = derived(() => {
			if (seriesItems()) return seriesItems().map((series) => ({
				value: series.key,
				label: series.label,
				color: series.color,
				onclick: (e) => ctx.series?.selectedKeys?.toggle?.(series.key),
				onpointerenter: (e) => {
					ctx.series.highlightKey = series.key;
				},
				onpointerleave: (e) => {
					ctx.series.highlightKey = null;
				},
				selected: selected().length === 0 || selected().includes(series.key)
			}));
			else return (scaleConfig().tickValues ?? scaleConfig().xScale?.ticks?.(ticks) ?? []).map((tick) => ({
				value: tick,
				label: tickFormatProp ? format(tick, asAny(tickFormatProp)) : tick,
				color: scale()?.(tick) ?? "",
				onclick: (e) => ctx.series?.selectedKeys?.toggle?.(tick),
				onpointerenter: (e) => {
					ctx.series.highlightKey = tick;
				},
				onpointerleave: (e) => {
					ctx.series.highlightKey = null;
				},
				selected: selected().length === 0 || selected().includes(tick)
			}));
		});
		$$renderer.push(`<div${attributes({
			...restProps,
			"data-placement": placement,
			class: clsx(cls("lc-legend-container", className, classes.root))
		}, "svelte-1odwfni")}><div${attr_class(clsx(cls("lc-legend-title", classes.title)), "svelte-1odwfni")}>${escape_html(title)}</div> `);
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, {
				values: scaleConfig().tickValues ?? scaleConfig().xScale?.ticks?.(ticks) ?? [],
				scale: scale(),
				seriesItems: seriesItems()
			});
			$$renderer.push(`<!---->`);
		} else if (variant() === "ramp") {
			$$renderer.push("<!--[1-->");
			const indicatorSize = 6;
			const tickLabelY = height + tickLengthProp + tickFontSize;
			const svgHeight = tickLabelY;
			$$renderer.push(`<svg${attr("width", width)}${attr("height", svgHeight)}${attr("viewBox", `0 0 ${stringify(width)} ${stringify(svgHeight)}`)}${attr_class(clsx(cls("lc-legend-ramp-svg")), "svelte-1odwfni")}><g class="lc-legend-ramp-g">`);
			if (scaleConfig().interpolator) {
				$$renderer.push("<!--[0-->");
				ColorRamp($$renderer, {
					width,
					height,
					interpolator: scaleConfig().interpolator,
					class: "lc-legend-color-ramp"
				});
			} else if (scaleConfig().swatches) {
				$$renderer.push(`<!--[1--><!--[-->`);
				const each_array = ensure_array_like(scaleConfig().swatches);
				for (let i = 0, $$length = each_array.length; i < $$length; i++) {
					let swatch = each_array[i];
					$$renderer.push(`<rect${attributes({ ...extractLayerProps(swatch, "lc-legend-ramp-swatch") }, "svelte-1odwfni", void 0, void 0, 3)}></rect>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></g><g class="lc-legend-tick-group"><!--[-->`);
			const each_array_1 = ensure_array_like(tickValuesProp ?? scaleConfig().xScale?.ticks?.(ticks) ?? []);
			for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
				let tick = each_array_1[i];
				$$renderer.push(`<text text-anchor="middle"${attr("x", scaleConfig().xScale?.(tick) + scaleConfig().tickLabelOffset)}${attr("y", tickLabelY)}${attr_class(clsx(cls("lc-legend-tick-text", classes.label)), "svelte-1odwfni")}${attr_style("", { "font-size": tickFontSize })}>${escape_html(tickFormatProp ? format(tick, asAny(tickFormatProp)) : tick)}</text>`);
				if (scaleConfig().tickLine) $$renderer.push(`<!--[0--><line${attr("x1", scaleConfig().xScale?.(tick))}${attr("y1", 0)}${attr("x2", scaleConfig().xScale?.(tick))}${attr("y2", height + tickLengthProp)}${attr_class(clsx(cls("lc-legend-tick-line", classes.tick)), "svelte-1odwfni")}></line>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></g>`);
			if (indicatorX() != null) $$renderer.push(`<!--[0--><path${attr("d", `M${stringify(indicatorX() - 4)},${stringify(height + indicatorSize + 1)} L${stringify(indicatorX() + 4)},${stringify(height + indicatorSize + 1)} L${stringify(indicatorX())},${stringify(height)} Z`)}${attr_class(clsx(cls("lc-legend-indicator")), "svelte-1odwfni")}></path>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></svg>`);
		} else if (variant() === "swatches") {
			$$renderer.push(`<!--[2--><div${attr_class(clsx(cls("lc-legend-swatch-group", classes.items)), "svelte-1odwfni")}${attr("data-orientation", orientation)}><!--[-->`);
			const each_array_2 = ensure_array_like(swatchItems());
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let item = each_array_2[$$index_2];
				$$renderer.push(`<button type="button"${attr_class(clsx(cls("lc-legend-swatch-button", resolveMaybeFn(classes?.item, item))), "svelte-1odwfni")}${attr_style("", { opacity: selected().length === 0 || selected().includes(item.value) ? 1 : .3 })}><div${attr_class(clsx(cls("lc-legend-swatch", classes.swatch)), "svelte-1odwfni")}${attr_style("", { "background-color": item.color })}></div> <div${attr_class(clsx(cls("lc-legend-swatch-label", classes.label)), "svelte-1odwfni")}>${escape_html(item.label)}</div></button>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
export { Legend as default };

//# sourceMappingURL=Legend.js.map