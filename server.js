'use strict';

var express = require('express');
var path = require('path');
var async = require('async');
var mysql = require('mysql');
var BoursoramaRetriever = require('./Retriever/BoursoramaRetriever');
var GoogleFinanceRetriever = require('./Retriever/GoogleFinanceRetriever');

var app = express();

//Donne l'accès au serveur au lien externes (fichiers css, images...)
app.use(express.static('ressources'));

//Récupère les prix des métaux dans un tableau
var metals = [
  new BoursoramaRetriever('Or', '_GC'),
  new BoursoramaRetriever('Cuivre', '7xCAUSD'),
  new BoursoramaRetriever('Argent', '_SI'),
  new BoursoramaRetriever('Zinc', '7xZSUSD'),
  new GoogleFinanceRetriever('Fer', 'NASDAQ%3AMSFT')
];

//fonction qui permet de récupérer les informations d'un métal
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


//fonction qui permet de récupérer la liste des médicaments
function listemed() {
  var connection = mysql.createConnection({
    host     : 'localhost',
    database : 'medigraph',
    user     : 'root',
    password : ''
  });
  connection.connect();
//la ligne suivante ne récupère pas tab
  var tab = connection.query('SELECT * FROM medicament', function(err, rows, fields) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    var tab= [];
    rows.forEach(function logArrayElements(element, index, array) {
      tab.push([element.nom, element.prix])
    });
    connection.end();
    //forEach qui affiche les médicaments dans la console
    tab.forEach(function logArrayElements(element, index, array) {
      console.log("medicament : " + element[0] + "             prix : " + element[1]);
    });
    return tab;
  });
  return tab;
}


//fonction qui permet de récupérer les infos d'un médicament
function recup_med(med) {
  var connection = mysql.createConnection({
    host     : 'localhost',
    database : 'medigraph',
    user     : 'root',
    password : ''
  });
  connection.connect();
  //la ligne suivante ne récupère pas tab
  var tab = connection.query('SELECT * FROM quantite WHERE medicament = "'+ med + '"' , function(err, rows, fields) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    if (rows == 0)
    {
      console.log('Le médicament'+med+' n\'existe pas dans la base de données.')
      return;
    }
    var tab= [];
    rows.forEach(function logArrayElements(element, index, array) {
      tab.push([element.materiaux, element.quantite])
    });

    //Affichage du médicament dans la console
    console.log("medicament : "+ med);
    console.log(med + " est composé de :")
    tab.forEach(function logArrayElements(element, index, array) {
      console.log("- " + element[0] + "             quantite : " + element[1]);
      var a = element[0];
      connection.query('SELECT prix FROM materiaux WHERE nom = "'+ a + '"' , function(err, rows, fields) {
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }
        console.log("prix : "+rows[0].prix);
      });
    });
    connection.end();

    return tab;
  });
  return tab;
}


//à l'adresse '/' le serveur redirige vers accueil.ejs
//On passe en paramètre la liste des métaux
app.get('/', function (req, res) {
  listemed();
  //tab.forEach(function logArrayElements(element, index, array) {
  //  console.log("medicament : " + element[0] + "             prix : " + element[1]);
  //});
  async.map(metals, /*tab,*/ iterator, function done(err, metalsWithPrice) {
    return res.render('accueil.ejs', {
      error: err || '',
      metals: metalsWithPrice
      //,      liste_medicement: tab
    });
  });

});

//à l'adresse '/medic' le serveur exige un argument de type string qui correspond au nom d'un médicament
//le serveur redirige vers medic.ejs
//On passe en paramètre la liste des métaux
app.get('/medic/:medic', function (req, res) {
  recup_med(req.params.medic);
    async.map(metals, iterator, function done(err, metalsWithPrice) {
    return res.render('medic.ejs',  {
      error: err || '',
      metals: metalsWithPrice,
      medicament: req.params.medic
    });
  });
});



// Pour toutes les autres adresses, le serveur redirige vers la page 404.ejs
//On passe en paramètre la liste des métaux
app.use(function (req, res, next) {
  async.map(metals, iterator, function done(err, metalsWithPrice) {
    return res.render('404.ejs', {
      error: err || '',
      metals: metalsWithPrice
    });
  });
});

//Le serveur écoute sur le port 8080
app.listen(8080);
console.log('Listening on %s', 8080);
