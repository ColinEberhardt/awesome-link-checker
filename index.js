const fs = require('fs')
const rp = require('request-promise');
const stringReplaceAsync = require('string-replace-async');
const throat = require('throat');

const regex = /.*[-*+]{1} \[.*\]\((http.*?)\).*[\r\n]/g

const createReport = (report) => {
  return 'Awesome link checker verified ' + report.linksChecked + ' links, finding ' + report.errors.length + ' broken\r\n' +
     report.errors.map(link => ' - [' + link.status + '] ' + link.url + '\r\n').join('');
}

module.exports = (markdown, progress) => {

  const checkLinkStatus = throat(2, (url) => rp({ uri: url }) );

  var report = {
    linksChecked: 0,
    errors: []
  }
  const matchCount = markdown.match(regex).length;
  progress(matchCount);

  const replacer = (match, url) => {
      report.linksChecked ++;
      return checkLinkStatus(url)
        .then(d => {
          progress();
          return match;
        })
        .catch(err => {
          progress();
          if (err.statusCode == 404 || (err.cause && err.cause.code === 'ENOTFOUND')) {
            report.errors.push({status: '404', url: url + ' [REMOVED]'});
            return '';
          } else {
            report.errors.push({status: err.statusCode, url: url + ' [Not removed from list]'});
            return match;
          }
        });
      }

  return stringReplaceAsync(markdown, regex, replacer)
    .then(result => { return {content: result, report: createReport(report)}; })
}
