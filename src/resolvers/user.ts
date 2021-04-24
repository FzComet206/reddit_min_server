import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Users } from "../entity/User";
import argon2 from "argon2";
import { UserResponse, UsernamePasswordInput, LogoutResponse } from "./UserInputAndResponse";
import { MyContext } from "../types";
import { COOKIE_NAME } from "../constants";

@Resolver()
export class UserResolver {

    // query self to check if logged in
    @Query(()=> Users, { nullable: true })
    me(
        @Ctx() { req }: MyContext
    ) {
       if (!req.session.userId) {
           return null
       }
       const currentUser = Users.findOne({id: req.session.userId});
       return currentUser
    }
    
    // register user
    @Mutation(()=> UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {

        if (options.username.length < 3) {
            return {
                errors:[{
                    field: "username",
                    message: "username length must be greater than 3"
                }]
            }
        }

        const exist = await Users.findOne({username: options.username.toLowerCase()});

        if (exist) {
            return {
                errors:[{
                    field: "username",
                    message: "username has already taken"
                }]
            }
        }

        if (options.password.length <= 5) {
            return {
                errors:[{
                    field: "password",
                    message: "passsword length must be at least 6"
                }]
            }
        }

        try {

            const hashedPassword = await argon2.hash(options.password)
            const user = Users.create({
                username: options.username.toLowerCase(), 
                password: hashedPassword
            })

            await user.save()

            req.session!.userId = user.id;
            req.session!.userInfo = user.username;
            
            console.log(`${user.username} just registered and is logged in!`);

            return {
                user: user
            };
            
        } catch (err) {

            return {
                errors: [{
                    field: "unknown error",
                    message: "unknow error lol get rekt"
                }]
            }
        }
    }

    // handle login
    @Mutation(()=> UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {

        const selectUser = await Users.findOne({username: options.username.toLowerCase()});

        if (!selectUser) {
            return {
                errors: [{
                    field: "username",
                    message: "username incorrect"
                }]
            };
        }

        const valid = await argon2.verify(selectUser.password, options.password);

        if (!valid) {
            return {
                errors: [{
                    field: "password",
                    message: "password incorrect"
                }]
            };
        }

        // we can use this object to store user info
        // store userid session, will set a cookie on user
        // keep them logged in

        // SEMANTICS: 
        // 1. data stored on req.session will be stuck to redis ---> sess: qwer -> { userId: 1}
        // 2. express-session will set a cookie to be stored on browser like: theissomefakecookieqwerqwerq
        // 3. when user make request/queries: the cookie stored will be sent to server
        // 4. server-session sees the cookie, decrypt it using secret back to key ---> sess: qwer
        // 5. make-request to redis with decrypted key and look up data

        req.session!.userId = selectUser.id;
        req.session!.userInfo = selectUser.username;

        console.log(`${selectUser.username} just logged in!`)

        return {
            user: selectUser
        };

    }

    @Mutation(()=> Boolean)
    async logout(
        @Ctx() { req, res }: MyContext
    ){

        if (!req.session.userId) {
            return false;
        }

        function wrapper() {
            return new Promise(resolve => {
                req.session.destroy((err)=> {
                    if (err) {
                        console.log(err);
                        resolve(false);
                        return;
                    }
                    resolve(true);
                })
            });
        }

        console.log(`${req.session.userInfo} just logged out!`)

        res.clearCookie(COOKIE_NAME);  // clear the cookie
        await wrapper(); // wrapped callback inside promise so i can await
        
        return true;
    }
} 
