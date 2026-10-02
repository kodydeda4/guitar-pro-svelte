import { Mt as attr, Nt as clsx, a as bind_props, c as ensure_array_like, f as spread_props, h as stringify, o as derived, r as attributes, u as props_id } from "./server.js";
import "./index-server2.js";
import { a as extractTweenConfig, c as cubicInOut, n as createDataMotionMap, r as createMotion, s as cubicIn, t as createControlledMotion } from "./motion.svelte.js";
import { t as getChartContext } from "./chart.js";
import { C as getLayerContext, T as getGeoContext, b as resolveDataProp, d as flattenPathData, h as getMarkData, o as renderPathData, t as createKey, v as hasAnyDataProp, x as resolveGeoDataPair } from "./key.svelte.js";
import { merge } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
import { interpolatePath } from "d3-interpolate-path";
//#region node_modules/svelte/src/transition/index.js
/** @param {number} x */
var linear = (x) => x;
/**
* @param {number} t
* @returns {number}
*/
function cubic_in_out(t) {
	return t < .5 ? 4 * t * t * t : .5 * Math.pow(2 * t - 2, 3) + 1;
}
/**
* Animates the opacity of an element from 0 to the current opacity for `in` transitions and from the current opacity to 0 for `out` transitions.
*
* @param {Element} node
* @param {FadeParams} [params]
* @returns {TransitionConfig}
*/
function fade(node, { delay = 0, duration = 400, easing = linear } = {}) {
	const o = +getComputedStyle(node).opacity;
	return {
		delay,
		duration,
		easing,
		css: (t) => `opacity: ${t * o}`
	};
}
/**
* Animates the stroke of an SVG element, like a snake in a tube. `in` transitions begin with the path invisible and draw the path to the screen over time. `out` transitions start in a visible state and gradually erase the path. `draw` only works with elements that have a `getTotalLength` method, like `<path>` and `<polyline>`.
*
* @param {SVGElement & { getTotalLength(): number }} node
* @param {DrawParams} [params]
* @returns {TransitionConfig}
*/
function draw(node, { delay = 0, speed, duration, easing = cubic_in_out } = {}) {
	let len = node.getTotalLength();
	const style = getComputedStyle(node);
	if (style.strokeLinecap !== "butt") len += parseInt(style.strokeWidth);
	if (duration === void 0) {
		if (speed === void 0) duration = 800;
		else duration = len / speed;
	} else if (typeof duration === "function") duration = duration(len);
	return {
		delay,
		duration,
		easing,
		css: (_, u) => `
			stroke-dasharray: ${len};
			stroke-dashoffset: ${u * len};
		`
	};
}
//#endregion
//#region node_modules/layerchart/dist/components/Group/Group.shared.svelte.js
var defaultKey = (_, i) => i;
var GroupState = class {
	#getProps = () => ({});
	/**
	* Memoized props — the component's props closure allocates a fresh object
	* (it spreads `rest`), so calling it once per derived meant one allocation
	* per derived per update. Read it once here instead.
	*/
	#props = derived(() => this.#getProps());
	chartCtx = getChartContext();
	markData = getMarkData();
	geo = getGeoContext();
	#dataMode = derived(() => hasAnyDataProp(this.#props().x, this.#props().y));
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
			const resolved = this.#resolveGroup(d);
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
	#resolveGroup(d) {
		const props = this.#props();
		if (this.geo.projection) {
			const [projX, projY] = resolveGeoDataPair(props.x, props.y, d, this.geo.projection);
			return {
				x: projX,
				y: projY
			};
		}
		return {
			x: resolveDataProp(props.x, d, this.chartCtx.xScale, 0),
			y: resolveDataProp(props.y, d, this.chartCtx.yScale, 0)
		};
	}
	#trueX = derived(() => {
		const props = this.#props();
		if (typeof props.x === "number") return props.x;
		if (props.x == null && (props.center === "x" || props.center === true)) return this.chartCtx.width / 2;
		return 0;
	});
	get trueX() {
		return this.#trueX();
	}
	set trueX($$value) {
		return this.#trueX($$value);
	}
	#trueY = derived(() => {
		const props = this.#props();
		if (typeof props.y === "number") return props.y;
		if (props.y == null && (props.center === "y" || props.center === true)) return this.chartCtx.height / 2;
		return 0;
	});
	get trueY() {
		return this.#trueY();
	}
	set trueY($$value) {
		return this.#trueY($$value);
	}
	#series = derived(() => {
		const seriesKey = this.#props().seriesKey;
		if (seriesKey == null) return void 0;
		return this.chartCtx.series.series.find((s) => s.key === seriesKey);
	});
	get series() {
		return this.#series();
	}
	set series($$value) {
		return this.#series($$value);
	}
	#hidden = derived(() => this.series != null && !this.chartCtx.series.isVisible(this.series.key));
	get hidden() {
		return this.#hidden();
	}
	set hidden($$value) {
		return this.#hidden($$value);
	}
	#seriesOpacity = derived(() => {
		if (this.series?.key == null || this.chartCtx.series.visibleSeries.length <= 1 || this.chartCtx.series.isHighlighted(this.series.key, true)) return 1;
		return .1;
	});
	get seriesOpacity() {
		return this.#seriesOpacity();
	}
	set seriesOpacity($$value) {
		return this.#seriesOpacity($$value);
	}
	#opacity = derived(() => {
		const opacity = this.#props().opacity;
		if (this.seriesOpacity === 1) return opacity;
		return (opacity ?? 1) * this.seriesOpacity;
	});
	get opacity() {
		return this.#opacity();
	}
	set opacity($$value) {
		return this.#opacity($$value);
	}
	#dataMotionMap = null;
	#motionX;
	#motionY;
	get motionX() {
		return this.#motionX.current;
	}
	get motionY() {
		return this.#motionY.current;
	}
	#transform = derived(() => {
		const props = this.#props();
		if (props.center || props.x != null || props.y != null) return `translate(${this.motionX}px, ${this.motionY}px)`;
	});
	get transform() {
		return this.#transform();
	}
	set transform($$value) {
		return this.#transform($$value);
	}
	#defaultTransitionIn = derived(() => extractTweenConfig(this.#props().motion)?.options ? fade : () => ({}));
	get defaultTransitionIn() {
		return this.#defaultTransitionIn();
	}
	set defaultTransitionIn($$value) {
		return this.#defaultTransitionIn($$value);
	}
	defaultTransitionInParams = { easing: cubicIn };
	constructor(getProps) {
		this.#getProps = getProps;
		const initial = getProps();
		const initialX = initial.initialX ?? (typeof initial.x === "number" ? initial.x : void 0);
		const initialY = initial.initialY ?? (typeof initial.y === "number" ? initial.y : void 0);
		this.#motionX = createMotion(initialX, () => this.trueX, initial.motion);
		this.#motionY = createMotion(initialY, () => this.trueY, initial.motion);
		this.#dataMotionMap = createDataMotionMap(initial.motion);
		if (this.#dataMotionMap) this.#dataMotionMap;
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Group/Group.svg.svelte
function Group_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { preventTouchMove = false, transitionIn: transitionInProp, transitionInParams: transitionInParamsProp, class: className, children, ref: refProp = void 0, x, y, initialX, initialY, data, key, center, motion, seriesKey, opacity, $$slots, $$events, ...rest } = $$props;
		const c = new GroupState(() => ({
			preventTouchMove,
			transitionIn: transitionInProp,
			transitionInParams: transitionInParamsProp,
			class: className,
			children,
			x,
			y,
			initialX,
			initialY,
			data,
			key,
			center,
			motion,
			seriesKey,
			opacity,
			...rest
		}));
		derived(() => transitionInProp ?? c.defaultTransitionIn);
		derived(() => transitionInParamsProp ?? c.defaultTransitionInParams);
		if (c.hidden) $$renderer.push("<!--[0-->");
		else if (c.dataMode) {
			$$renderer.push(`<!--[1--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				$$renderer.push(`<g${attributes({
					class: clsx(["lc-group-g", className]),
					...rest,
					opacity: c.opacity
				}, void 0, void 0, { transform: `translate(${stringify(item.x)}px, ${stringify(item.y)}px)` }, 3)}>`);
				children?.($$renderer);
				$$renderer.push(`<!----></g>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><g${attributes({
				class: clsx(["lc-group-g", className]),
				...rest,
				opacity: c.opacity
			}, void 0, void 0, { transform: c.transform }, 3)}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></g>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Group/Group.canvas.svelte
function Group_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children, $$slots, $$events, ...rest } = $$props;
		const c = new GroupState(() => ({
			children,
			...rest
		}));
		c.chartCtx.registerComponent({
			name: "Group",
			kind: "group",
			canvasRender: {
				render: (ctx) => {
					ctx.translate(c.motionX ?? 0, c.motionY ?? 0);
					if (c.opacity != null) ctx.globalAlpha *= c.opacity;
				},
				events: {
					click: rest.onclick,
					dblclick: rest.ondblclick,
					pointerenter: rest.onpointerenter,
					pointermove: rest.onpointermove,
					pointerleave: rest.onpointerleave,
					pointerdown: rest.onpointerdown
				},
				deps: () => [
					c.motionX,
					c.motionY,
					c.opacity
				]
			}
		});
		if (!c.hidden) {
			$$renderer.push("<!--[0-->");
			children?.($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Group/Group.html.svelte
function Group_html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { preventTouchMove = false, transitionIn: transitionInProp, transitionInParams: transitionInParamsProp, class: className, children, ref: refProp = void 0, x, y, initialX, initialY, data, key, center, motion, seriesKey, opacity, $$slots, $$events, ...rest } = $$props;
		const c = new GroupState(() => ({
			preventTouchMove,
			transitionIn: transitionInProp,
			transitionInParams: transitionInParamsProp,
			class: className,
			children,
			x,
			y,
			initialX,
			initialY,
			data,
			key,
			center,
			motion,
			seriesKey,
			opacity,
			...rest
		}));
		derived(() => transitionInProp ?? c.defaultTransitionIn);
		derived(() => transitionInParamsProp ?? c.defaultTransitionInParams);
		if (c.hidden) $$renderer.push("<!--[0-->");
		else if (c.dataMode) {
			$$renderer.push(`<!--[1--><!--[-->`);
			const each_array = ensure_array_like(c.resolvedItems);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let item = each_array[$$index];
				$$renderer.push(`<div${attributes({
					...rest,
					class: clsx(["lc-group-div", className])
				}, "svelte-ytw4hl", void 0, {
					transform: `translate(${stringify(item.x)}px, ${stringify(item.y)}px)`,
					opacity: c.opacity
				})}>`);
				children?.($$renderer);
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attributes({
				...rest,
				class: clsx(["lc-group-div", className])
			}, "svelte-ytw4hl", void 0, {
				transform: c.transform,
				opacity: c.opacity
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Group/Group.svelte
function Group($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const layerCtx = getLayerContext();
		let { ref = void 0, $$slots, $$events, ...rest } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (layerCtx === "svg") {
				$$renderer.push("<!--[0-->");
				Group_svg($$renderer, spread_props([rest, {
					get ref() {
						return ref;
					},
					set ref($$value) {
						ref = $$value;
						$$settled = false;
					}
				}]));
			} else if (layerCtx === "canvas") {
				$$renderer.push("<!--[1-->");
				Group_canvas($$renderer, spread_props([rest]));
			} else if (layerCtx === "html") {
				$$renderer.push("<!--[2-->");
				Group_html($$renderer, spread_props([rest, {
					get ref() {
						return ref;
					},
					set ref($$value) {
						ref = $$value;
						$$settled = false;
					}
				}]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/createId.js
/**
* Creates a unique ID for a given prefix and uid.
*
* @param prefix - prefix to use for the id
* @param uid - the uid generated by $props.id()
*/
function createId(prefix, uid) {
	return `${prefix}-${uid}`;
}
//#endregion
//#region node_modules/layerchart/dist/components/Marker.svelte
function Marker($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { type, id = createId("marker-", uid), size = 10, markerWidth = size, markerHeight = size, markerUnits = "userSpaceOnUse", orient = "auto-start-reverse", refX = ["arrow", "triangle"].includes(type ?? "") ? 9 : 5, refY = 5, viewBox = "0 0 10 10", class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<defs><marker${attributes({
			id,
			markerWidth,
			markerHeight,
			markerUnits,
			orient,
			refX,
			refY,
			viewBox,
			"data-type": type,
			...restProps,
			class: clsx(cls("lc-marker", className))
		}, "svelte-1e1prg5", void 0, void 0, 3)}>`);
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer);
			$$renderer.push(`<!---->`);
		} else if (type === "triangle") $$renderer.push(`<!--[1--><path d="M 0 0 L 10 5 L 0 10 z" class="lc-marker-triangle"></path>`);
		else if (type === "arrow") $$renderer.push(`<!--[2--><polyline points="0 0, 10 5, 0 10" class="lc-marker-arrow"></polyline>`);
		else if (type === "circle" || type === "circle-stroke" || type === "dot") $$renderer.push(`<!--[3--><circle${attr("cx", 5)}${attr("cy", 5)}${attr("r", 5)} class="lc-marker-circle"></circle>`);
		else if (type === "line") $$renderer.push(`<!--[4--><polyline points="5 0, 5 10" class="lc-marker-line"></polyline>`);
		else if (type === "square" || type === "square-stroke") $$renderer.push(`<!--[5--><rect${attr("x", 0)}${attr("y", 0)}${attr("width", 10)}${attr("height", 10)} class="lc-marker-square"></rect>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></marker></defs>`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/MarkerWrapper.svelte
function MarkerWrapper($$renderer, $$props) {
	let { id, marker } = $$props;
	if (typeof marker === "function") {
		$$renderer.push("<!--[0-->");
		marker($$renderer, { id });
		$$renderer.push(`<!---->`);
	} else if (marker) {
		$$renderer.push("<!--[1-->");
		Marker($$renderer, spread_props([{
			id,
			type: typeof marker === "string" ? marker : void 0
		}, typeof marker === "object" ? marker : null]));
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]-->`);
}
//#endregion
//#region node_modules/layerchart/dist/components/Path/Path.shared.svelte.js
function resolvePathData(v) {
	return typeof v === "function" ? v() : v;
}
/**
* Reactive state shared by every per-layer Path variant.
*/
var PathState = class {
	#getPathData;
	chartCtx = getChartContext();
	#tweenedState;
	get tweenedPathData() {
		return this.#tweenedState.current;
	}
	drawKey = Symbol();
	/**
	* @param getPathData  Hot-path getter — reads only `pathData`. Kept separate from
	*                     `getProps` so the `<path d=...>` updater (and the canvas
	*                     `tweenedPathData` consumer) does not subscribe to every
	*                     Path prop on every tick.
	* @param getProps     Full-props getter — used for one-time / cold-path config
	*                     (motion, draw).
	*/
	constructor(getPathData, getProps = () => ({})) {
		this.#getPathData = () => resolvePathData(getPathData());
		const initial = getProps();
		const extractedTween = extractTweenConfig(initial.motion);
		const tweenedOptions = extractedTween ? {
			type: extractedTween.type,
			options: {
				interpolate: interpolatePath,
				...extractedTween.options
			}
		} : void 0;
		const defaultPathData = (() => {
			if (!tweenedOptions) return "";
			const resolved = resolvePathData(getPathData());
			if (resolved) return flattenPathData(resolved, Math.min(this.chartCtx.yScale(0) ?? this.chartCtx.yRange[0], this.chartCtx.yRange[0]));
			return "";
		})();
		this.#tweenedState = createMotion(defaultPathData, this.#getPathData, tweenedOptions);
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/Path/Path.svg.svelte
function Path_svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { pathRef = void 0, marker, markerStart: markerStartProp, markerMid: markerMidProp, markerEnd: markerEndProp, startContent, endContent, draw: draw$1, motion, pathData: _pathData, class: classProp, fill: fillProp, fillOpacity: fillOpacityProp, stroke: strokeProp, strokeOpacity: strokeOpacityProp, strokeWidth: strokeWidthProp, opacity: opacityProp, $$slots, $$events, ...rest } = $$props;
		const c = new PathState(() => _pathData, () => ({
			draw: draw$1,
			motion
		}));
		const markerStart = derived(() => markerStartProp ?? marker);
		const markerMid = derived(() => markerMidProp ?? marker);
		const markerEnd = derived(() => markerEndProp ?? marker);
		const markerStartId = derived(() => markerStart() ? createId("marker-start", uid) : "");
		const markerMidId = derived(() => markerMid() ? createId("marker-mid", uid) : "");
		const markerEndId = derived(() => markerEnd() ? createId("marker-end", uid) : "");
		derived(() => draw$1 ? draw : () => ({}));
		let staticEndPoint = void 0;
		const pathClass = derived(() => cls("lc-path", classProp));
		const endPointDuration = derived(() => {
			if (typeof draw$1 === "object" && draw$1.duration !== void 0 && typeof draw$1.duration !== "function") return draw$1.duration;
			return 800;
		});
		const endPoint = draw$1 && endContent ? createControlledMotion(void 0, {
			type: "tween",
			duration: () => endPointDuration(),
			easing: typeof draw$1 === "object" && draw$1.easing ? draw$1.easing : cubicInOut,
			interpolate() {
				return (t) => {
					const totalLength = pathRef?.getTotalLength() ?? 0;
					return pathRef?.getPointAtLength(totalLength * t);
				};
			}
		}) : null;
		const currentEndPoint = derived(() => endPoint ? endPoint.current : staticEndPoint);
		if (startContent || endContent) {}
		$$renderer.push(`<!---->`);
		$$renderer.push(`<path${attributes({
			...rest,
			d: c.tweenedPathData,
			fill: fillProp,
			"fill-opacity": fillOpacityProp,
			stroke: strokeProp,
			"stroke-opacity": strokeOpacityProp,
			"stroke-width": strokeWidthProp,
			opacity: opacityProp,
			class: clsx(pathClass()),
			"marker-start": markerStartId() ? `url(#${markerStartId()})` : void 0,
			"marker-mid": markerMidId() ? `url(#${markerMidId()})` : void 0,
			"marker-end": markerEndId() ? `url(#${markerEndId()})` : void 0
		}, void 0, void 0, void 0, 3)}></path>`);
		if (markerStart()) {
			$$renderer.push("<!--[0-->");
			MarkerWrapper($$renderer, {
				id: markerStartId(),
				marker: markerStart()
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if (markerMid()) {
			$$renderer.push("<!--[0-->");
			MarkerWrapper($$renderer, {
				id: markerMidId(),
				marker: markerMid()
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if (markerEnd()) {
			$$renderer.push("<!--[0-->");
			MarkerWrapper($$renderer, {
				id: markerEndId(),
				marker: markerEnd()
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if (endContent && currentEndPoint()) {
			$$renderer.push("<!--[0-->");
			Group($$renderer, {
				x: currentEndPoint().x,
				y: currentEndPoint().y,
				class: "lc-path-g-end",
				children: ($$renderer) => {
					endContent($$renderer, {
						point: currentEndPoint(),
						value: {
							x: c.chartCtx.xScale?.invert?.(currentEndPoint().x),
							y: c.chartCtx.yScale?.invert?.(currentEndPoint().y)
						}
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		$$renderer.push(`<!---->`);
		bind_props($$props, { pathRef });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Path/Path.canvas.svelte
function Path_canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { pathData, $$slots, $$events, ...rest } = $$props;
		const c = new PathState(() => pathData, () => rest);
		function render(ctx, styleOverrides) {
			renderPathData(ctx, c.tweenedPathData ?? "", styleOverrides ? merge({ styles: { strokeWidth: rest.strokeWidth } }, styleOverrides) : {
				styles: {
					fill: rest.fill,
					fillOpacity: rest.fillOpacity,
					stroke: rest.stroke,
					strokeOpacity: rest.strokeOpacity,
					strokeWidth: rest.strokeWidth,
					opacity: rest.opacity
				},
				classes: cls("lc-path", rest.class),
				style: rest.style
			});
		}
		const fillKey = createKey(() => rest.fill);
		const strokeKey = createKey(() => rest.stroke);
		c.chartCtx.registerComponent({
			name: "Path",
			kind: "mark",
			canvasRender: {
				render,
				events: {
					get click() {
						return rest.onclick;
					},
					get pointerenter() {
						return rest.onpointerenter;
					},
					get pointermove() {
						return rest.onpointermove;
					},
					get pointerleave() {
						return rest.onpointerleave;
					},
					get pointerdown() {
						return rest.onpointerdown;
					},
					get pointerover() {
						return rest.onpointerover;
					},
					get pointerout() {
						return rest.onpointerout;
					},
					get touchmove() {
						return rest.ontouchmove;
					}
				},
				deps: () => [
					fillKey.current,
					rest.fillOpacity,
					strokeKey.current,
					rest.strokeOpacity,
					rest.strokeWidth,
					rest.opacity,
					rest.class,
					c.tweenedPathData,
					rest.style
				]
			}
		});
	});
}
//#endregion
export { Group as a, Group_svg as c, createId as i, fade as l, Path_svg as n, Group_html as o, MarkerWrapper as r, Group_canvas as s, Path_canvas as t };

//# sourceMappingURL=Path.canvas.js.map