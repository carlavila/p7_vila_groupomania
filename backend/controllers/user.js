
const { User } = require('../models/index.js');
const { Post } = require('../models/index.js');
const { Comment } = require('../models/index.js');
const { Like } = require('../models/index.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

/* logique pour créer un user */
exports.signup = (req, res) => {
	bcrypt.hash(req.body.password, 8)
	    .then(hash => {
		const user = new User({
		    ...req.body,
		    password: hash
		});
		let { firstname, lastname, email, password } = user;
		User.create({firstname, lastname, email, password})
		    .then(newUser => {
			console.log("nouvel user enregistré:", newUser.firstname, newUser.lastname, "userId:", newUser.id);
			res.status(201).json()           
		    })
		    .catch(error => res.status(400).json(error))
	    })    
	    .catch(error => res.status(500).json(error));
};

/* logique pour login un user */
exports.login = (req, res) => {
	User.findOne({where: {email:req.body.email}})
	    .then(user => {
		if (!user) {
		    return res.status(401).json({ error: 'User non trouvé !'});
		};
		bcrypt.compare(req.body.password, user.password)
		    .then(valid => {
			if (!valid) {
			    return res.status(401).json({ error: 'Mot de passe incorrect !'});   
			};
			res.status(200).json({
			    // la res de login renvoi des données de user et le token (qui servira pour l'authentification)
			    userId: user.id,
			    isAdmin: user.userId == 1, 
			    token: jwt.sign({userId: user.id, isAdmin: user.id == 1 }, process.env.TOKEN_KEY, { expiresIn: '24h' })
			});               
		    })
		    .catch(error => res.status(400).json(error));
	    }) 
	    .catch(error => res.status(500).json({ error })); 
};

/* logique pour update un user */
exports.editUser = (req, res) => {  
	req.file ? req.body.imageUrl = req.file.filename : console.log("on garde la même photo"); // <- on vérifie si l'user a uploadé une nouvelle photo
	console.log('photo :'+ req.file)
	if (req.file) { // <- on supprime l'ancienne image de profil
	    User.findOne({where: {id:req.params.id}})
		.then(user => {
		    if(user.imageUrl !== null) { // <- si sa photo de profile n'est pas celle par défaut on peut la supprimer
			fs.unlink(`images/${user.imageUrl}`, (error) => {
			    if (error) throw error
			})    
		    } else {
			console.log("ce fichier ne peut être effacé car c'est l'image par défaut")
		    }
		})
		.catch(error => res.status(400).json(error));
	}
	if (req.body.password) { // <- si le password a été modifié on enregistre le hash
	    bcrypt.hash(req.body.password, 8)
		.then(hash => {
		    req.body.password = hash;
		    User.update(req.body, {where: {id: req.params.id}})
			.then(user => {
			    res.status(201).json({message: "profil et mot de passe changé"});
			})
			.catch(error => res.status(400).json(error));
		})
		.catch(error => res.status(500).json(error));
	} else { // <- le password n'a pas été modifié on peut donc enregistrer nos données directement
	    User.update(req.body, {where: {id: req.params.id}})
		.then(() => res.status(201).json({message: "profil actualisé"}))
		.catch(error => res.status(400).json(error));
	};
};
    
    /* logique pour afficher tous les users */
exports.getAllUsers = (req, res) => {
	try {	
		User.findAll({ include: { model: Post, include: { model: Like } }})
		.then(users => {
		    res.status(200).json(users);
		})
		.catch(error => res.status(400).json(error))
	} catch {
	    error => res.status(500).json(error);
	}
};
    
    /* logique pour afficher un user  */
exports.getOneUser = (req, res) => {
	try {
	    User.findOne({where: {id:req.params.id}})
		.then(user => {
		    res.status(200).json(user);
		})
		.catch(error => res.status(400).json(error))
	} catch {
	    error => res.status(500).json(error);
	}
};

/* logique pour supprimer un user */
exports.deleteUser = (req, res) => {
	let id = req.params.id
	Comment.destroy({ where: { userId: id } })
	.then(() => Post.destroy({ where: { userId: id } })
	.then(() => User.destroy({ where: { id: id } }))
	.then(() => res.status(200).json({ message: 'Utilisateur supprimé !' }))
	.catch(error => res.status(400).json({ error }))
	.catch(error => res.status(400).json({ error }))
	.catch(error => res.status(500).json({ error })));
};




