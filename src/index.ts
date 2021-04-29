// Libraries
import "reflect-metadata";
import { createConnection } from "typeorm";
import * as redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { buildSchema } from 'type-graphql';
import express from "express";
import { ApolloServer } from 'apollo-server-express';

// Api and Resolvers
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

// Utils
import { MyContext } from "./types";
import config from  "./config";
import { COOKIE_NAME } from "./constants";
import { sendEmail } from "./utils/sendEmail";


const redisConnect = async (ctx) => {

    const RedisStore = await connectRedis(session);
    const redisClient = await redis.createClient();

    await ctx.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ 
                client: redisClient,
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60,
                httpOnly: true,                // cannot access cookie in frontend
                secure: false                  // turn to true in prod
            },
            saveUninitialized: false,
            secret: '174115261',
            resave: false
        })
    )
    console.log("redis middleware connected to express")
}
 
const connectDB = async () => {
    try {
        const connect = await createConnection();
        console.log("DB connected")
        return connect;   
    } catch (error) {
        console.log(error)
    }
}

const createSchema = async () => {
    const schema = {
        schema: await buildSchema({
            resolvers: [UserResolver, PostResolver],
            validate: true
            }),
        context: ({req, res}): MyContext => ({req, res})  // we can access sessions using req context
    }
    console.log("schema created")
    return schema;
}   

const main = async () => {

    const app = express();

    app.use(
        cors({
            origin: config.orgindev,
            credentials: true
        })
    );

    await redisConnect(app);

    app.listen(config.port, ()=>{
        console.log("express server started");
    })

    await connectDB();
    
    const schema = await createSchema()
    const apolloserver = await new ApolloServer(schema)

    await apolloserver.applyMiddleware({ 
        app,
        cors: false              // turn off wildcard credentials
    })
    console.log("apollo started")

    // await sendEmail("caozibo2000@gmail.com", "hihihihi from node")
    // console.log("email sent")
}

main()
.then(()=>{
    console.log("api endpoint initialized\n");
    console.log("========================================================================");
    console.log("========================================================================\n");
})
.catch((err)=>{
    console.log(err)
})

