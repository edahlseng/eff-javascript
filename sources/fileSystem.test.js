/* @flow */

import test from "ava";
import fs from "fs";
import path from "path";

import { run } from "./eff";
import {
	readFile,
	writeFile,
	interpretLocalFileSystem,
	interpretMockFileSystem,
} from "./fileSystem";
import { tempDirectory } from "./testUtils.js";

test.cb("Local File System – Read file", t => {
	const a = "Hello, World! I'm reading!";
	const fileName = "./helloWorldReading.txt";

	const application = readFile(fileName);

	tempDirectory((err, directory) => {
		t.is(null, err);

		fs.writeFile(path.resolve(directory, fileName), a, {}, err => {
			t.is(null, err);

			run([interpretLocalFileSystem(directory)])(b => {
				t.is(a, b);
				t.end();
			})(application);
		});
	});
});

test.cb("Local File System – Write file", t => {
	const a = "Hello, World! I'm writing!";
	const fileName = "./helloWorldWriting.txt";

	const application = writeFile(fileName)(a);

	tempDirectory((err, directory) => {
		t.is(null, err);

		run([interpretLocalFileSystem(directory)])(() => {
			fs.readFile(path.resolve(directory, fileName), "utf8", (err, b) => {
				t.is(null, err);

				t.is(b, a);
				t.end();
			});
		})(application);
	});
});

test.cb("Mock File System – Read file", t => {
	const a = "Hello, World! I'm writing!";
	const fileName = "./helloWorldWriting.txt";
	const directory = "/directory";

	const application = readFile(fileName);

	let fileSystem = { "/directory/helloWorldWriting.txt": a };

	run([
		interpretMockFileSystem({
			fileSystemRoot: directory,
			startingFileSystem: fileSystem,
			onUpdate: newFileSystem => {
				fileSystem = newFileSystem;
			},
		}),
	])(b => {
		t.is(b, a);
		t.end();
	})(application);
});

test.cb("Mock File System – Write file", t => {
	const a = "Hello, World! I'm writing!";
	const fileName = "./helloWorldWriting.txt";
	const directory = "/directory";

	const application = writeFile(fileName)(a);

	let fileSystem: { [string]: string } = {};

	run([
		interpretMockFileSystem({
			fileSystemRoot: directory,
			startingFileSystem: fileSystem,
			onUpdate: newFileSystem => {
				fileSystem = newFileSystem;
			},
		}),
	])(() => {
		t.is(fileSystem["/directory/helloWorldWriting.txt"], a);
		t.end();
	})(application);
});
