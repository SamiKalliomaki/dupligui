import fs from 'fs';
import child_process from 'child_process';

export function runDuplicacyWithOutput(
	args: string[], cwd: string, logFile: string | null): Promise<string> {
	let output = '';
	let process = runDuplicacyInternal(args, cwd, null, (buffer) => {
		output += buffer.toString('utf-8');
	});
	return promisifyProcess(process).then(() => output);
}

export function runDuplicacy(args: string[], cwd: string, logFile: string | null): Promise<void> {
	return promisifyProcess(runDuplicacyInternal(args, cwd, logFile, null));
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

type OutputCallback = (data: Buffer) => void;
function runDuplicacyInternal(
	args: string[], cwd: string, logFile: string | null, stdoutCallback: OutputCallback | null) {
	let process = child_process.spawn('duplicacy', args, {
		cwd: cwd,
	});

	let log: fs.WriteStream | null = null;
	if (logFile != null) {
		log = fs.createWriteStream(logFile);

		process.on('exit', () => {
			log?.close();
		});
		process.on('error', () => {
			log?.close();
		});
	}

	if (log || stdoutCallback) {
		process.stdout.on('data', (data) => {
			log?.write(data);
			if (stdoutCallback) {
				stdoutCallback(data);
			}
		});
	} else {
		// Discard output.
		process.stdout.resume();
	}
	if (log) {
		process.stderr.on('data', (data) => {
			log?.write(data);
		});
	} else {
		// Discard output.
		process.stderr.resume();
	}

	return process;
}