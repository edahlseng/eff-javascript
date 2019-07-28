/* @flow */

import test from "ava";
import jsverify from "jsverify";
import { pipe } from "ramda";

import { chain, equals, impure, pure, send, show } from "./eff";

// Note: JSVerify does not appear to have a way to generate arbitrary arbitraries;
//       this means that each arbitrary in JSVerify has to be of a certain type.
//       For all of the tests below we are using arbitrary *numbers*, with the number
//       type being chosen pseudo-randomly. There's no logic within the Eff core
//       that treats the types of values differently, so this *shouldn't* have any
//       significance. Of course, as soon as an edge case is found, we will have
//       to revisit this approach.

// -----------------------------------------------------------------------------
// Setoid laws
// -----------------------------------------------------------------------------

test("Reflexivity (Pure)", t => {
	// equals a a ≡ true

	jsverify.assert(
		jsverify.forall("number", a => equals(pure(a))(pure(a)) === true),
	);
	t.pass();
});

test("Reflexivity (Impure)", t => {
	// equals a a ≡ true

	jsverify.assert(
		jsverify.forall(
			"json",
			effect => equals(send(effect))(send(effect)) === true,
		),
	);
	t.pass();
});

test("Symmetry (Pure)", t => {
	// equals a b ≡ equals b a

	jsverify.assert(
		jsverify.forall(
			"number",
			"number",
			(a, b) => equals(pure(a))(pure(b)) === equals(pure(b))(pure(a)),
		),
	);
	t.pass();
});

test("Symmetry (Impure)", t => {
	// equals a b ≡ equals b a

	jsverify.assert(
		jsverify.forall(
			"json",
			"json",
			(a, b) => equals(send(a))(send(b)) === equals(send(b))(send(a)),
		),
	);
	t.pass();
});

// TODO: should pass in the abritrary data with the constraint, rather than including the constraint in the test
test("Transitivity (Pure)", t => {
	// if equals a b == true and equals b c == true, then equals a c == true

	jsverify.assert(
		jsverify.forall("number", "number", "number", (a, b, c) =>
			equals(pure(a))(pure(b)) && equals(pure(b))(pure(c))
				? equals(pure(a))(pure(b))
				: true,
		),
	);
	t.pass();
});

test("Transitivity (Impure)", t => {
	// if equals a b == true and equals b c == true, then equals a c == true

	jsverify.assert(
		jsverify.forall("json", "json", "json", (a, b, c) =>
			equals(send(a))(send(b)) && equals(send(b))(send(c))
				? equals(send(a))(send(b))
				: true,
		),
	);
	t.pass();
});

// -----------------------------------------------------------------------------
// Functor Laws (https://wiki.haskell.org/Functor, https://github.com/fantasyland/fantasy-land#functor)
// -----------------------------------------------------------------------------

test.todo("Identity (map)"); // u.map(a => a) is equivalent to u

test.todo("Composition (map)"); // u.map(x => f(g(x))) is equivalent to u.map(g).map(f)

// -----------------------------------------------------------------------------
// Apply Laws (https://github.com/fantasyland/fantasy-land#apply)
// -----------------------------------------------------------------------------

test.todo("Composition (ap)"); // v.ap(u.ap(a.map(f => g => x => f(g(x))))) is equivalent to v.ap(u).ap(a)

// -----------------------------------------------------------------------------
// Applicative Laws (https://github.com/fantasyland/fantasy-land#applicative)
// -----------------------------------------------------------------------------

test.todo("Identity (ap)"); // v.ap(A.of(x => x)) is equivalent to v

test.todo("Homomorphism"); // A.of(x).ap(A.of(f)) is equivalent to A.of(f(x))

test.todo("Interchange"); // A.of(y).ap(u) is equivalent to u.ap(A.of(f => f(y)))

// -----------------------------------------------------------------------------
// Monad Laws (https://wiki.haskell.org/Monad_laws, https://github.com/fantasyland/fantasy-land#monad, https://github.com/fantasyland/fantasy-land#chain)
// -----------------------------------------------------------------------------

test("Left Identity", t => {
	// return a >>= f ≡ f a

	jsverify.assert(
		jsverify.forall("number", "number -> number", (a, f) => {
			const f2 = pipe(
				f,
				pure,
			);

			return equals(chain(f2)(pure(a)))(f2(a));
		}),
	);
	t.pass();
});

test("Right Identity", t => {
	// return m >>= return ≡ m

	jsverify.assert(
		jsverify.forall("number", a => equals(chain(pure)(pure(a)))(pure(a))),
	);
	t.pass();
});

test("Associativity", t => {
	// (m >>= f) >>= g ≡ m >>= (\x -> f x >>= g)

	jsverify.assert(
		jsverify.forall(
			"number",
			"number -> number",
			"number -> number",
			(a, f, g) => {
				const f2 = pipe(
					f,
					pure,
				);

				const g2 = pipe(
					g,
					pure,
				);

				return equals(chain(g2)(chain(f2)(pure(a))))(
					chain(x => chain(g2)(f2(x)))(pure(a)),
				);
			},
		),
	);
	t.pass();
});

// -----------------------------------------------------------------------------
// Show (https://github.com/sanctuary-js/sanctuary-show)
// -----------------------------------------------------------------------------

test("Show – Pure", t => {
	// eval ('(' + show (x) + ')') = x

	jsverify.assert(
		jsverify.forall("number", value => {
			const x = pure(value);
			global.pure = pure;
			const result = equals(eval("(" + show(x) + ")"))(x);
			delete global.pure;
			return result;
		}),
	);
	["show", "@@show", "toString"].forEach(method =>
		jsverify.assert(
			jsverify.forall("number", value => {
				const x = pure(value);
				global.pure = pure;
				const result = equals(eval("(" + x[method]() + ")"))(x);
				delete global.pure;
				return result;
			}),
		),
	);
	t.pass();
});

test("Show – Impure", t => {
	// eval ('(' + show (x) + ')') = x

	jsverify.assert(
		jsverify.forall("json", effect => {
			const x = send(effect);
			global.impure = impure;
			global.pure = pure;
			const result = equals(eval("(" + show(x) + ")"))(x);
			delete global.impure;
			delete global.pure;
			return result;
		}),
	);
	["show", "@@show", "toString"].forEach(method =>
		jsverify.assert(
			jsverify.forall("json", effect => {
				const x = send(effect);
				global.impure = impure;
				global.pure = pure;
				const result = equals(eval("(" + x[method]() + ")"))(x);
				delete global.impure;
				delete global.pure;
				return result;
			}),
		),
	);
	t.pass();
});
