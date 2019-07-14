/* @flow */

import daggy from "daggy";

import { interpreter, send } from "./eff.js";

const Reader = daggy.taggedSum("Reader", {
	get: [],
});

export const get = () => send(Reader.get);

export const interpretReader = (i: any) =>
	interpreter({
		predicate: x => Reader.is(x),
		handler: readerEffect =>
			readerEffect.cata({
				get: () => continuation => continuation(i),
			}),
	});
