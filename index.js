const fs = require('fs')
const rp = require('request-promise');
const stringReplaceAsync = require('string-replace-async');
const throat = require('throat');

const regex = /.*[-*+]{1} \[.*\]\((http.*)\).*[\r\n]/g

const sideEffect = side => d => {
  side()
  return d;
};

const createReport = (report) => {
  return 'Awesome link checker verified ' + report.linksChecked + ' links, finding ' + report.errors.length + ' broken\r\n' +
     report.errors.map(link => ' - [' + link.status + '] ' + link.url + '\r\n');
}

module.exports = (markdown, progress) => {

  const checkLinkStatus = throat(4, (url) =>
    rp({ uri: url })
  );

  var report = {
    linksChecked: 0,
    errors: []
  }
  const matchCount = markdown.match(regex).length;
  progress(matchCount);

  const replacer = (match, url) => {
      report.linksChecked ++;
      return checkLinkStatus(url)
        .then(sideEffect(progress))
        .then(d => match)
        .catch(err => {
          report.errors.push({status: err.statusCode, url: url});
          progress();
          return '';
        });
      }

  return stringReplaceAsync(markdown, regex, replacer)
    .then(updatedContent => { return {content: updatedContent, report: createReport(report)}; })
}
