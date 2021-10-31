import { DirectoryStats } from "data/ipc";

import { calculateNextBackup } from "../service/backupScheduler";
import { getDirectoryConfig, updateDirectoryConfigByPath } from "../service/directoryConfig";
import { getDirectoryPath } from "../service/directoryList";
import { handleIpc } from "./util";

handleIpc('getDirectoryConfig', async (event, name) => {
	return getDirectoryConfig(name);
});

handleIpc('updateDirectoryConfig', async (event, name, updates) => {
	const dirPath = await getDirectoryPath(name);
	await updateDirectoryConfigByPath(dirPath, updates);
});

handleIpc('getDirectoryStats', async (event, name) => {
	let config = await getDirectoryConfig(name);

	const result: DirectoryStats = {
		directoryConfig: config,
		nextBackup: calculateNextBackup(config)?.toISOString() || null,
	};
	return result;
});