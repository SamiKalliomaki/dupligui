import './index.scss'

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { NavLink, Route, HashRouter as Router, Switch, Redirect } from 'react-router-dom';

import { ObserverLifecycle } from './ipc/observer';
import { DirectoryListEntry } from 'data/directories';
import { AppConfigPage } from './config';
import Directories from './directories';
import { BackupSchedule } from './backupSchedule';
import { BackupLog } from './backupLog';

export function AppLink(props: React.PropsWithChildren<{
	to: string
}>) {
	return (
		<NavLink to={props.to} activeClassName="is-active">{props.children}</NavLink>
	);
}

export class App extends React.Component<{}, {
	directories: ReadonlyArray<DirectoryListEntry>
}> {
	private _observerLifecycle = new ObserverLifecycle();

	constructor(props: {}) {
		super(props);

		this.state = {
			directories: []
		};

		this._observerLifecycle.addObserver('directories', value => {
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
		let directories = this.state.directories.flatMap((directory) => [
			<p key={directory.name + '-label'} className="menu-label">
				Directory: {directory.name}
			</p>,
			<ul key={directory.name + '-menu'} className="menu-list">
				<li>
					<AppLink to={"/backup-schedule/" + directory.name}>Backup schedule</AppLink>
					<AppLink to={"/backup-log/" + directory.name}>Backup log</AppLink>
				</li>
			</ul>
		]);

		return (
			<Router>
				<div className="columns">
					<div className="column is-3" id="main-menu">
						<aside className="menu">
							<p className="menu-label">
								General
							</p>
							<ul className="menu-list">
								<li><AppLink to="/config">Configuration</AppLink></li>
								<li><AppLink to="/directories">Directories</AppLink></li>
							</ul>
							{directories}
						</aside>
					</div>


					<div className="column is-9">
						<Switch>
							<Route
								exact
								path="/"
								render={() => {
									return <Redirect to="/directories" />;
								}}
							/>
							<Route path="/config" component={AppConfigPage} />
							<Route path="/directories" component={Directories} />
							<Route path="/backup-schedule/:name" component={BackupSchedule} />
							<Route path="/backup-log/:name" component={BackupLog} />
						</Switch>
					</div>
				</div>
			</Router>
		);
	}
}

ReactDOM.render(<App />, document.getElementById('app'));