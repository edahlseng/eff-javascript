Eff Documentation
=================

* A Note on Notation
* Eff
* Built-in Effects
  * Input
  * Output

A Note on Notation
------------------

In addition to an English description, each function below is listed with a Hindley-Milner type, a Flow type, and an untyped JavaScript example. All three notations are provided in order to provide a variety of perspectives. If a particular perspective is unfamiliar to you, feel free to ignore it!

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
const pure: <value>(value) => Pure<value> = ...;
```

Example:

```js
import { pure } from 'eff';

const a = pure(28);
```

#### of alias

`of` is an alias for `pure`, for Fantasy Land compliance.

```js
import { of } from 'eff'

const a = of(28);
```

### impure

```hs
impure :: (a -> value) -> effect -> Impure effect value
```

```flow
const impure: <A, value, effect>((A) => value) => (effect) => Impure<effect, value> = ...;
```

Example:

```js
import { impure, pure } from 'eff';

const effect = { type: 'always-three' }; // The effect can be whatever we want

const a = impure(pure)(effect);
```

### send

TODO

### equals

TODO

### chain

TODO

### map

TODO

### run

Built-in Effects
-----------------

### File System

There are a number of file system effects included that allow one to read from and write to files.

#### readFile

TODO

#### writeFile

TODO

#### interpretLocalFileSystem

TODO

#### Example

```js
import { fileSystem, run } from 'eff';

const main =
	fileSystem.readFile("./helloWorld.txt")
	.map(toUppercase)
	.chain(fileSystem.writeFile("./helloWorldUppercase.txt"));

run([fileSystem.interpretLocalFileSystem(process.cwd())])
   (() => console.log("All done!"))
   (main);
```

### Input

TODO

### Output

TODO
