/* @flow */

import test from "ava";

import { run } from "./eff";
import { get, interpretReader } from "./reader";

test.cb("Get", t => {
	const character = "a";

	const application = get();

	run(interpretReader(character))(readData => {
		t.is(readData, character);
		t.end();
	})(application);
});
