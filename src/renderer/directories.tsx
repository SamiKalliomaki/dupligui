import * as React from 'react';

import { DirectoryListConfig, DirectoryListEntry } from 'data/directories';
import { ObserverLifecycle } from './ipc/observer';
import { Page } from './page';
import { toFormErrorState } from './utils';
import { DirectoryConfig } from 'data/directoryConfig';
import { DirectoryStats } from 'data/ipc';

const kDirectoryUpdateInterval = 5000;

type DirectoryProps = {
	directory: DirectoryListEntry
}
class Directory extends React.Component<DirectoryProps, {
	directoryStats: DirectoryStats | null
}> {
	private _interval: NodeJS.Timer | null = null;

	constructor(
		props: DirectoryProps
	) {
		super(props);

		this.state = {
			directoryStats: null
		}
	}

	componentDidMount() {
		if (this._interval === null) {
			this._interval = setInterval(this.updateDirectoryStats.bind(this), kDirectoryUpdateInterval);
			this.updateDirectoryStats();
		}
	}

	componentWillUnmount() {
		if (this._interval) {
			clearInterval(this._interval);
			this._interval = null;
		}
	}

	updateDirectoryStats() {
		window.ipc.getDirectoryStats(this.props.directory.name).then((stats) => {
			this.setState({
				directoryStats: stats
			});
		}, (e) => {
			this.setState({
				directoryStats: null
			});
		})
	}

	async remove() {
		await window.ipc.removeDirectory(this.props.directory);
	}

	render() {
		function prettyDate(date: string | null) {
			if (date === null) {
				return 'Never';
			}

			return new Date(date).toLocaleString();
		}

		return <div className="column is-full is-half-desktop is-one-third-fullhd">
			<div className="card">
				<div className="card-header">
					<p className="card-header-title">Directory: {this.props.directory.name}</p>
				</div>
				<div className="card-content">
					<p><b>Path:</b> {this.props.directory.path}</p>
					{this.state.directoryStats && <div>
						<p><b>Last backup:</b> {prettyDate(this.state.directoryStats.directoryConfig.lastBackup)}</p>
						<p><b>Last backup result:</b> {this.state.directoryStats.directoryConfig.lastBackupResult}</p>
						<p><b>Next backup:</b> {prettyDate(this.state.directoryStats.nextBackup)}</p>
						<p><b>State:</b> {this.state.directoryStats.directoryConfig.backupState}</p>
					</div>}
				</div>
				<footer className="card-footer">
					<a className="card-footer-item" onClick={this.remove.bind(this)}>
						Remove
					</a>
				</footer>
			</div>
		</div>
	}
}

class AddDirectory extends React.Component<{}, {
	path: string,
	name: string,
	error: string,
	fieldErrors: { [field in string]: string },
	processing: boolean
}> {
	static readonly kClearState = {
		path: '',
		name: '',
		error: '',
		fieldErrors: {},
	} as const;
	static readonly kInitialState = {
		...this.kClearState,
		processing: false
	} as const;

	constructor(props: {}) {
		super(props);

		this.state = { ...AddDirectory.kInitialState };
	}

	selectDirectory() {
		if (this.state.processing) {
			return;
		}

		window.ipc.selectDirectory().then((result) => {
			if (result.cancelled) {
				return;
			}

			var name = result.path.split('\\').pop() || '';
			name = name.split('/').pop() || '';

			this.setState({
				path: result.path,
				name: name,
				error: '',
				fieldErrors: {}
			})
		}, (e) => {
			this.setState({
				fieldErrors: {
					field: 'path',
					error: e.message
				}
			})
		});
	}

	clear() {
		if (this.state.processing) {
			return;
		}

		this.setState(AddDirectory.kClearState)
	}

	async add() {
		if (this.state.processing) {
			return;
		}

		this.setState({
			processing: true
		});
		try {
			let result = await window.ipc.addDirectory({
				name: this.state.name,
				path: this.state.path,
			});

			if (result && 'formErrors' in result) {
				this.setState(toFormErrorState(result));
			} else {
				// Success.
				this.setState(AddDirectory.kClearState);
			}
		} catch (e) {
			this.setState(toFormErrorState(e));
		} finally {
			this.setState({
				processing: false,
			});
		}
	}

	handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ name: event.target.value })
	}

	render() {
		return <div className="column is-full">
			<div className="card">
				<div className="card-header">
					<p className="card-header-title">Add a new directory</p>
				</div>
				<div className="card-content">
					{this.state.error &&
						<div className="notification is-warning is-hidden">{this.state.error}</div>
					}
					<label htmlFor="new-directory-path" className="label">Path</label>
					<p className="help is-danger">{this.state.fieldErrors['path']}</p>
					<div className="field has-addons">
						<div className="control is-expanded">
							<input
								id="new-directory-path"
								className="input"
								type="text"
								value={this.state.path}
								readOnly />
						</div>
						<div className="control">
							<button className="button is-primary" onClick={this.selectDirectory.bind(this)}>
								Select a directory...
							</button>
						</div>
					</div>
					<div className="field">
						<label htmlFor="new-directory-name" className="label">Name</label>
						<p className="help is-danger">{this.state.fieldErrors['name']}</p>
						<div className="control is-expanded">
							<input
								id="new-directory-name"
								className="input"
								type="text"
								value={this.state.name}
								onChange={this.handleNameChange.bind(this)} />
						</div>
					</div>
				</div>
				<footer className="card-footer">
					<a className="card-footer-item" onClick={this.clear.bind(this)}>
						Clear
					</a>
					<a className="card-footer-item is-primary" onClick={this.add.bind(this)}>
						Add
					</a>
				</footer>
			</div>
		</div>
	}
}

export default class Directories extends React.Component<{}, {
	directories: ReadonlyArray<DirectoryListEntry>
}> {
	private readonly _observerLifecycle = new ObserverLifecycle();

	constructor(props: {}) {
		super(props);

		this.state = {
			directories: []
		};
		this._observerLifecycle.addObserver('directories', (value: DirectoryListConfig) => {
			this.setState({
				directories: value.directories
			});
		});
	}

	componentDidMount() {
		this._observerLifecycle.register();
	}

	componentWillUnmount() {
		this._observerLifecycle.unregister();
	}

	render() {
		let directories = this.state.directories.map((directory) =>
			<Directory key={directory.name} directory={directory} />
		);

		return <Page name="Directories">
			<div className="columns is-multiline">
				{directories}
				<AddDirectory />
			</div>
		</Page>
	}
}