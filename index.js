//importing express, morgan, fs and path
const express = require('express'),
app = express(),
morgan = require('morgan'),
path = require("path"),
    // importing body-parser
    bodyParser = require('body-parser'),
    uuid = require('uuid');
    // importing express-validator
    const { check, validationResult } = require('express-validator');


// importing mongoose an reated models
const mongoose = require('mongoose');
const Models = require('./models.js');

// Importing CORS
const cors = require('cors');
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
app.use(cors({
	origin: (origin, callback) => {
	  if(!origin) return callback(null, true);
	  if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
		let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
		return callback(new Error(message ), false);
	  }
	  return callback(null, true);
	}
  }));

// integrating mongoose into the REST API
const Animes = Models.Anime;
const Users = Models.User;
const Genres = Models.Genre;
const MangaArtists = Models.MangaArtists;

// logging with morgan (middleware)
app.use(morgan('common'));

// mongoose.connect('mongodb://localhost:27017/myAnimeDB', {useNewUrlParser: true, useUnifiedTopology: true });

// Comment this before puhsing to HEROKU
// mongoose.connect('mongodb+srv://Alqatrony:Al1357912345678@alqatronycluster.mxoml6c.mongodb.net/myAnimeDB?retryWrites=true&w=majority',{useNewUrlParser: true, useUnifiedTopology: true });

// connecting to the database
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })

// import example
// mongoimport --uri mongodb+srv://Alqatrony:Al1357912345678@alqatronycluster.mxoml6c.mongodb.net/myAnimeDB --collection mangaArtists --type JSON --file C:\Users\User\Desktop\Alqatrony_Careerfoundry\jeson\mangaArtists.json

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//static serving the documentation file
app.use(express.static('public'));
app.use(cors());

// Importing auth.js file
let auth = require('./auth')(app);

// Importing passport module and passport.js file
const passport = require('passport');
require('./passport');


// GET request to main page
app.get('/', (req, res) => {
    res.send('Welcome to my Anime App!');
})

// GET request to Animes page, returns list of all animes in JSON 
app.get('/animes', passport.authenticate('jwt', { session: false}), (req, res) => {
    Animes.find()
    .then((animes) => {
        res.status(201).json(animes);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get info about one anime by title
app.get('/animes/:Title', passport.authenticate('jwt', { session: false}), (req, res) => {
    Animes.findOne({ Title: req.params.Title})
    .then((anime) => {
        res.json(anime);
    })
    .catch((err) => {
        console.error(err);
        res.status(400).send('Error: ' + err);
    });
});

// Get info about a genre by the name of the genre
app.get('/genre/:Name', passport.authenticate('jwt', { session: false}), (req, res) => {
    Genres.findOne({ 'Genre.Name': req.params.Name }).then((anime) => {
        if (anime) {
          res.status(200).json(anime.Genre);
        } else {
          res.status(400).send('Genre not found.');
        };
    });
});

// Gets info about a MangaArtist by MangaArtist's name
app.get('/mangaArtists/:Name', passport.authenticate('jwt', { session: false}), (req, res) => {
    MangaArtists.findOne({'mangaArtists.Name': req.params.Name})
    .then((anime) => {
        res.status(200).json(anime.MangaArtists);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Add new user (registering)
// input validation for username and password (min 5ch, alphanumeric, not empty, email formatt)
app.post('/users',
   [
    check('Username', 'Username is required').isLength({min:5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
   ], (req, res) => {
    // check validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array()});
    }
    // hashes the password before storing it in db
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({Username: req.body.Username})
    .then((user) => {
        if(user) {
            return res.status(400).send(req.body.Username + ' already exist ');
        } else {
            Users
            .create({
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthdate: req.body.Birthdate
            })
            .then((user) => {res.status(201).json(user)})
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
        }
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

// GET all users
app.get('/users', passport.authenticate('jwt', { session: false}), (req, res) => {
    Users.find()
    .then((users) => {
        res.status(201).json(users);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// GET a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
    Users.findOne({Username: req.params.Username})
    .then((user) => {
        res.json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Update username 
app.patch('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username}, {$set:
        {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthdate: req.body.Birthdate
        }
    },
    {new: true}, //makes sure the updated document is returned
    (err, updatedUser) => {
        if(err){
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// Adds new anime to the user's favoriteAnimes list
app.post('/users/:UserID/animes/:AnimeID', passport.authenticate('jwt', { session: false}), (req, res) => {
    Users.findOneAndUpdate({ _Id: req.params.UserID }, {
        $push: { FavoriteAnimes: req.params.AnimeID}
    },
    {new: true}, 
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// Delete a anime from the user's favoriteAnimes list
app.delete('/users/:UserID/animes/:a#AnimeID', passport.authenticate('jwt', { session: false}), (req, res) => {
    Users.findOneAndUpdate({ _Id: req.params.UserID }, {
        $pull: { FavoriteAnimes: req.params.AnimeID}
    },
    {new: true}, 
    (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// Delete a user from the users's array
app.delete('/users/:Username', passport.authenticate('jwt', { session: false}), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username})
    .then((user) => {
        if(!user) {
            res.status(400).sendStatus(req.params.Username + ' was not found');
        } else {
            res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//error handling
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Something broke!');
});

// app port listening
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('listening on Port ' + port);
});