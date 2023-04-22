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

	if (!parsed.depPath || parsed.depPath.endsWith('packages/kit')) {
		if (parsed.line.startsWith('{')) {
			try {
				parsed = JSON.parse(parsed.line);
			} catch {
				return;
			}
			if (parsed.name === 'pnpm:scope') {
				stdout.write(`\n::group::nested-${++count}\n`);
			} else if (parsed.name === 'pnpm:execution-time') {
				stdout.write(`::endgroup::\n`);
			}
			return;
		}

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
