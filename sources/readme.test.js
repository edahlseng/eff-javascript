/* @flow */

import test from "ava";
import fs from "fs";
import path from "path";

import { FileSystem, run } from "./index.js";
import { tempDirectory } from "./testUtils.js";

// Note: These tests are used to ensure that the examples in the README always work

test.cb("Real file system", t => {
	const a = "Hello, World! I'm reading!";
	const b = a.toUpperCase();

	tempDirectory((err, directory) => {
		t.is(null, err);

		fs.mkdir(path.join(directory, "/home/me"), { recursive: true }, err => {
			t.is(null, err);

			fs.writeFile(path.join(directory, "/home/me", "./a.txt"), a, {}, err => {
				t.is(null, err);

				// Below this line comes mostly from the README

				const upperCase = str => str.toUpperCase();

				const application = FileSystem.readFile("./a.txt")
					.map(upperCase)
					.chain(FileSystem.writeFile("./b.txt"));

				run([
					FileSystem.interpretLocalFileSystem(path.join(directory, "/home/me")),
				])(() => {
					fs.readFile(
						path.join(directory, "/home/me", "./b.txt"),
						"utf8",
						(err, bFile) => {
							t.is(null, err);

							t.is(bFile, b);
							t.end();
						},
					);
				})(application);
			});
		});
	});
});

test.cb("Mock file system", t => {
	const a = "hello, world";
	const b = a.toUpperCase();

	// Below this line comes mostly from the README

	const upperCase = str => str.toUpperCase();

	const application = FileSystem.readFile("./a.txt")
		.map(upperCase)
		.chain(FileSystem.writeFile("./b.txt"));

	let fileSystem: { [string]: string } = { "/home/me/a.txt": "hello, world" };

	run([
		FileSystem.interpretMockFileSystem({
			fileSystemRoot: "/home/me",
			startingFileSystem: fileSystem,
			onUpdate: newFileSystem => {
				fileSystem = newFileSystem;
			},
		}),
	])(() => {
		t.is(fileSystem["/home/me/b.txt"], b);
		t.end();
	})(application);
});
