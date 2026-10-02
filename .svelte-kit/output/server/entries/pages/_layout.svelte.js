import { Mt as attr, Nt as clsx$1, Vt as run, Wt as escape_html, _ as html, b as hasContext, c as ensure_array_like, f as spread_props, h as stringify, l as head, n as attr_style, o as derived, r as attributes, t as attr_class, x as setContext, y as getContext } from "../../chunks/server.js";
import { i as createSubscriber, s as on, t as MediaQuery } from "../../chunks/index-server.js";
import "../../chunks/index-server2.js";
import { Bt as cn, Ft as Loader_circle, It as Icon, Lt as SonnerState, Nt as Triangle_alert, Pt as Info, r as Tooltip_provider, zt as toastState } from "../../chunks/tooltip.js";
import "clsx";
import "style-to-object";
//#region node_modules/mode-watcher/node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow$2 = void 0;
//#endregion
//#region node_modules/mode-watcher/node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement$2(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
//#endregion
//#region node_modules/mode-watcher/node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement$2 = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow$2, document = window?.document } = options;
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
		return getActiveElement$2(this.#document);
	}
};
new ActiveElement$2();
//#endregion
//#region node_modules/mode-watcher/node_modules/runed/dist/utilities/watch/watch.svelte.js
function runWatcher$2(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
}
function watch$2(sources, effect, options) {
	runWatcher$2(sources, "post", effect, options);
}
function watchPre$2(sources, effect, options) {
	runWatcher$2(sources, "pre", effect, options);
}
watch$2.pre = watchPre$2;
function watchOnce$2(source, effect) {}
function watchOncePre$2(source, effect) {}
watchOnce$2.pre = watchOncePre$2;
//#endregion
//#region node_modules/mode-watcher/node_modules/runed/dist/utilities/persisted-state/persisted-state.svelte.js
function getStorage(storageType, window) {
	switch (storageType) {
		case "local": return window.localStorage;
		case "session": return window.sessionStorage;
	}
}
/**
* Creates reactive state that is persisted and synchronized across browser sessions and tabs using Web Storage.
* @param key The unique key used to store the state in the storage.
* @param initialValue The initial value of the state if not already present in the storage.
* @param options Configuration options including storage type, serializer for complex data types, and whether to sync state changes across tabs.
*
* @see {@link https://runed.dev/docs/utilities/persisted-state}
*/
var PersistedState = class {
	#current;
	#key;
	#serializer;
	#storage;
	#subscribe;
	#version = 0;
	constructor(key, initialValue, options = {}) {
		const { storage: storageType = "local", serializer = {
			serialize: JSON.stringify,
			deserialize: JSON.parse
		}, syncTabs = true, window = defaultWindow$2 } = options;
		this.#current = initialValue;
		this.#key = key;
		this.#serializer = serializer;
		if (window === void 0) return;
		const storage = getStorage(storageType, window);
		this.#storage = storage;
		const existingValue = storage.getItem(key);
		if (existingValue !== null) this.#current = this.#deserialize(existingValue);
		else this.#serialize(initialValue);
		if (syncTabs && storageType === "local") this.#subscribe = createSubscriber(() => {
			return on(window, "storage", this.#handleStorageEvent);
		});
	}
	get current() {
		this.#subscribe?.();
		this.#version;
		const root = this.#deserialize(this.#storage?.getItem(this.#key)) ?? this.#current;
		const proxies = /* @__PURE__ */ new WeakMap();
		const proxy = (value) => {
			if (value === null || value?.constructor.name === "Date" || typeof value !== "object") return value;
			let p = proxies.get(value);
			if (!p) {
				p = new Proxy(value, {
					get: (target, property) => {
						this.#version;
						return proxy(Reflect.get(target, property));
					},
					set: (target, property, value) => {
						this.#version += 1;
						Reflect.set(target, property, value);
						this.#serialize(root);
						return true;
					}
				});
				proxies.set(value, p);
			}
			return p;
		};
		return proxy(root);
	}
	set current(newValue) {
		this.#serialize(newValue);
		this.#version += 1;
	}
	#handleStorageEvent = (event) => {
		if (event.key !== this.#key || event.newValue === null) return;
		this.#current = this.#deserialize(event.newValue);
		this.#version += 1;
	};
	#deserialize(value) {
		try {
			return this.#serializer.deserialize(value);
		} catch (error) {
			console.error(`Error when parsing "${value}" from persisted store "${this.#key}"`, error);
			return;
		}
	}
	#serialize(value) {
		try {
			if (value != void 0) this.#storage?.setItem(this.#key, this.#serializer.serialize(value));
		} catch (error) {
			console.error(`Error when writing value from persisted store "${this.#key}" to ${this.#storage}`, error);
		}
	}
};
//#endregion
//#region node_modules/mode-watcher/node_modules/runed/dist/utilities/resource/resource.svelte.js
function debounce$1(fn, delay) {
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
function throttle$1(fn, delay) {
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
function runResource$1(source, fetcher, options = {}, effectFn) {
	const { lazy = false, once = false, initialValue, debounce: debounceTime, throttle: throttleTime } = options;
	let current = initialValue;
	let loading = false;
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
	const runFetcher = debounceTime ? debounce$1(baseFetcher, debounceTime) : throttleTime ? throttle$1(baseFetcher, throttleTime) : baseFetcher;
	const sources = Array.isArray(source) ? source : [source];
	let prevValues;
	effectFn((values, previousValues) => {
		if (once && prevValues) return;
		if (prevValues && JSON.stringify(values) === JSON.stringify(prevValues)) return;
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
function resource$1(source, fetcher, options) {
	return runResource$1(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getters = () => sources.map((s) => s());
		watch$2(getters, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
function resourcePre$1(source, fetcher, options) {
	return runResource$1(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getter = () => sources.map((s) => s());
		watch$2.pre(getter, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
resource$1.pre = resourcePre$1;
//#endregion
//#region node_modules/mode-watcher/dist/utils.js
/**
* Sanitizes an array of classnames by removing any empty strings.
*/
function sanitizeClassNames(classNames) {
	return classNames.filter((className) => className.length > 0);
}
var noopStorage = {
	getItem: (_key) => null,
	setItem: (_key, _value) => {}
};
var isBrowser = typeof document !== "undefined";
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/dist/utils/is.js
function isFunction(value) {
	return typeof value === "function";
}
function isObject(value) {
	return value !== null && typeof value === "object";
}
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/dist/box/box.svelte.js
var BoxSymbol = Symbol("box");
var isWritableSymbol = Symbol("is-writable");
function isBox(value) {
	return isObject(value) && BoxSymbol in value;
}
/**
* @returns Whether the value is a WritableBox
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function isWritableBox(value) {
	return box.isBox(value) && isWritableSymbol in value;
}
function box(initialValue) {
	let current = initialValue;
	return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return current;
		},
		set current(v) {
			current = v;
		}
	};
}
function boxWith(getter, setter) {
	const derived$1 = derived(getter);
	if (setter) return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return derived$1();
		},
		set current(v) {
			setter(v);
		}
	};
	return {
		[BoxSymbol]: true,
		get current() {
			return getter();
		}
	};
}
function boxFrom(value) {
	if (box.isBox(value)) return value;
	if (isFunction(value)) return box.with(value);
	return box(value);
}
/**
* Function that gets an object of boxes, and returns an object of reactive values
*
* @example
* const count = box(0)
* const flat = box.flatten({ count, double: box.with(() => count.current) })
* // type of flat is { count: number, readonly double: number }
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function boxFlatten(boxes) {
	return Object.entries(boxes).reduce((acc, [key, b]) => {
		if (!box.isBox(b)) return Object.assign(acc, { [key]: b });
		if (box.isWritableBox(b)) Object.defineProperty(acc, key, {
			get() {
				return b.current;
			},
			set(v) {
				b.current = v;
			}
		});
		else Object.defineProperty(acc, key, { get() {
			return b.current;
		} });
		return acc;
	}, {});
}
/**
* Function that converts a box to a readonly box.
*
* @example
* const count = box(0) // WritableBox<number>
* const countReadonly = box.readonly(count) // ReadableBox<number>
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function toReadonlyBox(b) {
	if (!box.isWritableBox(b)) return b;
	return {
		[BoxSymbol]: true,
		get current() {
			return b.current;
		}
	};
}
box.from = boxFrom;
box.with = boxWith;
box.flatten = boxFlatten;
box.readonly = toReadonlyBox;
box.isBox = isBox;
box.isWritableBox = isWritableBox;
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function createParser(matcher, replacer) {
	const regex = RegExp(matcher, "g");
	return (str) => {
		if (typeof str !== "string") throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
		if (!str.match(regex)) return str;
		return str.replace(regex, replacer);
	};
}
var camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
	if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
	return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/dist/utils/style.js
function styleToString(style = {}) {
	return styleToCSS(style).replace("\n", " ");
}
styleToString({
	position: "absolute",
	width: "1px",
	height: "1px",
	padding: "0",
	margin: "-1px",
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	whiteSpace: "nowrap",
	borderWidth: "0",
	transform: "translateX(-100%)"
});
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow$1 = void 0;
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement$1(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement$1 = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow$1, document = window?.document } = options;
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
		return getActiveElement$1(this.#document);
	}
};
new ActiveElement$1();
//#endregion
//#region node_modules/mode-watcher/node_modules/svelte-toolbelt/node_modules/runed/dist/utilities/watch/watch.svelte.js
function runWatcher$1(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
}
function watch$1(sources, effect, options) {
	runWatcher$1(sources, "post", effect, options);
}
function watchPre$1(sources, effect, options) {
	runWatcher$1(sources, "pre", effect, options);
}
watch$1.pre = watchPre$1;
function watchOnce$1(source, effect) {}
function watchOncePre$1(source, effect) {}
watchOnce$1.pre = watchOncePre$1;
//#endregion
//#region node_modules/mode-watcher/dist/storage-keys.svelte.js
var modeStorageKey = box("mode-watcher-mode");
var themeStorageKey = box("mode-watcher-theme");
//#endregion
//#region node_modules/mode-watcher/dist/modes.js
/**
* the modes that are supported, used for validation & type
* derivation
*/
var modes = [
	"dark",
	"light",
	"system"
];
function isValidMode(value) {
	if (typeof value !== "string") return false;
	return modes.includes(value);
}
//#endregion
//#region node_modules/mode-watcher/dist/mode-states.svelte.js
var UserPrefersMode = class {
	#defaultValue = "system";
	#storage = isBrowser ? localStorage : noopStorage;
	#initialValue = this.#storage.getItem(modeStorageKey.current);
	#value = isValidMode(this.#initialValue) ? this.#initialValue : this.#defaultValue;
	#persisted = this.#makePersisted();
	#makePersisted(value = this.#value) {
		return new PersistedState(modeStorageKey.current, value, { serializer: {
			serialize: (v) => v,
			deserialize: (v) => {
				if (isValidMode(v)) return v;
				return this.#defaultValue;
			}
		} });
	}
	constructor() {}
	get current() {
		return this.#persisted.current;
	}
	set current(newValue) {
		this.#persisted.current = newValue;
	}
};
var SystemPrefersMode = class {
	#defaultValue = void 0;
	#track = true;
	#current = this.#defaultValue;
	#mediaQueryState = typeof window !== "undefined" && typeof window.matchMedia === "function" ? new MediaQuery("prefers-color-scheme: light") : { current: false };
	query() {
		if (!isBrowser) return;
		this.#current = this.#mediaQueryState.current ? "light" : "dark";
	}
	tracking(active) {
		this.#track = active;
	}
	constructor() {
		this.query = this.query.bind(this);
		this.tracking = this.tracking.bind(this);
	}
	get current() {
		return this.#current;
	}
};
/**
* Writable state that represents the user's preferred mode
* (`"dark"`, `"light"` or `"system"`)
*/
var userPrefersMode = new UserPrefersMode();
/**
* Readable store that represents the system's preferred mode (`"dark"`, `"light"` or `undefined`)
*/
var systemPrefersMode = new SystemPrefersMode();
//#endregion
//#region node_modules/mode-watcher/dist/theme-state.svelte.js
var CustomTheme = class {
	#storage = isBrowser ? localStorage : noopStorage;
	#initialValue = this.#storage.getItem(themeStorageKey.current);
	#value = this.#initialValue === null || this.#initialValue === void 0 ? "" : this.#initialValue;
	#persisted = this.#makePersisted();
	#makePersisted(value = this.#value) {
		return new PersistedState(themeStorageKey.current, value, { serializer: {
			serialize: (v) => {
				if (typeof v !== "string") return "";
				return v;
			},
			deserialize: (v) => v
		} });
	}
	constructor() {}
	/**
	* The current theme.
	* @returns The current theme.
	*/
	get current() {
		return this.#persisted.current;
	}
	/**
	* Set the current theme.
	* @param newValue The new theme to set.
	*/
	set current(newValue) {
		this.#persisted.current = newValue;
	}
};
/**
* A custom theme to apply and persist to the root `html` element.
*/
var customTheme = new CustomTheme();
//#endregion
//#region node_modules/mode-watcher/dist/without-transition.js
var timeoutAction;
var timeoutEnable;
/**
* Whether this is the first time the function has been
* called, which will be true for the initial load, where
* we shouldn't need to disable any transitions, as there
* is nothing to transition from.
*/
var hasLoaded = false;
var styleElement = null;
function getStyleElement() {
	if (styleElement) return styleElement;
	styleElement = document.createElement("style");
	styleElement.appendChild(document.createTextNode(`* {
		-webkit-transition: none !important;
		-moz-transition: none !important;
		-o-transition: none !important;
		-ms-transition: none !important;
		transition: none !important;
	}`));
	return styleElement;
}
function withoutTransition(action, synchronous = false) {
	if (typeof document === "undefined") return;
	if (!hasLoaded) {
		hasLoaded = true;
		action();
		return;
	}
	if (typeof process !== "undefined" && process.env.NODE_ENV === "test" || typeof window !== "undefined" && window.__vitest_worker__) {
		action();
		return;
	}
	clearTimeout(timeoutAction);
	clearTimeout(timeoutEnable);
	const style = getStyleElement();
	const disable = () => document.head.appendChild(style);
	const enable = () => {
		if (style.parentNode) document.head.removeChild(style);
	};
	function executeAction() {
		action();
		window.requestAnimationFrame(enable);
	}
	if (typeof window.requestAnimationFrame !== "undefined") {
		disable();
		if (synchronous) executeAction();
		else window.requestAnimationFrame(() => {
			executeAction();
		});
		return;
	}
	disable();
	timeoutAction = window.setTimeout(() => {
		action();
		timeoutEnable = window.setTimeout(enable, 16);
	}, 16);
}
//#endregion
//#region node_modules/mode-watcher/dist/states.svelte.js
var themeColors = box(void 0);
var disableTransitions = box(true);
var synchronousModeChanges = box(false);
var darkClassNames = box([]);
var lightClassNames = box([]);
function createDerivedMode() {
	const current = derived(() => {
		if (!isBrowser) return void 0;
		const derivedMode = userPrefersMode.current === "system" ? systemPrefersMode.current : userPrefersMode.current;
		const sanitizedDarkClassNames = sanitizeClassNames(darkClassNames.current);
		const sanitizedLightClassNames = sanitizeClassNames(lightClassNames.current);
		function update() {
			const htmlEl = document.documentElement;
			const themeColorEl = document.querySelector("meta[name=\"theme-color\"]");
			if (derivedMode === "light") {
				if (sanitizedDarkClassNames.length) htmlEl.classList.remove(...sanitizedDarkClassNames);
				if (sanitizedLightClassNames.length) htmlEl.classList.add(...sanitizedLightClassNames);
				htmlEl.style.colorScheme = "light";
				if (themeColorEl && themeColors.current) themeColorEl.setAttribute("content", themeColors.current.light);
			} else {
				if (sanitizedLightClassNames.length) htmlEl.classList.remove(...sanitizedLightClassNames);
				if (sanitizedDarkClassNames.length) htmlEl.classList.add(...sanitizedDarkClassNames);
				htmlEl.style.colorScheme = "dark";
				if (themeColorEl && themeColors.current) themeColorEl.setAttribute("content", themeColors.current.dark);
			}
		}
		if (disableTransitions.current) withoutTransition(update, synchronousModeChanges.current);
		else update();
		return derivedMode;
	});
	return { get current() {
		return current();
	} };
}
function createDerivedTheme() {
	const current = derived(() => {
		customTheme.current;
		if (!isBrowser) return void 0;
		function update() {
			document.documentElement.setAttribute("data-theme", customTheme.current);
		}
		if (disableTransitions.current) withoutTransition(update, run(() => synchronousModeChanges.current));
		else update();
		return customTheme.current;
	});
	return { get current() {
		return current();
	} };
}
/**
* Derived store that represents the current mode (`"dark"`, `"light"` or `undefined`)
*/
var derivedMode = createDerivedMode();
createDerivedTheme();
function defineConfig(config) {
	return config;
}
/** Used to set the mode on initial page load to prevent FOUC */
function setInitialMode({ defaultMode = "system", themeColors, darkClassNames = ["dark"], lightClassNames = [], defaultTheme = "", modeStorageKey = "mode-watcher-mode", themeStorageKey = "mode-watcher-theme" }) {
	const rootEl = document.documentElement;
	const mode = localStorage.getItem(modeStorageKey) ?? defaultMode;
	const theme = localStorage.getItem(themeStorageKey) ?? defaultTheme;
	const light = mode === "light" || mode === "system" && window.matchMedia("(prefers-color-scheme: light)").matches;
	if (light) {
		if (darkClassNames.length) rootEl.classList.remove(...darkClassNames.filter(Boolean));
		if (lightClassNames.length) rootEl.classList.add(...lightClassNames.filter(Boolean));
	} else {
		if (lightClassNames.length) rootEl.classList.remove(...lightClassNames.filter(Boolean));
		if (darkClassNames.length) rootEl.classList.add(...darkClassNames.filter(Boolean));
	}
	rootEl.style.colorScheme = light ? "light" : "dark";
	if (themeColors) {
		const themeMetaEl = document.querySelector("meta[name=\"theme-color\"]");
		if (themeMetaEl) themeMetaEl.setAttribute("content", mode === "light" ? themeColors.light : themeColors.dark);
	}
	if (theme) {
		rootEl.setAttribute("data-theme", theme);
		localStorage.setItem(themeStorageKey, theme);
	}
	localStorage.setItem(modeStorageKey, mode);
}
//#endregion
//#region node_modules/mode-watcher/dist/components/mode-watcher-lite.svelte
function Mode_watcher_lite($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { themeColors } = $$props;
		if (themeColors) $$renderer.push(`<!--[0--><meta name="theme-color"${attr("content", themeColors.dark)}/>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/mode-watcher/dist/components/mode-watcher-full.svelte
function Mode_watcher_full($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { trueNonce = "", initConfig, themeColors } = $$props;
		head("1funsus", $$renderer, ($$renderer) => {
			if (themeColors) $$renderer.push(`<!--[0--><meta name="theme-color"${attr("content", themeColors.dark)}/>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> ${html(`<script${trueNonce ? ` nonce=${trueNonce}` : ""}>(` + setInitialMode.toString() + `)(` + JSON.stringify(initConfig) + `);<\/script>`)}`);
		});
	});
}
//#endregion
//#region node_modules/mode-watcher/dist/components/mode-watcher.svelte
function Mode_watcher($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { track = true, defaultMode = "system", themeColors: themeColorsProp, disableTransitions: disableTransitionsProp = true, darkClassNames: darkClassNamesProp = ["dark"], lightClassNames: lightClassNamesProp = [], defaultTheme = "", nonce = "", themeStorageKey: themeStorageKeyProp = "mode-watcher-theme", modeStorageKey: modeStorageKeyProp = "mode-watcher-mode", disableHeadScriptInjection = false, synchronousModeChanges: synchronousModeChangesProp = false } = $$props;
		modeStorageKey.current = modeStorageKeyProp;
		themeStorageKey.current = themeStorageKeyProp;
		darkClassNames.current = darkClassNamesProp;
		lightClassNames.current = lightClassNamesProp;
		disableTransitions.current = disableTransitionsProp;
		themeColors.current = themeColorsProp;
		synchronousModeChanges.current = synchronousModeChangesProp;
		const initConfig = defineConfig({
			defaultMode,
			themeColors: themeColorsProp,
			darkClassNames: darkClassNamesProp,
			lightClassNames: lightClassNamesProp,
			defaultTheme,
			modeStorageKey: modeStorageKeyProp,
			themeStorageKey: themeStorageKeyProp
		});
		const trueNonce = derived(() => typeof window === "undefined" ? nonce : "");
		if (disableHeadScriptInjection) {
			$$renderer.push("<!--[0-->");
			Mode_watcher_lite($$renderer, { themeColors: themeColors.current });
		} else {
			$$renderer.push("<!--[-1-->");
			Mode_watcher_full($$renderer, {
				trueNonce: trueNonce(),
				initConfig,
				themeColors: themeColors.current
			});
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/svelte-sonner/dist/Loader.svelte
var bars = Array(12).fill(0);
function Loader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { visible, class: className } = $$props;
		$$renderer.push(`<div${attr_class(clsx$1(["sonner-loading-wrapper", className].filter(Boolean).join(" ")))}${attr("data-visible", visible)}><div class="sonner-spinner"><!--[-->`);
		const each_array = ensure_array_like(bars);
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			each_array[i];
			$$renderer.push(`<div class="sonner-loading-bar"></div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region node_modules/svelte-sonner/node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow = void 0;
//#endregion
//#region node_modules/svelte-sonner/node_modules/runed/dist/internal/utils/dom.js
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
//#region node_modules/svelte-sonner/node_modules/runed/dist/utilities/active-element/active-element.svelte.js
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
//#region node_modules/svelte-sonner/node_modules/runed/dist/utilities/context/context.js
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
//#region node_modules/svelte-sonner/node_modules/runed/dist/utilities/watch/watch.svelte.js
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
//#region node_modules/svelte-sonner/node_modules/runed/dist/utilities/resource/resource.svelte.js
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
	let loading = false;
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
new Context("richColorsContext");
var sonnerContext = new Context("<Toaster/>");
//#endregion
//#region node_modules/svelte-sonner/dist/types.js
function isAction(action) {
	return action.label !== void 0;
}
//#endregion
//#region node_modules/svelte-sonner/dist/internal/use-document-hidden.svelte.js
function useDocumentHidden() {
	let current = typeof document !== "undefined" ? document.hidden : false;
	return { get current() {
		return current;
	} };
}
//#endregion
//#region node_modules/svelte-sonner/dist/Toast.svelte
var TOAST_LIFETIME$1 = 4e3;
var GAP$1 = 14;
var TIME_BEFORE_UNMOUNT = 200;
var DEFAULT_TOAST_CLASSES = {
	toast: "",
	title: "",
	description: "",
	loader: "",
	closeButton: "",
	cancelButton: "",
	actionButton: "",
	action: "",
	warning: "",
	error: "",
	success: "",
	default: "",
	info: "",
	loading: ""
};
function getDefaultSwipeDirections(position) {
	const [y, x] = position.split("-");
	const directions = [];
	if (y) directions.push(y);
	if (x) directions.push(x);
	return directions;
}
function Toast($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { toast, index, expanded, invert: invertFromToaster, position, visibleToasts, expandByDefault, closeButton: closeButtonFromToaster, interacting, cancelButtonStyle = "", actionButtonStyle = "", duration: durationFromToaster, descriptionClass = "", classes: classesProp, unstyled = false, loadingIcon, successIcon, errorIcon, warningIcon, closeIcon, infoIcon, defaultRichColors = false, gap = GAP$1, swipeDirections: swipeDirectionsProp, closeButtonAriaLabel, pauseWhenPageIsHidden, $$slots, $$events, ...restProps } = $$props;
		const defaultClasses = { ...DEFAULT_TOAST_CLASSES };
		let mounted = false;
		let removed = false;
		let swiping = false;
		let swipeOut = false;
		let isSwiped = false;
		let offsetBeforeRemove = 0;
		let initialHeight = 0;
		toast.duration;
		let swipeOutDirection = null;
		const isFront = derived(() => index === 0);
		const isVisible = derived(() => index + 1 <= visibleToasts);
		const toastType = derived(() => toast.type);
		const dismissible = derived(() => toast.dismissible !== void 0 ? toast.dismissible !== false : toast.dismissable !== false);
		const toastClass = derived(() => toast.class || "");
		const toastDescriptionClass = derived(() => toast.descriptionClass || "");
		const relevantHeights = derived(() => toastState.heights.filter((height) => height.toasterId === toast.toasterId && height.position === position));
		const heightIndex = derived(() => {
			const idx = relevantHeights().findIndex((height) => height.toastId === toast.id);
			return idx === -1 ? 0 : idx;
		});
		const closeButton = derived(() => toast.closeButton ?? closeButtonFromToaster);
		derived(() => toast.duration ?? durationFromToaster ?? TOAST_LIFETIME$1);
		const coords = derived(() => position.split("-"));
		derived(() => swipeDirectionsProp ?? getDefaultSwipeDirections(position));
		const toastsHeightBefore = derived(() => relevantHeights().reduce((prev, curr, reducerIndex) => {
			if (reducerIndex >= heightIndex()) return prev;
			return prev + curr.height;
		}, 0));
		useDocumentHidden();
		const invert = derived(() => toast.invert || invertFromToaster);
		const disabled = derived(() => toastType() === "loading");
		const classes = derived(() => ({
			...defaultClasses,
			...classesProp
		}));
		derived(() => toast.title);
		derived(() => toast.description);
		const offset = derived(() => Math.round(heightIndex() * gap + toastsHeightBefore()));
		function deleteToast() {
			removed = true;
			offsetBeforeRemove = offset();
			toastState.removeHeight(toast.id);
			toastState.markDismissed(toast.id);
			toastState.scheduleRemoval(toast.id, TIME_BEFORE_UNMOUNT);
		}
		derived(() => toast.promise && toastType() === "loading" || toast.duration === Number.POSITIVE_INFINITY);
		const icon = derived(() => {
			if (toast.icon) return toast.icon;
			if (toastType() === "success") return successIcon;
			if (toastType() === "error") return errorIcon;
			if (toastType() === "warning") return warningIcon;
			if (toastType() === "info") return infoIcon;
			if (toastType() === "loading") return loadingIcon;
			return null;
		});
		function LoadingIcon($$renderer) {
			if (loadingIcon) {
				$$renderer.push(`<!--[0--><div${attr_class(clsx$1(cn(classes()?.loader, toast?.classes?.loader, "sonner-loader")))}${attr("data-visible", toastType() === "loading")}>`);
				loadingIcon($$renderer);
				$$renderer.push(`<!----></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				Loader($$renderer, {
					class: cn(classes()?.loader, toast.classes?.loader),
					visible: toastType() === "loading"
				});
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<li${attr("tabindex", 0)}${attr_class(clsx$1(cn(restProps.class, toastClass(), classes()?.toast, toast?.classes?.toast, classes()?.[toastType()], toast?.classes?.[toastType()])))}${attr("aria-live", toast.important ? "assertive" : "polite")} aria-atomic="true" data-sonner-toast=""${attr("data-rich-colors", toast.richColors ?? defaultRichColors)}${attr("data-styled", !(toast.component || toast.unstyled || unstyled))}${attr("data-mounted", mounted)}${attr("data-promise", Boolean(toast.promise))}${attr("data-swiped", isSwiped)}${attr("data-removed", removed)}${attr("data-visible", isVisible())}${attr("data-y-position", coords()[0])}${attr("data-x-position", coords()[1])}${attr("data-index", index)}${attr("data-front", isFront())}${attr("data-swiping", swiping)}${attr("data-dismissible", dismissible())}${attr("data-type", toastType())}${attr("data-invert", invert())}${attr("data-swipe-out", swipeOut)}${attr("data-swipe-direction", swipeOutDirection)}${attr("data-expanded", Boolean(expanded || expandByDefault && mounted))}${attr_style(`${restProps.style} ${toast.style}`, {
			"--index": index,
			"--toasts-before": index,
			"--z-index": toastState.toasts.length - index,
			"--offset": `${removed ? offsetBeforeRemove : offset()}px`,
			"--initial-height": expandByDefault ? "auto" : `${initialHeight}px`
		})}>`);
		if (closeButton() && !toast.component && toastType() !== "loading" && closeIcon !== null) {
			$$renderer.push(`<!--[0--><button${attr("aria-label", closeButtonAriaLabel)}${attr("data-disabled", disabled())} data-close-button=""${attr_class(clsx$1(cn(classes()?.closeButton, toast?.classes?.closeButton)))}>`);
			closeIcon?.($$renderer);
			$$renderer.push(`<!----></button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (toast.component) {
			$$renderer.push("<!--[0-->");
			const Component = toast.component;
			if (Component) {
				$$renderer.push("<!--[-->");
				Component($$renderer, spread_props([toast.componentProps, { closeToast: deleteToast }]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		} else {
			$$renderer.push("<!--[-1-->");
			if ((toastType() || toast.icon || toast.promise) && toast.icon !== null && (icon() !== null || toast.icon)) {
				$$renderer.push(`<!--[0--><div data-icon=""${attr_class(clsx$1(cn(classes()?.icon, toast?.classes?.icon)))}>`);
				if (toastType() === "loading") {
					$$renderer.push("<!--[0-->");
					if (toast.icon) {
						$$renderer.push("<!--[0-->");
						if (toast.icon) {
							$$renderer.push("<!--[-->");
							toast.icon($$renderer, {});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					} else {
						$$renderer.push("<!--[-1-->");
						LoadingIcon($$renderer);
					}
					$$renderer.push(`<!--]-->`);
				} else if (toast.promise) {
					$$renderer.push("<!--[1-->");
					LoadingIcon($$renderer);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (toastType() !== "loading") {
					$$renderer.push("<!--[0-->");
					if (toast.icon) {
						$$renderer.push("<!--[0-->");
						if (toast.icon) {
							$$renderer.push("<!--[-->");
							toast.icon($$renderer, {});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					} else if (toastType() === "success") {
						$$renderer.push("<!--[1-->");
						successIcon?.($$renderer);
						$$renderer.push(`<!---->`);
					} else if (toastType() === "error") {
						$$renderer.push("<!--[2-->");
						errorIcon?.($$renderer);
						$$renderer.push(`<!---->`);
					} else if (toastType() === "warning") {
						$$renderer.push("<!--[3-->");
						warningIcon?.($$renderer);
						$$renderer.push(`<!---->`);
					} else if (toastType() === "info") {
						$$renderer.push("<!--[4-->");
						infoIcon?.($$renderer);
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div data-content=""${attr_class(clsx$1(cn(classes()?.content, toast?.classes?.content)))}><div data-title=""${attr_class(clsx$1(cn(classes()?.title, toast?.classes?.title)))}>`);
			if (toast.title) {
				$$renderer.push("<!--[0-->");
				if (typeof toast.title !== "string") {
					$$renderer.push("<!--[0-->");
					const Title = toast.title;
					if (Title) {
						$$renderer.push("<!--[-->");
						Title($$renderer, spread_props([toast.componentProps]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				} else $$renderer.push(`<!--[-1-->${escape_html(toast.title)}`);
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			if (toast.description) {
				$$renderer.push(`<!--[0--><div data-description=""${attr_class(clsx$1(cn(descriptionClass, toastDescriptionClass(), classes()?.description, toast.classes?.description)))}>`);
				if (typeof toast.description !== "string") {
					$$renderer.push("<!--[0-->");
					const Description = toast.description;
					if (Description) {
						$$renderer.push("<!--[-->");
						Description($$renderer, spread_props([toast.componentProps]));
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				} else $$renderer.push(`<!--[-1-->${escape_html(toast.description)}`);
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			if (toast.cancel) {
				$$renderer.push("<!--[0-->");
				if (typeof toast.cancel === "function") {
					$$renderer.push("<!--[0-->");
					if (toast.cancel) {
						$$renderer.push("<!--[-->");
						toast.cancel($$renderer, {});
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				} else if (isAction(toast.cancel)) $$renderer.push(`<!--[1--><button data-button="" data-cancel=""${attr_style(toast.cancelButtonStyle ?? cancelButtonStyle)}${attr_class(clsx$1(cn(classes()?.cancelButton, toast?.classes?.cancelButton)))}>${escape_html(toast.cancel.label)}</button>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (toast.action) {
				$$renderer.push("<!--[0-->");
				if (typeof toast.action === "function") {
					$$renderer.push("<!--[0-->");
					if (toast.action) {
						$$renderer.push("<!--[-->");
						toast.action($$renderer, {});
						$$renderer.push("<!--]-->");
					} else {
						$$renderer.push("<!--[!-->");
						$$renderer.push("<!--]-->");
					}
				} else if (isAction(toast.action)) $$renderer.push(`<!--[1--><button data-button=""${attr_style(toast.actionButtonStyle ?? actionButtonStyle)}${attr_class(clsx$1(cn(classes()?.actionButton, toast?.classes?.actionButton)))}>${escape_html(toast.action.label)}</button>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></li>`);
	});
}
//#endregion
//#region node_modules/svelte-sonner/dist/icons/SuccessIcon.svelte
function SuccessIcon($$renderer) {
	$$renderer.push(`<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" data-sonner-success-icon=""><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"></path></svg>`);
}
//#endregion
//#region node_modules/svelte-sonner/dist/icons/ErrorIcon.svelte
function ErrorIcon($$renderer) {
	$$renderer.push(`<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" data-sonner-error-icon=""><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>`);
}
//#endregion
//#region node_modules/svelte-sonner/dist/icons/WarningIcon.svelte
function WarningIcon($$renderer) {
	$$renderer.push(`<svg aria-hidden="true" viewBox="0 0 64 64" fill="currentColor" height="20" width="20" data-sonner-warning-icon="" xmlns="http://www.w3.org/2000/svg"><path d="M32.427,7.987c2.183,0.124 4,1.165 5.096,3.281l17.936,36.208c1.739,3.66 -0.954,8.585 -5.373,8.656l-36.119,0c-4.022,-0.064 -7.322,-4.631 -5.352,-8.696l18.271,-36.207c0.342,-0.65 0.498,-0.838 0.793,-1.179c1.186,-1.375 2.483,-2.111 4.748,-2.063Zm-0.295,3.997c-0.687,0.034 -1.316,0.419 -1.659,1.017c-6.312,11.979 -12.397,24.081 -18.301,36.267c-0.546,1.225 0.391,2.797 1.762,2.863c12.06,0.195 24.125,0.195 36.185,0c1.325,-0.064 2.321,-1.584 1.769,-2.85c-5.793,-12.184 -11.765,-24.286 -17.966,-36.267c-0.366,-0.651 -0.903,-1.042 -1.79,-1.03Z"></path><path d="M33.631,40.581l-3.348,0l-0.368,-16.449l4.1,0l-0.384,16.449Zm-3.828,5.03c0,-0.609 0.197,-1.113 0.592,-1.514c0.396,-0.4 0.935,-0.601 1.618,-0.601c0.684,0 1.223,0.201 1.618,0.601c0.395,0.401 0.593,0.905 0.593,1.514c0,0.587 -0.193,1.078 -0.577,1.473c-0.385,0.395 -0.929,0.593 -1.634,0.593c-0.705,0 -1.249,-0.198 -1.634,-0.593c-0.384,-0.395 -0.576,-0.886 -0.576,-1.473Z"></path></svg>`);
}
//#endregion
//#region node_modules/svelte-sonner/dist/icons/InfoIcon.svelte
function InfoIcon($$renderer) {
	$$renderer.push(`<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20" data-sonner-info-icon=""><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"></path></svg>`);
}
//#endregion
//#region node_modules/svelte-sonner/dist/icons/CloseIcon.svelte
function CloseIcon($$renderer) {
	$$renderer.push(`<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-sonner-close-icon=""><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`);
}
//#endregion
//#region node_modules/svelte-sonner/dist/Toaster.svelte
var VISIBLE_TOASTS_AMOUNT = 3;
var VIEWPORT_OFFSET = "24px";
var MOBILE_VIEWPORT_OFFSET = "16px";
var TOAST_LIFETIME = 4e3;
var TOAST_WIDTH = 356;
var GAP = 14;
var DARK = "dark";
var LIGHT = "light";
function getOffsetObject(defaultOffset, mobileOffset) {
	const styles = {};
	[defaultOffset, mobileOffset].forEach((offset, index) => {
		const isMobile = index === 1;
		const prefix = isMobile ? "--mobile-offset" : "--offset";
		const defaultValue = isMobile ? MOBILE_VIEWPORT_OFFSET : VIEWPORT_OFFSET;
		function assignAll(offset) {
			[
				"top",
				"right",
				"bottom",
				"left"
			].forEach((key) => {
				styles[`${prefix}-${key}`] = typeof offset === "number" ? `${offset}px` : offset;
			});
		}
		if (typeof offset === "number" || typeof offset === "string") assignAll(offset);
		else if (typeof offset === "object") [
			"top",
			"right",
			"bottom",
			"left"
		].forEach((key) => {
			const value = offset[key];
			if (value === void 0) styles[`${prefix}-${key}`] = defaultValue;
			else styles[`${prefix}-${key}`] = typeof value === "number" ? `${value}px` : value;
		});
		else assignAll(defaultValue);
	});
	return styles;
}
function Toaster($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		function getInitialTheme(t) {
			if (t !== "system") return t;
			if (typeof window !== "undefined") {
				if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return DARK;
				return LIGHT;
			}
			return LIGHT;
		}
		let { id, invert = false, position = "bottom-right", hotkey = ["altKey", "KeyT"], expand = false, closeButton = false, offset = VIEWPORT_OFFSET, mobileOffset = MOBILE_VIEWPORT_OFFSET, theme = "light", richColors = false, duration = TOAST_LIFETIME, visibleToasts = VISIBLE_TOASTS_AMOUNT, toastOptions = {}, dir = "auto", gap = GAP, swipeDirections, pauseWhenPageIsHidden = false, loadingIcon: loadingIconProp, successIcon: successIconProp, errorIcon: errorIconProp, warningIcon: warningIconProp, closeIcon: closeIconProp, infoIcon: infoIconProp, containerAriaLabel = "Notifications", class: className, closeButtonAriaLabel = "Close toast", onblur, onfocus, onmouseenter, onmousemove, onmouseleave, ondragend, onpointerdown, onpointerup, $$slots, $$events, ...restProps } = $$props;
		function getDocumentDirection() {
			if (dir !== "auto") return dir;
			if (typeof window === "undefined") return "ltr";
			if (typeof document === "undefined") return "ltr";
			const dirAttribute = document.documentElement.getAttribute("dir");
			if (dirAttribute === "auto" || !dirAttribute) {
				run(() => dir = window.getComputedStyle(document.documentElement).direction ?? "ltr");
				return dir;
			}
			run(() => dir = dirAttribute);
			return dirAttribute;
		}
		const filteredToasts = derived(() => id ? toastState.toasts.filter((toast) => toast.toasterId === id) : toastState.toasts.filter((toast) => !toast.toasterId));
		const possiblePositions = derived(() => Array.from(new Set([position, ...filteredToasts().filter((toast) => toast.position).map((toast) => toast.position)].filter(Boolean))));
		let expanded = false;
		let interacting = false;
		let actualTheme = getInitialTheme(theme);
		const hotkeyLabel = derived(() => hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, ""));
		sonnerContext.set(new SonnerState());
		$$renderer.push(`<section${attr("aria-label", `${stringify(containerAriaLabel)} ${stringify(hotkeyLabel())}`)}${attr("tabindex", -1)} aria-live="polite" aria-relevant="additions text" aria-atomic="false">`);
		if (filteredToasts().length > 0) {
			$$renderer.push(`<!--[0--><!--[-->`);
			const each_array = ensure_array_like(possiblePositions());
			for (let index = 0, $$length = each_array.length; index < $$length; index++) {
				let position = each_array[index];
				const [y, x] = position.split("-");
				const offsetObject = getOffsetObject(offset, mobileOffset);
				const frontHeight = toastState.heights.find((height) => height.toasterId === id && height.position === position)?.height ?? 0;
				$$renderer.push(`<ol${attributes({
					tabindex: -1,
					dir: getDocumentDirection(),
					class: clsx$1(className),
					"data-sonner-toaster": true,
					"data-sonner-theme": actualTheme,
					"data-y-position": y,
					"data-x-position": x,
					style: restProps.style,
					...restProps
				}, void 0, void 0, {
					"--front-toast-height": `${frontHeight}px`,
					"--width": `${TOAST_WIDTH}px`,
					"--gap": `${gap}px`,
					"--offset-top": offsetObject["--offset-top"],
					"--offset-right": offsetObject["--offset-right"],
					"--offset-bottom": offsetObject["--offset-bottom"],
					"--offset-left": offsetObject["--offset-left"],
					"--mobile-offset-top": offsetObject["--mobile-offset-top"],
					"--mobile-offset-right": offsetObject["--mobile-offset-right"],
					"--mobile-offset-bottom": offsetObject["--mobile-offset-bottom"],
					"--mobile-offset-left": offsetObject["--mobile-offset-left"]
				})}><!--[-->`);
				const each_array_1 = ensure_array_like(filteredToasts().filter((toast) => !toast.position && index === 0 || toast.position === position));
				for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
					let toast = each_array_1[index];
					{
						function successIcon($$renderer) {
							if (successIconProp) {
								$$renderer.push("<!--[0-->");
								successIconProp?.($$renderer);
								$$renderer.push(`<!---->`);
							} else if (successIconProp !== null) {
								$$renderer.push("<!--[1-->");
								SuccessIcon($$renderer, {});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						function errorIcon($$renderer) {
							if (errorIconProp) {
								$$renderer.push("<!--[0-->");
								errorIconProp?.($$renderer);
								$$renderer.push(`<!---->`);
							} else if (errorIconProp !== null) {
								$$renderer.push("<!--[1-->");
								ErrorIcon($$renderer, {});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						function warningIcon($$renderer) {
							if (warningIconProp) {
								$$renderer.push("<!--[0-->");
								warningIconProp?.($$renderer);
								$$renderer.push(`<!---->`);
							} else if (warningIconProp !== null) {
								$$renderer.push("<!--[1-->");
								WarningIcon($$renderer, {});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						function infoIcon($$renderer) {
							if (infoIconProp) {
								$$renderer.push("<!--[0-->");
								infoIconProp?.($$renderer);
								$$renderer.push(`<!---->`);
							} else if (infoIconProp !== null) {
								$$renderer.push("<!--[1-->");
								InfoIcon($$renderer, {});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						function closeIcon($$renderer) {
							if (closeIconProp) {
								$$renderer.push("<!--[0-->");
								closeIconProp?.($$renderer);
								$$renderer.push(`<!---->`);
							} else if (closeIconProp !== null) {
								$$renderer.push("<!--[1-->");
								CloseIcon($$renderer, {});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						Toast($$renderer, {
							index,
							toast,
							defaultRichColors: richColors,
							duration: toastOptions?.duration ?? duration,
							class: toastOptions?.class ?? "",
							descriptionClass: toastOptions?.descriptionClass || "",
							invert,
							visibleToasts,
							closeButton: toastOptions?.closeButton ?? closeButton,
							interacting,
							position,
							gap,
							style: toastOptions?.style ?? "",
							classes: toastOptions.classes || {},
							unstyled: toastOptions.unstyled ?? false,
							cancelButtonStyle: toastOptions?.cancelButtonStyle ?? "",
							actionButtonStyle: toastOptions?.actionButtonStyle ?? "",
							closeButtonAriaLabel: toastOptions?.closeButtonAriaLabel ?? closeButtonAriaLabel,
							expandByDefault: expand,
							expanded,
							swipeDirections,
							pauseWhenPageIsHidden,
							loadingIcon: loadingIconProp,
							successIcon,
							errorIcon,
							warningIcon,
							infoIcon,
							closeIcon,
							$$slots: {
								successIcon: true,
								errorIcon: true,
								warningIcon: true,
								infoIcon: true,
								closeIcon: true
							}
						});
					}
				}
				$$renderer.push(`<!--]--></ol>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/circle-check.svelte
function Circle_check($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([props, { icon: {
		"name": "circle-check",
		"size": 24,
		"node": [["circle", {
			"cx": "12",
			"cy": "12",
			"r": "10"
		}], ["path", { "d": "m16 9-5.5 5.5L8 12" }]],
		"aliases": ["check-circle-2"]
	} }]));
}
//#endregion
//#region node_modules/@lucide/svelte/dist/icons/octagon-x.svelte
function Octagon_x($$renderer, $$props) {
	let { $$slots, $$events, ...props } = $$props;
	Icon($$renderer, spread_props([props, { icon: {
		"name": "octagon-x",
		"size": 24,
		"node": [
			["path", { "d": "m15 9-6 6" }],
			["path", { "d": "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z" }],
			["path", { "d": "m9 9 6 6" }]
		],
		"aliases": ["x-octagon"]
	} }]));
}
//#endregion
//#region src/lib/components/ui/sonner/sonner.svelte
function Sonner_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { $$slots, $$events, ...restProps } = $$props;
		{
			function loadingIcon($$renderer) {
				Loader_circle($$renderer, { class: "size-4 animate-spin" });
			}
			function successIcon($$renderer) {
				Circle_check($$renderer, { class: "size-4" });
			}
			function errorIcon($$renderer) {
				Octagon_x($$renderer, { class: "size-4" });
			}
			function infoIcon($$renderer) {
				Info($$renderer, { class: "size-4" });
			}
			function warningIcon($$renderer) {
				Triangle_alert($$renderer, { class: "size-4" });
			}
			Toaster($$renderer, spread_props([
				{
					theme: derivedMode.current,
					class: "toaster group",
					style: "--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);",
					toastOptions: { classes: { toast: "cn-toast" } }
				},
				restProps,
				{
					loadingIcon,
					successIcon,
					errorIcon,
					infoIcon,
					warningIcon,
					$$slots: {
						loadingIcon: true,
						successIcon: true,
						errorIcon: true,
						infoIcon: true,
						warningIcon: true
					}
				}
			]));
		}
	});
}
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	let { children } = $$props;
	Mode_watcher($$renderer, {});
	$$renderer.push(`<!----> `);
	Sonner_1($$renderer, {});
	$$renderer.push(`<!----> `);
	if (Tooltip_provider) {
		$$renderer.push("<!--[-->");
		Tooltip_provider($$renderer, {
			children: ($$renderer) => {
				children($$renderer);
				$$renderer.push(`<!---->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push("<!--]-->");
	} else {
		$$renderer.push("<!--[!-->");
		$$renderer.push("<!--]-->");
	}
}
//#endregion
export { _layout as default };

//# sourceMappingURL=_layout.svelte.js.map