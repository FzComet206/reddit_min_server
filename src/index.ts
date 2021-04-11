import "reflect-metadata";
import { createConnection } from "typeorm";

import express from "express";
import { ApolloServer } from 'apollo-server-express';

import { buildSchema } from 'type-graphql';

import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";


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
            resolvers: [UserResolver, PostResolver],
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
    console.log("apollo started")
}


main().catch((err)=>{
    console.log(err)
})
