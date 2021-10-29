import { contextBridge, ipcRenderer } from "electron"
import { IpcApi, IpcObservables } from "data/ipcApi"
import { ObserverBinderImpl } from "./ipc/observerBinderImpl";
import { IpcObserverBinders } from "./ipc/observerBinder";
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

	getAppConfig: forwardIpc('getAppConfig'),
	setAppConfig: forwardIpc('setAppConfig'),
};

let observerBinders: IpcObserverBinders = {
	directories: new ObserverBinderImpl('directories')
}

function registerObserver<T extends keyof IpcObservables>(name: T, observer: Observer<T>) {
	observerBinders[name].registerObserver(observer);
}

function unregisterObserver<T extends keyof IpcObservables>(name: T, observer: Observer<T>) {
	observerBinders[name].unregisterObserver(observer);
}

contextBridge.exposeInMainWorld('ipc', ipc);
contextBridge.exposeInMainWorld('registerObserver', registerObserver);
contextBridge.exposeInMainWorld('unregisterObserver', unregisterObserver);