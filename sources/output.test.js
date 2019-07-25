/* @flow */

import test from "ava";
import { Writable } from "stream";

import { run } from "./eff";
import { putString, putStringLine, interpretOutput } from "./output";

test.cb("Put string", t => {
	const stringToWrite = "Hello, World!";

	let writtenString = "";

	const writableStream = new Writable({
		write(chunk, encoding, callback) {
			writtenString = writtenString + chunk.toString();
			callback();
		},
	});

	const application = putString(stringToWrite);

	run([interpretOutput(writableStream)])(() => {
		t.is(writtenString, stringToWrite);
		t.end();
	})(application);
});

test.cb("Put string line", t => {
	const stringToWrite = "Hello, World!";

	let writtenString = "";

	const writableStream = new Writable({
		write(chunk, encoding, callback) {
			writtenString = writtenString + chunk.toString();
			callback();
		},
	});

	const application = putStringLine(stringToWrite);

	run([interpretOutput(writableStream)])(() => {
		t.is(writtenString, stringToWrite + "\n");
		t.end();
	})(application);
});
