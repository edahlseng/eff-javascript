/* @flow */

import daggy from "daggy";

import Eff, { interpreter, send } from "./eff.js";

const Output = daggy.taggedSum("Output", {
	putString: ["string"],
});

export const putString = s => send(Output.putString(s));
export const putStringLine = s => send(Output.putString(s + "\n"));

export const interpretOutput = outputStream =>
	interpreter({
		onPure: Eff.Pure,
		predicate: x => Output.is(x),
		handler: outputEffect =>
			outputEffect.cata({
				putString: string => continuation => {
					outputStream.write(string, "utf8", () => continuation(null));
				},
			}),
	});

export const interpretOutputStdOut = interpretOutput(process.stdout);
