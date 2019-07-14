/* @flow */

import daggy from "daggy";

import { interpreter, send } from "./eff.js";

const Output = daggy.taggedSum("Output", {
	putString: ["string"],
});

export const putString = (s: string) => send(Output.putString(s));
export const putStringLine = (s: string) => send(Output.putString(s + "\n"));

export const interpretOutput = (outputStream: stream$Writable) =>
	interpreter({
		predicate: x => Output.is(x),
		handler: outputEffect =>
			outputEffect.cata({
				putString: string => continuation => {
					outputStream.write(string, "utf8", () => continuation(null));
				},
			}),
	});

export const interpretOutputStdOut = interpretOutput(process.stdout);
