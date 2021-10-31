import { dialog } from "electron";

import { DirectoryListEntry } from "data/directories";
import { addDirectory, removeDirectory, validateDirectory } from "../service/directoryList";
import { handleIpc } from "./util";

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

handleIpc('addDirectory', async (event, newDir: DirectoryListEntry) => {
	return await addDirectory(newDir);
});

handleIpc('removeDirectory', async (event, dir: DirectoryListEntry) => {
	return await removeDirectory(dir.name);
});
