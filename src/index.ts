// Libraries
import "reflect-metadata";
import { createConnection } from "typeorm";
// import * as redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { buildSchema } from 'type-graphql';
import express from "express";
import { ApolloServer } from 'apollo-server-express';
import Redis from 'ioredis';


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
    // const redisClient = await redis.createClient();
    const redis = new Redis(); 

    await ctx.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ 
                client: redis,
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60,
                httpOnly: true,                // cannot access cookie in frontend
                secure: false                  // turn to true in prod
            },
            saveUninitialized: false,
            secret: '11111111',
            resave: false
        })
    )
    console.log("redis middleware connected to express")

    return redis; // return redis context
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

const createSchema = async (redisContext) => {
    const schema = {
        schema: await buildSchema({
            resolvers: [UserResolver, PostResolver],
            validate: true
            }),
        context: ({req, res}): MyContext => ({req, res, redis: redisContext})  // we can access sessions using req context
        // context is a special object that is accessible by all your resolvers 
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

    app.listen(config.port, ()=>{
        console.log("express server started");
    })

    await connectDB();
    
    const redisContext = await redisConnect(app);
    const schema = await createSchema(redisContext);
    const apolloserver = await new ApolloServer(schema);

    await apolloserver.applyMiddleware({ 
        app,
        cors: false              // turn off wildcard credentials
    })
    console.log("apollo started")
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

