/* @flow */

import { always, pipe, equals, F } from "ramda";
import { taggedSum } from "daggy";

// value :: any
// effect :: any
// continuation :: any -> Eff
const Eff = taggedSum("Eff", {
	Pure: ["value"],
	Impure: ["effect", "continuation"],
});

Eff.prototype.map = function(f) {
	return this.chain(a => Eff.of(f(a)));
};

const pipeK = (a, b) => c => a(c).chain(b);

// -----------------------------------------------------------------------------
// Equals
// -----------------------------------------------------------------------------

Eff.equals = (a, b) =>
	a.cata({
		Pure: b.cata({
			Pure: equals,
			Impure: always(F),
		}),
		Impure: (aEffect, aContinuation) =>
			b.cata({
				Pure: F,
				Impure: (bEffect, bContinuation) =>
					equals(aEffect, bEffect) && equals(aContinuation, bContinuation),
			}),
	});

Eff.prototype.equals = function(b) {
	return Eff.equals(this, b);
};

// -----------------------------------------------------------------------------
// Chain
// -----------------------------------------------------------------------------

Eff.chain = (eff, nextContinuation) =>
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

Eff.prototype.chain = function chain(nextContinuation) {
	return Eff.chain(this, nextContinuation);
};

Eff.of = Eff.Pure;

export default Eff;

type Pure = { cata: Function };
type Impure = { cata: Function };
type EffMonad = Pure | Impure;

export const run = (...interpreters: Array<Function>) => (
	callback: Function,
) => (effectfulMonad: EffMonad) =>
	interpreters.reduce(
		(previousInterpreter, currentInterpreter) =>
			currentInterpreter({
				interpreterContinuation: previousInterpreter,
				interpreterRestart: x => run(...interpreters)(callback)(x),
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

export const send = (t: any) => Eff.Impure(t, Eff.Pure);

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
