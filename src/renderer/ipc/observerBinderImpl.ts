import { IpcObservables } from "data/ipcApi";
import { ipcRenderer } from "electron";
import { Observer } from "./observer";
import { ObserverBinder } from "./observerBinder";

export class ObserverBinderImpl<T extends keyof IpcObservables> implements ObserverBinder<T> {
	private _value: IpcObservables[T] | null;
	private _observers: Observer<T>[] = [];

	constructor(private readonly _name: T) {
		ipcRenderer.on('observableValue_' + _name, (event, newValue) => {
			this._value = newValue;
			for (let o of this._observers) {
				o(newValue);
			}
		});
	}

	public get value() {
		return this._value;
	}

	registerObserver(observer: Observer<T>) {
		if (this._observers.length == 0 && this._value == null) {
			ipcRenderer.invoke('requestObservable_' + this._name);
		}

		if (!this._observers.includes(observer)) {
			this._observers.push(observer);
		}
		if (this._value != null) {
			observer(this._value);
		}
	}

	unregisterObserver(observer: Observer<T>): void {
		const index = this._observers.indexOf(observer);
		if (index > -1)
			this._observers.splice(index, 1);
	}
}