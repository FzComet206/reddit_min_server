import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { Users } from "../entity/User";
import argon2 from "argon2";
import { UserResponse, UsernamePasswordInput } from "./UserInputAndResponse";
import { MyContext } from "../types";

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
        @Arg('options') options: UsernamePasswordInput 
    ): Promise<UserResponse> {

        if (options.username.length <= 3) {
            return {
                errors:[{
                    field: "username",
                    message: "username length must be greaters than 3"
                }]
            }
        }

        const exist = await Users.findOne({username: options.username.toLowerCase()});
        if (exist) {
            return {
                errors: [{
                    field: "duplicae username error",
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
                    message: "username doesn't exist"
                }]
            };
        }

        const valid = await argon2.verify(selectUser.password ,options.password);

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
        req.session!.userId = selectUser.id;

        return {
            user: selectUser
        };

    }
}

 