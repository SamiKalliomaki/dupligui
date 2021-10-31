import React from "react";
import ReactRouter from "react-router";

import { Page } from './page';

type BackupLogProps = ReactRouter.RouteComponentProps<{
	name: string
}>;
export class BackupLog extends React.Component<BackupLogProps, {
	log: string
}> {
	constructor(props: BackupLogProps) {
		super(props);

		this.state = {
			log: ''
		}
	}

	componentDidMount() {
		this.refresh();
	}

	async refresh() {
		try {
			let log = await window.ipc.getBackupLog(this.props.match.params.name);
			this.setState({
				log: log
			});
		} catch (e) {
			this.setState({
				log: 'Error: ' + e.message
			});
		}
	}

	render() {
		return <Page name={"Backup log for directory: " + this.props.match.params.name}>
			<div className="block">
				<button className="button is-primary" onClick={this.refresh.bind(this)}>Refresh</button>
			</div>
			<div className="block">
				<pre className="output-log">{this.state.log}</pre>
			</div>
		</Page >
	}
}