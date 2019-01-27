/* @flow */

import test from "ava";

import { run } from "./eff";
import { get, modify, put, interpretState } from "./state";

test.cb("Get", t => {
	const state = "Hello, World!";

	const application = get();

	run(interpretState(state))(receivedState => {
		t.is(receivedState, state);
		t.end();
	})(application);
});

test.cb("Modify", t => {
	const state = "Hello, World!";
	const modification = x => x + " How are you?";

	const application = modify(modification).chain(get);

	run(interpretState(state))(receivedState => {
		t.is(receivedState, modification(state));
		t.end();
	})(application);
});

test.cb("Put", t => {
	const state = "Hello, World!";
	const newState = "World, Hello!";

	const application = put(newState).chain(get);

	run(interpretState(state))(receivedState => {
		t.is(receivedState, newState);
		t.end();
	})(application);
});
