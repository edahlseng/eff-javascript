/* @flow */

import test from "ava";
import { Readable } from "stream";

import { run } from "./eff";
import { getCharacter, interpretInput } from "./input";

test.cb("Get character", t => {
	const character = "a";

	const application = getCharacter();

	const readableStream = new Readable();

	run(interpretInput(readableStream))(readCharacter => {
		t.is(readCharacter, character);
		t.end();
	})(application);

	readableStream.push(character);
	readableStream.push(null);
});
