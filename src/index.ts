import "reflect-metadata";
import { createConnection } from "typeorm";
import { Post } from "./entity/Post";

import express from "express";
import { ApolloServer } from 'apollo-server-express';

import { buildSchema } from 'type-graphql';

import { HelloResolver } from "./resolvers/hi";
import { PostResolver } from "./resolvers/post";


const connectDB = async () => {
    try {
        const connect = await createConnection();
        console.log("DB connected")
        return connect;   
    } catch (error) {
        console.log(error)
    }
}

const createSchema = async ()=>{
    const schema = {
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver],
            validate: true
            })
    }
    console.log("schema created")
    return schema;
}   

const main = async () => {

    const app = express();
    app.listen(3000, ()=>{
        console.log("express server started");
    })

    await connectDB();
    
    const schema = await createSchema()
    const apolloserver = await new ApolloServer(schema)

    await apolloserver.applyMiddleware({app})
    console.log("done")
}


main().catch((err)=>{
    console.log(err)
})
