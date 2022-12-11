import alert from 'cli-alerts';

const log = (info, level = 'warning') => {
	alert({
		type: level,
		name: level === `error` ? `Error` : `Info`,
		msg: info
	});
};

export default {
	error: info => log(info, `error`),
	warning: info => log(info, `warning`),
	info: info => log(info, `info`)
};
