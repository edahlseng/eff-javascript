/* @flow */

import { always, pipe, equals as equalsGeneric, F } from "ramda";
import { taggedSum } from "daggy";
import showSanctuary from "sanctuary-show";

// value :: any
// effect :: any
// continuation :: any -> Eff
const Eff = taggedSum("Eff", {
	Pure: ["value"],
	Impure: ["effect", "continuation"],
});

type Pure = { cata: Function };
type Impure = { cata: Function };
type EffMonad = Pure | Impure;

export const pure = (x: *) => Eff.Pure(x);
(pure: any).toString = () => "pure"; // See https://github.com/facebook/flow/issues/6196 for more information on why we cast to `any` here

export const of = pure;

export const impure = (continuation: Function) => (effect: EffMonad) =>
	Eff.Impure(effect, continuation);

export const send = (effect: any) => Eff.Impure(effect, pure);

const pipeK = (a, b) => c => a(c).chain(b);

// -----------------------------------------------------------------------------
// Equals
// -----------------------------------------------------------------------------

export const map = (f: Function) => (eff: EffMonad) =>
	chain(a => pure(f(a)))(eff);

Eff.prototype.map = function(f) {
	return map(f)(this);
};

// -----------------------------------------------------------------------------
// Equals
// -----------------------------------------------------------------------------

export const equals = (a: EffMonad) => (b: EffMonad) =>
	a.cata({
		Pure: b.cata({
			Pure: equalsGeneric,
			Impure: always(F),
		}),
		Impure: (aEffect, aContinuation) =>
			b.cata({
				Pure: F,
				Impure: (bEffect, bContinuation) =>
					equalsGeneric(aEffect, bEffect) &&
					equalsGeneric(aContinuation, bContinuation),
			}),
	});

Eff.prototype.equals = function(b) {
	return equals(this)(b);
};

// -----------------------------------------------------------------------------
// Chain
// -----------------------------------------------------------------------------

export const chain = (nextContinuation: Function) => (eff: EffMonad) =>
	eff.cata({
		Pure: x => nextContinuation(x),
		Impure: (effect, continuation) =>
			Eff.Impure(
				effect,
				pipeK(
					continuation,
					nextContinuation,
				),
			),
	});

Eff.prototype.chain = function(nextContinuation) {
	return chain(nextContinuation)(this);
};

// -----------------------------------------------------------------------------
// Show/toString
// -----------------------------------------------------------------------------

export const show = (eff: EffMonad) =>
	eff.cata({
		Pure: value => `pure (${showSanctuary(value)})`,
		Impure: (effect, continuation) =>
			`impure (${showSanctuary(continuation)}) (${showSanctuary(effect)})`,
	});

Eff.prototype.show = function() {
	return show(this);
};

Eff.prototype["@@show"] = function() {
	return show(this);
};

Eff.prototype.toString = function() {
	return show(this);
};

// -----------------------------------------------------------------------------
// Interpreting and Running
// -----------------------------------------------------------------------------

export const run = (interpreters: Array<Function>) => (callback: Function) => (
	effectfulMonad: EffMonad,
) =>
	interpreters.reduce(
		(previousInterpreter, currentInterpreter) =>
			currentInterpreter({
				interpreterContinuation: previousInterpreter,
				interpreterRestart: x => run(interpreters)(callback)(x),
			}),
		finalMonad =>
			finalMonad.cata({
				Pure: x => {
					callback(x);
				},
				Impure: effect => {
					throw `There was an unhandled effect: ${effect.toString()}`;
				},
			}),
	)(effectfulMonad);

export const interpreter = ({
	predicate,
	handler,
}: {
	predicate: Function,
	handler: Function,
}) => ({
	interpreterContinuation,
	interpreterRestart,
}: {
	interpreterContinuation: Function,
	interpreterRestart: Function,
}) => (m: EffMonad) =>
	m.cata({
		Pure: x => interpreterContinuation(Eff.Pure(x)),
		Impure: (effect, continuation) =>
			predicate(effect)
				? handler(effect)(
						pipe(
							continuation,
							interpreterRestart,
						),
				  )
				: interpreterContinuation(Eff.Impure(effect, continuation)),
	});
