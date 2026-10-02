import { Nt as clsx, Wt as escape_html, a as bind_props, c as ensure_array_like, f as spread_props, n as attr_style, o as derived, r as attributes, t as attr_class } from "./server.js";
import { c as chartDataArray, f as isEqualValue, s as accessor, t as getChartContext } from "./chart.js";
import { i as isSinglePointMode, t as Tooltip } from "./Tooltip2.js";
import { t as asAny } from "./types.js";
import { format } from "@layerstack/utils";
import { sum } from "d3-array";
import { cls } from "@layerstack/tailwind";
//#region node_modules/layerchart/dist/components/tooltip/TooltipHeader.svelte
function TooltipHeader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, colorRef: colorRefProp = void 0, value, format: format$2, color, classes = {
			root: "",
			color: ""
		}, props = {
			root: {},
			color: {}
		}, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			class: clsx(cls("lc-tooltip-header", classes.root, props.root?.class, className)),
			...restProps
		}, "svelte-1d44xgt")}>`);
		if (color) $$renderer.push(`<!--[0--><div${attr_class(clsx(cls("lc-tooltip-header-color", classes.color)), "svelte-1d44xgt")}${attr_style("", { "--color": color })}></div>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (children) {
			$$renderer.push("<!--[0-->");
			children?.($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push(`<!--[-1-->${escape_html(format$2 ? format(value, asAny(format$2)) : value)}`);
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, {
			ref: refProp,
			colorRef: colorRefProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipItem.svelte
function TooltipItem($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, labelRef: labelRefProp = void 0, valueRef: valueRefProp = void 0, colorRef: colorRefProp = void 0, label, value, format: format$1, valueAlign = "left", color, classes = {
			root: "",
			label: "",
			value: "",
			color: ""
		}, props = {
			root: {},
			label: {},
			value: {},
			color: {}
		}, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			...props.root,
			class: clsx(cls("lc-tooltip-item-root", classes.root, className, props.root?.class)),
			...restProps
		}, "svelte-ytd3mj")}><div${attributes({
			...props.label,
			class: clsx(cls("lc-tooltip-item-label", "label", classes.label, props.label?.class))
		}, "svelte-ytd3mj")}>`);
		if (color) $$renderer.push(`<!--[0--><div${attributes({
			...props.color,
			class: clsx(cls("lc-tooltip-item-color", "color", classes.color, props.color?.class))
		}, "svelte-ytd3mj", void 0, { "--color": color })}></div>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (typeof label === "function") {
			$$renderer.push("<!--[0-->");
			label($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push(`<!--[-1-->${escape_html(label)}`);
		$$renderer.push(`<!--]--></div> <div${attributes({
			...props.value,
			class: clsx(cls("lc-tooltip-item-value", "value", classes.value, props.value?.class)),
			"data-align": valueAlign
		}, "svelte-ytd3mj")}>`);
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push(`<!--[-1-->${escape_html(format$1 ? format(value, asAny(format$1)) : value)}`);
		$$renderer.push(`<!--]--></div></div>`);
		bind_props($$props, {
			ref: refProp,
			labelRef: labelRefProp,
			valueRef: valueRefProp,
			colorRef: colorRefProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipList.svelte
function TooltipList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			class: clsx(cls("lc-tooltip-list", className)),
			...restProps
		}, "svelte-10s3jfe")}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipSeparator.svelte
function TooltipSeparator($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			class: clsx(cls("lc-tooltip-separator", className)),
			...restProps
		}, "svelte-rriep1")}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/charts/DefaultTooltip.svelte
function DefaultTooltip($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const Tooltip$1 = {
			Root: Tooltip,
			Header: TooltipHeader,
			List: TooltipList,
			Item: TooltipItem,
			Separator: TooltipSeparator
		};
		let { tooltipProps, canHaveTotal = false } = $$props;
		const context = getChartContext();
		/**
		* One row of the tooltip's list.  `seriesKey` is the series it highlights on hover, or `null`
		* when the item is a sub-band of the data rather than a series.
		*/
		const visibleSeries = derived(() => context.tooltip.series.filter((s) => s.visible));
		/**
		* The rows the hovered band covers.
		*
		* Data-driven sub-bands (`x1` / `y1`) split one band across a row each, holding only that
		* sub-band's series — so the band's values live across the rows rather than in the single one
		* the pointer resolved to, and a tooltip for the band has to read all of them.
		*
		* A facet panel groups the same way, with the scale inside it as the sub-band, so its rows are
		* read back off the panel instead of matched on a value.
		*/
		function bandData(data) {
			if (context.facetBand) return context.facet.panels.find((panel) => panel.has(data))?.data ?? [data];
			const banded = context.props.x1 != null ? context.x : context.props.y1 != null ? context.y : context.cKey(data) != null ? context.valueAxis === "y" ? context.x : context.y : null;
			if (!banded) return [data];
			const value = banded(data);
			return (context.facet.enabled ? context.facet.panels.find((panel) => panel.has(data))?.data ?? chartDataArray(context.data) : chartDataArray(context.data)).filter((d) => isEqualValue(banded(d), value));
		}
		/**
		* The series values for the row being shown.
		*
		* `Tooltip.Root facetAll` renders one tooltip per facet panel, each for a *different* row, so
		* the values resolved for the hovered row can't be reused — they're re-read with the same
		* accessor rule `TooltipContext` uses.
		*/
		function seriesFor(data) {
			const d = bandData(data);
			if (d.length > 1 && context.series.isDefaultSeries) {
				const value = context.valueAxis === "y" ? context.y : context.x;
				const subBand = context.facetBand ? context.valueAxis === "y" ? context.x : context.y : context.props.x1 != null ? context.x1 : context.props.y1 != null ? context.y1 : context.c;
				return d.map((row, i) => ({
					key: [subBand(row), context.cKey(row) ?? i].join("\0"),
					seriesKey: context.cKey(row) ?? null,
					label: context.cKey(row) ?? subBand(row),
					value: value(row),
					color: context.cChannel ? context.cGet(row) : void 0
				}));
			}
			return (d.length === 1 && data === context.tooltip.data ? visibleSeries() : visibleSeries().map((s) => {
				const config = s.config;
				const valueAcc = accessor(config?.value ?? (config?.data ? context.props.y ?? context.props.x : config?.key));
				const match = d.find((row) => valueAcc(row) != null);
				return {
					...s,
					value: match != null ? valueAcc(match) : void 0
				};
			})).filter((s) => s.value != null).map((s) => ({
				key: s.key,
				seriesKey: s.key,
				label: s.label,
				value: s.value,
				color: s.color
			}));
		}
		const singlePointMode = derived(() => isSinglePointMode(context.tooltip.mode));
		const activeSeries = derived(() => singlePointMode() ? context.tooltip.series.find((s) => s.key === context.tooltip.data?.seriesKey) ?? context.tooltip.series[0] : null);
		/**
		* The header for the row being shown — the x-axis value (or the y-axis one for horizontal and
		* vertical charts), or the facet when the panel is the band, since the scale inside it labels
		* the items instead.
		*
		* Taken from the row it's passed for the same reason `seriesFor` is: with `facetAll` each panel
		* shows a *different* row, and a header read off the hovered one would name that panel in all of
		* them.
		*/
		function headerLabelFor(data) {
			if (!data) return void 0;
			if (context.facetBand) return context.facet.tooltipLabel(data);
			return context.valueAxis === "y" ? context.x(data) : context.y(data);
		}
		/**
		* The panel the row sits in, for charts where the panel *isn't* the band.
		*
		* The band value alone names a row in every panel — three panels each have a `Torgersen` — so it
		* only identifies the row once the panel is in front of it.  Empty when the panel is the band,
		* since the header is already the facet value there.
		*
		* What the panel is called is `facet.tooltip`'s to say, so both paths ask it.
		*/
		function facetLabelFor(data) {
			if (!data || context.facetBand || !context.facet.enabled) return void 0;
			return context.facet.tooltipLabel(data);
		}
		/**
		* The header with its facet in front, formatted here rather than by `Tooltip.Header` — the band
		* value still needs its own format applied before anything is joined to it, or a date or a
		* number would land in the header raw.
		*/
		function facetHeaderLabelFor(data) {
			const facetLabel = facetLabelFor(data);
			return facetLabel != null ? `${facetLabel} · ${format(headerLabelFor(data), tooltipProps?.header?.format)}` : void 0;
		}
		function isSeriesItemHighlighted(seriesKey) {
			return seriesKey ? context.series.isHighlighted(seriesKey, true) : void 0;
		}
		/**
		* What hovering the row's items highlights — its `c` category when the legend names those, and
		* the series the point belongs to otherwise.
		*/
		function activeKey(data) {
			return context.cKey(data) ?? activeSeries()?.key ?? null;
		}
		{
			function children($$renderer, { data }) {
				if (singlePointMode()) {
					$$renderer.push("<!--[0-->");
					if (activeSeries() && activeSeries().key !== "default") {
						$$renderer.push("<!--[0-->");
						if (Tooltip$1.Header) {
							$$renderer.push("<!--[-->");
							Tooltip$1.Header($$renderer, spread_props([{
								value: activeSeries().label ?? activeSeries().key,
								color: activeSeries().color
							}, tooltipProps?.header]));
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (Tooltip$1.List) {
						$$renderer.push("<!--[-->");
						Tooltip$1.List($$renderer, spread_props([tooltipProps?.list, {
							children: ($$renderer) => {
								if (Tooltip$1.Item) {
									$$renderer.push("<!--[-->");
									Tooltip$1.Item($$renderer, spread_props([{
										label: typeof context.config.x === "string" ? context.config.x : "x",
										value: context.x(data),
										"data-highlighted": isSeriesItemHighlighted(activeKey(data)),
										format,
										onpointerenter: () => context.series.highlightKey = activeKey(data),
										onpointerleave: () => context.series.highlightKey = null
									}, tooltipProps?.item]));
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
								$$renderer.push(` `);
								if (Tooltip$1.Item) {
									$$renderer.push("<!--[-->");
									Tooltip$1.Item($$renderer, spread_props([{
										label: typeof context.config.y === "string" ? context.config.y : "y",
										value: context.y(data),
										"data-highlighted": isSeriesItemHighlighted(activeKey(data)),
										format,
										onpointerenter: () => context.series.highlightKey = activeKey(data),
										onpointerleave: () => context.series.highlightKey = null
									}, tooltipProps?.item]));
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
								$$renderer.push(` `);
								if (context.config.r) {
									$$renderer.push("<!--[0-->");
									if (Tooltip$1.Item) {
										$$renderer.push("<!--[-->");
										Tooltip$1.Item($$renderer, spread_props([{
											label: typeof context.config.r === "string" ? context.config.r : "r",
											value: context.r(data),
											"data-highlighted": isSeriesItemHighlighted(activeKey(data)),
											format,
											onpointerenter: () => context.series.highlightKey = activeKey(data),
											onpointerleave: () => context.series.highlightKey = null
										}, tooltipProps?.item]));
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							},
							$$slots: { default: true }
						}]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				} else {
					$$renderer.push("<!--[-1-->");
					const facetHeaderLabel = facetHeaderLabelFor(data);
					if (facetHeaderLabel != null) {
						$$renderer.push("<!--[0-->");
						if (Tooltip$1.Header) {
							$$renderer.push("<!--[-->");
							Tooltip$1.Header($$renderer, spread_props([tooltipProps?.header, {
								value: facetHeaderLabel,
								format: void 0
							}]));
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					} else {
						$$renderer.push("<!--[-1-->");
						if (Tooltip$1.Header) {
							$$renderer.push("<!--[-->");
							Tooltip$1.Header($$renderer, spread_props([{
								value: headerLabelFor(data),
								format
							}, tooltipProps?.header]));
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					}
					$$renderer.push(`<!--]--> `);
					if (Tooltip$1.List) {
						$$renderer.push("<!--[-->");
						Tooltip$1.List($$renderer, spread_props([tooltipProps?.list, {
							children: ($$renderer) => {
								$$renderer.push(`<!--[-->`);
								const each_array = ensure_array_like(seriesFor(data));
								for (let i = 0, $$length = each_array.length; i < $$length; i++) {
									let s = each_array[i];
									if (Tooltip$1.Item) {
										$$renderer.push("<!--[-->");
										Tooltip$1.Item($$renderer, spread_props([{
											label: s.label,
											value: s.value,
											color: s.color,
											"data-highlighted": s.seriesKey != null ? context.series.isHighlighted(s.seriesKey, true) : void 0,
											format,
											valueAlign: "right",
											onpointerenter: () => context.series.highlightKey = s.seriesKey,
											onpointerleave: () => context.series.highlightKey = null
										}, tooltipProps?.item]));
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
								}
								$$renderer.push(`<!--]--> `);
								if (canHaveTotal && seriesFor(data).length > 1 && !tooltipProps?.hideTotal) {
									$$renderer.push("<!--[0-->");
									if (Tooltip$1.Separator) {
										$$renderer.push("<!--[-->");
										Tooltip$1.Separator($$renderer, spread_props([tooltipProps?.separator, { children: void 0 }]));
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
									$$renderer.push(` `);
									if (Tooltip$1.Item) {
										$$renderer.push("<!--[-->");
										Tooltip$1.Item($$renderer, spread_props([{
											label: "total",
											value: sum(seriesFor(data), (s) => s.value ?? 0),
											format: "integer",
											valueAlign: "right"
										}, tooltipProps?.item]));
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							},
							$$slots: { default: true }
						}]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				}
				$$renderer.push(`<!--]-->`);
			}
			if (Tooltip$1.Root) {
				$$renderer.push("<!--[-->");
				Tooltip$1.Root($$renderer, spread_props([
					{ context },
					tooltipProps?.root,
					{
						children,
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
	});
}
//#endregion
export { DefaultTooltip as default };

//# sourceMappingURL=DefaultTooltip.js.map