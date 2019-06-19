/* @flow */

import test from "ava";
import fs from "fs";
import path from "path";

import { run } from "./eff";
import { readFile, writeFile, interpretLocalFileSystem } from "./fileSystem";
import { tempDirectory } from "./testUtils.js";

test.cb("Read file", t => {
	const a = "Hello, World! I'm reading!";
	const fileName = "./helloWorldReading.txt";

	const application = readFile(fileName);

	tempDirectory((err, directory) => {
		t.is(null, err);

		fs.writeFile(path.resolve(directory, fileName), a, {}, err => {
			t.is(null, err);

			run(interpretLocalFileSystem(directory))(b => {
				t.is(a, b);
				t.end();
			})(application);
		});
	});
});

test.cb("Write file", t => {
	const a = "Hello, World! I'm writing!";
	const fileName = "./helloWorldWriting.txt";

	const application = writeFile(fileName, a);

	tempDirectory((err, directory) => {
		t.is(null, err);

		run(interpretLocalFileSystem(directory))(() => {
			fs.readFile(path.resolve(directory, fileName), "utf8", (err, b) => {
				t.is(null, err);

				t.is(b, a);
				t.end();
			});
		})(application);
	});
});
