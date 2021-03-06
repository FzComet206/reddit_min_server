import { Field, InputType, ObjectType } from "type-graphql";
import { OpUsers } from "../entity/OpUsers";
import { Post } from "../entity/Post";
// import { Users } from "../entity/User";

@InputType()
export class PostInput {
	@Field()
	title: string;

	@Field()
	text: string;
}

@ObjectType()
class FieldError {
	@Field()
	field: string;

	@Field()
	message: string;
}

@InputType()
export class UsernamePasswordEmailInput {
	@Field()
	username: string;

	@Field()
	password: string;

	@Field()
	confirmPassword: string;

	@Field()
	email: string;
}

@ObjectType()
export class UserResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => OpUsers, { nullable: true })
	user?: OpUsers;
}

@ObjectType()
export class LogoutResponse {
	@Field(() => Boolean)
	success?: Boolean;

	@Field(() => String)
	errors?: String;
}

@ObjectType()
export class PostResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => Boolean)
	success?: Boolean;
}

@ObjectType()
export class PaginatedPost {
	@Field(() => [Post])
	post: Post[];

	@Field(() => Boolean)
	hasMore: Boolean;
}
