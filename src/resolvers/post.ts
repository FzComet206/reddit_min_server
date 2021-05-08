import { max } from "class-validator";
import {
	Arg,
	Ctx,
	FieldResolver,
	Int,
	Mutation,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entity/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { sleep } from "../utils/sleep";
import { validatePost } from "../utils/validatePost";
import { PostInput, PostResponse } from "./UserInputAndResponse";

@Resolver(Post)
export class PostResolver {

	@FieldResolver(() => String)   // graphql thing
	textSnippet(
		@Root() root: Post,
	) {
		return root.text.slice(0, 400);
	}

	@Query(() => [Post], { nullable: true })
	async posts(
		@Arg("limit", () => Int) limit: number,
		@Arg("cursor", () => String, { nullable: true }) cursor: string | null
	): Promise<Post[] | undefined> {
		await sleep(600);
		const realLimit = Math.min(20, limit);
		const qb = getConnection()
			.getRepository(Post)
			.createQueryBuilder("p")
			.orderBy('"createdAt"', "DESC") // double quotes to keep uppercase
			.take(realLimit);

		if (cursor) {
			qb.where('"createdAt" < :cursor', {
				cursor: new Date(parseInt(cursor)),
			});
		}

		// awsome pagenation
		return await qb.getMany();
	}

	@Query(() => Post, { nullable: true })
	async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
		return await Post.findOne(id);
	}

	@UseMiddleware(isAuth)
	@Mutation(() => PostResponse)
	async createPost(
		@Arg("input") input: PostInput,
		@Ctx() { req }: MyContext
	): Promise<PostResponse> {
		// this is two sql queries

		const ok = validatePost(input.title, input.text);

		if (!ok) {
			return {
				errors: [
					{
						field: "text",
						message: "server error: invalid post",
					},
				],
				success: false,
			};
		}

		try {
			await Post.create({
				...input,
				creatorId: req.session.userId,
			}).save();
			return {
				success: true,
			};
		} catch (e) {
			console.log(e);
			return {
				errors: [
					{
						field: "text",
						message: "server error: unknown",
					},
				],
				success: false,
			};
		}
	}

	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg("id", () => Int) id: number,
		@Arg("content", () => String, { nullable: false }) text: string
	): Promise<Post> {
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}

		if (typeof text != undefined) {
			await Post.update({ id }, { text })
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
