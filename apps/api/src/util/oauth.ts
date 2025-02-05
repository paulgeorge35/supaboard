import { AuthorizationCode } from "simple-oauth2";

const id = process.env.GOOGLE_CLIENT_ID as string;
const secret = process.env.GOOGLE_CLIENT_SECRET as string;

export const googleClient = new AuthorizationCode({
    client: {
        id,
        secret,
    },
    auth: {
        tokenHost: "https://oauth2.googleapis.com",
        tokenPath: "/token",
        authorizePath: "https://accounts.google.com/o/oauth2/v2/auth",
    },
});
