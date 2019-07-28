/* @flow */

import test from "ava";
import laws from "fantasy-laws";
import jsverify from "jsverify";

import { equals, pure, send, show } from "./eff.js";

const arbitraryPure = jsverify.number.smap(
	pure,
	effPure => effPure.value,
	show,
);

const arbitraryImpure = jsverify.json.smap(
	send,
	effImpure => effImpure.effect,
	show,
);

const arbitraryEff = jsverify.oneof(arbitraryPure, arbitraryImpure);

const equalsNotCurried = (a, b) => equals(a)(b);

test("Functor, identity", t => {
	t.notThrows(laws.Functor(equalsNotCurried).identity(arbitraryEff));
});

test("Functor, composition", t => {
	t.notThrows(
		laws
			.Functor(equalsNotCurried)
			.composition(
				arbitraryEff,
				jsverify.fn(jsverify.number),
				jsverify.fn(jsverify.number),
			),
	);
});
