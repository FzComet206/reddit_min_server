import { Arg, Field, InputType, Mutation, Resolver } from "type-graphql";
import { Users } from "../entity/User";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
    
    @Field()
    username: string

    @Field()
    password: string
}

@Resolver()
export class UserResolver {
    
    @Mutation(()=> Users)
    async register(
        @Arg('options') options: UsernamePasswordInput 
    ): Promise<Users> {
        const hashedPassword = await argon2.hash(options.password)
        const user = Users.create({
            username: options.username, 
            password: hashedPassword
        })

        await user.save()
        return user;
    }
}