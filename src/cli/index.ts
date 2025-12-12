#!/usr/bin/env node

import { Command } from 'commander';
import { io } from 'socket.io-client';
import { spawn } from 'child_process';
import path from 'path';
import chalk from 'chalk';

// Explicitly declare Node.js globals to resolve type errors
declare const require: any;
declare const process: any;
declare const __dirname: string;

const program = new Command();
const socket = io('http://localhost:3123', {
  autoConnect: false,
  reconnection: false
});

// Helper: Check if daemon is running
const checkDaemon = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    socket.connect();
    socket.on('connect', () => {
      resolve(true);
      socket.disconnect();
    });
    socket.on('connect_error', () => {
      resolve(false);
    });
  });
};

program
  .name('ai-cursor')
  .description('Control the Sundial AI Cursor System')
  .version('1.0.0');

program
  .command('start')
  .description('Start the AI Cursor overlay')
  .action(async () => {
    const isRunning = await checkDaemon();
    if (isRunning) {
      console.log(chalk.yellow('AI Cursor is already running.'));
      return;
    }

    console.log(chalk.green('Starting AI Cursor System...'));
    
    // Path to Electron binary
    const electronPath = require('electron');
    const mainScript = path.join(__dirname, '../overlay/main.js');

    const subprocess = spawn(electronPath, [mainScript], {
      detached: true,
      stdio: 'ignore'
    });
    subprocess.unref();
  });

program
  .command('stop')
  .description('Stop the overlay and restore system cursor')
  .action(async () => {
    socket.connect();
    socket.emit('stop');
    console.log(chalk.red('Stopping AI Cursor...'));
    setTimeout(() => process.exit(0), 1000);
  });

program
  .command('mode <type>')
  .description('Change cursor mode (vision | clarify | navigator)')
  .action((type) => {
    socket.connect();
    socket.emit('set-mode', type.toUpperCase());
    console.log(chalk.blue(`Mode set to: ${type}`));
    setTimeout(() => process.exit(0), 500);
  });

program.parse(process.argv);