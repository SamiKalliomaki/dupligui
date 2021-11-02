import { IpcObservables } from "data/ipcApi";
import { Observer } from "./observer";

export interface ObserverBinder<T extends keyof IpcObservables> {
	get value(): IpcObservables[T] | null;

	registerObserver(observer: Observer<T>): void;
	unregisterObserver(observer: Observer<T>): void;
	getValue(): Promise<IpcObservables[T]>;
}

export type IpcObserverBinders = {
	[Name in keyof IpcObservables]-?: ObserverBinder<Name>
}