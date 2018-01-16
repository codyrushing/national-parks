const { exec } = require('child_process');
const handler = (err, stdout, stderr) => {
  console.log(this);
  console.log(stdout);
  console.error(stderr);
}

const devProcesses = [
  'npm run dev:server',
  'npm run dev:css',
  'npm run dev:js'
]
.map(
  command => {
    const devProcess = exec(command);
    devProcess.stdout.pipe(process.stdout);
    devProcess.stderr.pipe(process.stderr);
    return devProcess;
  }
);

const onExit = (options, err) => {
  devProcesses.forEach(
    devProcess => devProcess.kill()
  );
};

//do something when app is closing
process.on('exit', onExit);

//catches ctrl+c event
process.on('SIGINT', onExit);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', onExit);
process.on('SIGUSR2', onExit);

//catches uncaught exceptions
process.on('uncaughtException', onExit);
