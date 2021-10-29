type JobFunction = () => Promise<void>;

let executingJob: Promise<void> | null = null;
let jobs: JobFunction[] = [];

function maybeRunJob() {
	if (jobs.length == 0 || executingJob !== null) {
		return;
	}

	let job = jobs.shift();
	if (job === undefined)
		throw new Error('Unexpected condition');
	executingJob = job();
	executingJob.finally(() => {
		executingJob = null;
		maybeRunJob();
	});
}

export function addJob(job: JobFunction) {
	jobs.push(job);
	maybeRunJob();
}