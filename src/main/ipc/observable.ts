import { IpcObservables } from "data/ipcApi";
import { ipcMain } from "electron";

function lazyInit<Type>(fn: () => Promise<Type>): () => Promise<Type> {
	let prom: Promise<Type> | null = null
	return async () => {
		while (prom != null) {
			try {
				return await prom.then(v => v, reason => {
					prom = null;
					return reason;
				});
			} catch (e) { }
		}
		return prom = prom || fn();
	};
}

type ObservableInitialValueProvider<T extends keyof IpcObservables> =
	() => Promise<Readonly<IpcObservables[T]>>;

export class Observable<T extends keyof IpcObservables> {
	private _value: Readonly<IpcObservables[T]> | null = null;
	private _initialValue: ObservableInitialValueProvider<T>;

	constructor(
		private readonly _name: T,
		_initialValue: ObservableInitialValueProvider<T>) {
		this._initialValue = lazyInit(_initialValue);

		ipcMain.handle('requestObservable_' + _name, async (event) => {
			let result = await this.getValue();
			this.sendValue();
			return result;
		});
	}

	public get value(): IpcObservables[T] | null {
		return this._value && { ...this._value };
	}

	public async getValue(): Promise<IpcObservables[T]> {
		if (this._value != null) {
			return { ...this._value };
		}

		let initialValue = await this._initialValue();
		this.setValue(initialValue);
		return { ...initialValue };
	}

	public setValue(newValue: Readonly<IpcObservables[T]>) {
		this._value = { ...newValue };
		this.sendValue();
	}

	private sendValue() {
		if (mainWindow != null) {
			mainWindow.webContents.send('observableValue_' + this._name, this._value);
		}
	}
}