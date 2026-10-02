import * as devalue from "devalue";
//#region node_modules/@sveltejs/kit/src/runtime/app/internal/transport.js
/** @import { Transport } from '@sveltejs/kit/hooks' */
/** @type {(thing: any) => string} */
var uneval = () => {
	throw new Error("");
};
/** @type {(data: any) => string} */
var stringify$1 = () => {
	throw new Error("");
};
/** @type {(data: string) => any} */
var parse = () => {
	throw new Error("");
};
/** @type {Record<string, (data: any) => any>} */
var encoders = {};
/** @type {Record<string, (data: any) => any>} */
var decoders = {};
var has_custom_transporters = false;
/**
*
* @param {Transport} transport
*/
function init_transport(transport) {
	const transporters = Object.entries(transport);
	has_custom_transporters = transporters.length > 0;
	/** @param {unknown} thing */
	const replacer = (thing) => {
		for (const key of Object.keys(transport)) {
			const encoded = transport[key].encode(thing);
			if (encoded) return `app.decode('${key}', ${devalue.uneval(encoded, replacer)})`;
		}
	};
	encoders = Object.fromEntries(transporters.map(([k, v]) => [k, v.encode]));
	decoders = Object.fromEntries(transporters.map(([k, v]) => [k, v.decode]));
	uneval = (data) => devalue.uneval(data, replacer);
	stringify$1 = (data) => devalue.stringify(data, encoders);
	parse = (data) => devalue.parse(data, decoders);
}
//#endregion
export { parse as a, init_transport as i, encoders as n, stringify$1 as o, has_custom_transporters as r, uneval as s, decoders as t };

//# sourceMappingURL=transport.js.map