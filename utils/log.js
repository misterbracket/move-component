import chalk from 'chalk';
const log = (info, level = 'warning') => {
	//log error with chalk
	const logLevels = {
		error: chalk.red,
		warning: chalk.yellow,
		info: chalk.blue
	};

	const logLevel = logLevels[level];

	console.log(logLevel(info));
	console.log();
};

export default {
	error: info => log(info, `error`),
	warning: info => log(info, `warning`),
	info: info => log(info, `info`)
};
