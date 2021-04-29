import { Arg, Int, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "../entity/Post";

@Resolver() 
export class PostResolver {

    @Query(() => [Post], { nullable: true })
    async posts() {
        // await sleep(3000)
        return Post.find({});
    }

    @Query(() => Post, { nullable: true })
    post(
        @Arg('id', () => Int) id: number
    ): Promise <Post | null> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    async createPost(
        @Arg("title", ()=> String, { nullable: true}) title: string
    ): Promise<Post> {
        const post = Post.create({title});
        // await Post.insert(post);
        await post.save()
        return post;
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg("id", ()=> Int) id: number,
        @Arg("title", ()=> String, { nullable: true }) title: string
    ): Promise<Post> {

        if (typeof title != undefined){
            await Post.update({id}, {title}).then(response => response.raw[0])
            .catch(()=> console.log("update error"));

            return await Post.findOne(id);
        } else {
            console.log("undefined update");
            return null;
        }
    }

    @Mutation(()=> Boolean)
    async deletePost(
        @Arg("id", ()=> Int) id: number
    ): Promise<Boolean> {

        try {
            // await Post.delete({id});
            // return true;
            const post = await Post.findOne(id);
            post.remove()
            return true;

        } catch {
            console.log("delete error");
            return false;
        }
    }
}