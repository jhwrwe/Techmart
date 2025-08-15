import type { DefaultSession } from "next-auth";

declare module 'next-auth'{
    interface Session{
        user: {
            id:string
            role:string,
            createdAt: Date
        } & DefaultSession['user']
    }
    interface User{
        role:string
    }
}