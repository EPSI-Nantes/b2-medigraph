'use strict';

var request = require('request');
var jsdom = require('jsdom');

function BoursoramaRetriever(metalName, symbol) {
  this.metalName = metalName;
  this.symbol = symbol;
}

BoursoramaRetriever.URL = 'http://www.boursorama.com/cours.phtml?symbole=';

BoursoramaRetriever.prototype.getMetalName = function () {
  return this.metalName;
};

/**
 * @param  {Function} f(err, price: float)
 */
BoursoramaRetriever.prototype.getPrice = function (f) {
  request({
    url: BoursoramaRetriever.URL + this.symbol
  }, function (err, response, html) {
    if (err) {
      return f(err);
    }

    jsdom.env(html, [
      'http://code.jquery.com/jquery-1.5.min.js'
    ], function (err, window) {
      var $ = window.jQuery;

      var priceAsText = $('.fv-header .cotation').text().replace('USD', '').replace(' ', '').trim();
      f(null, parseFloat(priceAsText));
    });
  });
};



module.exports = BoursoramaRetriever;
