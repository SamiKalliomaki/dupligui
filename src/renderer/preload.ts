import { contextBridge, ipcRenderer } from "electron"
import { IpcApi, IpcObservables } from "data/ipcApi"
import { ObserverBinderImpl } from "./ipc/observerBinderImpl";
import { IpcObserverBinders, ObserverBinder } from "./ipc/observerBinder";
import { Observer } from "./ipc/observer";

function forwardIpc<IpcName extends keyof IpcApi>(ipcName: IpcName): IpcApi[IpcName] {
	return (...args: any[]) => {
		return ipcRenderer.invoke(ipcName, ...args);
	};
}


let ipc: IpcApi = {
	selectDirectory: forwardIpc('selectDirectory'),
	addDirectory: forwardIpc('addDirectory'),
	removeDirectory: forwardIpc('removeDirectory'),

	getDirectoryConfig: forwardIpc('getDirectoryConfig'),
	updateDirectoryConfig: forwardIpc('updateDirectoryConfig'),
	getDirectoryStats: forwardIpc('getDirectoryStats'),

	updateAppConfig: forwardIpc('updateAppConfig'),

	getBackupLog: forwardIpc('getBackupLog'),

	getSnapshotList: forwardIpc('getSnapshotList'),
	getSnapshotFileList: forwardIpc('getSnapshotFileList'),
};

let observerBinders: IpcObserverBinders = {
	directories: new ObserverBinderImpl('directories'),
	appConfig: new ObserverBinderImpl('appConfig'),
}

function registerObserver<T extends keyof IpcObservables>(name: T, observer: Observer<T>) {
	(<ObserverBinder<T>>observerBinders[name]).registerObserver(observer);
}

function unregisterObserver<T extends keyof IpcObservables>(name: T, observer: Observer<T>) {
	(<ObserverBinder<T>>observerBinders[name]).unregisterObserver(observer);
}

function getValue<T extends keyof IpcObservables>(name: T): Promise<IpcObservables[T]> {
	return (<ObserverBinder<T>>observerBinders[name]).getValue();
}

contextBridge.exposeInMainWorld('ipc', ipc);
contextBridge.exposeInMainWorld('registerObserver', registerObserver);
contextBridge.exposeInMainWorld('unregisterObserver', unregisterObserver);
contextBridge.exposeInMainWorld('getValue', getValue);