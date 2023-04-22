import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';

const buf = new Map();

let exitCode = 0;
function process_line(line) {
	let parsed = null;
	try {
		parsed = JSON.parse(line);
	} catch {
		stdout.write(line);
		stdout.write('\n');
		return;
	}

	if (parsed.exitCode) {
		process.exitCode = exitCode = parsed.exitCode;
	}

	if (!parsed.line) {
		return;
	}

	if (!parsed.depPath || parsed.depPath.endsWith('packages/kit')) {
		if (parsed.line.startsWith('{"time"')) return stdout.write('\n');

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
