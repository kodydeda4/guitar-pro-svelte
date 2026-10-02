import { a as bind_props, c as ensure_array_like, f as spread_props, o as derived, u as props_id } from "./server.js";
import { s as accessor, t as getChartContext } from "./chart.js";
import { C as getLayerContext, T as getGeoContext, m as getFacetPanel } from "./key.svelte.js";
import { c as Group_svg, i as createId, n as Path_svg, s as Group_canvas, t as Path_canvas } from "./Path.canvas.js";
import { n as ClipPath_svg, t as ClipPath_canvas } from "./ClipPath.canvas.js";
import { max } from "d3-array";
import { cls } from "@layerstack/tailwind";
import { curveLinearClosed, pointRadial } from "d3-shape";
import { geoArea, geoCentroid, geoPath, geoTransform } from "d3-geo";
import { path } from "d3-path";
import { Delaunay } from "d3-delaunay";
import { geoVoronoi } from "d3-geo-voronoi";
import { polygonArea, polygonCentroid } from "d3-polygon";
//#region node_modules/layerchart/dist/components/CircleClipPath/CircleClipPath.base.svelte
function CircleClipPath_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { ClipPath, id = createId("clipPath-", uid), cx = 0, cy = 0, r, disabled = false, invert = false, children } = $$props;
		const path = derived(() => `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`);
		if (ClipPath) {
			$$renderer.push("<!--[-->");
			ClipPath($$renderer, {
				id,
				disabled,
				invert,
				children,
				path: path()
			});
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/CircleClipPath/CircleClipPath.svg.svelte
function CircleClipPath_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	CircleClipPath_base($$renderer, spread_props([{ ClipPath: ClipPath_svg }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/CircleClipPath/CircleClipPath.canvas.svelte
function CircleClipPath_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	CircleClipPath_base($$renderer, spread_props([{ ClipPath: ClipPath_canvas }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/utils/geo.js
/**
* Render a geoPath() using curve factory
* @see {@link https://observablehq.com/@d3/context-to-curve}
*/
function geoCurvePath(projection, curve, context) {
	const pathContext = context === void 0 ? path() : context;
	const geoPath$2 = geoPath(projection, curveContext(curve(pathContext)));
	const fn = (object) => {
		geoPath$2(object);
		return context === void 0 ? pathContext + "" : void 0;
	};
	Object.setPrototypeOf(fn, geoPath$2);
	return fn;
}
/**
* Translate Curve to GeoContext interface
*/
function curveContext(curve) {
	return {
		beginPath() {},
		moveTo(x, y) {
			curve.lineStart();
			curve.point(x, y);
		},
		arc(x, y, radius, startAngle, endAngle, anticlockwise) {},
		lineTo(x, y) {
			curve.point(x, y);
		},
		closePath() {
			curve.lineEnd();
		}
	};
}
//#endregion
//#region node_modules/layerchart/dist/components/geo/GeoPath/GeoPath.base.svelte
function GeoPath_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Path, geoTransform: geoTransform$1, geojson, tooltip, curve = curveLinearClosed, onclick, onpointerenter, onpointermove, onpointerleave, class: className, ref: refProp = void 0, children, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const geo = getGeoContext();
		const projection = derived(() => geoTransform$1 && geo.projection ? geoTransform(geoTransform$1(geo.projection)) : geo.projection);
		const geoPath$1 = derived(() => {
			if (!projection()) return;
			if (curve === curveLinearClosed) return geoPath(projection());
			return geoCurvePath(projection(), curve);
		});
		const pathData = derived(() => geojson ? geoPath$1()?.(geojson) ?? "" : "");
		function _onClick(e) {
			onclick?.(e, geoPath$1());
		}
		function _onPointerEnter(e) {
			onpointerenter?.(e);
			if (tooltip) ctx?.tooltip.show(e, geojson);
		}
		function _onPointerMove(e) {
			onpointermove?.(e);
			if (tooltip) ctx.tooltip.show(e, geojson);
		}
		function _onPointerLeave(e) {
			onpointerleave?.(e);
			if (tooltip) ctx.tooltip.hide();
		}
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, { geoPath: geoPath$1() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			if (Path) {
				$$renderer.push("<!--[-->");
				Path($$renderer, spread_props([
					{ pathData: pathData() },
					restProps,
					onclick && { onclick: _onClick },
					(tooltip || onpointerenter) && { onpointerenter: _onPointerEnter },
					(tooltip || onpointermove) && { onpointermove: _onPointerMove },
					(tooltip || onpointerleave) && { onpointerleave: _onPointerLeave },
					{
						class: cls("lc-geo-path", className),
						pathRef: refProp
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/geo/GeoPath/GeoPath.svg.svelte
function GeoPath_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	GeoPath_base($$renderer, spread_props([{ Path: Path_svg }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/geo/GeoPath/GeoPath.canvas.svelte
function GeoPath_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	GeoPath_base($$renderer, spread_props([{ Path: Path_canvas }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/geo/GeoPath/GeoPath.svelte
function GeoPath($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			GeoPath_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			GeoPath_canvas($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Voronoi/Voronoi.base.svelte
function Voronoi_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Group, Path, CircleClipPath, data, x: xProp, y: yProp, r, classes = {}, onclick, onpointerenter, onpointerdown, onpointermove, class: className, children, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const facetPanel = getFacetPanel();
		const geo = getGeoContext();
		const xAccessorOverride = derived(() => xProp != null ? accessor(xProp) : void 0);
		const yAccessorOverride = derived(() => yProp != null ? accessor(yProp) : void 0);
		const points = derived(() => (data ?? facetPanel?.().data ?? ctx.flatData).map((d) => {
			const xValue = xAccessorOverride() ? geo.projection ? xAccessorOverride()(d) : ctx.xScale(xAccessorOverride()(d)) : geo.projection ? ctx.x(d) : ctx.xGet(d);
			const yValue = yAccessorOverride() ? geo.projection ? yAccessorOverride()(d) : ctx.yScale(yAccessorOverride()(d)) : geo.projection ? ctx.y(d) : ctx.yGet(d);
			const x = Array.isArray(xValue) ? max(xValue) : xValue;
			const y = Array.isArray(yValue) ? max(yValue) : yValue;
			let point;
			if (ctx.radial) {
				const radialPoint = pointRadial(x, y);
				point = [radialPoint[0] + ctx.width / 2, radialPoint[1] + ctx.height / 2];
			} else point = [x, y];
			point.data = d;
			return point;
		}));
		const boundWidth = derived(() => Math.max(ctx.width, 0));
		const boundHeight = derived(() => Math.max(ctx.height, 0));
		const disableClip = derived(() => r === 0 || r == null || r === Infinity);
		const voronoi = derived(() => geo.projection ? null : Delaunay.from(points()).voronoi([
			0,
			0,
			boundWidth(),
			boundHeight()
		]));
		const geoPolygons = derived(() => geo.projection ? geoVoronoi().polygons(points()) : null);
		const cells = derived(() => {
			if (!children) return [];
			if (geo.projection && geoPolygons()) return geoPolygons().features.map((feature, index) => {
				const projectedPoint = geo.projection?.(feature.properties.sitecoordinates) ?? null;
				const ring = (feature.geometry?.coordinates?.[0] ?? []).map((coord) => geo.projection?.(coord)).filter((p) => p != null);
				const polygon = ring.length ? ring : null;
				const projectedCentroid = geo.projection?.(geoCentroid(feature)) ?? null;
				return {
					data: feature.properties.site?.data,
					index,
					point: projectedPoint ?? [NaN, NaN],
					polygon,
					centroid: projectedCentroid && Number.isFinite(projectedCentroid[0]) ? projectedCentroid : null,
					area: geoArea(feature)
				};
			});
			if (voronoi()) return points().map((point, index) => {
				const polygon = voronoi().cellPolygon(index);
				return {
					data: point.data,
					index,
					point: [point[0], point[1]],
					polygon,
					centroid: polygon ? polygonCentroid(polygon) : null,
					area: polygon ? Math.abs(polygonArea(polygon)) : 0
				};
			});
			return [];
		});
		if (Group) {
			$$renderer.push("<!--[-->");
			Group($$renderer, spread_props([restProps, {
				class: cls("lc-voronoi-g", classes.root, className),
				children: ($$renderer) => {
					if (geo.projection) {
						$$renderer.push("<!--[0-->");
						if (geoPolygons()) {
							$$renderer.push(`<!--[0--><!--[-->`);
							const each_array = ensure_array_like(geoPolygons().features);
							for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
								let feature = each_array[$$index];
								const point = r ? geo.projection?.(feature.properties.sitecoordinates) : null;
								if (CircleClipPath) {
									$$renderer.push("<!--[-->");
									CircleClipPath($$renderer, {
										cx: point?.[0],
										cy: point?.[1],
										r: r ?? 0,
										disabled: point == null || disableClip(),
										children: ($$renderer) => {
											GeoPath($$renderer, {
												geojson: feature,
												class: ["lc-voronoi-geo-path", classes.path],
												onclick: (e) => onclick?.(e, {
													data: feature.properties.site.data,
													feature
												}),
												onpointerenter: (e) => onpointerenter?.(e, {
													data: feature.properties.site.data,
													feature
												}),
												onpointermove: (e) => onpointermove?.(e, {
													data: feature.properties.site.data,
													feature
												}),
												onpointerdown: (e) => onpointerdown?.(e, {
													data: feature.properties.site.data,
													feature
												}),
												ontouchmove: (e) => {
													e.preventDefault();
												}
											});
										},
										$$slots: { default: true }
									});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							}
							$$renderer.push(`<!--]-->`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					} else if (voronoi()) {
						$$renderer.push(`<!--[1--><!--[-->`);
						const each_array_1 = ensure_array_like(points());
						for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
							let point = each_array_1[i];
							const pathData = voronoi().renderCell(i);
							if (pathData) {
								$$renderer.push("<!--[0-->");
								if (CircleClipPath) {
									$$renderer.push("<!--[-->");
									CircleClipPath($$renderer, {
										cx: point[0],
										cy: point[1],
										r: r ?? 0,
										disabled: disableClip(),
										children: ($$renderer) => {
											if (Path) {
												$$renderer.push("<!--[-->");
												Path($$renderer, {
													pathData,
													class: ["lc-voronoi-path", classes.path],
													onclick: (e) => onclick?.(e, {
														data: point.data,
														point
													}),
													onpointerenter: (e) => onpointerenter?.(e, {
														data: point.data,
														point
													}),
													onpointermove: (e) => onpointermove?.(e, {
														data: point.data,
														point
													}),
													onpointerdown: (e) => onpointerdown?.(e, {
														data: point.data,
														point
													}),
													ontouchmove: (e) => {
														e.preventDefault();
													}
												});
												$$renderer.push("<!--]-->");
											} else {
												$$renderer.push("<!--[!-->");
												$$renderer.push("<!--]-->");
											}
										},
										$$slots: { default: true }
									});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]-->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					children?.($$renderer, { cells: cells() });
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			}]));
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Voronoi/Voronoi.svg.svelte
function Voronoi_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Voronoi_base($$renderer, spread_props([{
		Group: Group_svg,
		Path: Path_svg,
		CircleClipPath: CircleClipPath_svg
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Voronoi/Voronoi.canvas.svelte
function Voronoi_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Voronoi_base($$renderer, spread_props([{
		Group: Group_canvas,
		Path: Path_canvas,
		CircleClipPath: CircleClipPath_canvas
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Voronoi/Voronoi.svelte
function Voronoi($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			Voronoi_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			Voronoi_canvas($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { Voronoi as default };

//# sourceMappingURL=Voronoi.js.map