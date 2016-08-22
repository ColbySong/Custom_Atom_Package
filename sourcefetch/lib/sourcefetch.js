'use babel';

import { CompositeDisposable } from 'atom';
import request from 'request';
import cheerio from 'cheerio';
import google from 'google';
google.resultsPerPage = 1;

export default {

  subscriptions: null,

  activate() {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'sourcefetch:fetch': () => this.fetch()
    }))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  fetch() {
    let editor;
    let self = this;

    if (editor = atom.workspace.getActiveTextEditor()) {
      let query = editor.getSelectedText();
      let language = editor.getGrammar().name;

      // check what kind of query user input
      let queryWords = query.split(" ");
      if (queryWords[0] === 'image:') {
        console.log("looking for " + queryWords[1] + " Images");
        console.log("link: " + 'http://imgur.com/r/' + queryWords[1]);
        self.download('http://imgur.com/r/' + queryWords[1]).then((html) => {
          let answer = self.scrape(html);
          console.log(answer);
          if (answer === '') {
            atom.notifications.addWarning('No answer found :(');
          } else {
            atom.notifications.addSuccess('Found snippet!');
            editor.insertText(answer);
          }
        }).catch((error) => {
          atom.notifications.addWarning(error.reason);
        })
      } else {
        self.searchCode(query, language).then((url) => {
          atom.notifications.addSuccess('Found google results!')
          return self.download(url);
        }).then((html) => {
          let answer = self.scrape(html);
          console.log(answer);
          if (answer === '') {
            atom.notifications.addWarning('No answer found :(');
          } else {
            atom.notifications.addSuccess('Found snippet!');
            editor.insertText(answer);
          }
        }).catch((error) => {
          atom.notifications.addWarning(error.reason);
        })
      }
    }
  },

  download(url) {
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {
          reject({
            reason: 'Unable to download page'
          })
        }
      })
    })
  },

  scrape(html) {
    $ = cheerio.load(html);
    if ($('[title="Stack Overflow"]').length > 0) {
      return $('div.accepted-answer pre code').text();
    } else {
      let linksNum = $("img").length;
      console.log(linksNum);
      let imgURL = $("img")[Math.floor(Math.random()*linksNum)].attribs.src.slice(2);
      return imgURL;
    }
  },

  searchCode(query, language) {
    console.log('searching for code');
    return new Promise((resolve, reject) => {
      let searchString = `${query} in ${language} site:stackoverflow.com`;
      console.log(searchString);
      google(searchString, (err, res) => {
        console.log(res);
        if (err) {
          reject({
            reason: 'search error'
          })
        } else if (res.links.length === 0) {
          reject({
            reason: 'no results found'
          })
        } else {
          resolve(res.links[0].href);
        }
      })
    })
  }
}
