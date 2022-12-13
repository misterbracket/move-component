export const camelize = s =>
	s
		.replace(/-./g, x => x[1].toUpperCase())
		.replace(/^./g, x => x.toUpperCase());
