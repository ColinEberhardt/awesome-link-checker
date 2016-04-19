const ProgressBar = require('progress');
const awesomeLinkChecker = require('./index');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const Q = require('q');

const packageConfig = fs.readFileSync(path.join(__dirname, 'package.json'));

program
  .version(JSON.parse(packageConfig).version)
  .option('-i, --infile [file]', 'Input file')
  .option('-o, --outfile [file]', 'Output file')
  .parse(process.argv);

if (!program.infile || !program.outfile) {
  console.error('All parameters are mandatory');
  process.exit()
}

Q.nfcall(fs.readFile, program.infile, 'utf8')
  .then(markdown => {
    var bar;
    return awesomeLinkChecker(markdown,
      (count) => {
        if (count) {
          bar = new ProgressBar('Checking links: [:bar] :percent', { total: count, width: 30 });
        } else {
          bar.tick();
        }
      });
  })
  .then(transformedMarkdown => Q.nfcall(fs.writeFile, program.outfile, transformedMarkdown))
  .catch(err => console.error(err));
