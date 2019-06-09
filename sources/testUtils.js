/* @flow */

import os from "os";
import fs from "fs";
import path from "path";

export const tempDirectory = (callback: Function) =>
	fs.mkdtemp(path.resolve(os.tmpdir(), `eff-tests-${process.pid}-`), callback);
