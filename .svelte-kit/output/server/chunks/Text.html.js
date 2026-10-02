import { Mt as attr, Nt as clsx, Wt as escape_html, a as bind_props, c as ensure_array_like, h as stringify, n as attr_style, o as derived, r as attributes, t as attr_class, u as props_id } from "./server.js";
import "./index-server2.js";
import { n as createDataMotionMap, r as createMotion } from "./motion.svelte.js";
import { t as getChartContext } from "./chart.js";
import { S as resolveStyleProp, T as getGeoContext, b as resolveDataProp, c as renderText, h as getMarkData, i as getComputedStyles, t as createKey, x as resolveGeoDataPair, y as resolveColorProp } from "./key.svelte.js";
import { i as createId } from "./Path.canvas.js";
import { n as degreesToRadians } from "./math.js";
import { format, get, merge } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
import memoize from "memoize";
//#region node_modules/layerchart/dist/utils/string.js
var MEASUREMENT_ELEMENT_ID = "__text_measurement_id";
function _getStringWidth(str, style) {
	try {
		let textEl = document.getElementById(MEASUREMENT_ELEMENT_ID);
		if (!textEl) {
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.style.width = "0";
			svg.style.height = "0";
			svg.style.position = "absolute";
			svg.style.top = "-100%";
			svg.style.left = "-100%";
			textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
			textEl.setAttribute("id", MEASUREMENT_ELEMENT_ID);
			svg.appendChild(textEl);
			document.body.appendChild(svg);
		}
		Object.assign(textEl.style, style);
		textEl.textContent = str;
		return textEl.getComputedTextLength();
	} catch (e) {
		return null;
	}
}
var getStringWidth = memoize(_getStringWidth, { cacheKey: ([str, style]) => `${str}_${JSON.stringify(style)}` });
/**
* Axis-aligned box enclosing `rect` after rotating it `degrees` about (`originX`, `originY`) —
* the same rotation SVG's `rotate(deg, x, y)` applies.
*
* A rotated label still has to be compared as an axis-aligned box (that is all `occlude()` tests),
* so it is widened to the box that contains it.  At 45° a long label takes far less horizontal
* room than it does flat, and measuring it unrotated would drop neighbours that actually fit.
*/
function rotateRect(rect, degrees, originX, originY) {
	if (!degrees) return rect;
	const radians = degrees * Math.PI / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	const corners = [
		[rect.x, rect.y],
		[rect.x + rect.width, rect.y],
		[rect.x, rect.y + rect.height],
		[rect.x + rect.width, rect.y + rect.height]
	].map(([cx, cy]) => {
		const dx = cx - originX;
		const dy = cy - originY;
		return [originX + dx * cos - dy * sin, originY + dx * sin + dy * cos];
	});
	const xs = corners.map(([cx]) => cx);
	const ys = corners.map(([, cy]) => cy);
	const minX = Math.min(...xs);
	const minY = Math.min(...ys);
	return {
		x: minX,
		y: minY,
		width: Math.max(...xs) - minX,
		height: Math.max(...ys) - minY
	};
}
/**
* Bounding box (`{ x, y, width, height }`) of `text` anchored at (`x`, `y`) — matching
* how `<Text>` positions it for the given `textAnchor`/`verticalAnchor`/`rotate`. Width is
* measured with the same memoized metrics as `<Text>` (falling back to a character-count estimate
* when the DOM is unavailable, e.g. during SSR), making it a convenient `bounds` for
* `occlude()`.
*
* Pass an array to measure a multiline `<Text>` value: the box is as wide as the widest line and
* as tall as the stack.
*/
function getTextRect(text, x, y, options = {}) {
	const { textAnchor = "start", verticalAnchor = "middle", fontSize = 16, lineHeight = fontSize, dx = 0, dy = 0, rotate = 0 } = options;
	const lines = Array.isArray(text) ? text : [text];
	const width = lines.reduce((widest, line) => {
		const lineWidth = getStringWidth(line, { fontSize: `${fontSize}px` }) ?? line.length * fontSize * .6;
		return Math.max(widest, lineWidth);
	}, 0);
	const height = lines.length > 1 ? lineHeight * lines.length : fontSize;
	const ax = x + dx;
	const ay = y + dy;
	return rotateRect({
		x: textAnchor === "end" ? ax - width : textAnchor === "middle" ? ax - width / 2 : ax,
		y: verticalAnchor === "end" ? ay - height : verticalAnchor === "middle" ? ay - height / 2 : ay,
		width,
		height
	}, rotate, x, y);
}
function toTitleCase(str) {
	return str.replace(/^\w/, (d) => d.toUpperCase());
}
var DEFAULT_ELLIPSIS = "…";
/**
* Truncates a string to fit within a specified pixel width or character count.
* If the string's width exceeds the maxWidth, it will be truncated. If the character
* count exceeds maxChars, it will also be truncated.
*
* The ellipsis can be placed at the start, middle, or end of the string.
*/
function truncateText(text, { position = "end", ellipsis = DEFAULT_ELLIPSIS, maxWidth, style, maxChars }) {
	if (!text) return "";
	if (maxWidth === void 0 && maxChars === void 0) return text;
	let workingText = text;
	if (maxChars !== void 0 && text.length > maxChars) {
		if (position === "start") workingText = ellipsis + text.slice(-maxChars);
		else if (position === "middle") {
			const half = Math.floor(maxChars / 2);
			workingText = text.slice(0, half) + ellipsis + text.slice(-half);
		} else workingText = text.slice(0, maxChars) + ellipsis;
	}
	if (maxWidth !== void 0) {
		const fullWidth = getStringWidth(workingText, style);
		if (fullWidth === null || fullWidth <= maxWidth) return workingText;
		let availableWidth = maxWidth - (getStringWidth(ellipsis, style) ?? 0);
		if (position === "start") {
			let truncated = workingText.slice(ellipsis.length);
			let truncatedWidth = getStringWidth(truncated, style);
			while (truncatedWidth !== null && truncatedWidth > availableWidth && truncated.length > 0) {
				truncated = truncated.slice(1);
				truncatedWidth = getStringWidth(truncated, style);
			}
			return ellipsis + truncated;
		} else if (position === "middle") {
			const halfWidth = availableWidth / 2;
			let left = "";
			let right = "";
			let bestLeft = "";
			let bestRight = "";
			for (let i = 0, j = workingText.length - 1; i < workingText.length && j >= 0; i++, j--) {
				const leftTest = workingText.slice(0, i + 1);
				const rightTest = workingText.slice(j);
				const leftWidth = getStringWidth(leftTest, style);
				const rightWidth = getStringWidth(rightTest, style);
				if (leftWidth !== null && leftWidth <= halfWidth) left = leftTest;
				if (rightWidth !== null && rightWidth <= halfWidth) right = rightTest;
				const combinedWidth = getStringWidth(left + ellipsis + right, style);
				if (combinedWidth !== null && combinedWidth <= maxWidth) {
					bestLeft = left;
					bestRight = right;
				} else break;
			}
			return bestLeft + ellipsis + bestRight;
		} else {
			let truncated = workingText.slice(0, -ellipsis.length);
			let truncatedWidth = getStringWidth(truncated + ellipsis, style);
			while (truncatedWidth !== null && truncatedWidth > maxWidth && truncated.length > 0) {
				truncated = truncated.slice(0, -1);
				truncatedWidth = getStringWidth(truncated + ellipsis, style);
			}
			return truncated + ellipsis;
		}
	}
	return workingText;
}
//#endregion
//#region node_modules/layerchart/dist/components/Text/Text.shared.svelte.js
function isCSSValue(value) {
	return /^-?[\d.]+(%|em|rem|px|pt|cm|mm|in)?$/.test(value);
}
/**
* Check if a Text prop value is a data-space prop.
* Functions are always data props.
* Strings are data props unless they look like CSS values (e.g. "50%", "1em").
*/
function isTextDataProp(value) {
	if (typeof value === "function") return true;
	if (typeof value === "string" && !isCSSValue(value)) return true;
	return false;
}
var defaultKey = (_, i) => i;
function getPathLength(pathRef) {
	if (pathRef && typeof pathRef.getTotalLength === "function") try {
		return pathRef.getTotalLength();
	} catch (e) {
		console.error("Error getting path length:", e);
		return 0;
	}
	return 0;
}
/**
* Convert css value to pixel value (ex. 0.71em => 11.36)
*/
function getPixelValue(cssValue) {
	if (typeof cssValue === "number") return cssValue;
	const result = cssValue.match(/([\d.]+)(\D+)/);
	const number = Number(result?.[1]);
	switch (result?.[2]) {
		case "px": return number;
		case "em":
		case "rem": return number * 16;
		default: return 0;
	}
}
/**
* Resolve the cap-height used by vertical-anchor math.
*
* Priority:
*   1. Explicit `capHeight` prop
*   2. `fontSize * 0.71` when `fontSize` is set (keeps centering correct as
*      labels scale per-item)
*   3. `'0.71em'` (legacy default — only correct for ~16px text since
*      `getPixelValue` resolves `em` against 16, not the actual font-size)
*/
function resolveCapHeight(capHeight, fontSize) {
	if (capHeight != null) return capHeight;
	if (fontSize != null) return getPixelValue(fontSize) * .71;
	return "0.71em";
}
/** Build the standard `markInfo` payload used by every Text variant. */
function textMarkInfo(props, dataMode) {
	if (!dataMode) return {};
	return {
		data: props.data,
		x: typeof props.x === "string" ? props.x : void 0,
		y: typeof props.y === "string" ? props.y : void 0,
		color: typeof props.fill === "string" ? props.fill : void 0
	};
}
/**
* Reactive state shared by every per-layer Text variant. Instantiate from
* each `Text.svg.svelte` / `Text.canvas.svelte` / `Text.html.svelte`
* component setup, passing a getter for the props.
*
* Per-layer specific bits (SVG `bind:this` refs, canvas's `render` function,
* canvas-specific style measurement) stay in their respective `.svelte` files.
*/
var TextState = class {
	#getProps = () => ({});
	/**
	* Memoized props — `#getProps()` allocates a fresh object (it spreads `rest`),
	* so calling it per derived meant ~30 allocations per instance per update.
	*/
	#props = derived(() => this.#getProps());
	chartCtx = getChartContext();
	markData = getMarkData();
	geo = getGeoContext();
	pathRef;
	#dataMode = derived(() => this.#props().data != null || isTextDataProp(this.#props().x) || isTextDataProp(this.#props().y));
	get dataMode() {
		return this.#dataMode();
	}
	set dataMode($$value) {
		return this.#dataMode($$value);
	}
	#resolvedData = derived(() => this.dataMode ? this.markData(this.#props().data) : []);
	#resolvedItems = derived(() => {
		if (!this.dataMode) return [];
		const keyFn = this.#props().key ?? defaultKey;
		return this.#resolvedData().map((d, i) => {
			const key = keyFn(d, i);
			const resolved = this.resolveTextPosition(d);
			const animated = this.#dataMotionMap?.get(key);
			return {
				d,
				key,
				x: animated?.x ?? resolved.x,
				y: animated?.y ?? resolved.y
			};
		});
	});
	get resolvedItems() {
		return this.#resolvedItems();
	}
	set resolvedItems($$value) {
		return this.#resolvedItems($$value);
	}
	resolveTextPosition(d) {
		const props = this.#props();
		if (this.geo.projection) {
			const [projX, projY] = resolveGeoDataPair(props.x, props.y, d, this.geo.projection);
			return {
				x: projX,
				y: projY
			};
		}
		const xDefault = typeof props.x === "number" ? props.x : props.x == null && this.chartCtx.config.x != null ? Number(this.chartCtx.xGet(d)) || 0 : 0;
		const yDefault = typeof props.y === "number" ? props.y : props.y == null && this.chartCtx.config.y != null ? Number(this.chartCtx.yGet(d)) || 0 : 0;
		return {
			x: resolveDataProp(props.x, d, this.chartCtx.xScale, xDefault),
			y: resolveDataProp(props.y, d, this.chartCtx.yScale, yDefault)
		};
	}
	resolveTextValue(d) {
		const value = this.#props().value;
		if (typeof value === "function") {
			const v = value(d);
			return v != null ? String(v) : "";
		}
		if (typeof value === "string") {
			const v = get(d, value);
			return v != null ? String(v) : "";
		}
		return value != null ? String(value) : "";
	}
	#dataMotionMap = null;
	#motionX;
	#motionY;
	#motionValue;
	get motionX() {
		return this.#motionX.current;
	}
	get motionY() {
		return this.#motionY.current;
	}
	#resolvedWidth = derived(() => this.#props().path ? getPathLength(this.pathRef) : this.#props().width);
	get resolvedWidth() {
		return this.#resolvedWidth();
	}
	set resolvedWidth($$value) {
		return this.#resolvedWidth($$value);
	}
	#defaultTruncateOptions = derived(() => ({
		maxChars: void 0,
		position: "end",
		maxWidth: this.resolvedWidth
	}));
	#truncateConfig = derived(() => {
		const truncate = this.#props().truncate;
		if (typeof truncate === "boolean") {
			if (truncate) return this.#defaultTruncateOptions();
			return false;
		}
		return {
			...this.#defaultTruncateOptions(),
			...truncate ?? {}
		};
	});
	get truncateConfig() {
		return this.#truncateConfig();
	}
	set truncateConfig($$value) {
		return this.#truncateConfig($$value);
	}
	#rawText = derived(() => {
		const value = this.#props().value;
		const motion = this.#props().motion;
		const format$1 = this.#props().format;
		if (typeof value === "function" || value == null) return "";
		if (typeof value === "number" && motion) {
			const v = this.#motionValue.current;
			return format$1 ? format(v, format$1) : String(v);
		}
		return (format$1 ? format(value, format$1) : value.toString()).replace(/\\n/g, "\n");
	});
	get rawText() {
		return this.#rawText();
	}
	set rawText($$value) {
		return this.#rawText($$value);
	}
	#textValue = derived(() => {
		const cfg = this.truncateConfig;
		if (!cfg || cfg === true) return this.rawText;
		return truncateText(this.rawText, cfg);
	});
	get textValue() {
		return this.#textValue();
	}
	set textValue($$value) {
		return this.#textValue($$value);
	}
	#spaceWidth = derived(() => getStringWidth("\xA0", void 0) || 0);
	#wordsByLines = derived(() => {
		const props = this.#props();
		const width = props.width;
		const scaleToFit = props.scaleToFit ?? false;
		return this.textValue.split("\n").flatMap((line) => {
			const words = line.split(/(?:(?! +)\s+)/);
			if (width == null) return [{ words }];
			return words.reduce((result, item) => {
				const currentLine = result[result.length - 1];
				const itemWidth = getStringWidth(item, void 0) || 0;
				if (currentLine && (width == null || scaleToFit || (currentLine.width || 0) + itemWidth + this.#spaceWidth() < width)) {
					currentLine.words.push(item);
					currentLine.width = currentLine.width || 0;
					currentLine.width += itemWidth + this.#spaceWidth();
				} else {
					const newLine = {
						words: [item],
						width: itemWidth
					};
					result.push(newLine);
				}
				return result;
			}, []);
		});
	});
	get wordsByLines() {
		return this.#wordsByLines();
	}
	set wordsByLines($$value) {
		return this.#wordsByLines($$value);
	}
	#lineCount = derived(() => this.wordsByLines.length);
	get lineCount() {
		return this.#lineCount();
	}
	set lineCount($$value) {
		return this.#lineCount($$value);
	}
	#startDy = derived(() => {
		const props = this.#props();
		const verticalAnchor = props.verticalAnchor ?? "end";
		const lineHeight = props.lineHeight ?? "1em";
		const capHeight = resolveCapHeight(props.capHeight, props.fontSize);
		if (verticalAnchor === "start") return getPixelValue(capHeight);
		else if (verticalAnchor === "middle") return (this.lineCount - 1) / 2 * -getPixelValue(lineHeight) + getPixelValue(capHeight) / 2;
		return (this.lineCount - 1) * -getPixelValue(lineHeight);
	});
	get startDy() {
		return this.#startDy();
	}
	set startDy($$value) {
		return this.#startDy($$value);
	}
	#dataModeStartDy = derived(() => {
		const props = this.#props();
		const verticalAnchor = props.verticalAnchor ?? "end";
		const capHeight = resolveCapHeight(props.capHeight, props.fontSize);
		if (verticalAnchor === "start") return getPixelValue(capHeight);
		if (verticalAnchor === "middle") return getPixelValue(capHeight) / 2;
		return 0;
	});
	get dataModeStartDy() {
		return this.#dataModeStartDy();
	}
	set dataModeStartDy($$value) {
		return this.#dataModeStartDy($$value);
	}
	#scaleTransform = derived(() => {
		const props = this.#props();
		const x = props.x;
		const y = props.y;
		const width = props.width;
		if ((props.scaleToFit ?? false) && this.lineCount > 0 && typeof x === "number" && typeof y === "number" && typeof width === "number") {
			const sx = width / (this.wordsByLines[0].width || 1);
			const sy = sx;
			return `matrix(${sx}, 0, 0, ${sy}, ${x - sx * x}, ${y - sy * y})`;
		}
		return "";
	});
	get scaleTransform() {
		return this.#scaleTransform();
	}
	set scaleTransform($$value) {
		return this.#scaleTransform($$value);
	}
	#rotateTransform = derived(() => {
		const props = this.#props();
		return props.rotate ? `rotate(${props.rotate}, ${props.x}, ${props.y})` : "";
	});
	get rotateTransform() {
		return this.#rotateTransform();
	}
	set rotateTransform($$value) {
		return this.#rotateTransform($$value);
	}
	#transform = derived(() => this.#props().transform ?? `${this.scaleTransform} ${this.rotateTransform}`);
	get transform() {
		return this.#transform();
	}
	set transform($$value) {
		return this.#transform($$value);
	}
	#staticFill = derived(() => typeof this.#props().fill === "string" ? this.#props().fill : void 0);
	get staticFill() {
		return this.#staticFill();
	}
	set staticFill($$value) {
		return this.#staticFill($$value);
	}
	#staticFillOpacity = derived(() => typeof this.#props().fillOpacity === "number" ? this.#props().fillOpacity : void 0);
	get staticFillOpacity() {
		return this.#staticFillOpacity();
	}
	set staticFillOpacity($$value) {
		return this.#staticFillOpacity($$value);
	}
	#staticStroke = derived(() => typeof this.#props().stroke === "string" ? this.#props().stroke : void 0);
	get staticStroke() {
		return this.#staticStroke();
	}
	set staticStroke($$value) {
		return this.#staticStroke($$value);
	}
	#staticStrokeWidth = derived(() => typeof this.#props().strokeWidth === "number" ? this.#props().strokeWidth : void 0);
	get staticStrokeWidth() {
		return this.#staticStrokeWidth();
	}
	set staticStrokeWidth($$value) {
		return this.#staticStrokeWidth($$value);
	}
	#staticOpacity = derived(() => typeof this.#props().opacity === "number" ? this.#props().opacity : void 0);
	get staticOpacity() {
		return this.#staticOpacity();
	}
	set staticOpacity($$value) {
		return this.#staticOpacity($$value);
	}
	#staticClassName = derived(() => typeof this.#props().class === "string" ? this.#props().class : void 0);
	get staticClassName() {
		return this.#staticClassName();
	}
	set staticClassName($$value) {
		return this.#staticClassName($$value);
	}
	constructor(getProps) {
		this.#getProps = getProps;
		const initial = getProps();
		const _initialX = initial.initialX ?? (typeof initial.x === "function" ? 0 : initial.x ?? 0);
		const _initialY = initial.initialY ?? (typeof initial.y === "function" ? 0 : initial.y ?? 0);
		this.#motionX = createMotion(_initialX, () => {
			const x = this.#props().x;
			return typeof x === "number" || typeof x === "string" ? x : 0;
		}, initial.motion);
		this.#motionY = createMotion(_initialY, () => {
			const y = this.#props().y;
			return typeof y === "number" || typeof y === "string" ? y : 0;
		}, initial.motion);
		this.#motionValue = createMotion(typeof initial.value === "number" ? initial.value : 0, () => typeof this.#props().value === "number" ? this.#props().value : 0, typeof initial.value === "number" && initial.motion ? typeof initial.motion === "object" && "type" in initial.motion ? initial.motion : void 0 : void 0);
		this.#dataMotionMap = createDataMotionMap(initial.motion);
		if (this.#dataMotionMap) this.#dataMotionMap;
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Text/Text.svg.svelte
function Text_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { svgRef: svgRefProp = void 0, ref: refProp = void 0, pathId = createId("text-path", uid), rotate, dx, dy, fontSize, $$slots, $$events, ...rest } = $$props;
		const c = new TextState(() => ({
			rotate,
			dx,
			dy,
			fontSize,
			...rest
		}));
		c.chartCtx.registerComponent({
			name: "Text",
			kind: "mark",
			markInfo: () => textMarkInfo(rest, c.dataMode)
		});
		if (c.dataMode) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				const text = c.resolveTextValue(item.d);
				const resolvedFill = resolveColorProp(rest.fill, item.d, c.chartCtx.cScale);
				const resolvedStroke = resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale);
				const resolvedFillOpacity = resolveStyleProp(rest.fillOpacity, item.d);
				const resolvedStrokeWidth = resolveStyleProp(rest.strokeWidth, item.d);
				const resolvedOpacity = resolveStyleProp(rest.opacity, item.d);
				const resolvedClass = resolveStyleProp(rest.class, item.d);
				const dataRotateTransform = rotate ? `rotate(${rotate}, ${item.x}, ${item.y})` : "";
				$$renderer.push(`<svg${attributes({
					x: dx ?? 0,
					y: dy ?? 0,
					...rest.svgProps,
					class: clsx(["lc-text-svg", rest.svgProps?.class])
				}, void 0, void 0, void 0, 3)}><text${attributes({
					...rest,
					x: item.x,
					y: item.y,
					transform: rest.transform ?? dataRotateTransform,
					"text-anchor": rest.textAnchor ?? "start",
					"dominant-baseline": rest.dominantBaseline ?? "auto",
					"font-size": fontSize,
					fill: resolvedFill,
					"fill-opacity": resolvedFillOpacity,
					stroke: resolvedStroke,
					"stroke-width": resolvedStrokeWidth,
					opacity: resolvedOpacity,
					class: clsx(["lc-text", resolvedClass])
				}, void 0, void 0, void 0, 3)}><tspan${attr("x", item.x)}${attr("dy", c.dataModeStartDy)} class="lc-text-tspan">${escape_html(text)}</tspan></text></svg>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><svg${attributes({
				x: dx ?? 0,
				y: dy ?? 0,
				...rest.svgProps,
				class: clsx(["lc-text-svg", rest.svgProps?.class])
			}, void 0, void 0, void 0, 3)}>`);
			if (rest.path) {
				$$renderer.push(`<!--[0--><defs><!---->`);
				$$renderer.push(`<path${attr("id", pathId)}${attr("d", rest.path)}></path>`);
				$$renderer.push(`<!----></defs><text${attributes({
					...rest,
					dy: dy ?? 0,
					"font-size": fontSize,
					fill: c.staticFill,
					"fill-opacity": c.staticFillOpacity,
					stroke: c.staticStroke,
					"stroke-width": c.staticStrokeWidth,
					opacity: c.staticOpacity,
					transform: rest.transform,
					class: clsx(["lc-text", c.staticClassName])
				}, void 0, void 0, void 0, 3)}><textPath${attr_style(`text-anchor: ${stringify(rest.textAnchor ?? "start")};`)}${attr("dominant-baseline", rest.dominantBaseline ?? "auto")}${attr("href", `#${stringify(pathId)}`)}${attr("startOffset", rest.startOffset ?? "0%")} class="lc-text-path">${escape_html(c.wordsByLines.map((line) => line.words.join(" ")).join())}</textPath></text>`);
			} else {
				$$renderer.push(`<!--[-1--><text${attributes({
					...rest,
					x: c.motionX,
					y: c.motionY,
					transform: c.transform,
					"text-anchor": rest.textAnchor ?? "start",
					"dominant-baseline": rest.dominantBaseline ?? "auto",
					"font-size": fontSize,
					fill: c.staticFill,
					"fill-opacity": c.staticFillOpacity,
					stroke: c.staticStroke,
					"stroke-width": c.staticStrokeWidth,
					opacity: c.staticOpacity,
					class: clsx(["lc-text", c.staticClassName])
				}, void 0, void 0, void 0, 3)}>`);
				if (rest.segments) {
					$$renderer.push(`<!--[0--><!--[-->`);
					const each_array_1 = ensure_array_like(rest.segments);
					for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
						let segment = each_array_1[index];
						$$renderer.push(`<tspan${attr("dy", index === 0 ? c.startDy : 0)}${attr_class(clsx(["lc-text-tspan", segment.class]))}>${escape_html(segment.value)}</tspan>`);
					}
					$$renderer.push(`<!--]-->`);
				} else {
					$$renderer.push(`<!--[-1--><!--[-->`);
					const each_array_2 = ensure_array_like(c.wordsByLines);
					for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
						let line = each_array_2[index];
						$$renderer.push(`<tspan${attr("x", c.motionX)}${attr("dy", index === 0 ? c.startDy : getPixelValue(rest.lineHeight ?? "1em"))} class="lc-text-tspan">${escape_html(line.words.join(" "))}</tspan>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]--></text>`);
			}
			$$renderer.push(`<!--]--></svg>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			svgRef: svgRefProp,
			ref: refProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Text/Text.canvas.svelte
function Text_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...rest } = $$props;
		const c = new TextState(() => rest);
		function getTextStyles(styleOverrides, itemFill, itemStroke, itemFillOpacity, itemStrokeWidth, itemOpacity, itemClass) {
			return styleOverrides ? merge({ styles: { strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth } }, styleOverrides) : {
				styles: {
					fill: itemFill ?? rest.fill,
					fillOpacity: itemFillOpacity ?? c.staticFillOpacity,
					stroke: itemStroke ?? rest.stroke,
					strokeWidth: itemStrokeWidth ?? c.staticStrokeWidth,
					opacity: itemOpacity ?? c.staticOpacity,
					paintOrder: "stroke",
					...rest.fontSize != null ? { fontSize: typeof rest.fontSize === "number" ? `${rest.fontSize}px` : rest.fontSize } : {},
					...(rest.textAnchor ?? "start") !== "start" ? { textAnchor: rest.textAnchor } : {}
				},
				classes: cls("lc-text", itemClass ?? c.staticClassName),
				style: rest.style
			};
		}
		function render(ctx, styleOverrides) {
			const textAnchor = rest.textAnchor ?? "start";
			rest.verticalAnchor;
			const lineHeight = rest.lineHeight ?? "1em";
			const dx = rest.dx ?? 0;
			const dy = rest.dy ?? 0;
			const rotate = rest.rotate;
			const x = rest.x;
			const y = rest.y;
			if (c.dataMode) {
				const baseStyles = getTextStyles(styleOverrides);
				const computedStyles = getComputedStyles(ctx.canvas, baseStyles);
				ctx.font = `${computedStyles.fontSize} ${computedStyles.fontFamily}`;
				ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor === "end" ? "end" : "start";
				for (const item of c.resolvedItems) {
					const text = c.resolveTextValue(item.d);
					const itemStyles = getTextStyles(styleOverrides, resolveColorProp(rest.fill, item.d, c.chartCtx.cScale), resolveColorProp(rest.stroke, item.d, c.chartCtx.cScale), resolveStyleProp(rest.fillOpacity, item.d), resolveStyleProp(rest.strokeWidth, item.d), resolveStyleProp(rest.opacity, item.d), resolveStyleProp(rest.class, item.d));
					ctx.save();
					if (rotate !== void 0) {
						const radians = degreesToRadians(rotate);
						ctx.translate(item.x, item.y);
						ctx.rotate(radians);
						ctx.translate(-item.x, -item.y);
					}
					renderText(ctx, text, {
						x: item.x + getPixelValue(dx),
						y: item.y + getPixelValue(dy) + c.dataModeStartDy
					}, itemStyles);
					ctx.restore();
				}
			} else {
				const styles = getTextStyles(styleOverrides);
				const effectiveLineHeight = getPixelValue(lineHeight);
				const baseY = getPixelValue(c.motionY) + getPixelValue(dy) + getPixelValue(c.startDy);
				const baseX = getPixelValue(c.motionX) + getPixelValue(dx);
				ctx.save();
				if (rotate !== void 0) {
					const centerX = getPixelValue(typeof x === "function" ? 0 : x ?? 0);
					const centerY = getPixelValue(typeof y === "function" ? 0 : y ?? 0);
					const radians = degreesToRadians(rotate);
					ctx.translate(centerX, centerY);
					ctx.rotate(radians);
					ctx.translate(-centerX, -centerY);
				}
				const computedStyles = getComputedStyles(ctx.canvas, styles);
				ctx.font = `${computedStyles.fontSize} ${computedStyles.fontFamily}`;
				ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor === "end" ? "end" : "start";
				if (rest.segments) {
					let xOffset = baseX;
					for (const segment of rest.segments) {
						const segStyles = getTextStyles(styleOverrides, void 0, void 0, void 0, void 0, void 0, segment.class);
						const text = String(segment.value);
						const segComputedStyles = getComputedStyles(ctx.canvas, segStyles);
						ctx.font = `${segComputedStyles.fontWeight || ""} ${segComputedStyles.fontSize || "10px"} ${segComputedStyles.fontFamily || "sans-serif"}`.trim();
						renderText(ctx, text, {
							x: xOffset,
							y: baseY
						}, segStyles);
						xOffset += ctx.measureText(text).width;
					}
				} else for (let index = 0; index < c.wordsByLines.length; index++) {
					const text = c.wordsByLines[index].words.join(" ");
					const xPos = baseX;
					const yPos = baseY + index * effectiveLineHeight;
					renderText(ctx, text, {
						x: xPos,
						y: yPos
					}, styles);
				}
				ctx.restore();
			}
		}
		const fillKey = createKey(() => rest.fill);
		const strokeKey = createKey(() => rest.stroke);
		c.chartCtx.registerComponent({
			name: "Text",
			kind: "mark",
			markInfo: () => textMarkInfo(rest, c.dataMode),
			canvasRender: {
				render,
				deps: () => [
					c.dataMode,
					c.dataMode ? c.resolvedItems : null,
					rest.value,
					rest.segments,
					c.motionX,
					c.motionY,
					fillKey.current,
					strokeKey.current,
					rest.strokeWidth,
					rest.opacity,
					rest.class,
					c.truncateConfig,
					rest.rotate,
					rest.fontSize,
					rest.lineHeight,
					rest.textAnchor,
					rest.verticalAnchor
				]
			}
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Text/Text.html.svelte
function Text_html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...rest } = $$props;
		const c = new TextState(() => rest);
		c.chartCtx.registerComponent({
			name: "Text",
			kind: "mark",
			markInfo: () => textMarkInfo(rest, c.dataMode)
		});
		if (c.dataMode) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				const text = c.resolveTextValue(item.d);
				const resolvedFill = resolveColorProp(rest.fill, item.d, c.chartCtx.cScale);
				const resolvedFillOpacity = resolveStyleProp(rest.fillOpacity, item.d);
				const resolvedOpacity = resolveStyleProp(rest.opacity, item.d);
				const resolvedClass = resolveStyleProp(rest.class, item.d);
				const textAnchor = rest.textAnchor ?? "start";
				const verticalAnchor = rest.verticalAnchor ?? "end";
				const translateX = textAnchor === "middle" ? "-50%" : textAnchor === "end" ? "-100%" : "0%";
				const translateY = verticalAnchor === "middle" ? "-50%" : verticalAnchor === "end" ? "-100%" : "0%";
				$$renderer.push(`<div${attr_class(clsx(["lc-text", resolvedClass]))}${attr_style("", {
					position: "absolute",
					left: `${stringify(getPixelValue(rest.dx ?? 0) + item.x)}px`,
					top: `${stringify(getPixelValue(rest.dy ?? 0) + item.y)}px`,
					transform: `translate(${translateX}, ${translateY}) rotate(${stringify(rest.rotate ?? 0)}deg)`,
					"transform-origin": `${verticalAnchor === "middle" ? "center" : verticalAnchor === "end" ? "bottom" : "top"} ${textAnchor === "middle" ? "center" : textAnchor === "end" ? "right" : "left"}`,
					"white-space": "pre-wrap",
					"line-height": rest.lineHeight ?? "1em",
					"font-size": typeof rest.fontSize === "number" ? `${rest.fontSize}px` : rest.fontSize,
					color: resolvedFill,
					opacity: resolvedOpacity ?? resolvedFillOpacity
				})}>${escape_html(text)}</div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			const textAnchor = rest.textAnchor ?? "start";
			const verticalAnchor = rest.verticalAnchor ?? "end";
			const translateX = textAnchor === "middle" ? "-50%" : textAnchor === "end" ? "-100%" : "0%";
			const translateY = verticalAnchor === "middle" ? "-50%" : verticalAnchor === "end" ? "-100%" : "0%";
			$$renderer.push(`<div${attr_class(clsx(["lc-text", c.staticClassName]))}${attr_style("", {
				position: "absolute",
				left: `${stringify((typeof rest.dx === "number" ? rest.dx : 0) + (typeof c.motionX === "number" ? c.motionX : 0))}px`,
				top: `${stringify((typeof rest.dy === "number" ? rest.dy : 0) + (typeof c.motionY === "number" ? c.motionY : 0))}px`,
				transform: `translate(${translateX}, ${translateY}) rotate(${stringify(rest.rotate ?? 0)}deg)`,
				"transform-origin": `${verticalAnchor === "middle" ? "center" : verticalAnchor === "end" ? "bottom" : "top"} ${textAnchor === "middle" ? "center" : textAnchor === "end" ? "right" : "left"}`,
				"white-space": "pre-wrap",
				"line-height": rest.lineHeight ?? "1em",
				"font-size": typeof rest.fontSize === "number" ? `${rest.fontSize}px` : rest.fontSize,
				color: c.staticFill,
				opacity: c.staticOpacity ?? c.staticFillOpacity
			})}>`);
			if (rest.segments) {
				$$renderer.push(`<!--[0--><!--[-->`);
				const each_array_1 = ensure_array_like(rest.segments);
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let segment = each_array_1[$$index_1];
					$$renderer.push(`<span${attr_class(clsx(segment.class))}>${escape_html(segment.value)}</span>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push(`<!--[-1-->${escape_html(c.textValue)}`);
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { getTextRect as a, getPixelValue as i, Text_canvas as n, toTitleCase as o, Text_svg as r, Text_html as t };

//# sourceMappingURL=Text.html.js.map