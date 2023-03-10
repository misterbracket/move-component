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
const { clear } = flags;

const PACKAGES_FOLDER = `packages`;
const PACKAGE_NAME = `ui`;
const PACKAGE_PATH = `${PACKAGES_FOLDER}/${PACKAGE_NAME}/src/components`;

(async () => {
	init({ clear });

	if (input.length === 0) {
		log.error(`No component name provided`);
		process.exit(1);
	}

	const [componentName] = input;

	// 0. Checks
	//check if there is a folder with the name of the input
	checkFolderExists(componentName);
	// check if exports are named exports
	checkForNamedExports(componentName);
	//check if component exports props
	checkPropsExports(componentName);

	// 1. Get all the paths
	const paths = getPaths();

	// 2. move folder to targetPath
	moveComponent(paths.pathToPackage, componentName);

	// 3. update the index file in the ui package
	updateIndexFile(paths.pathToRepoRoot, componentName);

	// 4. update all the paths in repo
	logImports(paths.pathToRepoRoot, componentName, paths.pathToProjectRoot);

	const endAnimation = chalkAnimation.rainbow(
		'🎉 Component moved successfully'
	);

	setTimeout(() => {
		endAnimation.stop();
	}, 2000);
})();

function checkFolderExists(componentName) {
	if (!fs.readdirSync('./').includes(componentName)) {
		log.error(`There is no folder with the name ${componentName}`);
		process.exit(1);
	}
}

function checkForNamedExports(componentName) {
	const componentContent = fs.readFileSync(
		`./${componentName}/${componentName}.tsx`,
		'utf8'
	);

	if (componentContent.includes('export default')) {
		log.error(
			`The component ${componentName} exports a default export. Please change them into named exports before moving the component.`
		);
		process.exit(1);
	}
}

function checkPropsExports(componentName) {
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
			`The component ${componentName} has an export named "Props". Please rename the export before moving the component.`
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
	try {
		fs.renameSync(
			`./${componentName}`,
			`${pathToPackage}/${componentName}`
		);
		log.info('📦 Folder moved to new location');
	} catch (err) {
		log.error(err);
		process.exit(1);
	}
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

function logImports(root, componentName, pathToProjectRoot) {
	function updateImports(root, componentName, pathToProjectRoot) {
		const files = fs.readdirSync(root);

		const oldImport = new RegExp(
			`'@helios${pathToProjectRoot}/${componentName}'`,
			'g'
		);

		for (let file of files) {
			const filePath = path.join(root, file);

			const excludeFolders = /\.git|node_modules|public|.cache/;
			if (fs.statSync(filePath).isDirectory()) {
				if (!excludeFolders.test(filePath)) {
					// Recurse into a subdirectory
					updateImports(filePath, componentName, pathToProjectRoot);
				}
			} else {
				const fileContents = fs.readFileSync(filePath, 'utf8');
				if (oldImport.test(fileContents)) {
					log.warning('🐥 ' + filePath);
				}
			}
		}
	}
	log.info(`✨ You need to update the imports of the following components:`);

	updateImports(root, componentName, pathToProjectRoot);
}
