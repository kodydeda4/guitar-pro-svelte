import { b as hasContext, o as derived, x as setContext, y as getContext } from "./server.js";
import { i as createSubscriber, s as on } from "./index-server.js";
import "./index-server2.js";
import { get } from "@layerstack/utils";
//#region node_modules/layerchart/dist/utils/common.js
function accessor(prop) {
	if (Array.isArray(prop)) return (d) => prop.map((p) => accessor(p)(d));
	else if (typeof prop === "function") return prop;
	else if (typeof prop === "string" || typeof prop === "number") {
		if (typeof prop === "number" || !prop.includes(".") && !prop.includes("[")) return (d) => d == null ? void 0 : d[prop];
		return (d) => get(d, prop);
	} else return (d) => d;
}
/** Guarantee chart data is an array */
function chartDataArray(data) {
	if (data == null) return [];
	else if (Array.isArray(data)) return data;
	else if ("nodes" in data) return data.nodes;
	else if ("descendants" in data) return data.descendants();
	return [];
}
function defaultChartPadding(options = {}) {
	const { axis = true, legend = false, top, left, bottom, right } = options;
	if (axis === false) return;
	return {
		top: top ?? (axis === true || axis === "y" ? 4 : 0),
		left: left ?? (axis === true || axis === "y" ? 20 : 0),
		bottom: (bottom ?? (axis === true || axis === "x" ? 20 : 0)) + (legend ? 32 : 0),
		right: right ?? (axis === true || axis === "x" ? 4 : 0)
	};
}
/**
* Compare two scale/domain values, treating boxed values such as `Date` as equal when they
* represent the same instant.  `null` and `undefined` are equal to each other.
*
* Uses `valueOf()` rather than d3's `+a === +b` idiom: numeric coercion turns the string values
* of a band/point scale into `NaN`, so identical categories would never compare equal.
*/
function isEqualValue(a, b) {
	return a?.valueOf() === b?.valueOf();
}
/**
* Find the first instance within `data` with the same value as `original` using prop accessor.
* Handles complex objects such as `Date` by invoking `.valueOf()`
*/
function findRelatedData(data, original, accessor) {
	if (data.includes(original)) return original;
	return data.find((d) => isEqualValue(accessor(d), accessor(original)));
}
/**
* Return the object if the value is an object, otherwise return null.
* Functions (including Snippet types) are treated as non-objects and return null.
*/
function getObjectOrNull(value) {
	if (typeof value === "object") return value;
	if (value === void 0) return void 0;
	return null;
}
/**
* Call with args if function, otherwise return the value.
*/
function resolveMaybeFn(value, ...args) {
	return typeof value === "function" ? value(...args) : value;
}
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow = void 0;
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow, document = window?.document } = options;
		if (window === void 0) return;
		this.#document = document;
		this.#subscribe = createSubscriber((update) => {
			const cleanupFocusIn = on(window, "focusin", update);
			const cleanupFocusOut = on(window, "focusout", update);
			return () => {
				cleanupFocusIn();
				cleanupFocusOut();
			};
		});
	}
	get current() {
		this.#subscribe?.();
		if (!this.#document) return null;
		return getActiveElement(this.#document);
	}
};
new ActiveElement();
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/internal/utils/is.js
function isFunction(value) {
	return typeof value === "function";
}
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/utilities/extract/extract.svelte.js
function extract(value, defaultValue) {
	if (isFunction(value)) {
		const gotten = value();
		if (gotten === void 0) return defaultValue;
		return gotten;
	}
	if (value === void 0) return defaultValue;
	return value;
}
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/utilities/context/context.js
var Context = class {
	#name;
	#key;
	/**
	* @param name The name of the context.
	* This is used for generating the context key and error messages.
	*/
	constructor(name) {
		this.#name = name;
		this.#key = Symbol(name);
	}
	/**
	* The key used to get and set the context.
	*
	* It is not recommended to use this value directly.
	* Instead, use the methods provided by this class.
	*/
	get key() {
		return this.#key;
	}
	/**
	* Checks whether this has been set in the context of a parent component.
	*
	* Must be called during component initialisation.
	*/
	exists() {
		return hasContext(this.#key);
	}
	/**
	* Retrieves the context that belongs to the closest parent component.
	*
	* Must be called during component initialisation.
	*
	* @throws An error if the context does not exist.
	*/
	get() {
		const context = getContext(this.#key);
		if (context === void 0) throw new Error(`Context "${this.#name}" not found`);
		return context;
	}
	/**
	* Retrieves the context that belongs to the closest parent component,
	* or the given fallback value if the context does not exist.
	*
	* Must be called during component initialisation.
	*/
	getOr(fallback) {
		const context = getContext(this.#key);
		if (context === void 0) return fallback;
		return context;
	}
	/**
	* Associates the given value with the current component and returns it.
	*
	* Must be called during component initialisation.
	*/
	set(context) {
		return setContext(this.#key, context);
	}
};
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/utilities/use-debounce/use-debounce.svelte.js
function useDebounce(callback, wait) {
	let context = null;
	const wait$ = derived(() => extract(wait, 250));
	function debounced(...args) {
		if (context) {
			if (context.timeout) clearTimeout(context.timeout);
		} else {
			let resolve;
			let reject;
			context = {
				timeout: null,
				runner: null,
				promise: new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				}),
				resolve,
				reject
			};
		}
		context.runner = async () => {
			if (!context) return;
			const ctx = context;
			context = null;
			try {
				ctx.resolve(await callback.apply(this, args));
			} catch (error) {
				ctx.reject(error);
			}
		};
		context.timeout = setTimeout(context.runner, wait$());
		return context.promise;
	}
	debounced.cancel = async () => {
		if (!context || context.timeout === null) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || context.timeout === null) return;
		}
		clearTimeout(context.timeout);
		context.reject("Cancelled");
		context = null;
	};
	debounced.runScheduledNow = async () => {
		if (!context || !context.timeout) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || !context.timeout) return;
		}
		clearTimeout(context.timeout);
		context.timeout = null;
		await context.runner?.();
	};
	Object.defineProperty(debounced, "pending", {
		enumerable: true,
		get() {
			return !!context?.timeout;
		}
	});
	return debounced;
}
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/utilities/watch/watch.svelte.js
function runWatcher(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
}
function watch(sources, effect, options) {
	runWatcher(sources, "post", effect, options);
}
function watchPre(sources, effect, options) {
	runWatcher(sources, "pre", effect, options);
}
watch.pre = watchPre;
function watchOnce(source, effect) {}
function watchOncePre(source, effect) {}
watchOnce.pre = watchOncePre;
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/utilities/use-mutation-observer/use-mutation-observer.svelte.js
function useMutationObserver(target, callback, options = {}) {
	const { window = defaultWindow } = options;
	derived(() => {
		const value = extract(target);
		return new Set(value ? Array.isArray(value) ? value : [value] : []);
	});
	const stop = () => {};
	return {
		stop,
		takeRecords() {}
	};
}
//#endregion
//#region node_modules/layerchart/node_modules/runed/dist/utilities/resource/resource.svelte.js
function debounce(fn, delay) {
	let timeoutId;
	let lastResolve = null;
	return (...args) => {
		return new Promise((resolve) => {
			if (lastResolve) lastResolve(void 0);
			lastResolve = resolve;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(async () => {
				const result = await fn(...args);
				if (lastResolve) {
					lastResolve(result);
					lastResolve = null;
				}
			}, delay);
		});
	};
}
function throttle(fn, delay) {
	let lastRun = 0;
	let lastPromise = null;
	return (...args) => {
		const now = Date.now();
		if (lastRun && now - lastRun < delay) return lastPromise ?? Promise.resolve(void 0);
		lastRun = now;
		lastPromise = fn(...args);
		return lastPromise;
	};
}
function runResource(source, fetcher, options = {}, effectFn) {
	const { lazy = false, once = false, initialValue, debounce: debounceTime, throttle: throttleTime } = options;
	let current = initialValue;
	let loading = initialValue === void 0 && !lazy;
	let error = void 0;
	let cleanupFns = [];
	const runCleanup = () => {
		cleanupFns.forEach((fn) => fn());
		cleanupFns = [];
	};
	const onCleanup = (fn) => {
		cleanupFns = [...cleanupFns, fn];
	};
	const baseFetcher = async (value, previousValue, refetching = false) => {
		try {
			loading = true;
			error = void 0;
			runCleanup();
			const controller = new AbortController();
			onCleanup(() => controller.abort());
			const result = await fetcher(value, previousValue, {
				data: current,
				refetching,
				onCleanup,
				signal: controller.signal
			});
			current = result;
			return result;
		} catch (e) {
			if (!(e instanceof DOMException && e.name === "AbortError")) error = e;
			return;
		} finally {
			loading = false;
		}
	};
	const runFetcher = debounceTime ? debounce(baseFetcher, debounceTime) : throttleTime ? throttle(baseFetcher, throttleTime) : baseFetcher;
	const sources = Array.isArray(source) ? source : [source];
	let prevValues;
	effectFn((values, previousValues) => {
		if (once && prevValues) return;
		prevValues = values;
		runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? previousValues : previousValues?.[0]);
	}, { lazy });
	return {
		get current() {
			return current;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		mutate: (value) => {
			current = value;
		},
		refetch: (info) => {
			const values = sources.map((s) => s());
			return runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? values : values[0], info ?? true);
		}
	};
}
function resource(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getters = () => sources.map((s) => s());
		watch(getters, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
function resourcePre(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getter = () => sources.map((s) => s());
		watch.pre(getter, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
resource.pre = resourcePre;
//#endregion
//#region node_modules/layerchart/dist/contexts/chart.js
var _ChartContext = new Context("ChartContext");
/**
* Fallback context when used outside of a Chart component.
* Provides safe defaults to prevent runtime errors.
*/
var fallbackContext = {
	id: Symbol("FallbackChart"),
	registerMark: () => () => {},
	registerComponent: (_options) => ({
		id: Symbol("noop"),
		kind: "mark",
		name: "noop",
		parent: null,
		children: [],
		insideCompositeMark: false
	}),
	series: {
		series: [],
		visibleSeries: [],
		highlightKey: null,
		isVisible: () => true,
		isHighlighted: () => false,
		isDefaultSeries: true,
		allSeriesData: [],
		allSeriesColors: [],
		selectedKeys: {
			isEmpty: () => true,
			isSelected: () => false
		}
	},
	tooltip: {
		x: 0,
		y: 0,
		data: null,
		series: [],
		config: {},
		isHoveringTooltipArea: false,
		isHoveringTooltipContent: false,
		mode: "manual",
		source: null,
		suppressed: false,
		show: () => {},
		hide: () => {}
	}
};
function getChartContext() {
	return _ChartContext.getOr(fallbackContext);
}
function setChartContext(context) {
	return _ChartContext.set(context);
}
//#endregion
export { useDebounce as a, chartDataArray as c, getObjectOrNull as d, isEqualValue as f, watch as i, defaultChartPadding as l, setChartContext as n, Context as o, resolveMaybeFn as p, useMutationObserver as r, accessor as s, getChartContext as t, findRelatedData as u };

//# sourceMappingURL=chart.js.map