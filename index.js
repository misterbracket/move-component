#!/usr/bin/env node

/**
 * move-component
 * Moves component to ui package and updates all the paths
 *
 * @author Max Klammer <https://maxklammer.com>
 */

import fs from 'fs';
import chalkAnimation from 'chalk-animation';

import init from './utils/init.js';
import cli from './utils/cli.js';
import log from './utils/log.js';

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

const PACKAGES_FOLDER = `packages`;
const PACKAGE_NAME = `ui`;
const PACKAGE_PATH = `${PACKAGES_FOLDER}/${PACKAGE_NAME}/src/components`;

(async () => {
	init({ clear });
	input.includes(`help`) && showHelp(0);
	chalkAnimation.rainbow("Hi Gang, Let's move some components"); // Animation starts

	// //check if input is empty
	if (input.length === 0) {
		log.error(`Please provide a component name`);
	}

	const [componentName] = input;

	//check if there is a folder with the name of the input
	//if not, exit
	//if yes, move the folder to the ui package

	if (!fs.readdirSync('./').includes(componentName)) {
		log.error(`There is no folder with the name ${componentName}`);
	}

	const [pathToRoot, componentTargetPath] = buildPath();

	//1. move folder to targetPath
	moveComponent(componentTargetPath, componentName);

	//2. update the index file in the ui package
	updateIndexFile(pathToRoot, componentName);

	debug && log(flags);
})();

function buildPath() {
	//check if current folder has a folder called packages
	//if not, move up one folder and check again and add ../ to path
	let pathToProjectRoot = '';
	const checkAndMoveUp = path => {
		if (!fs.readdirSync(path).includes(PACKAGES_FOLDER)) {
			checkAndMoveUp(path + '../');
		} else {
			pathToProjectRoot = path;
		}
	};

	checkAndMoveUp('./');

	return [pathToProjectRoot, pathToProjectRoot + PACKAGE_PATH];
}

function moveComponent(targetPath, componentName) {
	//move folder to targetPath
	fs.rename(`./${componentName}`, `${targetPath}/${componentName}`, err => {
		if (err) {
			// Handle any errors
			log.error(err);
		} else {
			// The folder was moved successfully
			log.info('Folder moved to new location');
		}
	});
}

function updateIndexFile(pathToRoot, componentName) {
	const data = `export * from './src/components/${componentName}';`;
	const filePath = `${pathToRoot}${PACKAGES_FOLDER}/${PACKAGE_NAME}/index.ts`;

	fs.appendFile(filePath, data, err => {
		if (err) {
			log.error(err);
		} else {
			log.info('Added export statement to ui package index file');
		}
	});
}
