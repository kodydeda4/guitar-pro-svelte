import { $ as state, B as render_effect, Ft as deferred, O as get, Z as set, zt as noop } from "./server.js";
import "./index-server.js";
import "./index-server2.js";
import { ct as loop, lt as raf } from "./tooltip.js";
//#region node_modules/svelte/src/motion/utils.js
/**
* @param {any} obj
* @returns {obj is Date}
*/
function is_date(obj) {
	return Object.prototype.toString.call(obj) === "[object Date]";
}
//#endregion
//#region node_modules/svelte/src/motion/spring.js
/**
* @template T
* @param {TickContext} ctx
* @param {T} last_value
* @param {T} current_value
* @param {T} target_value
* @returns {T}
*/
function tick_spring(ctx, last_value, current_value, target_value) {
	if (typeof current_value === "number" || is_date(current_value)) {
		const delta = target_value - current_value;
		const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
		const d = (velocity + (ctx.opts.stiffness * delta - ctx.opts.damping * velocity) * ctx.inv_mass) * ctx.dt;
		if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) return target_value;
		else {
			ctx.settled = false;
			return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
		}
	} else if (Array.isArray(current_value)) return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
	else if (typeof current_value === "object") {
		const next_value = {};
		for (const k in current_value) next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
		return next_value;
	} else throw new Error(`Cannot spring ${typeof current_value} values`);
}
/**
* A wrapper for a value that behaves in a spring-like fashion. Changes to `spring.target` will cause `spring.current` to
* move towards it over time, taking account of the `spring.stiffness` and `spring.damping` parameters.
*
* ```svelte
* <script>
* 	import { Spring } from 'svelte/motion';
*
* 	const spring = new Spring(0);
* <\/script>
*
* <input type="range" bind:value={spring.target} />
* <input type="range" bind:value={spring.current} disabled />
* ```
* @template T
* @since 5.8.0
*/
var Spring = class Spring {
	#stiffness = /* @__PURE__ */ state(.15);
	#damping = /* @__PURE__ */ state(.8);
	#precision = /* @__PURE__ */ state(.01);
	#current;
	#target;
	#last_value = void 0;
	#last_time = 0;
	#inverse_mass = 1;
	#momentum = 0;
	/** @type {import('../internal/client/types').Task | null} */
	#task = null;
	/** @type {ReturnType<typeof deferred> | null} */
	#deferred = null;
	/**
	* @param {T} value
	* @param {SpringOptions} [options]
	*/
	constructor(value, options = {}) {
		this.#current = /* @__PURE__ */ state(value);
		this.#target = /* @__PURE__ */ state(value);
		if (typeof options.stiffness === "number") this.#stiffness.v = clamp(options.stiffness, 0, 1);
		if (typeof options.damping === "number") this.#damping.v = clamp(options.damping, 0, 1);
		if (typeof options.precision === "number") this.#precision.v = options.precision;
	}
	/**
	* Create a spring whose value is bound to the return value of `fn`. This must be called
	* inside an effect root (for example, during component initialisation).
	*
	* ```svelte
	* <script>
	* 	import { Spring } from 'svelte/motion';
	*
	* 	let { number } = $props();
	*
	* 	const spring = Spring.of(() => number);
	* <\/script>
	* ```
	* @template U
	* @param {() => U} fn
	* @param {SpringOptions} [options]
	*/
	static of(fn, options) {
		const spring = new Spring(fn(), options);
		render_effect(() => {
			spring.set(fn());
		});
		return spring;
	}
	/** @param {T} value */
	#update(value) {
		set(this.#target, value);
		this.#current.v ??= value;
		this.#last_value ??= this.#current.v;
		if (!this.#task) {
			this.#last_time = raf.now();
			var inv_mass_recovery_rate = 1e3 / (this.#momentum * 60);
			this.#task ??= loop((now) => {
				this.#inverse_mass = Math.min(this.#inverse_mass + inv_mass_recovery_rate, 1);
				const elapsed = Math.min(now - this.#last_time, 1e3 / 30);
				/** @type {import('./private').TickContext} */
				const ctx = {
					inv_mass: this.#inverse_mass,
					opts: {
						stiffness: this.#stiffness.v,
						damping: this.#damping.v,
						precision: this.#precision.v
					},
					settled: true,
					dt: elapsed * 60 / 1e3
				};
				var next = tick_spring(ctx, this.#last_value, this.#current.v, this.#target.v);
				this.#last_value = this.#current.v;
				this.#last_time = now;
				set(this.#current, next);
				if (ctx.settled) this.#task = null;
				return !ctx.settled;
			});
		}
		return this.#task.promise;
	}
	/**
	* Sets `spring.target` to `value` and returns a `Promise` that resolves if and when `spring.current` catches up to it.
	*
	* If `options.instant` is `true`, `spring.current` immediately matches `spring.target`.
	*
	* If `options.preserveMomentum` is provided, the spring will continue on its current trajectory for
	* the specified number of milliseconds. This is useful for things like 'fling' gestures.
	*
	* @param {T} value
	* @param {SpringUpdateOptions} [options]
	*/
	set(value, options) {
		this.#deferred?.reject(/* @__PURE__ */ new Error("Aborted"));
		if (options?.instant || this.#current.v === void 0) {
			this.#task?.abort();
			this.#task = null;
			set(this.#current, set(this.#target, value));
			this.#last_value = value;
			return Promise.resolve();
		}
		if (options?.preserveMomentum) {
			this.#inverse_mass = 0;
			this.#momentum = options.preserveMomentum;
		}
		var d = this.#deferred = deferred();
		d.promise.catch(noop);
		this.#update(value).then(() => {
			if (d !== this.#deferred) return;
			d.resolve(void 0);
		});
		return d.promise;
	}
	get current() {
		return get(this.#current);
	}
	get damping() {
		return get(this.#damping);
	}
	set damping(v) {
		set(this.#damping, clamp(v, 0, 1));
	}
	get precision() {
		return get(this.#precision);
	}
	set precision(v) {
		set(this.#precision, v);
	}
	get stiffness() {
		return get(this.#stiffness);
	}
	set stiffness(v) {
		set(this.#stiffness, clamp(v, 0, 1));
	}
	get target() {
		return get(this.#target);
	}
	set target(v) {
		this.set(v);
	}
};
/**
* @param {number} n
* @param {number} min
* @param {number} max
*/
function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}
//#endregion
//#region node_modules/svelte/src/easing/index.js
/**
* Returns value as is.
*
* @param {number} t
* @returns {number}
*/
function linear(t) {
	return t;
}
/**
* Cubic scaling, accelerate on start, decelerate towards end.
*
* @param {number} t
* @returns {number}
*/
function cubicInOut(t) {
	return t < .5 ? 4 * t * t * t : .5 * Math.pow(2 * t - 2, 3) + 1;
}
/**
* Cubic scaling, accelerate on start
*
* @param {number} t
* @returns {number}
*/
function cubicIn(t) {
	return t * t * t;
}
//#endregion
//#region node_modules/svelte/src/motion/tweened.js
/**
* @template T
* @param {T} a
* @param {T} b
* @returns {(t: number) => T}
*/
function get_interpolator(a, b) {
	if (a === b || a !== a) return () => a;
	const type = typeof a;
	if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) throw new Error("Cannot interpolate values of different type");
	if (Array.isArray(a)) {
		const arr = b.map((bi, i) => {
			return get_interpolator(
				/** @type {Array<any>} */
				a[i],
				bi
			);
		});
		return (t) => arr.map((fn) => fn(t));
	}
	if (type === "object") {
		if (!a || !b) throw new Error("Object cannot be null");
		if (is_date(a) && is_date(b)) {
			const an = a.getTime();
			const delta = b.getTime() - an;
			return (t) => new Date(an + t * delta);
		}
		const keys = Object.keys(b);
		/** @type {Record<string, (t: number) => T>} */
		const interpolators = {};
		keys.forEach((key) => {
			interpolators[key] = get_interpolator(a[key], b[key]);
		});
		return (t) => {
			/** @type {Record<string, any>} */
			const result = {};
			keys.forEach((key) => {
				result[key] = interpolators[key](t);
			});
			return result;
		};
	}
	if (type === "number") {
		const delta = b - a;
		return (t) => a + t * delta;
	}
	return () => b;
}
/**
* A wrapper for a value that tweens smoothly to its target value. Changes to `tween.target` will cause `tween.current` to
* move towards it over time, taking account of the `delay`, `duration` and `easing` options.
*
* ```svelte
* <script>
* 	import { Tween } from 'svelte/motion';
*
* 	const tween = new Tween(0);
* <\/script>
*
* <input type="range" bind:value={tween.target} />
* <input type="range" bind:value={tween.current} disabled />
* ```
* @template T
* @since 5.8.0
*/
var Tween = class Tween {
	#current;
	#target;
	/** @type {TweenOptions<T>} */
	#defaults;
	/** @type {import('../internal/client/types').Task | null} */
	#task = null;
	/**
	* @param {T} value
	* @param {TweenOptions<T>} options
	*/
	constructor(value, options = {}) {
		this.#current = /* @__PURE__ */ state(value);
		this.#target = /* @__PURE__ */ state(value);
		this.#defaults = options;
	}
	/**
	* Create a tween whose value is bound to the return value of `fn`. This must be called
	* inside an effect root (for example, during component initialisation).
	*
	* ```svelte
	* <script>
	* 	import { Tween } from 'svelte/motion';
	*
	* 	let { number } = $props();
	*
	* 	const tween = Tween.of(() => number);
	* <\/script>
	* ```
	* @template U
	* @param {() => U} fn
	* @param {TweenOptions<U>} [options]
	*/
	static of(fn, options) {
		const tween = new Tween(fn(), options);
		render_effect(() => {
			tween.set(fn());
		});
		return tween;
	}
	/**
	* Sets `tween.target` to `value` and returns a `Promise` that resolves if and when `tween.current` catches up to it.
	*
	* If `options` are provided, they will override the tween's defaults.
	* @param {T} value
	* @param {TweenOptions<T>} [options]
	* @returns
	*/
	set(value, options) {
		set(this.#target, value);
		let { delay = 0, duration = 400, easing = linear, interpolate = get_interpolator } = {
			...this.#defaults,
			...options
		};
		if (duration === 0) {
			this.#task?.abort();
			set(this.#current, value);
			return Promise.resolve();
		}
		const start = raf.now() + delay;
		/** @type {(t: number) => T} */
		let fn;
		let started = false;
		let previous_task = this.#task;
		this.#task = loop((now) => {
			if (now < start) return true;
			if (!started) {
				started = true;
				const prev = this.#current.v;
				fn = interpolate(prev, value);
				if (typeof duration === "function") duration = duration(prev, value);
				previous_task?.abort();
				previous_task = null;
			}
			const elapsed = now - start;
			if (elapsed > duration) {
				set(this.#current, value);
				return false;
			}
			set(this.#current, fn(easing(elapsed / duration)));
			return true;
		});
		return this.#task.promise;
	}
	get current() {
		return get(this.#current);
	}
	get target() {
		return get(this.#target);
	}
	set target(v) {
		this.set(v);
	}
};
//#endregion
//#region node_modules/layerchart/dist/utils/motion.svelte.js
var MotionSpring = class extends Spring {
	type = "spring";
	constructor(value, options) {
		super(value, options);
	}
};
/**
* Extended Tween class that adds a type discriminator to help with
* type narrowing in our motion system
*/
var MotionTween = class extends Tween {
	type = "tween";
	constructor(value, options) {
		super(value, options);
	}
};
/**
* MotionNone is a state container that provides the same interface as
* Spring and Tween but without any animation logic. Values update immediately.
*
* This allows components to use a consistent API regardless of whether
* animations are enabled or not.
*/
var MotionNone = class {
	type = "none";
	#current = null;
	#target = null;
	constructor(value, _options = {}) {
		this.#current = value;
		this.#target = value;
	}
	/**
	* Updates the value immediately and returns a resolved promise
	* to maintain API compatibility with animated motion classes
	*/
	set(value, _options = {}) {
		this.#current = value;
		this.#target = value;
		return Promise.resolve();
	}
	get current() {
		return this.#current;
	}
	get target() {
		return this.#target;
	}
	set target(v) {
		this.set(v);
	}
};
/**
* Sets up automatic tracking between a source value and a motion state.
* When the `controlled` option is `true`, the motion state will not update
* automatically and will only update when explicitly set.
*/
function setupTracking(motion, getValue, options) {
	if (options.controlled) return;
	if (typeof window === "undefined") {
		try {
			const value = getValue();
			if (value != null) motion.set(value, { instant: true });
		} catch {}
		return;
	}
}
function createMotion(initialValue, getValue, motionProp, options = {}) {
	if (motionProp === void 0) return {
		type: "none",
		get current() {
			return getValue();
		},
		get target() {
			return getValue();
		},
		set target(v) {},
		set(_value, _options) {
			return Promise.resolve();
		}
	};
	const motion = parseMotionProp(motionProp);
	const motionState = motion.type === "spring" ? new MotionSpring(initialValue, motion.options) : motion.type === "tween" ? new MotionTween(initialValue, motion.options) : new MotionNone(initialValue);
	setupTracking(motionState, getValue, options);
	return motionState;
}
/**
* Creates a controlled motion state that only updates when explicitly set
* rather than automatically tracking changes to the source value
*/
function createControlledMotion(initialValue, motionProp) {
	return createMotion(initialValue, () => initialValue, motionProp, { controlled: true });
}
/**
* Creates a motion state map for data mode rendering.
* Tracks per-item animated values keyed by the item key.
* Returns null if no motion is configured (type: 'none').
*/
function createDataMotionMap(motionProp) {
	if (motionProp === void 0) return null;
	const config = parseMotionProp(motionProp);
	if (config.type === "none") return null;
	const map = /* @__PURE__ */ new Map();
	function create(value) {
		return config.type === "spring" ? new MotionSpring(value, config.options) : new MotionTween(value, config.options);
	}
	return {
		/** Update motion targets for an item. Creates states on first call per key/prop. */
		update(key, values) {
			let itemMap = map.get(key);
			if (!itemMap) {
				itemMap = /* @__PURE__ */ new Map();
				map.set(key, itemMap);
			}
			for (const [prop, value] of Object.entries(values)) {
				let state = itemMap.get(prop);
				if (!state) {
					state = create(value);
					itemMap.set(prop, state);
				} else state.set(value);
			}
		},
		/** Get current animated values for an item, or null if not tracked yet. */
		get(key) {
			const itemMap = map.get(key);
			if (!itemMap) return null;
			const result = {};
			for (const [prop, state] of itemMap) result[prop] = state.current;
			return result;
		},
		/** Remove items no longer in the active set. */
		cleanup(activeKeys) {
			for (const key of map.keys()) if (!activeKeys.has(key)) map.delete(key);
		}
	};
}
/**
* Per-key path tweens, for marks that draw one path per group (`z`) instead of a single path.
*
* `createMotion` covers the single-path case, but a grouped mark's paths come and go with the
* data, so each group needs a tween of its own that survives across updates. Tween only: an
* interpolator walks two `d` strings, which a spring has no way to do — so `motion="spring"`
* leaves grouped paths unanimated, exactly as it already does for the ungrouped path.
*
* `interpolate` is a parameter rather than an import so the path interpolator stays out of the
* bundle of every mark that reaches for `motion`.
*/
function createPathMotionMap(motionProp, interpolate) {
	const tween = extractTweenConfig(motionProp);
	if (!tween) return null;
	const map = /* @__PURE__ */ new Map();
	return {
		/**
		* Point `key`'s path at `d`, creating its tween on first sight.
		*
		* `getInitial` supplies the value a newly seen group starts from — the flattened baseline,
		* so a group that appears grows in rather than popping. It is a thunk because building that
		* path is only worth doing on the update that actually creates the tween.
		*/
		update(key, d, getInitial) {
			let state = map.get(key);
			if (!state) {
				state = new MotionTween(getInitial?.() ?? d, {
					interpolate,
					...tween.options
				});
				map.set(key, state);
			}
			state.set(d);
		},
		/** Current animated `d` for `key`, or `null` until its first `update` */
		get(key) {
			return map.get(key)?.current ?? null;
		},
		/** Drop groups that are no longer in the data */
		cleanup(activeKeys) {
			for (const key of map.keys()) if (!activeKeys.has(key)) map.delete(key);
		}
	};
}
/**
* Extracts tween configuration from a motion prop
* @returns Resolved tween configuration or undefined if not a tween
*/
function extractTweenConfig(prop) {
	const resolved = parseMotionProp(prop);
	if (resolved.type === "tween") return resolved;
}
/**
* Parses and normalizes a motion configuration into a standard format
*
* @param config - The motion configuration to parse
* @param propertyKey - Optional property key when config is a map of properties
* @returns A standardized motion configuration object
*/
function parseMotionProp(config, accessor) {
	if (typeof config === "object" && "type" in config && "options" in config) {
		if (typeof config.options === "object") return config;
		return {
			type: config.type,
			options: {}
		};
	}
	if (config === void 0) return {
		type: "none",
		options: {}
	};
	if (typeof config === "string") {
		if (config === "spring") return {
			type: "spring",
			options: {}
		};
		else if (config === "tween") return {
			type: "tween",
			options: {}
		};
		return {
			type: "none",
			options: {}
		};
	}
	if (typeof config === "object" && "type" in config) {
		if (config.type === "spring") {
			const { type, ...options } = config;
			return {
				type: "spring",
				options
			};
		} else if (config.type === "tween") {
			const { type, ...options } = config;
			return {
				type: "tween",
				options
			};
		} else return {
			type: "none",
			options: {}
		};
	}
	if (accessor) {
		const propConfig = config[accessor];
		if (propConfig !== void 0) return parseMotionProp(propConfig);
	}
	return {
		type: "none",
		options: {}
	};
}
//#endregion
export { extractTweenConfig as a, cubicInOut as c, createPathMotionMap as i, createDataMotionMap as n, parseMotionProp as o, createMotion as r, cubicIn as s, createControlledMotion as t };

//# sourceMappingURL=motion.svelte.js.map