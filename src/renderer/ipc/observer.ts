import { IpcObservables } from "data/ipcApi";

export type Observer<T extends keyof IpcObservables> = (value: IpcObservables[T]) => void;

export class ObserverLifecycle {
	private _observers: {
		name: keyof IpcObservables,
		observer: Observer<any>
	}[] = [];
	private _isActive = false;

	addObserver<T extends keyof IpcObservables>(name: T, observer: Observer<T>) {
		this._observers.push({
			name: name,
			observer: observer
		});
		if (this._isActive) {
			window.registerObserver(name, observer);
		}
	}

	register() {
		this._isActive = true;
		for (let o of this._observers) {
			window.registerObserver(o.name, o.observer);
		}
	}

	unregister() {
		this._isActive = false;
		for (let o of this._observers) {
			window.unregisterObserver(o.name, o.observer);
		}
	}
}