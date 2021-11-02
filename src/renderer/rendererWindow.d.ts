import { IpcApi, IpcObservables } from 'data/ipcApi';
import { Observer } from './ipc/observer';
import { ObserverBinder, IpcObserverBinders } from './ipc/observerBinder';

type ObserverRegistration = <T extends keyof IpcObservables>(name: T, observer: Observer<T>) => void;

declare global {
	interface Window {
		ipc: IpcApi;
		registerObserver: ObserverRegistration;
		unregisterObserver: ObserverRegistration;
		getValue: <T extends keyof IpcObservables>(name: T) => Promise<IpcObservables[T]>;
	}
}