'use babel';

import { CompositeDisposable } from 'atom';
import request from 'request';
import cheerio from 'cheerio';

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
      let selection = editor.getSelectedText();
      this.download(selection).then((htmlResponse) => {
        let answer = self.scrape(htmlResponse);
        if (answer) {
          editor.insertText(answer);
        } else {
          atom.notifications.addWarning('No answer found');
        }
      }).catch((error) => {
        atom.notifications.addWarning(error.reason);
      });
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
    return $('div.accepted-answer pre code').text();
  }
}
