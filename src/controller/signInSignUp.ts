import bcrypt, { hashSync } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as validate from '../validate/registerValidate';
import * as passEmailVer from '../mailer/passverification';
import { Request, Response } from 'express';
import User from '../entity/user';
const genUsername = require("unique-username-generator");

export async function registerPosts(req: Request, res: Response){
    // Validate the data
    const { error } = validate.registerValidation(req.body);
    if (error){
        return res.status(400).json({error: error.details[0].message});
    }
    
    try{
        // Check if user is in DB
        const result = await User.find({ 
            where: [
                { email: req.body.email },
                { username: req.body.username }
            ],
            select: ['username', 'email']
        });

        if (result[0]) {
            if(result[0].email == req.body.email)
                return res.status(400).json({error: "Email is already exist"});
            else
                return res.status(400).json({error: "Username is already exist"});
        }       
    } catch(error){
        console.log("controller/signinsignup line 34", error);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashpass = await bcrypt.hash(req.body.password, salt);

    // Create user for DB
    const { fullName, email, username } = req.body;
    const user = createUser(fullName, email, username);
    user.password = hashpass;

    // Save the user in DB
    try{
        await user.save();
        console.log("New user registered");
        res.status(200).json({message: "Sign up successfully"});
    } catch(err) {
        console.log("controller/signinsignup line 57", err);
    } 
    
};

export async function logInPost(req: Request, res: Response){
    // Validate the data
    const { error } = validate.loginValidation(req.body);
    if (error){
        return res.status(400).json({error: "Email or Password are incorrect"});
    }

    let result: User;
    try{
        // Check if user is in DB
        result = await User.findOne({ 
            where: [
                { email: req.body.username },
                { username: req.body.username }
            ],
            select: ['id', 'password', 'username'] 
        });
    } catch(err) {
        console.log("controller/signinsignup line 81", err);
    }

    if(result && await bcrypt.compare(req.body.password, result.password)){
        const token = createToken(result.id, result.username)
        
        const UserInfo = {
            username: result.username,
            auth_token: token                    
        }
        console.log("User login");
        res.status(200).json({UserInfo});
    }
    else{
        res.status(401).json({error: "Email or Password are incorrect"});
    }
};

export async function googleLogIn(req: Request, res: Response){
    console.log(req.body)
    let user: User;
    // Create a user
    try{
        user = await User.findOne({
            where:[
                {email: req.body.email}
            ],
            select:['id', 'username']
        });
        if(!user){
            // Generate username
            const username = await userNameGenerator(req.body.email);

            // Save user in DB
            const { name, email } = req.body;
            const user = createUser(name, email, username);
            await user.save();
        };
    } catch(err) {
        console.log("controller/signinsignup line 98", err);
    };

    if(!user){
        try{
            user = await User.findOne({ 
                where: [
                    { email: req.body.email }
                ],
                select: ['id', 'username']
            });
        } catch(err) {
            console.log("controller/signinsignup line 111", err);
        }
    };

    if(user){
        const token = createToken(user.id, user.username)
        const UserInfo = {
            username: user.username,
            auth_token: token                    
        };
        console.log("Google login");
        
        res.status(200).json({UserInfo});
    }
    else{
        res.status(404).send();
    }
};

export async function passwordReset(req: Request, res: Response){

    // Validate the data
    const { error } = validate.emailValidation(req.body);
    if (error){
        return res.status(400).json({error: "Email is not valid"});
    }

    let user: User;;
    try{
        user = await User.findOne({ 
            where: [
                { email: req.body.email }
            ],
            select: ['id', 'fullName', 'email', 'password']
        });
        //user = await pool.query(`SELECT * FROM users WHERE email='${req.body.email}'`);
    } catch(err) {
        console.log("controller/signinsignup line 111", err);
    }

    if (user && passEmailVer.passResetMail(user)){
        res.status(200).json({message:"Email send"});
    } else {
        res.status(400).json({error:"User did not found"});
    }    
};

export async function passUpdate(req: Request, res: Response){
    const pass = {
        password: req.body.password
    }

    // Validate the data
    const { error } = validate.passwordValidation(pass);
    if (error){
        return res.status(400).json({error: error.details[0].message});
    }

    if (req.body.password == req.body.passwordConfirm){

        // Hash the password
        const salt = await bcrypt.genSalt(12);
        const hashpass = await bcrypt.hash(req.body.password, salt);

        try{
            await User.update({ id: req.body.id },{ password: hashpass });
            res.status(200).json({message: "The password updated successfully"});
        } catch(err) {
            console.log("controller/signinsignup line 165", err);
        }
    }
    else{
        res.status(400).json({error: "The password must be equal"});
    }   
};

async function userNameGenerator(email: string){
    let username: string;
    let tempUser: Pick<User, 'username'>;
    do {                
        username = genUsername.generateFromEmail(email, 3);
        tempUser = await User.findOne({
            where:[
                {username: username}
            ],
            select: ['username']
        })
    } while (tempUser);
    return username;
};

function createUser(fullName: string, email: string, username: string){
    const user = new User();
    user.fullName = fullName;
    user.email = email;
    user.username = username;
    user.profileImage = process.env.PROFILE_IMAGE;
    user.themeImage = process.env.THEME_IMAGE;
    user.media = 0;
    return user;
};

function createToken(id: string, username: string){
    const tokenUser = {
        id: id,
        username: username
    };

    return (jwt.sign(tokenUser, process.env.TOKEN_SECRET));
};