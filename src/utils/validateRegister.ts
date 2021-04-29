import { OpUsers } from "../entity/OpUsers";
import { UsernamePasswordEmailInput } from "../resolvers/UserInputAndResponse";

export const validateRegister = async (options: UsernamePasswordEmailInput) => {

    if (options.username.length < 3 || options.username.length > 18) {
        return [{
                field: "username",
                message: "username must be 3 to 18 characters long"
        }]
    }

    if (options.username.includes('@')) {
        return [{
            field: "username",
            message: "username cannot contain @"
    }]
    }

    const exist = await OpUsers.findOne({username: options.username.toLowerCase()});

    if (exist) {
        return [{
                field: "username",
                message: "username is taken"
        }]
    }

    if (!options.email.includes('@')) {
        return [{
                field: "email",
                message: "email format invalid"
        }]
    }

    const emailexist = await OpUsers.findOne({email: options.email.toLowerCase()});

    if (emailexist) {
        return [{
                field: "email",
                message: "this email is already registered"
        }]
    }

    if (options.password.length < 6 || options.password.length > 20) {
        return [{
                field: "password",
                message: "passsword must be 6 to 20 characters long"
        }]
    }

    if (options.confirmPassword != options.password) {
        return [{
                field: "confirmPassword",
                message: "confirm password not matched"
        }]
    }

    return null;
}