import { app } from "electron";
import { promises as fsasync } from "fs";
import fs from "fs";
import path from "path";

import { DirectoryListConfig, DirectoryListEntry } from "data/directories";
import { FormError, SingleFormError } from "data/ipc";
import { kDuplicacyDir, kPrettyWriteIndent } from "data/util";
import { Observable } from "../ipc/observable";
import { eventBus } from "./eventBus";

const kDirectorySettingsFile = path.join(app.getPath('userData'), 'directories.json');
const directoryList: Observable<'directories'> = new Observable('directories', loadDirectories)

export async function getDirectoryListConfig(): Promise<DirectoryListConfig> {
	return directoryList.getValue();
}

export async function getDirectoryPath(name: string): Promise<string> {
	let directoryList = await getDirectoryListConfig();
	let entry = directoryList.directories.find(v => v.name == name);
	if (entry === undefined) {
		throw new Error('Unknown directory.');
	}
	return entry.path;
}

export async function addDirectory(newDir: DirectoryListEntry): Promise<null | FormError> {
	let validationError = await validateDirectory(newDir);
	if (validationError) {
		return validationError;
	}

	let prevData = await directoryList.getValue()
	directoryList.setValue({
		...prevData,
		directories: [...prevData.directories, newDir]
	});
	await saveDirectories();

	eventBus.emit('directoryConfigUpdate');

	return null;
}

export async function removeDirectory(name: string): Promise<void> {
	let prevData = await directoryList.getValue()
	let newDirs = prevData.directories.filter(v => v.name != name);

	directoryList.setValue({
		...prevData,
		directories: newDirs
	});
	await saveDirectories();
}

// Helpers
async function loadDirectories(): Promise<Readonly<DirectoryListConfig>> {
	try {
		let directoriesString = await fsasync.readFile(kDirectorySettingsFile, 'utf-8');
		return DirectoryListConfig.sanitize(JSON.parse(directoriesString));
	} catch (e) {
		console.log('Failed to load directory list, using default.', e);
		return DirectoryListConfig.kDefault;
	}
};

async function saveDirectories() {
	let dirs = directoryList.value
	if (dirs == null) {
		return;
	}
	await fsasync.writeFile(
		kDirectorySettingsFile, JSON.stringify(dirs, null, kPrettyWriteIndent), 'utf-8');
}

export async function validateDirectory(dir: DirectoryListEntry): Promise<null | FormError> {
	let errors: SingleFormError[] = []

	if (!dir.name.match(DirectoryListEntry.kValidName)) {
		errors.push({
			field: 'name',
			message: 'Name may only contain alphanumeric characters.'
		});
	}

	if (!path.isAbsolute(dir.path)) {
		errors.push({
			field: 'path',
			message: 'Path should be absolute.'
		});
	}

	try {
		await fsasync.access(dir.path, fs.constants.W_OK | fs.constants.R_OK);
		let dirStat = await fsasync.stat(dir.path)

		if (!dirStat.isDirectory()) {
			errors.push({
				field: 'path',
				message: 'Path is not a directory.'
			});
		}
	} catch (e) {
		errors.push({
			field: 'path',
			message: 'Path is not accessible.'
		});
	}

	try {
		let duplicacyDirStat = await fsasync.stat(path.join(dir.path, kDuplicacyDir))

		if (!duplicacyDirStat.isDirectory()) {
			errors.push({
				field: 'path',
				message: 'Expected to find ' + kDuplicacyDir + ' directory inside.'
			});
		}
	} catch (e) {
		errors.push({
			field: 'path',
			message: 'Directory is not set up for duplicacy.'
		});
	}

	if (errors.length != 0) {
		return {
			formErrors: errors
		}
	}
	return null;
}

