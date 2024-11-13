#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import ora from 'ora';
import { program } from 'commander';

// Get the current directory from import.meta.url
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

program
    .version('1.0.0')
    .argument('<project-name>', 'Name of the new Nuxius project')
    .option('-t, --template <template-path>', 'Path to the Nuxius template directory', path.join(__dirname, 'nuxius')) // Default to "nuxius" in the current directory
    .action((projectName, options) => {
        // Resolve the template path to an absolute path
        const templatePath = path.resolve(options.template);
        // Use the current working directory for the new project
        const projectPath = path.join(process.cwd(), projectName); // `process.cwd()` for the current directory

        // Start the loading spinner
        const spinner = ora(`Initializing Nuxius project '${projectName}'...`).start();

        try {
            // Check if the template path exists
            if (!fs.existsSync(templatePath)) {
                spinner.fail(`Template path '${templatePath}' does not exist.`);
                return;
            }

            // Create the new project directory if it does not exist
            if (!fs.existsSync(projectPath)) {
                fs.mkdirSync(projectPath, { recursive: true }); // Ensure directories are created
            }

            // Copy the template directory to the new project folder
            fs.cpSync(templatePath, projectPath, { recursive: true });

            // Update package.json with the new project name
            const packageJsonPath = path.join(projectPath, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            packageJson.name = projectName;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

            // Install dependencies
            exec(`npm install`, { cwd: projectPath }, (error, stdout, stderr) => {
                if (error) {
                    spinner.fail(`Error installing dependencies: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(stderr);
                }
                console.log(stdout);
                spinner.succeed(`Nuxius project '${projectName}' has been initialized successfully!`);
            });
        } catch (err) {
            spinner.fail(`Failed to initialize project: ${err.message}`);
        }
    });

program.parse(process.argv);
