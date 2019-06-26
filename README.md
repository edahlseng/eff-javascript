Eff – An Extensible Effect Monad
================================

Eff is an extensible effect monad, based on the freer monad. It is both Fantasy Land and Static Land compliant.

Motivation
----------

Composition is the pinnacle of reusability for software. While easy to achieve when working with pure functions, the reality is that any useful application necessarily produces _effects_, and are by definition impure, making composition much more difficult. The Eff monad allows for these "impure" applications to easily utilize composition by splitting effects into two separate pieces – the definition of an effect, and the interpretation of an effect – each of which can be easily composed.

Documentation
-------------

A detailed API reference can be found in the [`documentation/` directory](./documentation).

Example
-------

This library comes with several different effects already defined, though custom effects can be easily written. This example uses the `FileSystem` effect to read from a file, uppercase all of its content, and then write a new file with the transformed content.

The first step is to write the application as a definition of the effects that will be performed:

```JavaScript
import { FileSystem, run } from "eff"; // Note: `run` will be used later on in the example

const uppercase = str => str.toUppercase();

const application =
	FileSystem.readFile("./a.txt")
	.map(uppercase)
	.chain(writeFile("./b.txt"));
```

The application as written above will not actually _do_ anything, it's just a _description of what should be done_. The magic comes from interpreting this description:

```JavaScript
import { compose } from "ramda";

const interpreter = compose(
	run,
	FileSystem.interpretLocalFileSystem("/home/me")
)(() => console.log("Done!"));

// In the line below the application is interpreted. This is when the effects are actually run.
interpreter(application)
```

The interpreter contains two different parts:
* `FileSystem.interpretLocalFileSystem`: This is the standard `FileSystem` effect interpreter.
* `run`: This is the main `Eff` interpreter. It is always needed to properly interpret an Eff monad.

At first blush this separation of effects into a definition and its interpretation may seem inconsequential. Nevertheless, this approach gives us extremely powerful abilities that go beyond just separation of concerns:
* trivial testability
* composition of _applications_

Let's take a closer look at the first one, testability, in action:

```JavaScript
const mockInterpreter = compose(
	run,
	FileSystem.interpretMock({
		workingDirectory: "/home/me",
		startingFileSystem: {
			"/home/me/a.txt": "hello, world"
		}
	 })
)(mockFileSystemOutput => {
	if (mockFileSystemOutput["/home/me/b.txt"] === "HELLO, WORLD") {
		console.log("Test passed!");
	} else {
		console.log("Test failed!");
	}
});

mockInterpreter(application);
```

We can interpret the application definition with a mock interpreter just as easily as the original interpreter. This allows us to verify the logic of the application without needing to actually interact with a live filesystem.

Contributing
------------

Community contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

References
----------

This library was originally based on the work presented in the following research papers:

[Extensible Effects: An Alternative to Monad Transformers](http://okmij.org/ftp/Haskell/extensible/exteff.pdf)
Oleg Kiselyov, Amr Sabry, and Cameron Swords. 2013. Extensible effects: an alternative to monad transformers. In Proceedings of the 2013 ACM SIGPLAN symposium on Haskell (Haskell '13). ACM, New York, NY, USA, 59-70. DOI=http://dx.doi.org/10.1145/2503778.2503791

[Freer Monads, More Extensible Effects](http://okmij.org/ftp/Haskell/extensible/more.pdf)
Oleg Kiselyov and Hiromi Ishii. 2015. Freer monads, more extensible effects. SIGPLAN Not. 50, 12 (August 2015), 94-105. DOI=http://dx.doi.org/10.1145/2887747.2804319
