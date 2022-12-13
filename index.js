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
import path from 'path';

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

const PACKAGES_FOLDER = `packages`;
const PACKAGE_NAME = `ui`;
const PACKAGE_NAMESPACE = `@commercial-helios`;
const PACKAGE_PATH = `${PACKAGES_FOLDER}/${PACKAGE_NAME}/src/components`;

(async () => {
	init({ clear });
	input.includes(`help`) && showHelp(0);
	chalkAnimation.rainbow("Hi Gang, Let's move some components");

	if (input.length === 0) {
		log.error(`No component name provided`);
		process.exit(1);
	}

	const [componentName] = input;

	// 0. Checks
	//check if there is a folder with the name of the input
	checkFolderExists(componentName);
	//check if component exports props
	checkExports(componentName);

	// 1. Get all the paths
	const paths = getPaths();

	// 2. move folder to targetPath
	moveComponent(paths.pathToPackage, componentName);

	// 3. update the index file in the ui package
	updateIndexFile(paths.pathToRepoRoot, componentName);

	// 4. update all the paths in repo
	updateImports(paths.pathToRepoRoot, componentName, paths.pathToProjectRoot);
})();

function checkFolderExists(componentName) {
	if (!fs.readdirSync('./').includes(componentName)) {
		log.error(`There is no folder with the name ${componentName}`);
		process.exit(1);
	}
}

function checkExports(componentName) {
	// Read the file contents
	const data = fs.readFileSync(
		`${componentName}/${componentName}.tsx`,
		'utf8'
	);

	// Check if the file contains the string
	const typeExport = `export type Props`;
	const interfaceExport = `export interface Props`;
	if (data.includes(typeExport) || data.includes(interfaceExport)) {
		log.error(
			`The component ${componentName} exports Props. Please rename them before moving the component.`
		);
		process.exit(1);
	}
}

function getPaths() {
	//check if current folder has a folder called packages
	//if not, move up one folder and check again and add ../ to path
	let relativePathToRepositoryRoot = '';
	const checkAndMoveUp = path => {
		if (!fs.readdirSync(path).includes(PACKAGES_FOLDER)) {
			checkAndMoveUp(path + '../');
		} else {
			relativePathToRepositoryRoot = path;
		}
	};

	checkAndMoveUp('./');

	//get the path to the project root like /shared/components
	const pathToProjectRoot = process.env.PWD.match(/(?<=\bprojects\b).*/i)[0];

	return {
		pathToRepoRoot: relativePathToRepositoryRoot,
		pathToProjectRoot: pathToProjectRoot,
		pathToPackage: relativePathToRepositoryRoot + PACKAGE_PATH
	};
}

function moveComponent(pathToPackage, componentName) {
	//move folder to targetPath
	fs.rename(
		`./${componentName}`,
		`${pathToPackage}/${componentName}`,
		err => {
			if (err) {
				// Handle any errors
				log.error(err);
				process.exit(1);
			} else {
				// The folder was moved successfully
				log.info('📦 Folder moved to new location');
			}
		}
	);
}

function updateIndexFile(pathToRepoRoot, componentName) {
	const data = `export * from './src/components/${componentName}'`;
	const filePath = `${pathToRepoRoot}${PACKAGES_FOLDER}/${PACKAGE_NAME}/index.ts`;

	try {
		fs.appendFileSync(filePath, data);
	} catch (err) {
		log.error(err);
		process.exit(1);
	}

	log.info('🔝 Added export statement to ui package index file');
}

function updateImports(root, componentName, pathToProjectRoot) {
	const files = fs.readdirSync(root);

	for (let file of files) {
		const filePath = path.join(root, file);

		const excludeFolders = /\.git|node_modules|public/;
		if (fs.statSync(filePath).isDirectory()) {
			if (!excludeFolders.test(filePath)) {
				// Recurse into a subdirectory
				updateImports(filePath, componentName, pathToProjectRoot);
			}
		} else {
			const textToReplace = new RegExp(
				`'@helios${pathToProjectRoot}/${componentName}'`,
				'g'
			);
			const replacement = `'${PACKAGE_NAMESPACE}/${PACKAGE_NAME}'`;
			const fileContents = fs.readFileSync(filePath, 'utf8');
			if (textToReplace.test(fileContents)) {
				const newFileContents = fileContents.replace(
					textToReplace,
					replacement
				);
				fs.writeFileSync(filePath, newFileContents);
				log.info(`Updated paths in ${filePath}`);
			}
		}
	}
}
