const LocalStrategy = require ('passport-local').Strategy;
const bcrypt = require ('bcryptjs');
const DB = require ('./database');

function initialize(passport) {
    const authenticateUser = async (email, password ,done) => {
        console.log(email)
        console.log(password)
        const user = DB.searcInDB(email);
        if (!user){
            return done(null, false, {message: 'the user could not find'});
        } 

        if (await bcrypt.compare(password, user.password)){
            return done(null, user);
        } else {
            return done(null, false, {message: 'Password incorrect'});
        }
        
    }

    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser));


    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    passport.deserializeUser((userId, done) => {
        const user = DB.searcIdInDB(userId)
        if (user){
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
};

module.exports = initialize;