import fs from 'fs';
import child_process from 'child_process';

export function runDuplicacyWithOutput(
	args: string[], cwd: string, logFile: string | null): Promise<string> {
	let process = runDuplicacyInternal(args, cwd, logFile);

	let output = '';
	process.stdout.on('data', (data) => {
		output += data;
	});
	return promisifyProcess(process).then(() => output);
}

export function runDuplicacy(args: string[], cwd: string, logFile: string | null): Promise<void> {
	return promisifyProcess(runDuplicacyInternal(args, cwd, logFile));
}

function promisifyProcess(process: child_process.ChildProcess): Promise<void> {
	return new Promise((resolve, reject) => {
		process.on('exit', (code, signal) => {
			if (code == 0) {
				resolve();
			} else {
				reject(new Error('Exit code: ' + code));
			}
		});
		process.on('error', (e) => {
			reject(e);
		});
	});
}

function runDuplicacyInternal(args: string[], cwd: string, logFile: string | null) {
	let process = child_process.spawn('duplicacy', args, {
		cwd: cwd,
	});

	let log: fs.WriteStream | null = null;
	if (logFile != null) {
		log = fs.createWriteStream(logFile);
		process.stdout.on('data', (data) => {
			log?.write(data);
		});
		process.stderr.on('data', (data) => {
			log?.write(data);
		});
		process.on('exit', () => {
			log?.close();
		});
		process.on('error', () => {
			log?.close();
		});
	}

	return process;
}