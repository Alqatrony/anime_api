// importing mongoose
const mongoose = require('mongoose');

// importing bcrypt Node.js'module
const bcrypt = require('bcrypt');

// defining schema for anime collection
let animeSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String
    },
    MangaArtist: {
        Name: String,
        Bio: String,
        Born: Date
    },
    Image: String,
    Featured: Boolean
});

// defining schema for users collection
let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Email: {type: String, required: true},
    Password: {type: String, required: true},
    Birthdate: Date,
    FavoriteAnimes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Anime' }]
});

 // defined a function that hashes the password
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10); 
 };

 // defined a function to compare the submitted hashed passwored with the hashed one stored in database
userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.Password);
};

// Genre Schema 
let genreSchema = mongoose.Schema({
  Name: {type: String, required: true},
  Description: {type: String, required: true}
});

// MangaArtist Schema 
let mangaArtistsSchema = mongoose.Schema({
Name: { type: String, required: true },
Bio: { type: String, required: true },
Birth: { type: String, required: true },
Death: { type: String },
});

// creating models
let Anime = mongoose.model('Anime', animeSchema);
let User = mongoose.model('User', userSchema);
let Genre = mongoose.model('Genre', genreSchema);
let MangaArtists = mongoose.model('MangaArtist', mangaArtistsSchema);

// exporting the created models
module.exports.Anime = Anime;
module.exports.User = User;
module.exports.Genre = Genre;
module.exports.MangaArtists = MangaArtists;