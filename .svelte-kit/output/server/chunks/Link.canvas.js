import { a as bind_props, c as ensure_array_like, f as spread_props, o as derived } from "./server.js";
import { a as extractTweenConfig, r as createMotion } from "./motion.svelte.js";
import { s as accessor, t as getChartContext } from "./chart.js";
import { h as getMarkData } from "./key.svelte.js";
import { n as Path_svg, t as Path_canvas } from "./Path.canvas.js";
import { a as getTextRect } from "./Text.html.js";
import { cls } from "@layerstack/tailwind";
import { curveBumpX, curveBumpY, curveStep, curveStepAfter, curveStepBefore, line, lineRadial, linkRadial } from "d3-shape";
import { interpolatePath } from "d3-interpolate-path";
//#region node_modules/layerchart/dist/utils/labelPlacement.js
/**
* Resolve where a `smart` (or discrete) placement puts a label attached to a point —
* text position, anchors, and leader direction. Shared by `<AnnotationPoint>` and
* `<Labels layout="voronoi" links>`, so labels can be measured/occluded with the exact
* geometry the component renders instead of re-deriving it.
*/
function getPointLabelLayout(options) {
	const { x: px, y: py, r = 4, labelPlacement = "center", labelX, labelY, labelXOffset = 0, labelYOffset = 0, fontSize = 16, labelGap = 2, link = false, verticalAnchor } = options;
	const explicit = labelX != null || labelY != null;
	const capHeight = fontSize * .71;
	let dirX = 0;
	let dirY = 0;
	if (labelPlacement === "smart") {
		const ddx = (labelX ?? px) - px;
		const ddy = (labelY ?? py) - py;
		const ax = Math.abs(ddx);
		const ay = Math.abs(ddy);
		if (ax > 1e-6 || ay > 1e-6) {
			dirX = ax >= ay * .4 ? Math.sign(ddx) : 0;
			dirY = ay >= ax * .4 ? Math.sign(ddy) : 0;
		}
	} else if (labelPlacement !== "center") {
		dirX = labelPlacement.includes("left") ? -1 : labelPlacement.includes("right") ? 1 : 0;
		dirY = labelPlacement.includes("top") ? -1 : labelPlacement.includes("bottom") ? 1 : 0;
	}
	const mag = Math.hypot(dirX, dirY) || 1;
	const signX = dirX < 0 ? -1 : 1;
	const signY = dirY < 0 ? -1 : 1;
	const anchorX = explicit ? labelX ?? px : px + r * dirX / mag + labelXOffset * signX;
	const anchorY = explicit ? labelY ?? py : py + r * dirY / mag + labelYOffset * signY;
	const gap = link ? labelGap : 0;
	const adx = anchorX - px;
	const ady = anchorY - py;
	const adist = Math.hypot(adx, ady) || 1;
	const gapX = gap * adx / adist;
	const gapY = gap * ady / adist;
	const capBias = verticalAnchor != null ? 0 : dirY > 0 ? capHeight / 2 : dirY < 0 ? -capHeight / 2 : 0;
	return {
		direction: {
			x: dirX,
			y: dirY
		},
		anchor: {
			x: anchorX,
			y: anchorY
		},
		text: {
			x: anchorX + gapX,
			y: anchorY + gapY + capBias,
			textAnchor: dirX > 0 ? "start" : dirX < 0 ? "end" : "middle",
			verticalAnchor: "middle"
		}
	};
}
/**
* Bounding box of a point label, combining {@link getPointLabelLayout} with `getTextRect` —
* a reliable `bounds` for `occlude()` when hiding overlapping labels.
*/
function getPointLabelRect(label, options) {
	const { text } = getPointLabelLayout(options);
	return getTextRect(label, text.x, text.y, {
		textAnchor: text.textAnchor,
		verticalAnchor: text.verticalAnchor,
		fontSize: options.fontSize ?? 16
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/linkUtils.js
function isSamePoint(p1, p2) {
	return Math.abs(p1.x - p2.x) < 1e-6 && Math.abs(p1.y - p2.y) < 1e-6;
}
function createDirectPath(source, target) {
	if (isSamePoint(source, target)) return "";
	return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
}
function isNearZero(value) {
	return Math.abs(value) < 1e-6;
}
function createSquarePath({ source, target, sweep }) {
	if (sweep === "horizontal-vertical") return `M ${source.x} ${source.y} L ${target.x} ${source.y} L ${target.x} ${target.y}`;
	else return `M ${source.x} ${source.y} L ${source.x} ${target.y} L ${target.x} ${target.y}`;
}
function createBeveledPath(opts) {
	const { radius, dx, dy, source, target, sweep } = opts;
	const effectiveRadius = Math.max(0, Math.min(radius, Math.abs(dx), Math.abs(dy)));
	if (isNearZero(effectiveRadius)) return createSquarePath(opts);
	const signX = Math.sign(dx);
	const signY = Math.sign(dy);
	if (sweep === "horizontal-vertical") {
		const pBeforeCorner = {
			x: target.x - effectiveRadius * signX,
			y: source.y
		};
		const pAfterCorner = {
			x: target.x,
			y: source.y + effectiveRadius * signY
		};
		return `M ${source.x} ${source.y} L ${pBeforeCorner.x} ${pBeforeCorner.y} L ${pAfterCorner.x} ${pAfterCorner.y} L ${target.x} ${target.y}`;
	} else {
		const pBeforeCorner = {
			x: source.x,
			y: target.y - effectiveRadius * signY
		};
		const pAfterCorner = {
			x: source.x + effectiveRadius * signX,
			y: target.y
		};
		return `M ${source.x} ${source.y} L ${pBeforeCorner.x} ${pBeforeCorner.y} L ${pAfterCorner.x} ${pAfterCorner.y} L ${target.x} ${target.y}`;
	}
}
function createRoundedPath(opts) {
	const { radius, dx, dy, source, target, sweep } = opts;
	const effectiveRadius = Math.max(0, Math.min(radius, Math.abs(dx), Math.abs(dy)));
	if (isNearZero(effectiveRadius)) return createSquarePath(opts);
	const signX = Math.sign(dx);
	const signY = Math.sign(dy);
	if (sweep === "horizontal-vertical") {
		const pBeforeCorner = {
			x: target.x - effectiveRadius * signX,
			y: source.y
		};
		const pAfterCorner = {
			x: target.x,
			y: source.y + effectiveRadius * signY
		};
		const sweepFlag = signX * signY > 0 ? 1 : 0;
		return `M ${source.x} ${source.y} L ${pBeforeCorner.x} ${pBeforeCorner.y} A ${effectiveRadius} ${effectiveRadius} 0 0 ${sweepFlag} ${pAfterCorner.x} ${pAfterCorner.y} L ${target.x} ${target.y}`;
	} else {
		const pBeforeCorner = {
			x: source.x,
			y: target.y - effectiveRadius * signY
		};
		const pAfterCorner = {
			x: source.x + effectiveRadius * signX,
			y: target.y
		};
		const sweepFlag = signX * signY > 0 ? 0 : 1;
		return `M ${source.x} ${source.y} L ${pBeforeCorner.x} ${pBeforeCorner.y} A ${effectiveRadius} ${effectiveRadius} 0 0 ${sweepFlag} ${pAfterCorner.x} ${pAfterCorner.y} L ${target.x} ${target.y}`;
	}
}
/**
* Swoop: circular arc between source and target. Equivalent to ObservablePlot's
* Arrow `bend` option — positive angle bends right (clockwise from source to
* target), negative bends left, 0 is a straight line.
*/
function createSwoopPath({ source, target, dx, dy, bend = 22.5 }) {
	const chordLen = Math.hypot(dx, dy);
	const bendRad = bend * Math.PI / 180;
	if (Math.abs(bendRad) < 1e-6 || chordLen < 1e-6) return createDirectPath(source, target);
	const arcRadius = chordLen / (2 * Math.sin(Math.abs(bendRad)));
	const largeArc = Math.abs(bend) > 90 ? 1 : 0;
	const sweepFlag = bend > 0 ? 1 : 0;
	return `M${source.x},${source.y}A${arcRadius},${arcRadius} 0 ${largeArc} ${sweepFlag} ${target.x},${target.y}`;
}
var pathStrategies = {
	square: createSquarePath,
	beveled: createBeveledPath,
	rounded: createRoundedPath,
	swoop: createSwoopPath
};
function getLinkPresetPath(opts) {
	const { source, target, type } = opts;
	if (isSamePoint(source, target)) return "";
	const dx = target.x - source.x;
	const dy = target.y - source.y;
	if (type === "straight" || type !== "swoop" && (isNearZero(dx) || isNearZero(dy))) return createDirectPath(source, target);
	return (pathStrategies[type] || pathStrategies.square)({
		...opts,
		dx,
		dy
	});
}
var FALLBACK_PATH = "M0,0L0,0";
function getLinkD3Path({ source, target, sweep, curve, orientation = "horizontal" }) {
	const dx = target.x - source.x;
	const dy = target.y - source.y;
	if (orientation === "vertical" && sweep === "none") {
		const { x: sx, y: sy } = source;
		const { x: tx, y: ty } = target;
		if (curve === curveStep) {
			const my = (sy + ty) / 2;
			return `M${sx},${sy}L${sx},${my}L${tx},${my}L${tx},${ty}`;
		}
		if (curve === curveStepBefore) return `M${sx},${sy}L${tx},${sy}L${tx},${ty}`;
		if (curve === curveStepAfter) return `M${sx},${sy}L${sx},${ty}L${tx},${ty}`;
	}
	const line$1 = line().curve(curve);
	let points = [];
	const isAligned = isNearZero(dx) || isNearZero(dy);
	if (sweep === "none" || isAligned) points = [[source.x, source.y], [target.x, target.y]];
	else if (sweep === "horizontal-vertical") points = [
		[source.x, source.y],
		[target.x, source.y],
		[target.x, target.y]
	];
	else if (sweep === "vertical-horizontal") points = [
		[source.x, source.y],
		[source.x, target.y],
		[target.x, target.y]
	];
	if (points.length === 2 && isNearZero(dx) && isNearZero(dx)) return FALLBACK_PATH;
	const d = line$1(points);
	if (!d || d.includes("NaN")) return FALLBACK_PATH;
	return d;
}
function radialGeometry(source, target) {
	const sa = source.x - Math.PI / 2;
	const sr = source.y;
	const ta = target.x - Math.PI / 2;
	const tr = target.y;
	const sc = Math.cos(sa);
	const ss = Math.sin(sa);
	const tc = Math.cos(ta);
	const ts = Math.sin(ta);
	const sweepFlag = Math.abs(ta - sa) > Math.PI ? ta <= sa ? 1 : 0 : ta > sa ? 1 : 0;
	return {
		sa,
		sr,
		ta,
		tr,
		sc,
		ss,
		tc,
		ts,
		sx: sr * sc,
		sy: sr * ss,
		tx: tr * tc,
		ty: tr * ts,
		sweepFlag
	};
}
function getLinkRadialPresetPath({ source, target, type, radius, bend = 22.5 }) {
	const { sr, ta, tr, sc, ss, tc, ts, sx, sy, tx, ty, sweepFlag } = radialGeometry(source, target);
	if (type === "straight") return `M${sx},${sy}L${tx},${ty}`;
	if (type === "swoop") {
		const dx = tx - sx;
		const dy = ty - sy;
		const chordLen = Math.hypot(dx, dy);
		const bendRad = bend * Math.PI / 180;
		if (Math.abs(bendRad) < 1e-6 || chordLen < 1e-6) return `M${sx},${sy}L${tx},${ty}`;
		const arcRadius = chordLen / (2 * Math.sin(Math.abs(bendRad)));
		return `M${sx},${sy}A${arcRadius},${arcRadius} 0 ${Math.abs(bend) > 90 ? 1 : 0} ${bend > 0 ? 1 : 0} ${tx},${ty}`;
	}
	if (type === "rounded") {
		const percent = .2;
		const dx = tx - sx;
		const dy = ty - sy;
		const ix = percent * (dx + dy);
		const iy = percent * (dy - dx);
		return `M${sx},${sy}C${sx + ix},${sy + iy} ${tx + iy},${ty - ix} ${tx},${ty}`;
	}
	if (type === "square") {
		if (sr < 1e-6) return `M${sx},${sy}L${tx},${ty}`;
		const mr = (sr + tr) / 2;
		return `M${sx},${sy}L${mr * sc},${mr * ss}A${mr},${mr},0,0,${sweepFlag},${mr * tc},${mr * ts}L${tx},${ty}`;
	}
	const cornerX = sr * tc;
	const cornerY = sr * ts;
	const chordDx = cornerX - sx;
	const chordDy = cornerY - sy;
	const chordLen = Math.hypot(chordDx, chordDy);
	if (chordLen < 1e-6) return `M${sx},${sy}L${tx},${ty}`;
	const radialLen = Math.abs(tr - sr) || 1;
	const r = Math.max(0, Math.min(radius, chordLen, radialLen));
	const cux = chordDx / chordLen;
	const cuy = chordDy / chordLen;
	const radialDir = Math.sign(tr - sr) || 1;
	return `M${sx},${sy}L${cornerX - r * cux},${cornerY - r * cuy}L${cornerX + radialDir * r * tc},${cornerY + radialDir * r * ts}L${tx},${ty}`;
}
function getLinkRadialD3Path({ source, target, curve }) {
	const { sr, tr, sc, ss, tc, ts, sx, sy, tx, ty, sweepFlag } = radialGeometry(source, target);
	if (curve === curveStepBefore || curve === curveStepAfter || curve === curveStep) {
		if (sr < 1e-6) return `M${sx},${sy}L${tx},${ty}`;
	}
	if (curve === curveStepBefore) return `M${sx},${sy}A${sr},${sr},0,0,${sweepFlag},${sr * tc},${sr * ts}L${tx},${ty}`;
	if (curve === curveStepAfter) return `M${sx},${sy}L${tr * sc},${tr * ss}A${tr},${tr},0,0,${sweepFlag},${tx},${ty}`;
	if (curve === curveStep) {
		const mr = (sr + tr) / 2;
		return `M${sx},${sy}L${mr * sc},${mr * ss}A${mr},${mr},0,0,${sweepFlag},${mr * tc},${mr * ts}L${tx},${ty}`;
	}
	if (curve) return lineRadial().curve(curve)([[source.x, source.y], [target.x, target.y]]) ?? FALLBACK_PATH;
	return linkRadial().angle((d) => d.x).radius((d) => d.y)({
		source,
		target
	}) ?? FALLBACK_PATH;
}
//#endregion
//#region node_modules/layerchart/dist/components/Link/Link.shared.svelte.js
var LINK_FALLBACK_COORDS = {
	x: 0,
	y: 0
};
function isAccessorAccessor(value) {
	return typeof value === "string" || typeof value === "function";
}
//#endregion
//#region node_modules/layerchart/dist/components/Link/Link.base.svelte
function Link_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		const markData = getMarkData();
		let { Path, x1, y1, x2, y2, data, sankey = false, source: sourceProp, target: targetProp, x: xProp, y: yProp, orientation: orientationProp, curve: curveProp, type = "d3", sweep: sweepProp, radius = 20, bend = 22.5, radial: radialProp, marker, markerStart, markerMid, markerEnd, motion, pathRef = void 0, pathData: pathDataProp, class: classProp, $$slots, $$events, ...restProps } = $$props;
		const radial = derived(() => radialProp ?? ctx.radial ?? false);
		const orientation = derived(() => {
			if (orientationProp) return orientationProp;
			if (sankey) return "horizontal";
			return "vertical";
		});
		const curve = derived(() => {
			if (curveProp) return curveProp;
			if (orientation() === "horizontal") return curveBumpX;
			return curveBumpY;
		});
		const sweep = derived(() => {
			if (type === "d3") return sweepProp ?? "none";
			if (sweepProp && sweepProp !== "none") return sweepProp;
			return orientation() === "vertical" ? "horizontal-vertical" : "vertical-horizontal";
		});
		const isArrayMode = derived(() => isAccessorAccessor(x1) || isAccessorAccessor(y1) || isAccessorAccessor(x2) || isAccessorAccessor(y2));
		const isPixelMode = derived(() => !isArrayMode() && (typeof x1 === "number" || typeof y1 === "number" || typeof x2 === "number" || typeof y2 === "number"));
		const sourceAccessor = derived(() => {
			if (sourceProp) return sourceProp;
			if (sankey) return (d) => ({
				node: d.source,
				y: d.y0,
				isSource: true
			});
			return (d) => d.source;
		});
		const targetAccessor = derived(() => {
			if (targetProp) return targetProp;
			if (sankey) return (d) => ({
				node: d.target,
				y: d.y1,
				isSource: false
			});
			return (d) => d.target;
		});
		const xAccessor = derived(() => {
			if (xProp) return xProp;
			if (sankey) return (d) => d.isSource ? d.node.x1 : d.node.x0;
			if (radial()) return (d) => d.x;
			return (d) => orientation() === "horizontal" ? d.y : d.x;
		});
		const yAccessor = derived(() => {
			if (yProp) return yProp;
			if (sankey) return (d) => d.y;
			if (radial()) return (d) => d.y;
			return (d) => orientation() === "horizontal" ? d.x : d.y;
		});
		const x1Accessor = derived(() => accessor(x1));
		const y1Accessor = derived(() => accessor(y1));
		const x2Accessor = derived(() => accessor(x2));
		const y2Accessor = derived(() => accessor(y2));
		const resolveArrayCoords = (d) => {
			const sxRaw = x1Accessor()(d);
			const syRaw = y1Accessor()(d);
			const txRaw = x2Accessor()(d);
			const tyRaw = y2Accessor()(d);
			const scaleX = typeof x1 === "string" || typeof x1 === "function" ? ctx.xScale : null;
			const scaleY = typeof y1 === "string" || typeof y1 === "function" ? ctx.yScale : null;
			const sx = scaleX && sxRaw != null ? scaleX(sxRaw) : typeof sxRaw === "number" ? sxRaw : 0;
			const sy = scaleY && syRaw != null ? scaleY(syRaw) : typeof syRaw === "number" ? syRaw : 0;
			const tx = scaleX && txRaw != null ? scaleX(txRaw) : typeof txRaw === "number" ? txRaw : 0;
			const ty = scaleY && tyRaw != null ? scaleY(tyRaw) : typeof tyRaw === "number" ? tyRaw : 0;
			return {
				source: {
					x: Number.isFinite(sx) ? sx : 0,
					y: Number.isFinite(sy) ? sy : 0
				},
				target: {
					x: Number.isFinite(tx) ? tx : 0,
					y: Number.isFinite(ty) ? ty : 0
				}
			};
		};
		const singleSourceCoords = derived(() => {
			if (isPixelMode()) return {
				x: typeof x1 === "number" ? x1 : 0,
				y: typeof y1 === "number" ? y1 : 0
			};
			if (!data) return LINK_FALLBACK_COORDS;
			try {
				const sourceData = sourceAccessor()(data);
				if (sourceData == null) return LINK_FALLBACK_COORDS;
				const xVal = xAccessor()(sourceData);
				const yVal = yAccessor()(sourceData);
				return {
					x: Number.isFinite(xVal) ? xVal : 0,
					y: Number.isFinite(yVal) ? yVal : 0
				};
			} catch (e) {
				console.error("Error accessing source coordinates:", e, "Data:", data);
				return LINK_FALLBACK_COORDS;
			}
		});
		const singleTargetCoords = derived(() => {
			if (isPixelMode()) return {
				x: typeof x2 === "number" ? x2 : 100,
				y: typeof y2 === "number" ? y2 : 100
			};
			if (!data) return LINK_FALLBACK_COORDS;
			try {
				const targetData = targetAccessor()(data);
				if (targetData == null) return LINK_FALLBACK_COORDS;
				const xVal = xAccessor()(targetData);
				const yVal = yAccessor()(targetData);
				return {
					x: Number.isFinite(xVal) ? xVal : 0,
					y: Number.isFinite(yVal) ? yVal : 0
				};
			} catch (e) {
				console.error("Error accessing target coordinates:", e, "Data:", data);
				return LINK_FALLBACK_COORDS;
			}
		});
		function buildPath(source, target) {
			if (pathDataProp) return pathDataProp;
			if (radial()) return type === "d3" ? getLinkRadialD3Path({
				source,
				target,
				curve: curve()
			}) : getLinkRadialPresetPath({
				source,
				target,
				type,
				radius,
				bend
			});
			if (type === "d3") return getLinkD3Path({
				source,
				target,
				sweep: sweep(),
				curve: curve(),
				orientation: orientation()
			});
			return getLinkPresetPath({
				source,
				target,
				sweep: sweep(),
				type,
				radius,
				bend
			});
		}
		const singlePathData = derived(() => isArrayMode() ? "" : buildPath(singleSourceCoords(), singleTargetCoords()));
		const extractedTween = extractTweenConfig(motion);
		const tweenOptions = extractedTween ? {
			type: extractedTween.type,
			options: {
				interpolate: interpolatePath,
				...extractedTween.options
			}
		} : void 0;
		const motionPath = createMotion("", () => singlePathData(), tweenOptions);
		const getPathData = () => motionPath.current;
		const arrayRows = derived(() => isArrayMode() ? markData(data) : []);
		function resolvePerDatum(value, d) {
			return typeof value === "function" ? value(d) : value;
		}
		function resolveClass(d) {
			return resolvePerDatum(classProp, d);
		}
		const strokeProp = derived(() => restProps.stroke);
		const fillProp = derived(() => restProps.fill);
		const strokeWidthProp = derived(() => restProps["stroke-width"] ?? restProps.strokeWidth);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (isArrayMode()) {
				$$renderer.push(`<!--[0--><!--[-->`);
				const each_array = ensure_array_like(arrayRows());
				for (let i = 0, $$length = each_array.length; i < $$length; i++) {
					let d = each_array[i];
					const { source, target } = resolveArrayCoords(d);
					const resolvedStroke = resolvePerDatum(strokeProp(), d) ?? (ctx.config.c ? ctx.cGet(d) : void 0);
					if (Path) {
						$$renderer.push("<!--[-->");
						Path($$renderer, spread_props([
							{
								pathData: buildPath(source, target),
								marker,
								markerStart,
								markerMid,
								markerEnd
							},
							restProps,
							{
								stroke: resolvedStroke,
								fill: resolvePerDatum(fillProp(), d),
								"stroke-width": resolvePerDatum(strokeWidthProp(), d),
								class: cls("lc-link", resolveClass(d))
							}
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
							pathData: getPathData,
							marker,
							markerStart,
							markerMid,
							markerEnd
						},
						restProps,
						{
							class: cls("lc-link", typeof classProp === "string" ? classProp : void 0),
							get pathRef() {
								return pathRef;
							},
							set pathRef($$value) {
								pathRef = $$value;
								$$settled = false;
							}
						}
					]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { pathRef });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Link/Link.svg.svelte
function Link_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { pathRef = void 0, $$slots, $$events, ...rest } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Link_base($$renderer, spread_props([
				{ Path: Path_svg },
				rest,
				{
					get pathRef() {
						return pathRef;
					},
					set pathRef($$value) {
						pathRef = $$value;
						$$settled = false;
					}
				}
			]));
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { pathRef });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Link/Link.canvas.svelte
function Link_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Link_base($$renderer, spread_props([{ Path: Path_canvas }, props]));
}
//#endregion
export { getPointLabelRect as i, Link_svg as n, getPointLabelLayout as r, Link_canvas as t };

//# sourceMappingURL=Link.canvas.js.map