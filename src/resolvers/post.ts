import { Arg, Ctx, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Post } from "../entity/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { PostInput } from "./UserInputAndResponse";

@Resolver()
export class PostResolver {
	@Query(() => [Post], { nullable: true })
	async posts(): Promise<Post[] | undefined> {
		// await sleep(3000)
		return await Post.find({});
	}

	@Query(() => Post, { nullable: true })
	async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
		return await Post.findOne(id);
	}

	@UseMiddleware(isAuth)
	@Mutation(() => Post)
	async createPost(
		@Arg("input") input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<Post> {
		// this is two sql queries
		return await Post.create({
			...input,
			creatorId: req.session.userId,
		}).save();
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg("id", () => Int) id: number,
		@Arg("content", () => String, { nullable: false }) content: string
	): Promise<Post> {
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}

		if (typeof content != undefined) {
			await Post.update({ id }, { content })
				.then((response) => response.raw[0])
				.catch(() => console.log("update error"));

			return await Post.findOne(id);
		} else {
			return null;
		}
	}

	@Mutation(() => Boolean)
	async deletePost(@Arg("id", () => Int) id: number): Promise<Boolean> {
		try {
			await Post.delete({ id });
			return true;
		} catch {
			console.log("delete error");
			return false;
		}
	}
}
