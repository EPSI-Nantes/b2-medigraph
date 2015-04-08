var express = require('express');
var path = require('path');

var app = express();

//à l'adresse '/' le serveur redirige vers accueil.ejs
app.get('/', function(req, res) {
    res.render('accueil.ejs');
});


//à l'adresse '/medic' le serveur exige un argument de type string qui correspond au nom d'un médicament
//le serveur redirige vers medic.ejs
app.get('/medic/:medic', function(req, res) {
    res.render('medic.ejs', {medicament: req.params.medic});
});

//pour toutes les autres adresses, le serveur redirige vers la page 404.ejs
app.use(function(req, res, next){
    res.render('404.ejs');
});

//Donne l'accès au serveur au lien externes (fichiers css, images...)
app.use(express.static('ressources'));

app.use(express.static(path.join(__dirname, 'ressources')));







var async = require('async');

var BoursoramaRetriever = require('./Retriever/BoursoramaRetriever');
var GoogleFinanceRetriever = require('./Retriever/GoogleFinanceRetriever');

var metals = [
  new BoursoramaRetriever('Or', '_GC'),
  new BoursoramaRetriever('Cuivre', '7xCAUSD'),
  new BoursoramaRetriever('Argent', '_SI'),
  new BoursoramaRetriever('Zinc', '7xZSUSD'),
  new GoogleFinanceRetriever('Fer', 'NASDAQ%3AMSFT')
];

function iterator(metal, fDone) {
  metal.getPrice(function (err, price) {
    if (err) {
      return fDone(err);
    }

    var name = metal.getMetalName();
    fDone(null, {
      name: name,
      price: price
    });
  });
}


function done(err, metalsWithPrice) {
  if (err) {
    console.error('We got an error', err);
    return;
  }

  console.log('prices', metalsWithPrice);
}

async.map(metals, iterator, done);










//Le serveur écoute sur le port 8080
app.listen(8080);
