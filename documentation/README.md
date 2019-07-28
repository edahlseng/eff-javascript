Eff Documentation
=================

* [A Note on Notation](#a-note-on-notation)
* [Eff](#eff)
  * [pure](#pure)
  * [impure](#impure)
  * [send](#send)
  * [show](#show)
  * [equals](#equals)
  * [chain](#chain)
  * [map](#map)
  * [run](#run)
* [Interoperability](#interoperability)
* [Built-in Effects](#built-in-effects)
  * [File System](#file-system)
  * [Input](#input)
  * [Output](#output)

A Note on Notation
------------------

In addition to an English description, each function below is listed with a Hindley-Milner type, a [Flow](https://flow.org) type, and an untyped JavaScript example. All three notations are provided in order to provide a variety of perspectives. If a particular perspective is unfamiliar to you, feel free to ignore it!

Eff
---

The Eff monad is a sum type, and can be either `Pure` or `Impure`:

```hs
data Eff effect value = Pure value | Impure effect value
```

```flow
opaque type Pure<value> = { value: value, ... };
opaque type Impure<effects, value> = { effect: effects, continuation: (any) => value, ... }

/* Note: the ellipses above indicate that there are additional fields used for internal
   use (such as a `toString` method) */

type Eff<effects, value> = Pure<value> | Impure<effects, value>;
```

Eff is parameterized by a union of possible effects and a value. The Eff Pure type is parameterized by only a value, while the Eff Impure types is parameterized by both the effects and the value.

### pure

`pure` is a function that accepts a single parameter, returning an Eff instance that is a wrapper around that value.

```hs
pure :: value -> Pure value
```

```flow
declare function pure<value>(value): Pure<value>;
```

Example:

```js
import { pure } from "eff";

const application = pure(28);
```

#### of

`of` is an alias for `pure`.

```js
import { of } from "eff"

const application = of(28);
```

### impure

`impure` is a function that returns an "impure" Eff instance, when given a continuation function and an effect. The `effect` is an arbitrary, user defined object, that will be used by the interpreter to determine how to handle the effect. The continuation function will be called after the effect has returned.

Often times a user will not need to use the `impure` function directly, instead using the `send` function.

```hs
impure :: (a -> value) -> effect -> Impure effect value
```

```flow
declare function impure<A, value, effect>((A) => value): (effect) => Impure<effect, value>;
```

Example:

```js
import { impure, pure } from "eff";

const effect = { type: 'always-three' }; // The effect can be whatever we want

const application = impure(pure)(effect);
```

### send

`send` is a function that creates an "impure" Eff instance from an `effect` argument. The difference between `send` and `impure` is that `send` automatically uses the `pure` function as the continuation for the Eff instance that it returns (a common use pattern).

```hs
send :: effect -> Impure effect value
```

```flow
declare function send<value, effect>(effect): Impure<effect, value>;
```

Example:

```js
import { send } from "eff";

const effect = { type: "random-number" }; // The effect can be whatever we want

const application = send(effect); // This is equivalent to `impure(pure)(effect)`
```

### show

`show` is a function that converts an Eff instance to a string representation. This can be particularly useful for logging.

```hs
show :: Eff a b -> string
```

```flow
declare function show<a, b>(Eff<a, b>): string;
```

Example:

```js
import { pure, show } from "eff";

const effExample = pure(2);

console.log(show(effExample)); // Prints "pure (2)"
```

### equals

`equals` is a function that compares two `eff` instances, returning `true` iff they are equal. This function has some limitations, however, particularly when comparing two `impure` functions that might be functionally equivalent, but have different instances for their continuation functions. Therefore, we recommend not using this function. It exists mainly to support some internal needs. In particular, we recommend not using this function for testing purposes, but rather using mock interpreters instead.

```hs
equals :: Eff a b -> Eff c d -> boolean
```

```flow
declare function equals<a, b, c, d>(Eff<a, b>): Eff<c, d> => boolean;
```

Example:

```js
import { equals, pure } from "eff";

console.log(equals(pure(1))(pure(2))); // Prints "false"
```

### chain

`chain` is a function that connects an Eff instance with a function that returns an Eff instance.

```hs
chain :: (a -> Eff b c) -> Eff d a -> Eff (d | b) c
```

```flow
declare function chain<a, b, c, d>((a) => Eff<b, c>): Eff<d, a> => Eff<d | b, c>
```

Example:

```js
import { chain, pure, send } from "eff";

const application = chain(value => pure(value * 2))(send({ type: "random-number" }));
```

### map

`map` is a function that transforms the value contained within an Eff instance, returning a new Eff instance with the transformed value.

```hs
map :: (a -> b) -> Eff c a -> Eff c b
```

```flow
declare function map<a, b, c>((a) => b): Eff<c, a> => Eff<c, b>
```

Example:

```js
import { map, send } from "eff";

const application = map(value => value * 2)(send({ type: "random-number" }));
```

### interpreter

`interpreter` is a function that creates an "interpreter" to be used for running effects. The "interpreter" is essentially just another function that will check if it understands how to interpret an effect. If it does, then it will run the effect; if it does not, then it will pass on the effect.

The `interpreter` function only needs to be used when creating custom effects.

```hs
type Interpreter effect = (Interpreter effectsA, Interpreter effectsB) -> Eff (effectsB | effect) b -> void

interpreter :: (a -> Eff b c, effect -> boolean, effect -> (d -> void) -> void) -> Interpreter effect
```

```flow
type Interpreter<effect> = ({interpreterCotinuation: Interpreter<any>, interpreterRestart: Interpreter<any>}) => Eff<any, any> => void;

declare function interpreter<a, b, c, d, effect>({ predicate: (effect) => boolean, handler: (effect) => (d => void) => void}) => Interpreter effect
```

Example:

```js
import { interpreter, map, pure, send } from "eff";

const randomNumberInterpreter = interpreter({
    predicate: x => x.type === "random-number",
    handler: effect => continuation => continuation(Math.random()),
})
```

### run

`run` allows an Eff instance to be _actually run_, performing the effects. `run` does not perform the effects itself, rather it coordinates between multiple different interpreters passed in as arguments.

Todo: need type constraints here on the I

```hs
run :: interpreters -> (a -> void) -> Eff a b
```

```flow
declare function run<a, b>(interpreters): ((a) -> void) -> Eff<a, b>
```

Example:

```js
import { chain, interpreter, pure, run, send } from "eff";

const application = chain(value => pure(value * 2))(send({ type: "random-number" }));

const randomNumberInterpreter = interpreter({
    predicate: x => x.type === "random-number",
    handler: effect => continuation => continuation(Math.random()),
})

run([randomNumberInterpreter])(() => console.log('All done!'))(application);
```

Interoperability
----------------

In order to make it easier to use Eff with other libraries, the Eff instance is compatible with the following specifications:
* [Sanctuary Show](https://github.com/sanctuary-js/sanctuary-show)
* [Fantasy Land](https://github.com/fantasyland/fantasy-land)'s `Functor` specification

Built-in Effects
-----------------

### File System

There are a number of file system effects included that allow one to read from and write to files.

#### readFile

```hs
readFile :: string -> Impure read-file string
```

```flow
declare function readFile(string): Impure<read-file, string>
```

#### writeFile

```hs
writeFile :: string -> string -> Impure write-file null
```

```flow
declare function writeFile(sting): string -> Impure<write-file, null>
```

#### interpretLocalFileSystem

```hs
type interpretLocalFileSystem = Interpreter (read-file | write-file)
```

```flow
declare var interpretLocalFileSystem = Interpreter<read-file | write-file>
```

#### Example

```js
import { fileSystem, run } from "eff";

const main =
	fileSystem.readFile("./helloWorld.txt")
	.map(toUppercase)
	.chain(fileSystem.writeFile("./helloWorldUppercase.txt"));

run([fileSystem.interpretLocalFileSystem(process.cwd())])
   (() => console.log("All done!"))
   (main);
```

### Input

Built-in input effects allow for reading from stdin.

#### getCharacter

```hs
getCharacter :: () -> Impure get-character string
```

```flow
declare function getCharacter(): Impure<get-character, string>
```

#### interpretInput

```hs
type interpretInput = Interpreter get-character
```

```flow
declare var interpretInput = Interpreter<get-character>
```

#### Example

```js
import { input, run } from "eff";

const main = input.getCharacter();

run([input.interpretInput])
   (character => console.log('Received character:', character))
   (main);
// Will wait for a character input, and then output it
```

### Output

Built-in output effects allow for writing to stdout.

#### putString

```hs
putString :: string -> Impure put
```

```flow
declare function putString(string): Impure put
```

#### putStringLine

```hs
putStringLine :: string -> Impure put
```

```flow
declare function putStringLine(string): Impure put
```

#### interpretOutput

```hs
type interpretOutput = Interpreter put
```

```flow
declare var interpretOutput = Interpreter<put>
```

#### Example

```js
import { output, run } from "eff";

const main = output.putString("Hello, World!");

run([output.interpretOutput])
   (() => {})
   (main);
// Will print "Hello, World!"
```
