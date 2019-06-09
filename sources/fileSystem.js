/* @flow */

import { taggedSum } from "daggy";
import fs from "fs";
import path from "path";

import Eff, { interpreter, send } from "./eff";

const FileSystem = taggedSum("FileSystem", {
	readFile: ["path"],
	writeFile: ["path", "content"],
});

export const readFile = (path: string) => send(FileSystem.readFile(path));
export const writeFile = (
	path: string,
	content: string | Buffer | $TypedArray | DataView,
) => send(FileSystem.writeFile(path, content));

export const interpretLocalFileSystem = (fileSystemRoot: string) =>
	interpreter({
		onPure: x => Eff.Pure(x),
		predicate: x => FileSystem.is(x),
		handler: fileSystemEffect =>
			fileSystemEffect.cata({
				readFile: filePath => continuation =>
					fs.readFile(
						path.resolve(fileSystemRoot, filePath),
						"utf8",
						(err, data) => continuation(data),
					),
				writeFile: (filePath, content) => continuation =>
					fs.writeFile(
						path.resolve(fileSystemRoot, filePath),
						content,
						"utf8",
						() => continuation(null),
					),
			}),
	});
