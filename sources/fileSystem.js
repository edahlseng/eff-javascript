/* @flow */

import { taggedSum } from "daggy";
import fs from "fs";
import path from "path";
import { assoc } from "ramda";

import { interpreter, send } from "./eff";

const FileSystem = taggedSum("FileSystem", {
	readFile: ["path"],
	writeFile: ["path", "content"],
});

export const readFile = (path: string) => send(FileSystem.readFile(path));
export const writeFile = (path: string) => (
	content: string | Buffer | $TypedArray | DataView,
) => send(FileSystem.writeFile(path, content));

export const interpretLocalFileSystem = (fileSystemRoot: string) =>
	interpreter({
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

export const interpretMockFileSystem = ({
	fileSystemRoot,
	startingFileSystem,
	onUpdate,
}: {
	fileSystemRoot: string,
	startingFileSystem: { ... },
	onUpdate?: ({ ... }) => void,
}) => {
	let fileSystem = startingFileSystem;

	return interpreter({
		predicate: x => FileSystem.is(x),
		handler: fileSystemEffect =>
			fileSystemEffect.cata({
				readFile: filePath => continuation =>
					continuation(fileSystem[path.resolve(fileSystemRoot, filePath)]),
				writeFile: (filePath, content) => continuation => {
					fileSystem = assoc(path.resolve(fileSystemRoot, filePath))(content)(
						fileSystem,
					);
					if (onUpdate) onUpdate({ ...fileSystem });
					return continuation(null);
				},
			}),
	});
};
