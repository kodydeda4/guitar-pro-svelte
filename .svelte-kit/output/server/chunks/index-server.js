import { A as set_active_reaction, D as active_reaction, E as active_effect, It as define_property, at as queue_micro_task, k as set_active_effect, rt as without_reactive_context } from "./server.js";
//#region node_modules/svelte/src/internal/client/dom/elements/events.js
/**
* Used on elements, as a map of event type -> event handler,
* and on events themselves to track which element handled an event
*/
var event_symbol = Symbol("events");
/** @type {Set<string>} */
var all_registered_events = /* @__PURE__ */ new Set();
/** @type {Set<(events: Array<string>) => void>} */
var root_event_handles = /* @__PURE__ */ new Set();
/**
* @param {string} event_name
* @param {EventTarget} dom
* @param {EventListener} [handler]
* @param {AddEventListenerOptions} [options]
*/
function create_event(event_name, dom, handler, options = {}) {
	/**
	* @this {EventTarget}
	*/
	function target_handler(event) {
		if (!options.capture) handle_event_propagation.call(dom, event);
		if (!event.cancelBubble) return without_reactive_context(() => {
			return handler?.call(this, event);
		});
	}
	if (event_name.startsWith("pointer") || event_name.startsWith("touch") || event_name === "wheel") {
		target_handler.__removed = false;
		queue_micro_task(() => {
			if (!target_handler.__removed) dom.addEventListener(event_name, target_handler, options);
		});
	} else dom.addEventListener(event_name, target_handler, options);
	return target_handler;
}
/**
* Attaches an event handler to an element and returns a function that removes the handler. Using this
* rather than `addEventListener` will preserve the correct order relative to handlers added declaratively
* (with attributes like `onclick`), which use event delegation for performance reasons
*
* @param {EventTarget} element
* @param {string} type
* @param {EventListener} handler
* @param {AddEventListenerOptions} [options]
*/
function on(element, type, handler, options = {}) {
	var target_handler = create_event(type, element, handler, options);
	return () => {
		target_handler.__removed = true;
		element.removeEventListener(type, target_handler, options);
	};
}
var last_propagated_event = null;
var last_propagated_event_clear_scheduled = false;
/**
* @this {EventTarget}
* @param {Event} event
* @returns {void}
*/
function handle_event_propagation(event) {
	var handler_element = this;
	var owner_document = handler_element.ownerDocument;
	var event_name = event.type;
	var path = event.composedPath?.() || [];
	var current_target = path[0] || event.target;
	last_propagated_event = event;
	if (!last_propagated_event_clear_scheduled) {
		last_propagated_event_clear_scheduled = true;
		setTimeout(() => {
			last_propagated_event_clear_scheduled = false;
			last_propagated_event = null;
		});
	}
	var path_idx = 0;
	var handled_at = last_propagated_event === event && event[event_symbol];
	if (handled_at) {
		var at_idx = path.indexOf(handled_at);
		if (at_idx !== -1 && (handler_element === document || handler_element === window)) {
			event[event_symbol] = handler_element;
			return;
		}
		var handler_idx = path.indexOf(handler_element);
		if (handler_idx === -1) return;
		if (at_idx <= handler_idx) path_idx = at_idx;
	}
	current_target = path[path_idx] || event.target;
	if (current_target === handler_element) return;
	define_property(event, "currentTarget", {
		configurable: true,
		get() {
			return current_target || owner_document;
		}
	});
	var previous_reaction = active_reaction;
	var previous_effect = active_effect;
	set_active_reaction(null);
	set_active_effect(null);
	try {
		/**
		* @type {unknown}
		*/
		var throw_error;
		/**
		* @type {unknown[]}
		*/
		var other_errors = [];
		while (current_target !== null) {
			if (current_target === handler_element) break;
			try {
				var delegated = current_target[event_symbol]?.[event_name];
				if (delegated != null && (!current_target.disabled || event.target === current_target)) delegated.call(current_target, event);
			} catch (error) {
				if (throw_error) other_errors.push(error);
				else throw_error = error;
			}
			if (event.cancelBubble) break;
			path_idx++;
			current_target = path_idx < path.length ? path[path_idx] : null;
		}
		if (throw_error) {
			for (let error of other_errors) queueMicrotask(() => {
				throw error;
			});
			throw throw_error;
		}
	} finally {
		event[event_symbol] = handler_element;
		delete event.currentTarget;
		set_active_reaction(previous_reaction);
		set_active_effect(previous_effect);
	}
}
globalThis.Date;
var SvelteSet = globalThis.Set;
var SvelteMap = globalThis.Map;
globalThis.URL;
globalThis.URLSearchParams;
var MediaQuery = class {
	current;
	/**
	* @param {string} query
	* @param {boolean} [matches]
	*/
	constructor(query, matches = false) {
		this.current = matches;
	}
};
/**
* @param {any} _
*/
function createSubscriber(_) {
	return () => {};
}
//#endregion
export { all_registered_events as a, root_event_handles as c, createSubscriber as i, SvelteMap as n, handle_event_propagation as o, SvelteSet as r, on as s, MediaQuery as t };

//# sourceMappingURL=index-server.js.map