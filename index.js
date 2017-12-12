'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = process.env.port || 3789;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/zoo', { useMongoClient: true })
    .then( ()=>{
        console.log('La conexion a la BD se ha realizado correctamente');

         //creo mi servidor y lo lanzo
         app.listen(port, () => {
            console.log('El servidor local con Node y Express esta corriendo...');
         });
    })
    .catch(err => console.log(err));