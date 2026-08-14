const requiredMajor = 24;
const actualMajor = Number.parseInt(process.versions.node.split(".")[0], 10);

if (actualMajor !== requiredMajor) {
  console.error(
    `farms-frontend requires Node ${requiredMajor}.x; this shell is using ${process.version}. Run \`nvm use\` (or activate .node-version) and try again.`,
  );
  process.exit(1);
}
