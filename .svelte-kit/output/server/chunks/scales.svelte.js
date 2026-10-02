import "./server.js";
import "./motion.svelte.js";
import { s as accessor } from "./chart.js";
import "@layerstack/utils";
import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
//#region node_modules/layerchart/dist/utils/scales.svelte.js
function isAnyScale(scale) {
	return typeof scale === "function" && typeof scale.range === "function";
}
function isScaleBand(scale) {
	return typeof scale.bandwidth === "function";
}
function isScaleTime(scale) {
	const domain = scale.domain();
	return domain[0] instanceof Date || domain[1] instanceof Date;
}
/**
* Whether a time scale floors on UTC boundaries (`scaleUtc()`) rather than local ones
* (`scaleTime()`).
*
* d3 exposes no marker distinguishing the two, so probe the scale's own tick generator: ask a
* copy for daily ticks over a fixed multi-day window and check whether they land on UTC
* midnight. A local scale returns local midnights, which are only UTC midnight when the
* ambient offset is 0 — and there the distinction doesn't matter anyway.
*/
function isScaleUtc(scale) {
	if (!isScaleTime(scale)) return false;
	if (typeof scale.ticks !== "function" || typeof scale.copy !== "function") return false;
	const ticks = scale.copy().domain([new Date(Date.UTC(2024, 0, 1)), new Date(Date.UTC(2024, 0, 4))]).ticks(3);
	return ticks.length > 0 && ticks.every((tick) => tick.getUTCHours() === 0 && tick.getUTCMinutes() === 0 && tick.getUTCSeconds() === 0);
}
function isScaleNumeric(scale) {
	const domain = scale.domain();
	return typeof domain[0] === "number" || typeof domain[1] === "number";
}
function getRange(scale) {
	if (isAnyScale(scale)) return scale.range();
	console.error("[LayerChart] Your scale doesn't have a `.range` method?");
	return [];
}
/**
* Implementation for missing `scaleBand().invert()`
*
*  See: https://stackoverflow.com/questions/38633082/d3-getting-invert-value-of-band-scales
*      https://github.com/d3/d3-scale/pull/64
*      https://github.com/vega/vega-scale/blob/master/src/scaleBand.js#L118
*      https://observablehq.com/@d3/ordinal-brushing
* 			https://github.com/d3/d3-scale/blob/11777dac7d4b0b3e229d658aee3257ea67bd5ffa/src/band.js#L32
* 			https://gist.github.com/LuisSevillano/d53a1dc529eef518780c6df99613e2fd
*/
function scaleBandInvert(scale) {
	const domain = scale.domain();
	const eachBand = scale.step();
	const rangeStart = scale.range()[0];
	const paddingOuter = scale.paddingOuter?.() ?? scale.padding();
	return function(value) {
		const index = Math.floor((value - rangeStart) / eachBand - paddingOuter);
		return domain[Math.max(0, Math.min(index, domain.length - 1))];
	};
}
/**
*  Generic way to invert a scale value, handling scaleBand and continuous scales (linear, time, etc).
*  Useful to map mouse event location (x,y) to domain value
*/
function scaleInvert(scale, value) {
	if (isScaleBand(scale)) return scaleBandInvert(scale)(value);
	else return scale.invert?.(value);
}
/** Create new copy of scale with domain and range */
function createScale(scale, domain, range, context) {
	const scaleCopy = scale.copy();
	if (domain) scaleCopy.domain(domain);
	if (range != null) {
		if (typeof range === "function") scaleCopy.range(range(context));
		else scaleCopy.range(range);
	}
	return scaleCopy;
}
/**
* Auto-detect scale type based on domain values or data values
*/
function autoScale(domain, data, propAccessor) {
	let values = null;
	if (domain && domain.length > 0 && domain.some((d) => d != null)) values = domain.filter((d) => d != null);
	else if (data && data.length > 0 && propAccessor) {
		const value = accessor(propAccessor)(data[0]);
		if (Array.isArray(value)) values = value;
		else values = [value];
	}
	if (values) {
		if (values.some((v) => v instanceof Date)) return scaleTime();
		else if (values.some((v) => typeof v === "number")) return scaleLinear();
		else if (values.some((v) => typeof v === "string")) return scaleBand();
	}
	return scaleLinear();
}
function canBeZero(val) {
	if (val === 0) return true;
	return val;
}
function makeAccessor(acc) {
	if (!canBeZero(acc)) return null;
	if (Array.isArray(acc)) return (d) => acc.map((k) => {
		return typeof k !== "function" ? d[k] : k(d);
	});
	else if (typeof acc !== "function") return (d) => d[acc];
	return acc;
}
//#endregion
export { isScaleNumeric as a, makeAccessor as c, isScaleBand as i, scaleInvert as l, createScale as n, isScaleTime as o, getRange as r, isScaleUtc as s, autoScale as t };

//# sourceMappingURL=scales.svelte.js.map