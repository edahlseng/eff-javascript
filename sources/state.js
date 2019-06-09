/* @flow */

import daggy from "daggy";

import Eff, { interpreter, send } from "./eff.js";

const State = daggy.taggedSum("State", {
	get: [],
	modify: ["modificationFunction"],
	put: ["newState"],
});

export const get = () => send(State.get);
export const modify = (modificationFunction: any => any) =>
	send(State.modify(modificationFunction));
export const put = (newState: mixed) => send(State.put(newState));

export const interpretState = (startingState: mixed) => {
	let state = startingState;

	return interpreter({
		onPure: Eff.Pure,
		predicate: x => State.is(x),
		handler: stateEffect =>
			stateEffect.cata({
				get: () => continuation => continuation(state),
				modify: modificationFunction => continuation => {
					state = modificationFunction(state);
					return continuation(null);
				},
				put: newState => continuation => {
					state = newState;
					return continuation(null);
				},
			}),
	});
};
