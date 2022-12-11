import welcome from 'cli-welcome';

import unhandled from 'cli-handle-unhandled';

export default ({ clear = true }) => {
	unhandled();
	welcome({
		title: `move-component`,
		tagLine: `by Max Klammer`,
		description: 'Moves component to ui package and updates all the paths',
		version: '0.0.1',
		bgColor: '#36BB09',
		color: '#000000',
		bold: true,
		clear
	});
};
