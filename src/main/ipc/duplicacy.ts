import { DuplicacySnapshotListEntry } from "data/ipc";
import { getDirectoryPath } from "../service/directoryList";
import { runDuplicacyWithOutput } from "../service/duplicacy";
import { handleIpc } from "./util";

const kSnapshotListRegex = /^Snapshot .+ revision (\d+) created at (.*[^\w])$/gm;

handleIpc('getSnapshotList', async (event, name) => {
	let output = await runDuplicacyWithOutput(['list'], await getDirectoryPath(name), null);

	console.log(output);

	const result: DuplicacySnapshotListEntry[] = []
	for (var line of output.matchAll(kSnapshotListRegex)) {
		result.push({
			revision: Number.parseInt(line[1]),
			date: line[2],
		});
	}

	result.sort((a, b) => b.revision - a.revision);
	return result;
});