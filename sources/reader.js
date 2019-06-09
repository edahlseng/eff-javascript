/* @flow */

import daggy from "daggy";

import Eff, { interpreter, send } from "./eff.js";

const Reader = daggy.taggedSum("Reader", {
	get: [],
});

export const get = () => send(Reader.get);

export const interpretReader = (i: any) =>
	interpreter({
		onPure: Eff.Pure,
		predicate: x => Reader.is(x),
		handler: readerEffect =>
			readerEffect.cata({
				get: () => continuation => continuation(i),
			}),
	});
