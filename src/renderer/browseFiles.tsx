import React from "react";
import ReactRouter from "react-router";

import { DuplicacySnapshotListEntry } from "data/ipc";
import { Page } from './page';

type SnapshotListProps = {
	dirName: string,
}
class SnapshotList extends React.Component<SnapshotListProps, {
	error: string,
	snapshots: ReadonlyArray<DuplicacySnapshotListEntry>,
}> {
	constructor(props: SnapshotListProps) {
		super(props)

		this.state = {
			error: '',
			snapshots: [],
		}
	}

	componentDidMount() {
		this.refresh()
	}

	async refresh() {
		try {
			let snapshots = await window.ipc.getSnapshotList(this.props.dirName);
			console.log(snapshots);
			this.setState({
				snapshots: snapshots,
				error: '',
			});
		} catch (e) {
			this.setState({
				snapshots: [],
				error: 'Error: ' + e.message,
			});
		}
	}

	render() {
		const snapshots = this.state.snapshots.map((snapshot) => {
			return <a className="panel-block" key={snapshot.revision}>
				Revision #{snapshot.revision} from {snapshot.date}
			</a>
		});

		return <div className="panel">
			<div className="panel-heading">
				Snapshots
			</div>
			{!this.state.error && this.state.snapshots.length == 0 &&
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

type BrowseFilesProps = ReactRouter.RouteComponentProps<{
	name: string
}>;
export class BrowseFiles extends React.Component<BrowseFilesProps, {
}> {
	constructor(props: BrowseFilesProps) {
		super(props);
	}
	render() {
		return <Page name={"Browse files: " + this.props.match.params.name}>
			<SnapshotList dirName={this.props.match.params.name} />
		</Page >
	}
}