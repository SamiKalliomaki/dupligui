import { app, ipcMain, dialog } from "electron";
import { promises as fsasync } from "fs";
import fs from "fs";
import path from "path";

import { DirectoryListConfig, DirectoryListEntry } from "data/directories";
import { handleIpc } from "./util";
import { Observable } from "./observable";
import { kDuplicacyDir, kPrettyWriteIndent } from "data/util";
import { FormError, SingleFormError } from "data/ipc";

const kDirectorySettingsFile = path.join(app.getPath('userData'), 'directories.json');
const directoryList: Observable<'directories'> = new Observable('directories', loadDirectories)

async function loadDirectories(): Promise<Readonly<DirectoryListConfig>> {
	if (directoryList.value != null) {
		return directoryList.value;
	}

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

export async function getDirectoryListConfig(): Promise<DirectoryListConfig> {
	return directoryList.getValue();
}

handleIpc('selectDirectory', async (event) => {
	if (mainWindow == null) {
		throw new Error('Main window closed.');
	}

	const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
	if (result.canceled) {
		return {
			cancelled: true,
			path: ''
		};
	}
	return {
		cancelled: false,
		path: result.filePaths[0]
	};
});

async function validateDirectory(dir: DirectoryListEntry): Promise<null | FormError> {
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

handleIpc('addDirectory', async (event, newDir: DirectoryListEntry) => {
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

	return null;
});

handleIpc('removeDirectory', async (event, dir: DirectoryListEntry) => {
	let prevData = await directoryList.getValue()
	let newDirs = prevData.directories.filter(v => v.name != dir.name);

	directoryList.setValue({
		...prevData,
		directories: newDirs
	});
	await saveDirectories();
});
