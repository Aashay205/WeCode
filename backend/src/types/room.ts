import type User from "./user.js";

export default interface Room{
    hostUserId:string | null,
    users: Map<string,User>,
    code: string,
    language:string,
}