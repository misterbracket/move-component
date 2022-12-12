import meow from 'meow';
import meowHelp from 'cli-meow-help';

const commands = {
	help: { desc: `Print help info` }
};

const helpText = meowHelp({
	name: `move-component`,
	commands
});

const options = {
	inferType: true,
	description: false,
	hardRejection: false
};

export default meow(helpText, options);
