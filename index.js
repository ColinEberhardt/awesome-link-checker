const fs = require('fs')
const rp = require('request-promise');
const stringReplaceAsync = require('string-replace-async');
const throat = require('throat');

const regex = /.*[-*+]{1} \[.*\]\((http.*)\).*[\r\n]/g

const sideEffect = side => d => {
  side()
  return d;
};

module.exports = (markdown, progress) => {

  const checkLinkStatus = throat(2, (url) =>
    rp({ uri: url })
  );

  const matchCount = markdown.match(regex).length;
  progress(matchCount);

  const replacer = (match, url) => {
      return checkLinkStatus(url)
        .then(d => sideEffect(progress)(d))
        .then(d => match)
        .catch(err => {
          progress();
          return '';
        });
      }

  return stringReplaceAsync(markdown, regex, replacer);
}
