import { o as derived } from "./server.js";
import { c as chartDataArray, o as Context, t as getChartContext } from "./chart.js";
import { get } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
import memoize from "memoize";
import { objectId } from "@layerstack/utils/object";
//#region node_modules/layerchart/dist/contexts/geo.js
/**
* Access or set the current GeoContext.
*/
var _GeoContext = new Context("GeoContext");
function getGeoContext() {
	return _GeoContext.getOr({ projection: void 0 });
}
function setGeoContext(geo) {
	return _GeoContext.set(geo);
}
//#endregion
//#region node_modules/layerchart/dist/contexts/layer.js
var _LayerContext = new Context("LayerContext");
function getLayerContext() {
	return _LayerContext.get();
}
function setLayerContext(context) {
	return _LayerContext.set(context);
}
//#endregion
//#region node_modules/layerchart/dist/utils/dataProp.js
/**
* Returns true if the value is a data-space prop (string or function),
* meaning it needs scale resolution rather than being a direct pixel value.
*/
function isDataProp(value) {
	return typeof value === "string" || typeof value === "function";
}
/**
* Returns true if ANY of the provided values is a data-space prop.
* Used to detect whether a component should enter "data mode".
*/
function hasAnyDataProp(...values) {
	return values.some((v) => v !== void 0 && isDataProp(v));
}
/**
* Resolves a DataProp value for a specific data item through a scale.
*
* - `number`: returned directly (pixel value, no scale)
* - `string`: used as property path on data item, result passed through scale
* - `function`: called with data item, result passed through scale
* - `undefined`/`null`: returns defaultValue
*
* If no scale is provided and the raw value is numeric, it passes through directly.
*/
function resolveDataProp(value, d, scale, defaultValue = 0) {
	if (value === void 0 || value === null) return defaultValue;
	if (typeof value === "number") return value;
	let rawValue;
	if (typeof value === "string") rawValue = get(d, value);
	else if (typeof value === "function") rawValue = value(d);
	else return defaultValue;
	if (scale) {
		const result = scale(rawValue);
		return typeof result === "number" && isFinite(result) ? result : defaultValue;
	}
	return typeof rawValue === "number" ? rawValue : defaultValue;
}
/**
* Extract the raw value from a DataProp without applying any scale.
* Numbers pass through, strings do property lookup, functions are called.
*/
function extractRawDataValue(value, d) {
	if (value === void 0 || value === null) return void 0;
	if (typeof value === "number") return value;
	if (typeof value === "string") return get(d, value);
	if (typeof value === "function") return value(d);
}
/**
* Resolve a pair of x/y DataProps through a geo projection.
* x = longitude, y = latitude → projection([lon, lat]) → [px, py]
*/
function resolveGeoDataPair(xProp, yProp, d, projection, defaults = [0, 0]) {
	const rawX = extractRawDataValue(xProp, d);
	const rawY = extractRawDataValue(yProp, d);
	if (rawX == null || rawY == null) return defaults;
	return projection([rawX, rawY]) ?? defaults;
}
/**
* Resolves a ColorProp for a specific data item, optionally through a color scale.
*
* - `string`: checks if `get(d, value)` is defined → data property, passed through cScale.
*   Otherwise returns the string as a literal CSS color.
* - `function`: called with data item, result passed through cScale.
* - `undefined`/`null`: returns undefined.
*/
/**
* Returns true if the string looks like a CSS color value rather than a data property name.
* Matches: `#hex`, and functional notation like `rgb(...)`, `hsl(...)`, `var(...)`,
* `url(...)`, `color-mix(...)`, etc.
*/
function isCSSColor(value) {
	return value.startsWith("#") || value.includes("(");
}
/**
* The data property a color prop names, or `undefined` when it's a CSS color literal (or names
* nothing in the data).
*
* Marks that draw one shape per series use this to infer their grouping from `stroke` / `fill`,
* without also having to also use `z="fruit"`.
*/
function colorPropDataKey(value, d) {
	if (typeof value !== "string" || isCSSColor(value)) return void 0;
	return d != null && get(d, value) !== void 0 ? value : void 0;
}
function resolveColorProp(value, d, cScale, ...args) {
	if (value === void 0 || value === null) return void 0;
	if (typeof value === "function") {
		const rawValue = value(d, ...args);
		if (rawValue === void 0 || rawValue === null) return void 0;
		if (typeof rawValue === "string" && isCSSColor(rawValue)) return rawValue;
		return scaled(rawValue, cScale);
	}
	if (typeof value === "string") {
		if (isCSSColor(value)) return value;
		const dataValue = get(d, value);
		if (dataValue !== void 0) return scaled(dataValue, cScale);
		return value;
	}
}
/**
* Put a value through the color scale, keeping the value itself when the scale has nothing for it.
* A scale derived from `series` colors only covers the series keys, so anything else — a value the
* chart happens to colour by, say — behaves as it would with no scale at all.
*/
function scaled(value, cScale) {
	const result = cScale ? cScale(value) : void 0;
	return result != null ? String(result) : String(value);
}
/**
* Resolves a StyleProp for a specific data item.
* If the value is a function, calls it with the data item.
* Otherwise returns the static value.
*/
function resolveStyleProp(value, d, ...args) {
	if (value === void 0) return void 0;
	if (typeof value === "function") return value(d, ...args);
	return value;
}
//#endregion
//#region node_modules/layerchart/dist/contexts/facet.js
/**
* The panel a component is rendering into, or `undefined` outside a faceted chart.
*
* Read during init, as with any context.  Returns a getter so reads stay current as the panels
* are rebuilt.  Marks usually want `getMarkData()` rather than this.
*/
var _FacetPanelContext = new Context("FacetPanelContext");
function getFacetPanel() {
	return _FacetPanelContext.getOr(void 0) ?? void 0;
}
/**
* Set the panel for a subtree, or clear it with `undefined` — which is what the grid's own
* furniture wants, since it belongs to the whole grid rather than to any one panel.
*/
function setFacetPanel(getPanel) {
	return _FacetPanelContext.set(getPanel);
}
/**
* Resolves the rows a mark should draw: its own `data` when given, else the panel it's rendering
* into, else the chart's.
*
* Call during init (a component's setup, or a state class field initializer) — it reads context —
* then call the returned resolver from wherever the data is needed, including inside a `$derived`.
*
* Marks resolve this rather than the chart context being swapped underneath them, so what a mark
* draws stays visible at its own call site.
*/
function getMarkData() {
	const ctx = getChartContext();
	const panel = getFacetPanel();
	return (own) => chartDataArray(own ?? panel?.().data ?? ctx.data);
}
//#endregion
//#region node_modules/layerchart/dist/utils/path.js
/**
* SVG path `d` attribute for a rectangle with per-corner rounding.
* Corners are ordered `[top-left, top-right, bottom-right, bottom-left]`
* (matching CSS `border-radius` shorthand). Path is drawn clockwise from
* the top-left corner.
*/
function roundedRectPath(x, y, width, height, [tl, tr, br, bl]) {
	const topEdge = width - tl - tr;
	const rightEdge = height - tr - br;
	const bottomEdge = width - br - bl;
	const leftEdge = height - bl - tl;
	return [
		`M${x + tl},${y}`,
		`h${topEdge}`,
		tr > 0 ? `a${tr},${tr} 0 0 1 ${tr},${tr}` : "",
		`v${rightEdge}`,
		br > 0 ? `a${br},${br} 0 0 1 ${-br},${br}` : "",
		`h${-bottomEdge}`,
		bl > 0 ? `a${bl},${bl} 0 0 1 ${-bl},${-bl}` : "",
		`v${-leftEdge}`,
		tl > 0 ? `a${tl},${tl} 0 0 1 ${tl},${-tl}` : "",
		"z"
	].filter(Boolean).join(" ");
}
/**
* Normalize a dash-array value (CSS `stroke-dasharray`) to a numeric array.
* Accepts `"4 2"`, `"4,2"`, `[4, 2]`, or a single number (e.g. `4` → `[4, 4]`).
* Returns `null` when the input is empty or all zeros (i.e. solid stroke).
*/
function parseDashArray(value) {
	if (value == null || value === "" || value === "none") return null;
	let arr;
	if (typeof value === "number") arr = [value, value];
	else if (Array.isArray(value)) arr = value.filter((n) => Number.isFinite(n));
	else arr = value.split(/[\s,]+/).filter((s) => s.length > 0).map((s) => Number(s.replace("px", ""))).filter((n) => Number.isFinite(n));
	if (arr.length === 0 || arr.every((n) => n === 0)) return null;
	if (arr.length % 2 === 1) arr = [...arr, ...arr];
	return arr;
}
/**
* Build a CSS `repeating-linear-gradient` string approximating a `stroke-dasharray`
* pattern along a horizontal line (use with `background` on a rotated `<div>`).
* Alternates stops between `color` (dash) and `transparent` (gap) to match SVG.
*/
function dashArrayToGradient(dashArray, color, direction = "to right") {
	const stops = [];
	let offset = 0;
	for (let i = 0; i < dashArray.length; i++) {
		const length = dashArray[i];
		const c = i % 2 === 0 ? color : "transparent";
		stops.push(`${c} ${offset}px ${offset + length}px`);
		offset += length;
	}
	return `repeating-linear-gradient(${direction}, ${stops.join(", ")})`;
}
/** Flatten all `y` coordinates to `0` */
function flattenPathData(pathData, yOverride = 0) {
	let result = pathData;
	result = result.replace(/([MLTQCSAZ])(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (match, command, x, y) => {
		return `${command}${x},${yOverride}`;
	});
	result = result.replace(/([v])(-?\d*\.?\d+)/g, (match, command, l) => {
		return `${command}0`;
	});
	result = result.replace(/a(-?\d*\.?\d+),(-?\d*\.?\d+) (\d+) (\d+) (\d+) (-?\d*\.?\d+),(-?\d*\.?\d+)/g, (match, rx, ry, rot, large, sweep, dx, dy) => {
		return `a${rx},0 ${rot} ${large} ${sweep} ${dx},0`;
	});
	return result;
}
//#endregion
//#region node_modules/layerchart/dist/utils/canvas.js
/**
* Returns true if the fill color is effectively invisible (none, transparent, or alpha=0).
* Used to skip canvas fill rendering for invisible fills.
*/
function isTransparentFill(fill) {
	if (!fill || fill === "none" || fill === "transparent") return true;
	return /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(fill);
}
/**
* Returns true if a style value cannot be assigned directly to a canvas
* context and must first be resolved through the hidden `<svg>` helper —
* specifically `var(...)` references and the `currentColor` keyword.
*/
function needsCSSResolution(value) {
	if (typeof value !== "string") return false;
	return value.includes("var(") || value.toLowerCase() === "currentcolor";
}
var CANVAS_STYLES_ELEMENT_ID = "__layerchart_canvas_styles_id";
/**
* Parse an inline CSS style string into a StyleOptions object.
* Converts kebab-case properties to camelCase (e.g., 'stroke-dasharray' -> 'strokeDasharray')
*/
function parseStyleString(styleString) {
	if (!styleString) return {};
	const styles = {};
	const declarations = styleString.split(";").filter((s) => s.trim());
	for (const declaration of declarations) {
		const colonIndex = declaration.indexOf(":");
		if (colonIndex === -1) continue;
		const property = declaration.slice(0, colonIndex).trim();
		const value = declaration.slice(colonIndex + 1).trim();
		if (!property || !value) continue;
		const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
		styles[camelProperty] = value;
	}
	return styles;
}
var supportedStyles = [
	"fill",
	"fillOpacity",
	"stroke",
	"strokeOpacity",
	"strokeWidth",
	"strokeDasharray",
	"opacity",
	"fontWeight",
	"fontSize",
	"fontFamily",
	"textAnchor",
	"textAlign",
	"paintOrder"
];
/**
* Appends or reuses `<svg>` element below `<canvas>` to resolve CSS variables and classes (ex. `stroke: var(--color-primary)` => `stroke: rgb(...)` )
*/
function _getComputedStyles(canvas, { styles, classes } = {}) {
	if (typeof document === "undefined") {
		const merged = { ...styles };
		if (!merged.fontSize) merged.fontSize = "10px";
		if (!merged.fontFamily) merged.fontFamily = "sans-serif";
		return merged;
	}
	try {
		let svg = document.getElementById(CANVAS_STYLES_ELEMENT_ID);
		if (!svg) {
			svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("id", CANVAS_STYLES_ELEMENT_ID);
			svg.style.display = "none";
			canvas.after(svg);
		}
		svg = svg;
		svg.removeAttribute("style");
		svg.removeAttribute("class");
		if (styles) Object.assign(svg.style, styles);
		svg.style.display = "none";
		if (classes) svg.setAttribute("class", cls(classes).split(" ").filter((s) => !s.startsWith("transition-")).join(" "));
		return supportedStyles.reduce((acc, style) => {
			acc[style] = window.getComputedStyle(svg)[style];
			return acc;
		}, {});
	} catch (e) {
		console.error("Unable to get computed styles", e);
		return {};
	}
}
function getComputedStylesKey(canvas, { styles, classes } = {}) {
	return JSON.stringify({
		canvasId: canvas.id,
		styles,
		classes
	});
}
var getComputedStyles = memoize(_getComputedStyles, { cacheKey: ([canvas, styleOptions]) => {
	return getComputedStylesKey(canvas, styleOptions);
} });
/** Render onto canvas context.  Supports CSS variables and classes by tranferring to hidden `<svg>` element before retrieval) */
function render(ctx, render, styleOptions = {}, { applyText } = {}) {
	const parsedInlineStyles = parseStyleString(styleOptions.style);
	const mergedStyles = {
		...styleOptions.styles,
		...parsedInlineStyles
	};
	let resolvedStyles;
	if (typeof document === "undefined" || styleOptions.classes == null && !Object.values(mergedStyles).some(needsCSSResolution)) {
		resolvedStyles = mergedStyles;
		if (typeof document === "undefined") {
			if (!resolvedStyles.stroke && !resolvedStyles.fill) resolvedStyles = {
				...resolvedStyles,
				stroke: "black"
			};
		}
	} else {
		const { constantStyles, variableStyles } = Object.entries(mergedStyles).reduce((acc, [key, value]) => {
			if (needsCSSResolution(value)) acc.variableStyles[key] = value;
			else if (typeof value === "number" || typeof value === "string") acc.constantStyles[key] = value;
			return acc;
		}, {
			constantStyles: {},
			variableStyles: {}
		});
		resolvedStyles = {
			...getComputedStyles(ctx.canvas, {
				styles: variableStyles,
				classes: styleOptions.classes
			}),
			...constantStyles
		};
	}
	const paintOrder = resolvedStyles?.paintOrder === "stroke" ? ["stroke", "fill"] : ["fill", "stroke"];
	if (resolvedStyles?.opacity) ctx.globalAlpha *= Number(resolvedStyles?.opacity);
	if (applyText) {
		const fontSize = resolvedStyles.fontSize || "10px";
		const fontFamily = resolvedStyles.fontFamily || "sans-serif";
		ctx.font = `${resolvedStyles.fontWeight || ""} ${fontSize} ${fontFamily}`.trim();
		if (resolvedStyles.textAnchor === "middle") ctx.textAlign = "center";
		else if (resolvedStyles.textAnchor === "end") ctx.textAlign = "right";
		else if (resolvedStyles.textAnchor === "start") ctx.textAlign = "left";
		else if (resolvedStyles.textAlign) ctx.textAlign = resolvedStyles.textAlign;
	}
	if (resolvedStyles.strokeDasharray && resolvedStyles.strokeDasharray !== "none") {
		const dashArray = resolvedStyles.strokeDasharray.split(/[\s,]+/).filter((s) => s.length > 0).map((s) => Number(s.replace("px", "")));
		if (dashArray.length > 0 && dashArray.every((n) => !isNaN(n))) ctx.setLineDash(dashArray);
	}
	for (const attr of paintOrder) if (attr === "fill") {
		const fill = styleOptions.styles?.fill && (typeof CanvasGradient !== "undefined" && styleOptions.styles?.fill instanceof CanvasGradient || typeof CanvasPattern !== "undefined" && styleOptions.styles?.fill instanceof CanvasPattern || !needsCSSResolution(styleOptions.styles?.fill)) ? styleOptions.styles.fill : resolvedStyles?.fill;
		if (fill && !isTransparentFill(fill)) {
			const currentGlobalAlpha = ctx.globalAlpha;
			const fillOpacity = Number(resolvedStyles?.fillOpacity);
			ctx.globalAlpha *= isNaN(fillOpacity) ? 1 : fillOpacity;
			ctx.fillStyle = fill;
			render.fill(ctx);
			ctx.globalAlpha = currentGlobalAlpha;
		}
	} else if (attr === "stroke") {
		const stroke = styleOptions.styles?.stroke && (typeof CanvasGradient !== "undefined" && styleOptions.styles?.stroke instanceof CanvasGradient || !needsCSSResolution(styleOptions.styles?.stroke)) ? styleOptions.styles?.stroke : resolvedStyles?.stroke;
		if (stroke && !["none"].includes(stroke)) {
			const currentGlobalAlpha = ctx.globalAlpha;
			const strokeOpacity = Number(resolvedStyles?.strokeOpacity);
			Number(resolvedStyles?.opacity);
			if (!isNaN(strokeOpacity) && strokeOpacity !== 1) ctx.globalAlpha *= strokeOpacity;
			ctx.lineWidth = typeof resolvedStyles?.strokeWidth === "string" ? Number(resolvedStyles?.strokeWidth?.replace("px", "")) : resolvedStyles?.strokeWidth ?? 1;
			ctx.strokeStyle = stroke;
			render.stroke(ctx);
			ctx.globalAlpha = currentGlobalAlpha;
		}
	}
}
/** Render SVG path data onto canvas context.  Supports CSS variables and classes by tranferring to hidden `<svg>` element before retrieval) */
function renderPathData(ctx, pathData, styleOptions = {}) {
	const path = new Path2D(pathData ?? "");
	render(ctx, {
		fill: (ctx) => ctx.fill(path),
		stroke: (ctx) => ctx.stroke(path)
	}, styleOptions);
}
function renderText(ctx, text, coords, styleOptions = {}) {
	if (text) render(ctx, {
		fill: (ctx) => ctx.fillText(text.toString(), coords.x, coords.y),
		stroke: (ctx) => ctx.strokeText(text.toString(), coords.x, coords.y)
	}, styleOptions, { applyText: true });
}
function renderRect(ctx, coords, styleOptions = {}) {
	const { x, y, width, height, corners } = coords;
	const rx = coords.rx ?? 0;
	const ry = coords.ry ?? rx;
	if (!(corners && !corners.every((c) => c === corners[0])) && rx === 0 && ry === 0 && !corners) {
		render(ctx, {
			fill: (ctx) => ctx.fillRect(x, y, width, height),
			stroke: (ctx) => ctx.strokeRect(x, y, width, height)
		}, styleOptions);
		return;
	}
	if (typeof ctx.roundRect === "function") {
		ctx.beginPath();
		ctx.roundRect(x, y, width, height, corners ?? [rx, ry]);
		render(ctx, {
			fill: (ctx) => ctx.fill(),
			stroke: (ctx) => ctx.stroke()
		}, styleOptions);
		ctx.closePath();
		return;
	}
	if (corners) {
		renderPathData(ctx, roundedRectPath(x, y, width, height, corners), styleOptions);
		return;
	}
	const clampedRx = Math.min(rx, width / 2);
	const clampedRy = Math.min(ry, height / 2);
	renderPathData(ctx, [
		`M${x + clampedRx},${y}`,
		`h${width - 2 * clampedRx}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${clampedRx},${clampedRy}`,
		`v${height - 2 * clampedRy}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${-clampedRx},${clampedRy}`,
		`h${2 * clampedRx - width}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${-clampedRx},${-clampedRy}`,
		`v${2 * clampedRy - height}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${clampedRx},${-clampedRy}`,
		"z"
	].join(" "), styleOptions);
}
function renderCircle(ctx, coords, styleOptions = {}) {
	ctx.beginPath();
	ctx.arc(coords.cx, coords.cy, coords.r, 0, 2 * Math.PI);
	render(ctx, {
		fill: (ctx) => {
			ctx.fill();
		},
		stroke: (ctx) => {
			ctx.stroke();
		}
	}, styleOptions);
	ctx.closePath();
}
/**
Scales a canvas for high DPI / retina displays.
@see: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#examples
@see: https://web.dev/articles/canvas-hidipi
*/
function scaleCanvas(ctx, width, height) {
	const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
	ctx.canvas.width = width * devicePixelRatio;
	ctx.canvas.height = height * devicePixelRatio;
	ctx.canvas.style.width = `${width}px`;
	ctx.canvas.style.height = `${height}px`;
	ctx.scale(devicePixelRatio, devicePixelRatio);
	return {
		width: ctx.canvas.width,
		height: ctx.canvas.height
	};
}
function _createLinearGradient(ctx, x0, y0, x1, y1, stops) {
	const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
	for (const { offset, color } of stops) gradient.addColorStop(offset, color);
	return gradient;
}
/** Create linear gradient and memoize result to fix reactivity */
var createLinearGradient = memoize(_createLinearGradient, { cacheKey: (args) => JSON.stringify(args.slice(1)) });
function _createPattern(ctx, width, height, shapes, background) {
	const patternCanvas = document.createElement("canvas");
	const patternCtx = patternCanvas.getContext("2d");
	ctx.canvas.after(patternCanvas);
	const dpr = (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1;
	patternCanvas.width = Math.max(1, Math.round(width * dpr));
	patternCanvas.height = Math.max(1, Math.round(height * dpr));
	patternCtx.scale(dpr, dpr);
	if (background) {
		patternCtx.fillStyle = background;
		patternCtx.fillRect(0, 0, width, height);
	}
	for (const shape of shapes) {
		patternCtx.save();
		if (shape.type === "circle") renderCircle(patternCtx, {
			cx: shape.cx,
			cy: shape.cy,
			r: shape.r
		}, { styles: {
			fill: shape.fill,
			opacity: shape.opacity
		} });
		else if (shape.type === "line") renderPathData(patternCtx, shape.path, { styles: {
			stroke: shape.stroke,
			strokeWidth: shape.strokeWidth,
			opacity: shape.opacity
		} });
		else if (shape.type === "rect") {
			const rx = typeof shape.rx === "string" ? toRectCornerPx(shape.rx, shape.width) : shape.rx;
			const ry = typeof shape.ry === "string" ? toRectCornerPx(shape.ry, shape.height) : shape.ry ?? rx;
			renderRect(patternCtx, {
				x: shape.x,
				y: shape.y,
				width: shape.width,
				height: shape.height,
				rx,
				ry
			}, { styles: {
				fill: shape.fill,
				opacity: shape.opacity
			} });
		}
		patternCtx.restore();
	}
	const pattern = ctx.createPattern(patternCanvas, "repeat");
	if (pattern) {
		const sx = width / patternCanvas.width;
		const sy = height / patternCanvas.height;
		pattern.setTransform(new DOMMatrix([
			sx,
			0,
			0,
			sy,
			0,
			0
		]));
	}
	ctx.canvas.parentElement?.removeChild(patternCanvas);
	return pattern;
}
/** Create pattern and memoize result to fix reactivity */
var createPattern = memoize(_createPattern, { cacheKey: (args) => JSON.stringify(args.slice(1)) });
function toRectCornerPx(value, max) {
	if (value.endsWith("%")) {
		const pct = parseFloat(value);
		if (!Number.isFinite(pct)) return 0;
		return max / 2 * (pct / 100);
	}
	const n = parseFloat(value);
	return Number.isFinite(n) ? n : 0;
}
//#endregion
//#region node_modules/layerchart/dist/utils/key.svelte.js
function createKey(getValue) {
	const value = derived(getValue);
	const key = derived(() => value() && typeof value() === "object" ? objectId(value()) : value());
	return { get current() {
		return key();
	} };
}
//#endregion
export { getLayerContext as C, setGeoContext as E, resolveStyleProp as S, getGeoContext as T, colorPropDataKey as _, renderCircle as a, resolveDataProp as b, renderText as c, flattenPathData as d, parseDashArray as f, setFacetPanel as g, getMarkData as h, getComputedStyles as i, scaleCanvas as l, getFacetPanel as m, createLinearGradient as n, renderPathData as o, roundedRectPath as p, createPattern as r, renderRect as s, createKey as t, dashArrayToGradient as u, hasAnyDataProp as v, setLayerContext as w, resolveGeoDataPair as x, resolveColorProp as y };

//# sourceMappingURL=key.svelte.js.map