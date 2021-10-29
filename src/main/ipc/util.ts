import { ipcMain } from "electron";
import { IpcApi } from "data/ipcApi"

// This helper ensures the function takes the correct arguments.
export function handleIpc<NameType extends keyof IpcApi>(
	name: NameType,
	fn: (
		event: Electron.IpcMainInvokeEvent,
		...args: Parameters<IpcApi[NameType]>
	) => ReturnType<IpcApi[NameType]>) {
	ipcMain.handle(name, (event, ...args: Parameters<IpcApi[NameType]>) => {
		console.log('IPC:', name);
		return fn(event, ...args);
	});
}