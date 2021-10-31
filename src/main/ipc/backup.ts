import { handleIpc } from "./util";
import { promises as fsasync } from "fs";

import { getBackupLogFilename } from "../service/backup";
import { getDirectoryPath } from "../service/directoryList";

handleIpc('getBackupLog', async (event, name) => {
	return fsasync.readFile(getBackupLogFilename(await getDirectoryPath(name)), 'utf-8');
});