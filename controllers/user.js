'use strict'

//modulos
var bcrypt = require('bcrypt-nodejs'); 
var fs = require('fs');
var path = require('path');

//modelos
var User = require('../models/user');

//servicios
var jwt = require('../services/jwt');

//acciones
function pruebas(req, res){
    res.status(200).send({
        message: 'Probando el controlador de usuarios y la accion pruebas',
        user: req.user
    }) 
}

function saveUser(req, res){
    //Creamos el objeto usuario
    var user = new User();

    //Regocer paraetros peticion
    var params = req.body;

    if(params.name && params.surname && params.email && params.password){
         //Asignar valores al objeto usuario
        user.name = params.name;
        user.surname = params.surname;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        console.log(params.name);
        console.log(params.surname);
        console.log(params.email);
        console.log(params.password);

        User.findOne({ email: user.email.toLowerCase() }, (err, issetUser) => {
            if(err){
                res.status(500).send({message: 'Error al guardar el usuario'});
            }else{
                if(!issetUser){
                    //Cifrar contraseña
                    bcrypt.hash(params.password, null, null, function(err, hash){
                        user.password = hash;

                        //Guardar usuario en bd
                        user.save((err, userStore) => { 
                            if(err){
                                res.status(500).send({message: 'Error al guardar el usuario'});
                            }else{
                                if(!userStore){
                                    res.status(404).send({message: 'No se ha registrado el usuario'});
                                }else{
                                    res.status(200).send({user: userStore});
                                }
                            }
                        });
                    });
                }else{
                    res.status(200).send({
                        message: 'El usuario no puede registrarse'
                    });
                }
            }
        });
    }else{
        res.status(200).send({
            message: 'Introduce los datos correctamente para poder registrar al usuario'
        });
    }
}

function login(req, res){
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({ email: email.toLowerCase() }, (err, user) => {
        if(err){
            res.status(500).send({message: 'Error al guardar el usuario'});
        }else{
           if(user){
               bcrypt.compare(password, user.password, (err, check) =>{
                    if(check){
                        if(params.gettoken){
                            //devolver token jwt
                            res.status(200).send({ 
                                token:jwt.createToken(user)
                            });
                        }else{
                            res.status(200).send({user});
                        }
                    }else{  
                        res.status(400).send({
                            message: 'El usuario no ha podido logearse correctamente'
                        });
                    }
               })
           }else{
                res.status(400).send({
                    message: 'El usuario no ha podido logearse'
                });
           }
        }
    });
}

function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;
    delete update.password;

    if(userId != req.user.sub){
        return res.status(500).send({ message: 'No tienes permiso para actualizar el usuario'});
    }

    User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdate) => {
        if(err){
            res.status(500).send({ message: 'Error al actualizar el usuario'});
        }else{
            if(!userUpdate){
                res.status(404).send({ message: 'No se ha podido actualizar el usuario'});
            }else{
                res.status(200).send({ user: userUpdate});
            }
        }
    });
}

function uploadImage(req, res){
    var userId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];

        var ext_split = file_name.split('\.')
        var file_ext = ext_split[1];

        if(file_ext == 'png' || file_ext == 'jpg' ||file_ext == 'jpeg' ||file_ext == 'gif' ){
            if(userId != req.user.sub){
                return res.status(500).send({ message: 'No tienes permiso para actualizar el usuario'});
            }
        
            User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdate) => {
                if(err){
                    res.status(500).send({ message: 'Error al actualizar el usuario'});
                }else{
                    if(!userUpdate){
                        res.status(404).send({ message: 'No se ha podido actualizar el usuario'});
                    }else{
                        res.status(200).send({ user: userUpdate, image: file_name});
                    }
                }
            });
        }else{
            fs.unlink('file_path', (err) => {
                if(err){
                    res.status(200).send({ message: 'extension no valida y fichero no borrado'});
                }else{
                    res.status(200).send({ message: 'extension no valida'});
                }
            });
        }
    }else{
        res.status(200).send({ message: 'no se han subido los archivos'});
    }
}

function getImageFile(req, res){
    var imageFile = req.params.imageFile;
    var path_file = './uploads/users/'+ imageFile;

    fs.exists(path_file, function(exists){
        if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({ message: 'la imagen no existe'});
        }
    });
}

function getKeepers(req, res){
    User.find({role: 'ROLE_ADMIN'}).exec((err, users) => {
        if(err){
            res.status(500).send({ message: 'Error en la peticion'});
        }else{
            if(!users){
                res.status(404).send({ message: 'No hay cuidadores'});
            }else{
                res.status(200).send({users});
            }
        }
    });
}

module.exports = {
    pruebas,
    saveUser,
    login,
    updateUser,
    uploadImage,
    getImageFile,
    getKeepers
};
