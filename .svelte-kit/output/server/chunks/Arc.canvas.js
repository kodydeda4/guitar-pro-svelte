import { a as bind_props, f as spread_props, h as stringify, o as derived } from "./server.js";
import { r as createMotion } from "./motion.svelte.js";
import { t as getChartContext } from "./chart.js";
import { n as Path_svg, t as Path_canvas } from "./Path.canvas.js";
import { t as extractLayerProps } from "./attributes.js";
import { a as radiansToDegrees, n as degreesToRadians } from "./math.js";
import { scaleLinear } from "d3-scale";
import { max } from "d3-array";
import { cls } from "@layerstack/tailwind";
import { arc } from "d3-shape";
//#region node_modules/layerchart/dist/utils/arcText.svelte.js
function extractOutsideArc(arcPath) {
	const matches = arcPath.match(/(^.+?)(L|Z)/);
	if (!matches || !matches[1]) return arcPath;
	return matches[1];
}
function normalizeAngle(angle) {
	return (angle % 360 + 360) % 360;
}
/**
* Calculates and generates a path in the middle/medial line of an arc.
*/
function getArcPathMiddle(props) {
	const centerRadius = derived(() => (props.innerRadius() + props.outerRadius()) / 2);
	const cornerAngleOffset = derived(() => {
		if (props.cornerRadius() <= 0 || centerRadius() <= 0) return 0;
		return Math.min(props.cornerRadius(), centerRadius()) * .5 / centerRadius();
	});
	const effectiveStartAngle = derived(() => {
		if (props.invertCorner()) return props.startAngle() - cornerAngleOffset();
		return props.startAngle() + cornerAngleOffset();
	});
	const effectiveEndAngle = derived(() => {
		if (props.invertCorner()) return props.endAngle() + cornerAngleOffset();
		return props.endAngle() - cornerAngleOffset();
	});
	const path = derived(() => extractOutsideArc(arc().outerRadius(centerRadius()).innerRadius(centerRadius() - .5).startAngle(effectiveStartAngle()).endAngle(effectiveEndAngle())() ?? ""));
	return { get current() {
		return path();
	} };
}
function getArcPathInner(props) {
	const cornerAngleOffset = derived(() => {
		if (props.cornerRadius() <= 0 || props.innerRadius() <= 0) return 0;
		if (props.cornerRadius() >= props.innerRadius()) return Math.PI / 4;
		return props.cornerRadius() * .5 / props.innerRadius();
	});
	const effectiveStartAngle = derived(() => {
		if (props.invertCorner()) return props.startAngle() - cornerAngleOffset();
		return props.startAngle() + cornerAngleOffset();
	});
	const effectiveEndAngle = derived(() => {
		if (props.invertCorner()) return props.endAngle() + cornerAngleOffset();
		return props.endAngle() - cornerAngleOffset();
	});
	const path = derived(() => extractOutsideArc(arc().innerRadius(props.innerRadius()).outerRadius(props.innerRadius() + .5).startAngle(effectiveStartAngle()).endAngle(effectiveEndAngle())() ?? ""));
	return { get current() {
		return path();
	} };
}
function getArcPathOuter(props) {
	const cornerAngleOffset = derived(() => {
		if (props.cornerRadius() <= 0 || props.outerRadius() <= 0) return 0;
		return props.cornerRadius() * .5 / props.outerRadius();
	});
	const effectiveStartAngle = derived(() => {
		if (props.invertCorner()) return props.startAngle() - cornerAngleOffset();
		return props.startAngle() + cornerAngleOffset();
	});
	const effectiveEndAngle = derived(() => {
		if (props.invertCorner()) return props.endAngle() + cornerAngleOffset();
		return props.endAngle() - cornerAngleOffset();
	});
	const path = derived(() => extractOutsideArc(arc().innerRadius(props.outerRadius() - .5).outerRadius(props.outerRadius()).startAngle(effectiveStartAngle()).endAngle(effectiveEndAngle())() ?? ""));
	return { get current() {
		return path();
	} };
}
function pointOnCircle(radius, angle) {
	const adjustedAngle = angle - Math.PI / 2;
	return [radius * Math.cos(adjustedAngle), radius * Math.sin(adjustedAngle)];
}
function createArcTextProps(props, opts = {}, position) {
	const effectiveStartAngleRadians = derived(() => {
		const start = props.startAngle();
		const end = props.endAngle();
		const offset = opts.startOffset;
		if (offset) try {
			const percentage = parseFloat(offset.slice(0, -1)) / 100;
			if (!isNaN(percentage) && percentage >= 0 && percentage <= 1) return start + (end - start) * percentage;
			else console.warn("Invalid percentage for startOffset:", offset);
		} catch (e) {
			console.warn("Could not parse startOffset percentage:", offset, e);
		}
		return start;
	});
	const effectiveStartDegrees = derived(() => radiansToDegrees(effectiveStartAngleRadians()));
	const normalizedStartDegrees = derived(() => normalizeAngle(effectiveStartDegrees()));
	const startDegrees = derived(() => radiansToDegrees(props.startAngle()));
	const endDegrees = derived(() => radiansToDegrees(props.endAngle()));
	const isClockwise = derived(() => startDegrees() < endDegrees());
	const isTopCw = derived(() => isClockwise() && (normalizedStartDegrees() >= 270 || normalizedStartDegrees() <= 90));
	const isTopCcw = derived(() => !isClockwise() && (normalizedStartDegrees() > 270 || normalizedStartDegrees() <= 90));
	const isBottomCw = derived(() => isClockwise() && normalizedStartDegrees() < 270 && normalizedStartDegrees() >= 90);
	const isBottomCcw = derived(() => !isClockwise() && normalizedStartDegrees() <= 270 && normalizedStartDegrees() > 90);
	const reverseText = derived(() => isTopCcw() || isBottomCw());
	const pathGenProps = {
		...props,
		startAngle: () => reverseText() ? props.endAngle() : props.startAngle(),
		endAngle: () => reverseText() ? props.startAngle() : props.endAngle(),
		invertCorner: () => isBottomCw() || isBottomCcw()
	};
	const innerPath = getArcPathInner(pathGenProps);
	const middlePath = getArcPathMiddle(pathGenProps);
	const outerPath = getArcPathOuter(pathGenProps);
	const innerDominantBaseline = derived(() => {
		if (isBottomCw() || isBottomCcw()) return "auto";
		if (isTopCw() || isTopCcw()) return "hanging";
		return "auto";
	});
	const outerDominantBaseline = derived(() => {
		if (isBottomCw() || isBottomCcw()) return "hanging";
	});
	const sharedProps = derived(() => {
		if (opts.startOffset != null) return {
			startOffset: opts.startOffset,
			textAnchor: "start"
		};
		return {
			startOffset: "50%",
			textAnchor: "middle"
		};
	});
	const radialPositionProps = derived(() => {
		if (position !== "outer-radial") return {};
		const midAngle = (props.startAngle() + props.endAngle()) / 2;
		const basePadding = opts.radialOffset ?? opts.outerPadding ?? 23;
		const midAngleDegrees = normalizeAngle(radiansToDegrees(midAngle));
		let textAnchor = "middle";
		let effectivePadding = basePadding;
		const isBottomZone = midAngleDegrees > 45 && midAngleDegrees < 135;
		const isTopZone = midAngleDegrees > 225 && midAngleDegrees < 315;
		const isRightZone = midAngleDegrees <= 45 || midAngleDegrees >= 315;
		const isLeftZone = midAngleDegrees >= 135 && midAngleDegrees <= 225;
		const [x, y] = pointOnCircle(props.outerRadius() + effectivePadding, midAngle);
		if (isRightZone) {
			textAnchor = "start";
			if (midAngleDegrees > 350 || midAngleDegrees < 10) textAnchor = "start";
		} else if (isLeftZone) {
			textAnchor = "end";
			if (midAngleDegrees > 170 && midAngleDegrees < 190) textAnchor = "end";
		} else if (isBottomZone) textAnchor = "middle";
		else if (isTopZone) textAnchor = "middle";
		return {
			x,
			y,
			textAnchor,
			dominantBaseline: "middle"
		};
	});
	const current = derived(() => {
		if (position === "inner") return {
			path: innerPath.current,
			...sharedProps(),
			dominantBaseline: innerDominantBaseline()
		};
		else if (position === "outer") return {
			path: outerPath.current,
			...sharedProps(),
			dominantBaseline: outerDominantBaseline()
		};
		else if (position === "middle") return {
			path: middlePath.current,
			...sharedProps(),
			dominantBaseline: "middle"
		};
		else if (position === "centroid") {
			const centroid = props.centroid();
			return {
				x: centroid[0],
				y: centroid[1],
				textAnchor: "middle",
				verticalAnchor: "middle"
			};
		} else return radialPositionProps();
	});
	return { get current() {
		return current();
	} };
}
//#endregion
//#region node_modules/layerchart/dist/components/Arc/Arc.shared.svelte.js
function getOuterRadius(outerRadius, chartRadius) {
	if (!outerRadius) return chartRadius;
	if (outerRadius > 1) return outerRadius;
	if (outerRadius > 0) return chartRadius * outerRadius;
	if (outerRadius < 0) return chartRadius + outerRadius;
	return outerRadius;
}
/**
* Reactive state shared by every per-layer Arc variant. Derives the d3-arc
* generators (`arc`, `trackArc`), resolved radii/angles, and the centroid
* used for snippet props.
*/
var ArcState = class {
	#getProps = () => ({});
	/**
	* Memoized props — the component's props closure allocates a fresh object
	* (it spreads `rest`), so calling it once per derived meant one allocation
	* per derived per update. Read it once here instead.
	*/
	#props = derived(() => this.#getProps());
	ctx = getChartContext();
	trackRef;
	#motionEndAngle;
	constructor(getProps) {
		this.#getProps = getProps;
		const initial = getProps();
		this.#motionEndAngle = createMotion(initial.initialValue ?? 0, () => this.#props().value ?? 0, initial.motion);
	}
	get motionEndAngleValue() {
		return this.#motionEndAngle.current;
	}
	#range = derived(() => this.#props().range ?? [0, 360]);
	get range() {
		return this.#range();
	}
	set range($$value) {
		return this.#range($$value);
	}
	#domain = derived(() => this.#props().domain ?? [0, 100]);
	get domain() {
		return this.#domain();
	}
	set domain($$value) {
		return this.#domain($$value);
	}
	#endAngle = derived(() => {
		return this.#props().endAngle ?? degreesToRadians(this.ctx.config.xRange ? max(this.ctx.config.xRange) : max(this.range));
	});
	get endAngle() {
		return this.#endAngle();
	}
	set endAngle($$value) {
		return this.#endAngle($$value);
	}
	#scale = derived(() => scaleLinear().domain(this.domain).range(this.range));
	get scale() {
		return this.#scale();
	}
	set scale($$value) {
		return this.#scale($$value);
	}
	#chartRadius = derived(() => (Math.min(this.ctx.width, this.ctx.height) ?? 0) / 2);
	get chartRadius() {
		return this.#chartRadius();
	}
	set chartRadius($$value) {
		return this.#chartRadius($$value);
	}
	#outerRadius = derived(() => getOuterRadius(this.#props().outerRadius, this.chartRadius));
	get outerRadius() {
		return this.#outerRadius();
	}
	set outerRadius($$value) {
		return this.#outerRadius($$value);
	}
	#trackOuterRadius = derived(() => {
		const trackOuterRadiusProp = this.#props().trackOuterRadius;
		return trackOuterRadiusProp ? getOuterRadius(trackOuterRadiusProp, this.chartRadius) : this.outerRadius;
	});
	get trackOuterRadius() {
		return this.#trackOuterRadius();
	}
	set trackOuterRadius($$value) {
		return this.#trackOuterRadius($$value);
	}
	#getInnerRadius(innerRadius, outerRadius) {
		if (innerRadius == null) return Math.min(...this.ctx.yRange);
		if (innerRadius > 1) return innerRadius;
		if (innerRadius > 0) return outerRadius * innerRadius;
		if (innerRadius < 0) return outerRadius + innerRadius;
		return innerRadius;
	}
	#innerRadius = derived(() => this.#getInnerRadius(this.#props().innerRadius, this.outerRadius));
	get innerRadius() {
		return this.#innerRadius();
	}
	set innerRadius($$value) {
		return this.#innerRadius($$value);
	}
	#trackInnerRadius = derived(() => {
		const trackInnerRadiusProp = this.#props().trackInnerRadius;
		return trackInnerRadiusProp ? this.#getInnerRadius(trackInnerRadiusProp, this.trackOuterRadius) : this.innerRadius;
	});
	get trackInnerRadius() {
		return this.#trackInnerRadius();
	}
	set trackInnerRadius($$value) {
		return this.#trackInnerRadius($$value);
	}
	#startAngle = derived(() => this.#props().startAngle ?? degreesToRadians(this.range[0]));
	get startAngle() {
		return this.#startAngle();
	}
	set startAngle($$value) {
		return this.#startAngle($$value);
	}
	#trackStartAngle = derived(() => this.#props().trackStartAngle ?? this.#props().startAngle ?? degreesToRadians(this.range[0]));
	get trackStartAngle() {
		return this.#trackStartAngle();
	}
	set trackStartAngle($$value) {
		return this.#trackStartAngle($$value);
	}
	#trackEndAngle = derived(() => this.#props().trackEndAngle ?? this.#props().endAngle ?? degreesToRadians(this.range[1]));
	get trackEndAngle() {
		return this.#trackEndAngle();
	}
	set trackEndAngle($$value) {
		return this.#trackEndAngle($$value);
	}
	#trackCornerRadius = derived(() => this.#props().trackCornerRadius ?? this.#props().cornerRadius ?? 0);
	get trackCornerRadius() {
		return this.#trackCornerRadius();
	}
	set trackCornerRadius($$value) {
		return this.#trackCornerRadius($$value);
	}
	#trackPadAngle = derived(() => this.#props().trackPadAngle ?? this.#props().padAngle ?? 0);
	get trackPadAngle() {
		return this.#trackPadAngle();
	}
	set trackPadAngle($$value) {
		return this.#trackPadAngle($$value);
	}
	#arcEndAngle = derived(() => this.#props().endAngle ?? degreesToRadians(this.scale(this.motionEndAngleValue)));
	get arcEndAngle() {
		return this.#arcEndAngle();
	}
	set arcEndAngle($$value) {
		return this.#arcEndAngle($$value);
	}
	#arc = derived(() => {
		const props = this.#props();
		return arc().innerRadius(this.innerRadius).outerRadius(this.outerRadius).startAngle(this.startAngle).endAngle(this.arcEndAngle).cornerRadius(props.cornerRadius ?? 0).padAngle(props.padAngle ?? 0);
	});
	get arc() {
		return this.#arc();
	}
	set arc($$value) {
		return this.#arc($$value);
	}
	#trackArc = derived(() => arc().innerRadius(this.trackInnerRadius).outerRadius(this.trackOuterRadius).startAngle(this.trackStartAngle).endAngle(this.trackEndAngle).cornerRadius(this.trackCornerRadius).padAngle(this.trackPadAngle));
	get trackArc() {
		return this.#trackArc();
	}
	set trackArc($$value) {
		return this.#trackArc($$value);
	}
	#angle = derived(() => ((this.startAngle ?? 0) + (this.endAngle ?? 0)) / 2);
	get angle() {
		return this.#angle();
	}
	set angle($$value) {
		return this.#angle($$value);
	}
	#xOffset = derived(() => Math.sin(this.angle) * (this.#props().offset ?? 0));
	get xOffset() {
		return this.#xOffset();
	}
	set xOffset($$value) {
		return this.#xOffset($$value);
	}
	#yOffset = derived(() => -Math.cos(this.angle) * (this.#props().offset ?? 0));
	get yOffset() {
		return this.#yOffset();
	}
	set yOffset($$value) {
		return this.#yOffset($$value);
	}
	#trackArcCentroid = derived(() => {
		const centroid = this.trackArc.centroid();
		return [centroid[0] + this.xOffset, centroid[1] + this.yOffset];
	});
	get trackArcCentroid() {
		return this.#trackArcCentroid();
	}
	set trackArcCentroid($$value) {
		return this.#trackArcCentroid($$value);
	}
	#boundingBox = derived(() => this.trackRef ? this.trackRef.getBBox() : {});
	get boundingBox() {
		return this.#boundingBox();
	}
	set boundingBox($$value) {
		return this.#boundingBox($$value);
	}
	getTrackTextProps = (position, opts = {}) => {
		return createArcTextProps({
			startAngle: () => this.trackStartAngle,
			endAngle: () => this.trackEndAngle,
			outerRadius: () => this.trackOuterRadius + (opts.outerPadding ?? 0),
			innerRadius: () => this.trackInnerRadius - (opts.innerPadding ?? 0),
			cornerRadius: () => this.trackCornerRadius,
			centroid: () => this.trackArcCentroid
		}, opts, position).current;
	};
	getArcTextProps = (position, opts = {}) => {
		return createArcTextProps({
			startAngle: () => this.startAngle,
			endAngle: () => this.arcEndAngle,
			outerRadius: () => this.outerRadius + (opts.outerPadding ?? 0),
			innerRadius: () => this.innerRadius - (opts.innerPadding ?? 0),
			cornerRadius: () => this.#props().cornerRadius ?? 0,
			centroid: () => this.trackArcCentroid
		}, opts, position).current;
	};
};
//#endregion
//#region node_modules/layerchart/dist/components/Arc/Arc.base.svelte
function Arc_base($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { Path, ref: refProp = void 0, trackRef: trackRefProp = void 0, stroke = "none", motion, value, initialValue, domain, range, startAngle, endAngle, innerRadius, outerRadius, cornerRadius, padAngle, trackStartAngle, trackEndAngle, trackInnerRadius, trackOuterRadius, trackCornerRadius, trackPadAngle, offset, data, tooltip, track = false, onpointerenter = () => {}, onpointermove = () => {}, onpointerleave = () => {}, ontouchmove = () => {}, children, class: className, $$slots, $$events, ...restProps } = $$props;
		const c = new ArcState(() => ({
			motion,
			value,
			initialValue,
			domain,
			range,
			startAngle,
			endAngle,
			innerRadius,
			outerRadius,
			cornerRadius,
			padAngle,
			trackStartAngle,
			trackEndAngle,
			trackInnerRadius,
			trackOuterRadius,
			trackCornerRadius,
			trackPadAngle,
			offset
		}));
		let ref = void 0;
		const onPointerEnter = (e) => {
			onpointerenter?.(e);
			if (tooltip) c.ctx.tooltip.show(e, data);
		};
		const onPointerMove = (e) => {
			onpointermove?.(e);
			if (tooltip) c.ctx.tooltip.show(e, data);
		};
		const onPointerLeave = (e) => {
			onpointerleave?.(e);
			if (tooltip) c.ctx.tooltip.hide();
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (track) {
				$$renderer.push("<!--[0-->");
				var bind_get = () => c.trackRef;
				var bind_set = (v) => c.trackRef = v;
				if (Path) {
					$$renderer.push("<!--[-->");
					Path($$renderer, spread_props([{
						pathData: c.trackArc(),
						stroke: "none",
						get pathRef() {
							return bind_get();
						},
						set pathRef($$value) {
							bind_set($$value);
						}
					}, extractLayerProps(track, "lc-arc-track")]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (Path) {
				$$renderer.push("<!--[-->");
				Path($$renderer, spread_props([
					{
						pathData: c.arc(),
						transform: `translate(${stringify(c.xOffset)}, ${stringify(c.yOffset)})`,
						stroke
					},
					restProps,
					{
						class: cls("lc-arc-line", className),
						onpointerenter: onPointerEnter,
						onpointermove: onPointerMove,
						onpointerleave: onPointerLeave,
						ontouchmove: (e) => {
							ontouchmove?.(e);
							if (tooltip) e.preventDefault();
						},
						get pathRef() {
							return ref;
						},
						set pathRef($$value) {
							ref = $$value;
							$$settled = false;
						}
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
			$$renderer.push(` `);
			children?.($$renderer, {
				centroid: c.trackArcCentroid,
				boundingBox: c.boundingBox,
				value: c.motionEndAngleValue,
				startAngle: c.startAngle,
				endAngle: c.arcEndAngle,
				innerRadius: c.innerRadius,
				outerRadius: c.outerRadius,
				getTrackTextProps: c.getTrackTextProps,
				getArcTextProps: c.getArcTextProps
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref: refProp,
			trackRef: trackRefProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Arc/Arc.svg.svelte
function Arc_svg($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Arc_base($$renderer, spread_props([{ Path: Path_svg }, props]));
}
//#endregion
//#region node_modules/layerchart/dist/components/Arc/Arc.canvas.svelte
function Arc_canvas($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Arc_base($$renderer, spread_props([{ Path: Path_canvas }, props]));
}
//#endregion
export { Arc_svg as n, Arc_canvas as t };

//# sourceMappingURL=Arc.canvas.js.map