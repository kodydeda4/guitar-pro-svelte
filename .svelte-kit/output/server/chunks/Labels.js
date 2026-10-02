import { c as ensure_array_like, f as spread_props, o as derived } from "./server.js";
import { s as accessor, t as getChartContext } from "./chart.js";
import { i as isScaleBand } from "./scales.svelte.js";
import { C as getLayerContext } from "./key.svelte.js";
import { c as Group_svg, o as Group_html, s as Group_canvas } from "./Path.canvas.js";
import { t as extractLayerProps } from "./attributes.js";
import { a as getTextRect, i as getPixelValue, n as Text_canvas, r as Text_svg, t as Text_html } from "./Text.html.js";
import { t as occlude } from "./occlusion.js";
import { n as createDimensionGetter } from "./rect.svelte.js";
import { n as Points_canvas, r as Points_svg, t as Points_html } from "./Points.html.js";
import { i as getPointLabelRect, n as Link_svg, r as getPointLabelLayout, t as Link_canvas } from "./Link.canvas.js";
import { format } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
import { Delaunay } from "d3-delaunay";
import { polygonArea, polygonCentroid } from "d3-polygon";
//#region node_modules/layerchart/dist/components/Labels/Labels.shared.svelte.js
var LabelsState = class {
	#getProps = () => ({});
	ctx = getChartContext();
	constructor(getProps) {
		this.#getProps = getProps;
		this.ctx.registerComponent({
			name: "Labels",
			kind: "composite-mark"
		});
	}
	#getDimensions = derived(() => createDimensionGetter(this.ctx, () => ({
		x: this.#getProps().x,
		y: this.#getProps().y
	})));
	get getDimensions() {
		return this.#getDimensions();
	}
	set getDimensions($$value) {
		return this.#getDimensions($$value);
	}
	#series = derived(() => {
		const seriesKey = this.#getProps().seriesKey;
		return seriesKey ? this.ctx.series.series.find((s) => s.key === seriesKey) : void 0;
	});
	get series() {
		return this.#series();
	}
	set series($$value) {
		return this.#series($$value);
	}
	#derivedOpacity = derived(() => {
		return this.#getProps().opacity ?? (this.series?.key == null || this.ctx.series.visibleSeries.length <= 1 || this.ctx.series.isHighlighted(this.series.key, true) ? 1 : .1);
	});
	get derivedOpacity() {
		return this.#derivedOpacity();
	}
	set derivedOpacity($$value) {
		return this.#derivedOpacity($$value);
	}
	getTextProps(point, points, i) {
		const props = this.#getProps();
		const placement = props.placement ?? "outside";
		const offset = props.offset ?? (placement === "center" || placement === "middle" ? 0 : 4);
		const pointValue = isScaleBand(this.ctx.yScale) ? point.xValue : point.yValue;
		const isLowEdge = point.edgeIndex != null ? point.edgeIndex === 0 : pointValue < 0;
		const fillValue = typeof props.fill === "function" ? accessor(props.fill)(point.data) : props.fill;
		const displayValue = props.value ? accessor(props.value)(point.data) : isScaleBand(this.ctx.yScale) ? point.xValue : point.yValue;
		const formattedValue = format(displayValue, props.format ?? (props.value ? void 0 : isScaleBand(this.ctx.yScale) ? this.ctx.xScale.tickFormat?.() : this.ctx.yScale.tickFormat?.()));
		let result;
		if (isScaleBand(this.ctx.yScale)) {
			if (placement === "center") {
				const dims = this.getDimensions(point.data) ?? {
					x: point.x,
					y: point.y,
					width: 0,
					height: 0
				};
				result = {
					value: formattedValue,
					fill: fillValue,
					x: dims.x + dims.width / 2,
					y: dims.y + dims.height / 2,
					textAnchor: "middle",
					verticalAnchor: "middle",
					capHeight: ".6rem"
				};
			} else if (isLowEdge) result = {
				value: formattedValue,
				fill: fillValue,
				x: point.x + (placement === "outside" ? -offset : offset),
				y: point.y,
				textAnchor: placement === "middle" ? "middle" : placement === "outside" ? "end" : "start",
				verticalAnchor: "middle",
				capHeight: ".6rem"
			};
			else result = {
				value: formattedValue,
				fill: fillValue,
				x: point.x + (placement === "outside" ? offset : -offset),
				y: point.y,
				textAnchor: placement === "middle" ? "middle" : placement === "outside" ? "start" : "end",
				verticalAnchor: "middle",
				capHeight: ".6rem"
			};
		} else if (placement === "center") {
			const dims = this.getDimensions(point.data) ?? {
				x: point.x,
				y: point.y,
				width: 0,
				height: 0
			};
			result = {
				value: formattedValue,
				fill: fillValue,
				x: dims.x + dims.width / 2,
				y: dims.y + dims.height / 2,
				capHeight: ".6rem",
				textAnchor: "middle",
				verticalAnchor: "middle"
			};
		} else if (isLowEdge) result = {
			value: formattedValue,
			fill: fillValue,
			x: point.x,
			y: point.y + (placement === "outside" ? offset : -offset),
			capHeight: ".6rem",
			textAnchor: "middle",
			verticalAnchor: placement === "middle" ? "middle" : placement === "outside" ? "start" : "end"
		};
		else result = {
			value: formattedValue,
			fill: fillValue,
			x: point.x,
			y: point.y + (placement === "outside" ? -offset : offset),
			capHeight: ".6rem",
			textAnchor: "middle",
			verticalAnchor: placement === "middle" ? "middle" : placement === "outside" ? "end" : "start"
		};
		if (placement === "smart" && points != null && i != null) {
			const getValue = (p) => isScaleBand(this.ctx.yScale) ? p.xValue : p.yValue;
			const curr = getValue(point);
			const prev = i > 0 ? getValue(points[i - 1]) : curr;
			const next = i < points.length - 1 ? getValue(points[i + 1]) : curr;
			const xPrevTight = Math.abs(prev - curr) < offset;
			const xNextTight = Math.abs(curr - next) < offset;
			const isPeak = prev <= curr && curr >= next || xPrevTight && xNextTight;
			const isTrough = prev >= curr && curr <= next || xPrevTight && xNextTight;
			const isRising = !isPeak && !isTrough && prev < curr;
			const isFalling = !isPeak && !isTrough && prev >= curr;
			const markOffset = (point.r ?? 0) + offset;
			return {
				...result,
				x: point.x,
				y: point.y,
				dx: isRising ? xPrevTight ? markOffset : -markOffset : isFalling ? xNextTight ? -markOffset : markOffset : 0,
				dy: isPeak ? -markOffset : isTrough ? markOffset : 0,
				textAnchor: isRising ? xPrevTight ? "start" : "end" : isFalling ? xNextTight ? "end" : "start" : "middle",
				verticalAnchor: isPeak ? "end" : isTrough ? "start" : "middle"
			};
		}
		return result;
	}
	/**
	* `layout="voronoi"`: orient each label towards the open space of its Voronoi cell.
	* With `links`, move the label out to the cell centroid and draw a leader back to the
	* point (using AnnotationPoint's `smart` geometry). When `occlude` is set, drop labels
	* that would overlap a roomier-cell label. Returns per-point `{ textProps, link, visible }`,
	* index-aligned to `points`.
	*/
	getVoronoiLabels(points) {
		const props = this.#getProps();
		const offset = props.offset ?? 4;
		const fontSize = getPixelValue(props.fontSize ?? 12);
		const links = props.links != null && props.links !== false;
		const maxMove = this.ctx.width * .2;
		const orient = [
			{
				textAnchor: "start",
				dx: offset,
				dy: 0
			},
			{
				textAnchor: "middle",
				dx: 0,
				dy: offset + fontSize / 2
			},
			{
				textAnchor: "end",
				dx: -offset,
				dy: 0
			},
			{
				textAnchor: "middle",
				dx: 0,
				dy: -(offset + fontSize / 2)
			}
		];
		const voronoi = Delaunay.from(points, (p) => p.x, (p) => p.y).voronoi([
			0,
			0,
			this.ctx.width,
			this.ctx.height
		]);
		const candidates = points.map((point, i) => {
			const polygon = voronoi.cellPolygon(i);
			const centroid = polygon ? polygonCentroid(polygon) : [point.x, point.y];
			const area = polygon ? Math.abs(polygonArea(polygon)) : 0;
			const displayValue = props.value ? accessor(props.value)(point.data) : isScaleBand(this.ctx.yScale) ? point.xValue : point.yValue;
			const text = String(format(displayValue, props.format));
			const fill = typeof props.fill === "function" ? accessor(props.fill)(point.data) : props.fill;
			if (links) {
				const dist = Math.hypot(centroid[0] - point.x, centroid[1] - point.y);
				const move = polygon != null && dist > 1e-6 && dist <= maxMove;
				const opts = {
					x: point.x,
					y: point.y,
					labelPlacement: "smart",
					labelX: move ? centroid[0] : point.x,
					labelY: move ? centroid[1] : point.y,
					fontSize,
					link: move
				};
				const layout = getPointLabelLayout(opts);
				return {
					point,
					i,
					area,
					textProps: {
						value: text,
						fill,
						x: layout.text.x,
						y: layout.text.y,
						textAnchor: layout.text.textAnchor,
						verticalAnchor: layout.text.verticalAnchor
					},
					box: getPointLabelRect(text, opts),
					link: move ? {
						x1: point.x,
						y1: point.y,
						x2: layout.anchor.x,
						y2: layout.anchor.y
					} : null
				};
			}
			const angle = (Math.round(Math.atan2(centroid[1] - point.y, centroid[0] - point.x) / Math.PI * 2) + 4) % 4;
			const o = orient[angle];
			return {
				point,
				i,
				area,
				textProps: {
					value: text,
					fill,
					x: point.x,
					y: point.y,
					dx: o.dx,
					dy: o.dy,
					textAnchor: o.textAnchor,
					verticalAnchor: "middle"
				},
				box: getTextRect(text, point.x, point.y, {
					dx: o.dx,
					dy: o.dy,
					textAnchor: o.textAnchor,
					fontSize
				}),
				link: null
			};
		});
		const occludeOn = props.occlude != null && props.occlude !== false;
		const padding = typeof props.occlude === "object" ? props.occlude.padding ?? 2 : 2;
		const visible = occludeOn ? new Set(occlude(candidates, (c) => c.box, {
			priority: (c) => c.area,
			padding
		}).map((c) => c.i)) : null;
		return candidates.map((c) => ({
			textProps: c.textProps,
			link: c.link,
			visible: visible == null || visible.has(c.i)
		}));
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Labels/Labels.base.svelte
function Labels_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Text, Group, Points, Link, data, value, x, y, seriesKey, placement = "outside", layout, occlude, links, offset = placement === "center" || placement === "middle" ? 0 : 4, format, key = (_, i) => i, children: childrenProp, class: className, fill, opacity, $$slots, $$events, ...restProps } = $$props;
		const linkProps = derived(() => typeof links === "object" ? links : {});
		const c = new LabelsState(() => ({
			data,
			value,
			x,
			y,
			seriesKey,
			placement,
			layout,
			occlude,
			links,
			offset,
			format,
			fill,
			opacity,
			fontSize: restProps.fontSize
		}));
		const fontSizeVar = derived(() => restProps.fontSize != null ? `--labels-font-size: ${getPixelValue(restProps.fontSize)}px` : void 0);
		if (Group) {
			$$renderer.push("<!--[-->");
			Group($$renderer, {
				class: "lc-labels-g",
				opacity: c.derivedOpacity,
				style: fontSizeVar(),
				children: ($$renderer) => {
					{
						function children($$renderer, { points }) {
							if (layout === "voronoi") {
								$$renderer.push("<!--[0-->");
								const voronoiLabels = c.getVoronoiLabels(points);
								$$renderer.push(`<!--[-->`);
								const each_array = ensure_array_like(points);
								for (let i = 0, $$length = each_array.length; i < $$length; i++) {
									let point = each_array[i];
									const item = voronoiLabels[i];
									if (item.visible) {
										$$renderer.push("<!--[0-->");
										const textProps = extractLayerProps(item.textProps, "lc-labels-text");
										if (childrenProp) {
											$$renderer.push("<!--[0-->");
											childrenProp($$renderer, {
												data: point,
												textProps,
												link: item.link
											});
											$$renderer.push(`<!---->`);
										} else {
											$$renderer.push("<!--[-1-->");
											if (item.link && Link) {
												$$renderer.push("<!--[0-->");
												if (Link) {
													$$renderer.push("<!--[-->");
													Link($$renderer, spread_props([
														{
															x1: item.link.x1,
															y1: item.link.y1,
															x2: item.link.x2,
															y2: item.link.y2,
															type: "straight"
														},
														linkProps(),
														{ class: cls("lc-labels-link", typeof linkProps().class === "string" ? linkProps().class : void 0) }
													]));
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
											} else $$renderer.push("<!--[-1-->");
											$$renderer.push(`<!--]--> `);
											if (Text) {
												$$renderer.push("<!--[-->");
												Text($$renderer, spread_props([
													textProps,
													restProps,
													extractLayerProps(item.textProps, "lc-labels-text", className ?? "")
												]));
												$$renderer.push("<!--]-->");
											} else {
												$$renderer.push("<!--[!-->");
												$$renderer.push("<!--]-->");
											}
										}
										$$renderer.push(`<!--]-->`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]-->`);
								}
								$$renderer.push(`<!--]-->`);
							} else {
								$$renderer.push(`<!--[-1--><!--[-->`);
								const each_array_1 = ensure_array_like(points);
								for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
									let point = each_array_1[i];
									const baseProps = c.getTextProps(point, points, i);
									const textProps = extractLayerProps(baseProps, "lc-labels-text");
									if (childrenProp) {
										$$renderer.push("<!--[0-->");
										childrenProp($$renderer, {
											data: point,
											textProps
										});
										$$renderer.push(`<!---->`);
									} else {
										$$renderer.push("<!--[-1-->");
										if (Text) {
											$$renderer.push("<!--[-->");
											Text($$renderer, spread_props([
												{ "data-placement": placement },
												textProps,
												restProps,
												extractLayerProps(baseProps, "lc-labels-text", className ?? "")
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
							}
							$$renderer.push(`<!--]-->`);
						}
						if (Points) {
							$$renderer.push("<!--[-->");
							Points($$renderer, {
								data,
								x,
								y,
								seriesKey,
								children,
								$$slots: { default: true }
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					}
				},
				$$slots: { default: true }
			});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Labels/Labels.svg.svelte
function Labels_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Labels_base($$renderer, spread_props([{
		Text: Text_svg,
		Group: Group_svg,
		Points: Points_svg,
		Link: Link_svg
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Labels/Labels.canvas.svelte
function Labels_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Labels_base($$renderer, spread_props([{
		Text: Text_canvas,
		Group: Group_canvas,
		Points: Points_canvas,
		Link: Link_canvas
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Labels/Labels.html.svelte
function Labels_html($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Labels_base($$renderer, spread_props([{
		Text: Text_html,
		Group: Group_html,
		Points: Points_html
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Labels/Labels.svelte
function Labels($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			Labels_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			Labels_canvas($$renderer, spread_props([props]));
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			Labels_html($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Labels as default };

//# sourceMappingURL=Labels.js.map