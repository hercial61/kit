import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';

const buf = new Map();

let exitCode = 0;
let count = 0;
function process_line(line) {
	let parsed = null;
	if (!line) return stdout.write('\n');

	try {
		parsed = JSON.parse(line);
		if (!parsed.line) return;
	} catch {
		stdout.write(line);
		stdout.write('\n');
		return;
	}

	if (parsed.exitCode) {
		process.exitCode = exitCode = parsed.exitCode;
		return;
	}

	if (!parsed.depPath) {
		return;
	} else if (parsed.line.startsWith('{')) {
		try {
			parsed = JSON.parse(parsed.line);
		} catch {
			return;
		}
		if (parsed.name === 'pnpm:scope') {
			count++;
			// nested groups don't work yet so we only use groups for nested scripts inside packages/kit/test/*
			// where we have a lot of output
			if (count === 3) {
				stdout.write(`\n::group::`);
			}
		} else if (parsed.name === 'pnpm:execution-time') {
			if (count === 3) {
				const time = ((parsed.endedAt - parsed.startedAt) / 1000).toFixed(2);
				stdout.write(`::endgroup:: took ${time}s\n\n`);
			}
			count--;
		}
	} else if (parsed.depPath.endsWith('/packages/kit')) {
		stdout.write(parsed.line);
		stdout.write('\n');
	} else {
		let existing = buf.get(parsed.depPath);

		if (!existing) {
			buf.set(parsed.depPath, (existing = []));
		}

		existing.push(parsed.line);
	}
}

createInterface({
	input: stdin
})
	.on('line', process_line)
	.on('close', () => {
		for (const [dep, lines] of buf) {
			stdout.write(`::group::${dep}\n`);
			stdout.write(lines.join('\n'));
			stdout.write('\n::endgroup::\n');
		}

		exit(exitCode);
	});
