import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
// import { Users } from "../entity/User";
import { OpUsers } from "../entity/OpUsers";
import argon2 from "argon2";
import {
	UserResponse,
	UsernamePasswordEmailInput,
	LogoutResponse,
} from "./UserInputAndResponse";
import { MyContext } from "../types";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { validateRegister } from "../utils/validateRegister";
import { v4 } from "uuid";

import { sendEmail } from "../utils/sendEmail";
import { sleep } from "../utils/sleep";

import config from "../config";
import { getRepository } from "typeorm";

@Resolver()
export class UserResolver {
	// query self to check if logged in
	@Query(() => OpUsers, { nullable: true })
	me(@Ctx() { req }: MyContext) {
		if (!req.session.userId) {
			return null;
		}
		const currentUser = OpUsers.findOne({ id: req.session.userId });
		return currentUser;
	}

	@Mutation(() => Boolean)
	async forgotPassword(
		@Arg("email") email: string,
		@Ctx() { redis }: MyContext
	): Promise<Boolean> {
		const user = await OpUsers.findOne({ email: email });
		if (!user) {
			await sleep(3000); // prevent phishing
			return true;
		}

		const token = v4();

		// create a token and store userid/token
		// when user click on link, token will be sent back and we do look up
		await redis.set(
			FORGET_PASSWORD_PREFIX + token,
			user.id,
			"ex",
			1000 * 60 * 60
		);
		await sendEmail(
			email,
			`<p>Click <a href="${config.orgindev}/${FORGET_PASSWORD_PREFIX}${token}">here</a> to reset your Cl Reddit Password!`
		);

		return true;
	}

	@Mutation(() => UserResponse)
	async changePassword(
		@Arg("newPassword") newPassword: string,
		@Arg("confirmPassword") confirmPassword: string,
		@Arg("token") token: string,
		@Ctx() { redis, req }: MyContext
	): Promise<UserResponse> {
		// validate password and confirm password

		const key = FORGET_PASSWORD_PREFIX + token;
		const userId = await redis.get(key);

		if (!userId) {
			return {
				errors: [
					{
						field: "token",
						message: "token expired",
					},
				],
			};
		}

		if (newPassword.length < 6 || newPassword.length > 20) {
			return {
				errors: [
					{
						field: "newPassword",
						message: "passsword must be 6 to 20 characters long",
					},
				],
			};
		}

		if (confirmPassword != newPassword) {
			return {
				errors: [
					{
						field: "confirmPassword",
						message: "confirm password not matched",
					},
				],
			};
		}

		const userRepo = getRepository(OpUsers);
		const user = await userRepo.findOne(userId);

		if (!user) {
			return {
				errors: [
					{
						field: "token",
						message: "user no longer exist for some reason",
					},
				],
			};
		}

		try {
			await redis.del(key);
			const hashedPassword = await argon2.hash(newPassword);
			user.password = hashedPassword;
			await userRepo.save(user);
		} catch (err) {
			console.log(err);
		}

		req.session!.userId = user.id;
		req.session!.userName = user.username;
		req.session!.userNickname = user.nickname;

		return {
			user: user,
		};
	}

	// register user
	@Mutation(() => UserResponse)
	async register(
		@Arg("options") options: UsernamePasswordEmailInput,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		const hasError = await validateRegister(options);
		if (hasError) {
			return { errors: hasError };
		}

		try {
			const hashedPassword = await argon2.hash(options.password);
			const user = OpUsers.create({
				username: options.username.toLowerCase(),
				password: hashedPassword,
				email: options.email.toLowerCase(),
				nickname: options.username,
			});

			await user.save();

			req.session!.userId = user.id;
			req.session!.userName = user.username;
			req.session!.userNickname = user.nickname;

			console.log(`${user.username} just registered and is logged in!`);

			return {
				user: user,
			};
		} catch (err) {
			return {
				errors: [
					{
						field: "email",
						message: "unknow error lol get rekt",
					},
				],
			};
		}
	}

	// handle login
	@Mutation(() => UserResponse)
	async login(
		@Arg("usernameOrEmail") usernameOrEmail: string,
		@Arg("password") password: string,
		@Ctx() { req }: MyContext
	): Promise<UserResponse> {
		let selectUser;

		if (usernameOrEmail.includes("@")) {
			selectUser = await OpUsers.findOne({
				email: usernameOrEmail.toLowerCase(),
			});
		} else {
			selectUser = await OpUsers.findOne({
				username: usernameOrEmail.toLowerCase(),
			});
		}

		if (!selectUser) {
			return {
				errors: [
					{
						field: "usernameOrEmail",
						message: "username/email incorrect",
					},
				],
			};
		}

		const valid = await argon2.verify(selectUser.password, password);

		if (!valid) {
			return {
				errors: [
					{
						field: "password",
						message: "password incorrect",
					},
				],
			};
		}

		// we can use this object to store user info
		// store userid session, will set a cookie on user
		// keep them logged in

		// SEMANTICS:
		// 1. data stored on req.session will be stuck to redis ---> sess: qwer -> { userId: 1}
		// 2. express-session will set a cookie to be stored on browser like: theissomefakecookieqwerqwerq
		// 3. when user make request/queries: the cookie stored will be sent to server
		// 4. server-session sees the cookie, decrypt it using secret back to key ---> sess: qwer
		// 5. make-request to redis with decrypted key and look up data

		req.session!.userId = selectUser.id;
		req.session!.userName = selectUser.username;
		req.session!.userNickname = selectUser.nickname;

		console.log(`${selectUser.username} just logged in!`);

		return {
			user: selectUser,
		};
	}

	@Mutation(() => Boolean)
	async logout(@Ctx() { req, res }: MyContext) {
		if (!req.session.userId) {
			return false;
		}

		function wrapper() {
			return new Promise((resolve) => {
				req.session.destroy((err) => {
					if (err) {
						console.log(err);
						resolve(false);
						return;
					}
					resolve(true);
				});
			});
		}

		console.log(`${req.session.userName} just logged out!`);

		res.clearCookie(COOKIE_NAME); // clear the cookie
		await wrapper(); // wrapped callback inside promise so i can await

		return true;
	}

	// @Mutation(()=> Boolean)
	// async forgotpassword(
	//     @Arg('email') email: string,
	//     @Ctx() { req, res }: MyContext,
	// ) {
	//     const user = await Users.findOne({emails: email})
	// }
}
