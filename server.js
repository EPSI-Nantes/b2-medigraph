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



//tableau de médicaments
var tabMed = [];
var tabSpeMed = [];

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



function GetMedicaments(callback){
  var connection = mysql.createConnection({
    host     : 'localhost',
    database : 'medigraph',
    user     : 'root',
    password : ''
  });
  connection.connect();
  connection.query('SELECT * FROM medicament ORDER BY prix DESC', function(err, rows, fields) {
    if (err) {
      throw err;
    } else {
      callback(rows);
      connection.end();
    }
  }
  );
};

function callbackGetMedicament(rows){
  rows.forEach(function logArrayElements(element, index, array) {
  tabMed.push([element.nom, element.prix]);
  console.log("encapsulation...");
  });
  console.log("encapsulation terminée.");
};

function recup_med(med, callback) {
  var connection = mysql.createConnection({
    host     : 'localhost',
    database : 'medigraph',
    user     : 'root',
    password : ''
  });
  connection.connect();
  connection.query('SELECT * FROM quantite WHERE medicament = "'+ med + '"' , function(err, rows, fields) {
    if (err) {
      throw err;
    }
    else {
      if (rows == 0)
      {
        console.log('Le médicament'+med+' n\'existe pas dans la base de données.')
        return;
      }
      connection.end();
      callback(rows, med, connection, recup_med_prixMateriaux);
    }
  });
};

function stock_med(rows, med, connection, callback){
  rows.forEach(function logArrayElements(element, index, array) {
    tabSpeMed.push([element.materiaux, element.quantite])
  });
  console.log("Encapsulation medic terminée.");
  callback(rows, tabSpeMed, stock_med_prixMateriaux, connection);
};

function recup_med_prixMateriaux(rows, tabSpeMed, callback, connection){
  var connection = mysql.createConnection({
    host     : 'localhost',
    database : 'medigraph',
    user     : 'root',
    password : ''
  });
  connection.connect();
  tabSpeMed.forEach(function logArrayElements(element, index, array) {
    connection.query('SELECT prix FROM materiaux WHERE nom = "'+ element[0] + '"' , function(err, rows, fields) {
      if (err) {
        throw err;
      }
      callback(rows, index);
    });
  });
  connection.end();
  console.log("Encapsulation medic avec prix terminée.");
};

function stock_med_prixMateriaux(rows,index){
    tabSpeMed[index][2] = rows[0].prix;
    console.log(rows[0]);
};

/*function remplissage_tabSpeMed(callback){
  callback(stock_med);
}*/

//à l'adresse '/' le serveur redirige vers accueil.ejs
//On passe en paramètre la liste des métaux
app.get('/', function (req, res) {
  tabMed = [];
  GetMedicaments(callbackGetMedicament);
  async.map(metals, iterator, function done(err, metalsWithPrice) {
    return res.render('accueil.ejs', {
      error: err || '',
      metals: metalsWithPrice,
      liste_medicament: tabMed
    });

    });
});

//à l'adresse '/medic' le serveur exige un argument de type string qui correspond au nom d'un médicament
//le serveur redirige vers medic.ejs
//On passe en paramètre la liste des métaux
app.get('/medic/:medic', function (req, res) {
  tabSpeMed = [];
  tabMed = [];
  GetMedicaments(callbackGetMedicament);
  recup_med(req.params.medic, stock_med);
  async.map(metals, iterator, function done(err, metalsWithPrice) {
  return res.render('medic.ejs',  {
    error: err || '',
    metals: metalsWithPrice,
    liste_medicament: tabMed,
    medicament: req.params.medic,
    tabSpeMed : tabSpeMed
  });
});

});



// Pour toutes les autres adresses, le serveur redirige vers la page 404.ejs
//On passe en paramètre la liste des métaux
app.use(function (req, res, next) {
  async.map(metals, iterator, function done(err, metalsWithPrice) {
    return res.render('404.ejs', {
      error: err || '',
      metals: metalsWithPrice,
      liste_medicament: tabMed
    });
  });
});


//Le serveur écoute sur le port 8080
app.listen(8080);
console.log('Listening on %s', 8080);
