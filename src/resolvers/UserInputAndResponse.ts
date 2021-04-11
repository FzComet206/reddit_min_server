import { Field, InputType, ObjectType } from "type-graphql";
import { Users } from "../entity/User";

@ObjectType()
class FieldError {

    @Field()
    field: string;

    @Field()
    message: string;
}

@InputType()
export class UsernamePasswordInput {

    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
export class UserResponse {

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => Users, { nullable: true })
    user?: Users;
}
