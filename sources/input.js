/* @flow */

import daggy from "daggy";
import { always } from "ramda";

import Eff, { interpreter, send } from "./eff.js";

const Input = daggy.taggedSum("Input", {
	getCharacter: [],
});

export const getCharacter = always(send(Input.getCharacter));

export const interpretInput = inputStream =>
	interpreter({
		onPure: Eff.Pure,
		predicate: x => Input.is(x),
		handler: inputEffect =>
			inputEffect.cata({
				getCharacter: () => continuation => {
					if (inputStream.setRawMode) inputStream.setRawMode(true); // Needed to get characters *before* `enter` is pressed
					inputStream.setEncoding("utf8");

					inputStream.once("readable", () => {
						continuation(inputStream.read(1));
					});
				},
			}),
	});

export const interpretInputStdIn = interpretInput(process.stdin);
