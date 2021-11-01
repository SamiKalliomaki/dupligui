import pathToRegexp from 'path-to-regexp';
import React from "react";
import ReactRouter, { Route, Switch } from "react-router";
import { Link } from "react-router-dom";

import { DuplicacyDirectoryEntry, DuplicacySnapshotListEntry } from "data/ipc";
import { Page } from './page';

type SnapshotListProps = ReactRouter.RouteComponentProps & {
	dirName: string,
}
class SnapshotList extends React.Component<SnapshotListProps, {
	error: string,
	snapshots: ReadonlyArray<DuplicacySnapshotListEntry> | null,
}> {
	constructor(props: SnapshotListProps) {
		super(props)

		this.state = {
			error: '',
			snapshots: null,
		}
	}

	componentDidMount() {
		this.refresh()
	}

	async refresh() {
		try {
			let snapshots = await window.ipc.getSnapshotList(this.props.dirName);
			this.setState({
				error: '',
				snapshots: snapshots,
			});
		} catch (e) {
			this.setState({
				error: 'Error: ' + e.message,
				snapshots: null,
			});
		}
	}

	render() {
		const snapshots = this.state.snapshots?.map((snapshot) => {
			return <Link key={snapshot.revision}
				to={this.props.match.url + '/' + snapshot.revision}
				className="panel-block">
				Revision #{snapshot.revision} from {snapshot.date}
			</Link>
		});

		return <div className="panel">
			<div className="panel-heading">
				Snapshots
			</div>
			{!this.state.error && !this.state.snapshots &&
				<div className="panel-block">
					<progress className="progress is-small is-primary" />
				</div>
			}
			{this.state.error &&
				<div className="panel-block">{this.state.error}</div>
			}
			{snapshots}
		</div>
	}
}

function humanReadableSize(bytes: number) {
	let humanSize = bytes;
	let sizeUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
	let sizeUnit = sizeUnits[0];
	for (const unit of sizeUnits) {
		if (humanSize < 1024) {
			break;
		}

		humanSize /= 1024;
		sizeUnit = unit;
	}

	return `${humanSize} ${sizeUnit}`;
}

type DirectoryViewProps = {
	root: DuplicacyDirectoryEntry,
	url: string,
	parentUrl: string,
}
class DirectoryView extends React.Component<DirectoryViewProps> {
	render() {
		const directoryRoutes = Object.values(this.props.root.subdirs).map((dir) => {
			return <Route key={dir.name}
				path={`${this.props.url}/${encodeURIComponent(dir.name)}`}
				exact
				render={(routeProps) => {
					return <DirectoryView root={dir} url={routeProps.match.url} parentUrl={this.props.url} />;
				}} />
		});

		return <Switch>
			<Route path={this.props.url} exact render={() => {
				const directories = Object.values(this.props.root.subdirs).map((dir) => {
					return <Link key={dir.name}
						to={`${this.props.url}/${encodeURIComponent(dir.name)}`}
						className="panel-block">
						{dir.name}
						<span className="has-text-grey-light ml-1">{humanReadableSize(dir.size)}</span>
					</Link>
				});
				const files = Object.values(this.props.root.files).map((file) => {


					return <span key={file.name}
						className="panel-block is-justify-content-space-between">
						<div className="is-pulled-left is-flex-shrink-0">
							{file.name}
							<span className="has-text-grey-light ml-1">{humanReadableSize(file.size)}</span>
						</div>
						<div className="is-pulled-right ml-1 has-text-grey-light is-overflow-ellipsis">
							{file.hash}
						</div>
					</span>
				});

				return <div>
					<Link className="panel-block" to={this.props.parentUrl}>..</Link>
					{directories}
					{files}
				</div>;
			}} />
			{directoryRoutes}
		</Switch>
	}
}

type SnapshotViewProps = ReactRouter.RouteComponentProps<{
	revision: string,
}> & {
	dirName: string,
	parentUrl: string,
};
class SnapshotView extends React.Component<SnapshotViewProps, {
	error: string,
	root: DuplicacyDirectoryEntry | null,
}> {
	constructor(props: SnapshotViewProps) {
		super(props);

		this.state = {
			error: '',
			root: null,
		};
	}

	componentDidMount() {
		this.refresh();
	}

	async refresh() {
		try {
			let root = await window.ipc.getSnapshotFileList(
				this.props.dirName,
				Number.parseInt(this.props.match.params.revision));
			this.setState({
				root: root,
				error: '',
			});
		} catch (e) {
			this.setState({
				root: null,
				error: 'Error: ' + e.message,
			});
		}
	}

	render() {
		return <div className="panel">
			<div className="panel-heading">
				Snapshot #{this.props.match.params.revision}
			</div>
			{!this.state.error && !this.state.root &&
				<div className="panel-block">
					<progress className="progress is-small is-primary" />
				</div>
			}
			{this.state.error &&
				<div className="panel-block">{this.state.error}</div>
			}
			{this.state.root &&
				<DirectoryView
					root={this.state.root}
					url={this.props.match.url}
					parentUrl={this.props.parentUrl} />}
		</div>
	}
}

type BrowseFilesProps = ReactRouter.RouteComponentProps<{
	name: string
}>;
export class BrowseFiles extends React.Component<BrowseFilesProps, {
}> {
	constructor(props: BrowseFilesProps) {
		super(props);
	}
	render() {
		const url = this.props.match.url;

		return <Page name={"Browse files: " + this.props.match.params.name}>
			<Switch>
				<Route path={`${url}`} exact render={(routeProps) => {
					return <SnapshotList dirName={this.props.match.params.name} {...routeProps} />;
				}} />
				<Route path={`${url}/:revision`} render={(routeProps) => {
					return <SnapshotView
						dirName={this.props.match.params.name}
						parentUrl={url} {...routeProps} />;
				}} />
			</Switch>
		</Page >
	}
}