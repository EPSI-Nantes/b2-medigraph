'use strict';

var request = require('request');
var jsdom = require('jsdom');

function GoogleFinanceRetriever(metalName, q) {
  this.metalName = metalName;
  this.q = q;
}

GoogleFinanceRetriever.URL = 'https://www.google.com/finance?q=';

GoogleFinanceRetriever.prototype.getMetalName = function () {
  return this.metalName;
};

/**
 * @param  {Function} f(err, price: float)
 */
GoogleFinanceRetriever.prototype.getPrice = function (f) {
  request({
    url: GoogleFinanceRetriever.URL + this.q
  }, function (err, response, html) {
    if (err) {
      return f(err);
    }

    jsdom.env(html, [
      'http://code.jquery.com/jquery-1.5.min.js'
    ], function (err, window) {
      var $ = window.jQuery;
      var priceAsText = $('.id-price-panel > div > span > span').text().trim();
      f(null, parseFloat(priceAsText));
    });
  });
};



module.exports = GoogleFinanceRetriever;
