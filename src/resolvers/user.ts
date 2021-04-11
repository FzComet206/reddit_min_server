import { Arg, Mutation, Resolver } from "type-graphql";
import { Users } from "../entity/User";
import argon2 from "argon2";
import { UserResponse, UsernamePasswordInput } from "./UserInputAndResponse";

@Resolver()
export class UserResolver {
    
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

    @Mutation(()=> UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput
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

        return {
            user: selectUser
        };

    }
}

 