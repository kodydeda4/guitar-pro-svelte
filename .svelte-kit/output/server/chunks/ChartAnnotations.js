import { Mt as attr, Nt as clsx, a as bind_props, c as ensure_array_like, f as spread_props, h as stringify, o as derived, r as attributes, t as attr_class, u as props_id } from "./server.js";
import { t as getChartContext } from "./chart.js";
import { i as isScaleBand } from "./scales.svelte.js";
import { C as getLayerContext, T as getGeoContext, i as getComputedStyles, n as createLinearGradient, r as createPattern } from "./key.svelte.js";
import { i as createId } from "./Path.canvas.js";
import { t as extractLayerProps } from "./attributes.js";
import { r as parsePercent } from "./math.js";
import { i as getPixelValue, n as Text_canvas, r as Text_svg, t as Text_html } from "./Text.html.js";
import { t as asAny } from "./types.js";
import { n as Line_canvas, r as Line_svg, t as Line_html } from "./Line.html.js";
import { n as Circle_canvas, r as Circle_svg, t as Circle_html } from "./Circle.html.js";
import { n as Rect_canvas, r as Rect_svg, t as Rect_html } from "./Rect.html.js";
import { n as Link_svg, r as getPointLabelLayout, t as Link_canvas } from "./Link.canvas.js";
import { cls } from "@layerstack/tailwind";
//#region node_modules/layerchart/dist/components/AnnotationLine/AnnotationLine.base.svelte
function AnnotationLine_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Line, Text, x, y, x1: x1Prop, y1: y1Prop, x2: x2Prop, y2: y2Prop, seriesKey, label, labelPlacement = "top-right", labelXOffset = 0, labelYOffset = 0, props } = $$props;
		const ctx = getChartContext();
		const isVertical = derived(() => x != null || x1Prop != null && x2Prop != null && x1Prop === x2Prop);
		/**
		* Each end read against its series' stacked segment, at the category that end sits on.
		*
		* A rule spanning the plot (a `y` with no `x`) has no single category to read against, so it
		* is left where it was asked for.
		*/
		const stacked = derived(() => {
			if (seriesKey == null || !ctx.isStacked) return {
				x1: x1Prop,
				y1: y1Prop,
				x2: x2Prop,
				y2: y2Prop,
				x,
				y
			};
			const at = (value, keyValue) => keyValue == null ? value : ctx.stackedValue(seriesKey, keyValue, value);
			return ctx.valueAxis === "y" ? {
				x1: x1Prop,
				x2: x2Prop,
				x,
				y1: at(y1Prop, x1Prop ?? x),
				y2: at(y2Prop, x2Prop ?? x),
				y: at(y, x)
			} : {
				y1: y1Prop,
				y2: y2Prop,
				y,
				x1: at(x1Prop, y1Prop ?? y),
				x2: at(x2Prop, y2Prop ?? y),
				x: at(x, y)
			};
		});
		const line = derived(() => ({
			x1: stacked().x1 != null ? ctx.xScale(stacked().x1) : stacked().x != null ? ctx.xScale(stacked().x) : ctx.xRange[0],
			y1: stacked().y1 != null ? ctx.yScale(stacked().y1) : stacked().y != null && stacked().x == null ? ctx.yScale(stacked().y) : ctx.yRange[0],
			x2: stacked().x2 != null ? ctx.xScale(stacked().x2) : stacked().x != null ? ctx.xScale(stacked().x) : ctx.xRange[1],
			y2: stacked().y2 != null ? ctx.yScale(stacked().y2) : stacked().y != null ? ctx.yScale(stacked().y) : ctx.yRange[1]
		}));
		const isSloped = derived(() => !isVertical() && line().x1 !== line().x2 && line().y1 !== line().y2);
		const slopeAngle = derived(() => {
			let angle = Math.atan2(line().y2 - line().y1, line().x2 - line().x1) * (180 / Math.PI);
			if (angle > 90) angle -= 180;
			else if (angle < -90) angle += 180;
			return angle;
		});
		const labelProps = derived(() => {
			const isLeft = labelPlacement.includes("left");
			const isRight = labelPlacement.includes("right");
			const isTop = labelPlacement.includes("top");
			const isBottom = labelPlacement.includes("bottom");
			if (isVertical()) return {
				x: line().x1 + (isLeft ? -labelXOffset : labelXOffset),
				y: (isTop ? line().y2 : isBottom ? line().y1 : (line().y1 - line().y2) / 2) + ([
					"top",
					"bottom-left",
					"bottom-right"
				].includes(labelPlacement) ? -labelYOffset : labelYOffset),
				dy: -2,
				textAnchor: isLeft ? "end" : isRight ? "start" : "middle",
				verticalAnchor: labelPlacement === "top" ? "end" : labelPlacement === "bottom" ? "start" : isTop ? "start" : isBottom ? "end" : "middle"
			};
			const _x = isLeft ? line().x1 : isRight ? line().x2 : (line().x1 + line().x2) / 2;
			const _y = isLeft ? line().y1 : isRight ? line().y2 : (line().y1 + line().y2) / 2;
			const textAnchor = labelPlacement === "left" ? "end" : labelPlacement === "right" ? "start" : isLeft ? "start" : isRight ? "end" : "middle";
			const verticalAnchor = isTop ? "end" : isBottom ? "start" : "middle";
			if (isSloped()) {
				const aSign = [
					"left",
					"top-right",
					"bottom-right"
				].includes(labelPlacement) ? -1 : 1;
				const pSign = isTop ? 1 : -1;
				const alongLine = aSign * labelXOffset;
				const perpAbove = pSign * labelYOffset + 2;
				const theta = slopeAngle() * Math.PI / 180;
				const cosT = Math.cos(theta);
				const sinT = Math.sin(theta);
				return {
					x: _x,
					y: _y,
					rotate: slopeAngle(),
					dx: alongLine * cosT + perpAbove * sinT,
					dy: alongLine * sinT - perpAbove * cosT,
					textAnchor,
					verticalAnchor
				};
			}
			return {
				x: _x + ([
					"left",
					"top-right",
					"bottom-right"
				].includes(labelPlacement) ? -labelXOffset : labelXOffset),
				y: _y + (isTop ? -labelYOffset : labelYOffset),
				dy: -2,
				textAnchor,
				verticalAnchor
			};
		});
		if (Line) {
			$$renderer.push("<!--[-->");
			Line($$renderer, spread_props([
				{
					x1: line().x1,
					y1: line().y1,
					x2: line().x2,
					y2: line().y2
				},
				props?.line,
				{ class: cls("lc-annotation-line", props?.line?.class) }
			]));
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		$$renderer.push(` `);
		if (label) {
			$$renderer.push("<!--[0-->");
			if (Text) {
				$$renderer.push("<!--[-->");
				Text($$renderer, spread_props([
					{ value: label },
					labelProps(),
					props?.label,
					{ class: cls("lc-annotation-line-label", props?.label?.class) }
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationLine/AnnotationLine.svg.svelte
function AnnotationLine_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationLine_base($$renderer, spread_props([{
		Line: Line_svg,
		Text: Text_svg
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationLine/AnnotationLine.canvas.svelte
function AnnotationLine_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationLine_base($$renderer, spread_props([{
		Line: Line_canvas,
		Text: Text_canvas
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationLine/AnnotationLine.html.svelte
function AnnotationLine_html($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationLine_base($$renderer, spread_props([{
		Line: Line_html,
		Text: Text_html
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationLine/AnnotationLine.svelte
function AnnotationLine($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			AnnotationLine_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			AnnotationLine_canvas($$renderer, spread_props([props]));
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			AnnotationLine_html($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationPoint/AnnotationPoint.base.svelte
function AnnotationPoint_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Circle, Link, Text, x, y, r = 4, label, labelPlacement = "center", labelXOffset = 0, labelYOffset = 0, labelX, labelY, seriesKey, fontSize = 12, labelGap = 2, link, details, props } = $$props;
		const ctx = getChartContext();
		const geo = getGeoContext();
		const stackedX = derived(() => ctx.valueAxis === "x" ? ctx.stackedValue(seriesKey, y, x) : x);
		const stackedY = derived(() => ctx.valueAxis === "y" ? ctx.stackedValue(seriesKey, x, y) : y);
		const point = derived(() => {
			if (geo.projection && typeof x === "number" && typeof y === "number") {
				const [px, py] = geo.projection([x, y]) ?? [0, 0];
				return {
					x: px,
					y: py
				};
			}
			return {
				x: stackedX() ? ctx.xScale(stackedX()) + (isScaleBand(ctx.xScale) ? ctx.xScale.bandwidth() / 2 : 0) : 0,
				y: stackedY() ? ctx.yScale(stackedY()) + (isScaleBand(ctx.yScale) ? ctx.yScale.bandwidth() / 2 : 0) : ctx.height
			};
		});
		const labelLayout = derived(() => getPointLabelLayout({
			x: point().x,
			y: point().y,
			r,
			labelPlacement,
			labelX,
			labelY,
			labelXOffset,
			labelYOffset,
			fontSize: getPixelValue(fontSize),
			labelGap,
			link: !!link,
			verticalAnchor: props?.label?.verticalAnchor
		}));
		const labelProps = derived(() => ({
			...labelLayout().text,
			fontSize
		}));
		const linkEndpoints = derived(() => {
			if (!link) return null;
			const a = labelLayout().anchor;
			if (labelPlacement === "smart") {
				const dx = a.x - point().x;
				const dy = a.y - point().y;
				const dist = Math.hypot(dx, dy);
				if (dist <= r) return null;
				return {
					source: {
						x: point().x + r * dx / dist,
						y: point().y + r * dy / dist
					},
					target: {
						x: a.x,
						y: a.y
					}
				};
			}
			const { x: dirX, y: dirY } = labelLayout().direction;
			if (dirX === 0 && dirY === 0) return null;
			const mag = Math.hypot(dirX, dirY);
			return {
				source: {
					x: point().x + r * dirX / mag,
					y: point().y + r * dirY / mag
				},
				target: {
					x: a.x,
					y: a.y
				}
			};
		});
		const linkProps = derived(() => typeof link === "object" ? link : {});
		function onPointerMove(e) {
			if (details) {
				e.stopPropagation();
				ctx.tooltip.show(e, { annotation: {
					label,
					details
				} });
			}
		}
		function onPointerLeave(e) {
			if (details) {
				e.stopPropagation();
				ctx.tooltip.hide();
			}
		}
		if (Circle) {
			$$renderer.push("<!--[-->");
			Circle($$renderer, spread_props([
				{
					cx: point().x,
					cy: point().y,
					r,
					onpointermove: onPointerMove,
					onmousemove: onPointerMove,
					ontouchmove: onPointerMove,
					onpointerleave: onPointerLeave,
					onmouseleave: onPointerLeave,
					ontouchend: onPointerLeave
				},
				props?.circle,
				{ class: cls("lc-annotation-point", link && "lc-annotation-point-ring", props?.circle?.class) }
			]));
			$$renderer.push("<!--]-->");
		} else {
			$$renderer.push("<!--[!-->");
			$$renderer.push("<!--]-->");
		}
		$$renderer.push(` `);
		if (linkEndpoints() && Link) {
			$$renderer.push("<!--[0-->");
			if (Link) {
				$$renderer.push("<!--[-->");
				Link($$renderer, spread_props([
					{
						x1: linkEndpoints().source.x,
						y1: linkEndpoints().source.y,
						x2: linkEndpoints().target.x,
						y2: linkEndpoints().target.y,
						type: "straight"
					},
					linkProps(),
					{ class: cls("lc-annotation-point-link", typeof linkProps().class === "string" ? linkProps().class : void 0) }
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (label) {
			$$renderer.push("<!--[0-->");
			if (Text) {
				$$renderer.push("<!--[-->");
				Text($$renderer, spread_props([
					{ value: label },
					labelProps(),
					props?.label,
					{ class: cls("lc-annotation-point-label", props?.label?.class) }
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationPoint/AnnotationPoint.svg.svelte
function AnnotationPoint_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationPoint_base($$renderer, spread_props([{
		Circle: Circle_svg,
		Link: Link_svg,
		Text: Text_svg
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationPoint/AnnotationPoint.canvas.svelte
function AnnotationPoint_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationPoint_base($$renderer, spread_props([{
		Circle: Circle_canvas,
		Link: Link_canvas,
		Text: Text_canvas
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationPoint/AnnotationPoint.html.svelte
function AnnotationPoint_html($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationPoint_base($$renderer, spread_props([{
		Circle: Circle_html,
		Text: Text_html
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationPoint/AnnotationPoint.svelte
function AnnotationPoint($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			AnnotationPoint_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			AnnotationPoint_canvas($$renderer, spread_props([props]));
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			AnnotationPoint_html($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationRange/AnnotationRange.base.svelte
function AnnotationRange_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { LinearGradient, Pattern, Rect, Text, x, y, fill, class: className, gradient, pattern, label, labelPlacement = "center", labelXOffset = 0, labelYOffset = 0, props } = $$props;
		const ctx = getChartContext();
		const rect = derived(() => {
			const x0FromScale = x?.[0] != null;
			const x1FromScale = x?.[1] != null;
			const x0 = x0FromScale ? ctx.xScale(x[0]) : ctx.xRange[0];
			const x1 = x1FromScale ? ctx.xScale(x[1]) : ctx.xRange[1];
			const y0 = y?.[0] != null ? ctx.yScale(y[0]) : ctx.yRange[0];
			const y1 = y?.[1] != null ? ctx.yScale(y[1]) : ctx.yRange[1];
			const bandPadding = isScaleBand(ctx.xScale) ? ctx.xScale.padding() * ctx.xScale.step() / 2 : 0;
			const bandStep = isScaleBand(ctx.xScale) ? ctx.xScale.step() : 0;
			const leftFromScale = x0 <= x1 ? x0FromScale : x1FromScale;
			const rightFromScale = x0 <= x1 ? x1FromScale : x0FromScale;
			const left = Math.min(x0, x1) - (leftFromScale ? bandPadding : 0);
			const right = Math.max(x0, x1) + (rightFromScale ? bandStep - bandPadding : 0);
			return {
				x: left,
				y: Math.min(y0, y1),
				width: right - left,
				height: Math.abs(y1 - y0)
			};
		});
		const labelProps = derived(() => ({
			x: ((labelPlacement.includes("left") ? rect().x : labelPlacement.includes("right") ? (rect().x ?? 0) + rect().width : (rect().x ?? 0) + rect().width / 2) ?? 0) + (labelPlacement.includes("right") ? -labelXOffset : labelXOffset),
			y: ((labelPlacement.includes("top") ? rect().y : labelPlacement.includes("bottom") ? (rect().y ?? 0) + rect().height : (rect().y ?? 0) + rect().height / 2) ?? 0) + (labelPlacement.includes("bottom") ? -labelYOffset : labelYOffset),
			dy: -2,
			textAnchor: labelPlacement.includes("left") ? "start" : labelPlacement.includes("right") ? "end" : "middle",
			verticalAnchor: labelPlacement.includes("top") ? "start" : labelPlacement.includes("bottom") ? "end" : "middle"
		}));
		if (fill || className) {
			$$renderer.push("<!--[0-->");
			if (Rect) {
				$$renderer.push("<!--[-->");
				Rect($$renderer, spread_props([
					rect(),
					props?.rect,
					{
						fill,
						class: cls("lc-annotation-range", props?.rect?.class, className)
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (gradient) {
			$$renderer.push("<!--[0-->");
			{
				function children($$renderer, { gradient }) {
					if (Rect) {
						$$renderer.push("<!--[-->");
						Rect($$renderer, spread_props([
							rect(),
							props?.rect,
							{ fill: gradient }
						]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				}
				if (LinearGradient) {
					$$renderer.push("<!--[-->");
					LinearGradient($$renderer, spread_props([gradient, {
						children,
						$$slots: { default: true }
					}]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (pattern) {
			$$renderer.push("<!--[0-->");
			{
				function children($$renderer, { pattern }) {
					if (Rect) {
						$$renderer.push("<!--[-->");
						Rect($$renderer, spread_props([
							rect(),
							props?.rect,
							{ fill: pattern }
						]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				}
				if (Pattern) {
					$$renderer.push("<!--[-->");
					Pattern($$renderer, spread_props([pattern, {
						children,
						$$slots: { default: true }
					}]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (label) {
			$$renderer.push("<!--[0-->");
			if (Text) {
				$$renderer.push("<!--[-->");
				Text($$renderer, spread_props([
					{ value: label },
					labelProps(),
					props?.label,
					{ class: cls("lc-annotation-range-label", props?.label?.class) }
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/LinearGradient/LinearGradient.svg.svelte
function LinearGradient_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("linearGradient-", uid), stops = ["var(--tw-gradient-from)", "var(--tw-gradient-to)"], vertical = false, x1 = "0%", y1 = "0%", x2 = vertical ? "0%" : "100%", y2 = vertical ? "100%" : "0%", rotate, units = "objectBoundingBox", ref: refProp = void 0, class: className, stopsContent, children, $$slots, $$events, ...rest } = $$props;
		$$renderer.push(`<defs><linearGradient${attributes({
			id,
			x1,
			y1,
			x2,
			y2,
			gradientTransform: rotate ? `rotate(${rotate})` : "",
			gradientUnits: units,
			...extractLayerProps(rest, "lc-linear-gradient")
		}, void 0, void 0, void 0, 3)}>`);
		if (stopsContent) {
			$$renderer.push("<!--[0-->");
			stopsContent?.($$renderer);
			$$renderer.push(`<!---->`);
		} else if (stops) {
			$$renderer.push(`<!--[1--><!--[-->`);
			const each_array = ensure_array_like(stops);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let stop = each_array[i];
				if (Array.isArray(stop)) $$renderer.push(`<!--[0--><stop${attr("offset", stop[0])}${attr("stop-color", stop[1])}${attr_class(clsx(cls("lc-linear-gradient-stop", className)))}></stop>`);
				else $$renderer.push(`<!--[-1--><stop${attr("offset", `${stringify(i * (100 / (stops.length - 1)))}%`)}${attr("stop-color", stop)}${attr_class(clsx(cls("lc-linear-gradient-stop", className)))}></stop>`);
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></linearGradient></defs>`);
		children?.($$renderer, {
			id,
			gradient: `url(#${id})`
		});
		$$renderer.push(`<!---->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Pattern/Pattern.shared.svelte.js
function buildPatternShapes(linesProp, circlesProp, size, width, height, rectsProp) {
	const shapes = [];
	if (linesProp) {
		const lineDefs = Array.isArray(linesProp) ? linesProp : linesProp === true ? [{}] : [linesProp];
		for (const line of lineDefs) {
			const stroke = line.color ?? "var(--color-surface-content, currentColor)";
			const strokeWidth = line.width ?? 1;
			const opacity = line.opacity ?? 1;
			let rotate = Math.round(line.rotate ?? 0) % 360;
			if (rotate > 180) rotate = rotate - 360;
			else if (rotate > 90) rotate = rotate - 180;
			else if (rotate < -180) rotate = rotate + 360;
			else if (rotate < -90) rotate = rotate + 180;
			let path = "";
			if (rotate === 0) path = `
        M 0 0 L ${width} 0
        M 0 ${height} L ${width} ${height}
    `;
			else if (rotate === 90) path = `
        M 0 0 L 0 ${height}
        M ${width} 0 L ${width} ${height}
    `;
			else if (rotate > 0) path = `
          M 0 ${-height} L ${width * 2} ${height}
          M ${-width} ${-height} L ${width} ${height}
          M ${-width} 0 L ${width} ${height * 2}
      `;
			else path = `
          M ${-width} ${height} L ${width} ${-height}
          M ${-width} ${height * 2} L ${width * 2} ${-height}
          M 0 ${height * 2} L ${width * 2} 0
      `;
			shapes.push({
				type: "line",
				path,
				stroke,
				strokeWidth,
				opacity
			});
		}
	}
	if (circlesProp) {
		const circleDefs = Array.isArray(circlesProp) ? circlesProp : circlesProp === true ? [{}] : [circlesProp];
		for (const circle of circleDefs) {
			const fill = circle.color ?? "var(--color-surface-content, currentColor)";
			const opacity = circle.opacity ?? 1;
			const r = circle.radius ?? 1;
			if (circle.stagger) shapes.push({
				type: "circle",
				cx: size / 4,
				cy: size / 4,
				r,
				fill,
				opacity
			}, {
				type: "circle",
				cx: size * 3 / 4,
				cy: size * 3 / 4,
				r,
				fill,
				opacity
			});
			else shapes.push({
				type: "circle",
				cx: size / 2,
				cy: size / 2,
				r,
				fill,
				opacity
			});
		}
	}
	if (rectsProp) {
		const rectDefs = Array.isArray(rectsProp) ? rectsProp : rectsProp === true ? [{}] : [rectsProp];
		for (const rect of rectDefs) {
			const inset = rect.inset ?? 0;
			const fill = rect.color ?? "var(--color-surface-content, currentColor)";
			const opacity = rect.opacity ?? 1;
			shapes.push({
				type: "rect",
				x: inset,
				y: inset,
				width: Math.max(0, width - 2 * inset),
				height: Math.max(0, height - 2 * inset),
				rx: rect.rx,
				ry: rect.ry,
				fill,
				opacity
			});
		}
	}
	return shapes;
}
//#endregion
//#region node_modules/layerchart/dist/components/Pattern/Pattern.svg.svelte
function Pattern_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("pattern-", uid), size = 4, width = size, height = size, lines: linesProp, circles: circlesProp, rects: rectsProp, background, patternContent, children, $$slots, $$events, ...rest } = $$props;
		const shapes = derived(() => buildPatternShapes(linesProp, circlesProp, size, width, height, rectsProp));
		$$renderer.push(`<defs><pattern${attributes({
			id,
			width,
			height,
			patternUnits: "userSpaceOnUse",
			...extractLayerProps(rest, "lc-pattern")
		}, void 0, void 0, void 0, 3)}>`);
		if (patternContent) {
			$$renderer.push("<!--[0-->");
			patternContent?.($$renderer);
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			if (background) $$renderer.push(`<!--[0--><rect${attr("width", width)}${attr("height", height)}${attr("fill", background)}></rect>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--><!--[-->`);
			const each_array = ensure_array_like(shapes().filter((s) => s.type === "line"));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let line = each_array[$$index];
				$$renderer.push(`<path${attr("d", line.path)}${attr("stroke", line.stroke)}${attr("stroke-width", line.strokeWidth)} fill="none"${attr("opacity", line.opacity)}></path>`);
			}
			$$renderer.push(`<!--]--><!--[-->`);
			const each_array_1 = ensure_array_like(shapes().filter((s) => s.type === "circle"));
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let circle = each_array_1[$$index_1];
				$$renderer.push(`<circle${attr("cx", circle.cx)}${attr("cy", circle.cy)}${attr("r", circle.r)}${attr("fill", circle.fill)}${attr("opacity", circle.opacity)}></circle>`);
			}
			$$renderer.push(`<!--]--><!--[-->`);
			const each_array_2 = ensure_array_like(shapes().filter((s) => s.type === "rect"));
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let rect = each_array_2[$$index_2];
				$$renderer.push(`<rect${attr("x", rect.x)}${attr("y", rect.y)}${attr("width", rect.width)}${attr("height", rect.height)}${attr("rx", rect.rx)}${attr("ry", rect.ry)}${attr("fill", rect.fill)}${attr("opacity", rect.opacity)}></rect>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></pattern></defs>`);
		children?.($$renderer, {
			id,
			pattern: `url(#${id})`
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationRange/AnnotationRange.svg.svelte
function AnnotationRange_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationRange_base($$renderer, spread_props([{
		LinearGradient: LinearGradient_svg,
		Pattern: Pattern_svg,
		Rect: Rect_svg,
		Text: Text_svg
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/LinearGradient/LinearGradient.canvas.svelte
function LinearGradient_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("linearGradient-", uid), stops = ["var(--tw-gradient-from)", "var(--tw-gradient-to)"], vertical = false, x1 = "0%", y1 = "0%", x2 = vertical ? "0%" : "100%", y2 = vertical ? "100%" : "0%", class: className, children, $$slots, $$events, ...rest } = $$props;
		const ctx = getChartContext();
		let canvasGradient = void 0;
		function render(_ctx) {
			const _stops = stops.map((stop, i) => {
				if (Array.isArray(stop)) {
					const { fill } = getComputedStyles(_ctx.canvas, {
						styles: { fill: stop[1] },
						classes: className
					});
					return {
						offset: parsePercent(stop[0]),
						color: fill
					};
				} else {
					const { fill } = getComputedStyles(_ctx.canvas, {
						styles: { fill: stop },
						classes: className
					});
					return {
						offset: i / (stops.length - 1),
						color: fill
					};
				}
			});
			canvasGradient = createLinearGradient(_ctx, ctx.padding.left, ctx.padding.top, vertical ? ctx.padding.left : ctx.width - ctx.padding.right, vertical ? ctx.height + ctx.padding.bottom : ctx.padding.top, _stops);
		}
		ctx.registerComponent({
			name: "Gradient",
			kind: "group",
			canvasRender: {
				render,
				deps: () => [
					x1,
					y1,
					x2,
					y2,
					stops,
					className
				]
			}
		});
		children?.($$renderer, {
			id,
			gradient: asAny(canvasGradient)
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Pattern/Pattern.canvas.svelte
function Pattern_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		const chartCtx = getChartContext();
		let { id = createId("pattern-", uid), size = 4, width = size, height = size, lines: linesProp, circles: circlesProp, rects: rectsProp, background, children } = $$props;
		const shapes = derived(() => buildPatternShapes(linesProp, circlesProp, size, width, height, rectsProp));
		let canvasPattern = null;
		function render(_ctx) {
			canvasPattern = createPattern(_ctx, width, height, shapes(), background);
		}
		chartCtx.registerComponent({
			name: "Pattern",
			kind: "group",
			canvasRender: {
				render,
				deps: () => [
					width,
					height,
					shapes(),
					background
				]
			}
		});
		children?.($$renderer, {
			id,
			pattern: asAny(canvasPattern)
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationRange/AnnotationRange.canvas.svelte
function AnnotationRange_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationRange_base($$renderer, spread_props([{
		LinearGradient: LinearGradient_canvas,
		Pattern: Pattern_canvas,
		Rect: Rect_canvas,
		Text: Text_canvas
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/LinearGradient/LinearGradient.html.svelte
function LinearGradient_html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("linearGradient-", uid), stops = ["var(--tw-gradient-from)", "var(--tw-gradient-to)"], vertical = false, rotate, children } = $$props;
		function createCSSGradient() {
			if (!stops?.length) return "";
			let direction;
			if (rotate !== void 0) direction = `${(vertical ? 180 : 90) + rotate}deg`;
			else direction = vertical ? "to bottom" : "to right";
			const cssStops = stops.map((stop, i) => {
				if (Array.isArray(stop)) return `${stop[1]} ${stop[0]}`;
				else return `${stop} ${i * (100 / (stops.length - 1))}%`;
			}).join(", ");
			return `linear-gradient(${direction}, ${cssStops})`;
		}
		children?.($$renderer, {
			id,
			gradient: createCSSGradient()
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Pattern/Pattern.html.svelte
function Pattern_html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("pattern-", uid), size = 4, width = size, height = size, lines: linesProp, circles: circlesProp, background, children } = $$props;
		function withOpacity(color, opacity) {
			return opacity === 1 ? color : `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
		}
		function createCSSPattern() {
			const layers = [];
			if (linesProp) {
				const lineDefs = Array.isArray(linesProp) ? linesProp : linesProp === true ? [{}] : [linesProp];
				for (const line of lineDefs) {
					const color = withOpacity(line.color ?? "var(--color-surface-content, currentColor)", line.opacity ?? 1);
					const sw = line.width ?? 1;
					let rotate = Math.round(line.rotate ?? 0) % 360;
					if (rotate > 180) rotate = rotate - 360;
					else if (rotate > 90) rotate = rotate - 180;
					else if (rotate < -180) rotate = rotate + 360;
					else if (rotate < -90) rotate = rotate + 180;
					let angle;
					let period;
					if (rotate === 0) {
						angle = 0;
						period = height;
					} else if (rotate === 90) {
						angle = 90;
						period = width;
					} else if (rotate > 0) {
						angle = 45;
						period = width * height / Math.sqrt(width * width + height * height);
					} else {
						angle = 135;
						period = width * height / Math.sqrt(width * width + height * height);
					}
					layers.push(`repeating-linear-gradient(${angle}deg, ${color} 0 ${sw}px, transparent ${sw}px ${period}px)`);
				}
			}
			if (circlesProp) {
				const circleDefs = Array.isArray(circlesProp) ? circlesProp : circlesProp === true ? [{}] : [circlesProp];
				for (const circle of circleDefs) {
					const color = withOpacity(circle.color ?? "var(--color-surface-content, currentColor)", circle.opacity ?? 1);
					const r = circle.radius ?? 1;
					if (circle.stagger) layers.push(`radial-gradient(circle at 25% 25%, ${color} ${r}px, transparent ${r}px) 0 0 / ${size}px ${size}px`, `radial-gradient(circle at 75% 75%, ${color} ${r}px, transparent ${r}px) 0 0 / ${size}px ${size}px`);
					else layers.push(`radial-gradient(circle at center, ${color} ${r}px, transparent ${r}px) 0 0 / ${size}px ${size}px`);
				}
			}
			const isImage = background != null && /gradient\(|url\(/i.test(background);
			if (isImage) layers.push(`${background} 0 0 / ${width}px ${height}px`);
			if (layers.length === 0) return background ?? "transparent";
			return !isImage && background ? `${layers.join(", ")}, ${background}` : layers.join(", ");
		}
		children?.($$renderer, {
			id,
			pattern: createCSSPattern()
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationRange/AnnotationRange.html.svelte
function AnnotationRange_html($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	AnnotationRange_base($$renderer, spread_props([{
		LinearGradient: LinearGradient_html,
		Pattern: Pattern_html,
		Rect: Rect_html,
		Text: Text_html
	}, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationRange/AnnotationRange.svelte
function AnnotationRange($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { $$slots, $$events, ...props } = $$props;
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			AnnotationRange_svg($$renderer, spread_props([props]));
		} else if (layerCtx === "canvas") {
			$$renderer.push("<!--[1-->");
			AnnotationRange_canvas($$renderer, spread_props([props]));
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			AnnotationRange_html($$renderer, spread_props([props]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/charts/ChartAnnotations.svelte
function ChartAnnotations($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { annotations, layer } = $$props;
		const ctx = getChartContext();
		let visibleAnnotations = derived(() => annotations.filter((a) => (a.layer === layer || a.layer == null && layer === "above") && (ctx.series.highlightKey == null || a.seriesKey == null || a.seriesKey === ctx.series.highlightKey) && ctx.series.visibleSeries.some((s) => a.seriesKey == null || a.seriesKey === s.key)));
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(visibleAnnotations());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let annotation = each_array[$$index];
			if (annotation.type === "point") {
				$$renderer.push("<!--[0-->");
				AnnotationPoint($$renderer, spread_props([annotation]));
			} else if (annotation.type === "line") {
				$$renderer.push("<!--[1-->");
				AnnotationLine($$renderer, spread_props([annotation]));
			} else if (annotation.type === "range") {
				$$renderer.push("<!--[2-->");
				AnnotationRange($$renderer, spread_props([annotation]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { ChartAnnotations as default };

//# sourceMappingURL=ChartAnnotations.js.map