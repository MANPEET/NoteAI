"use client"

import {createContext, useContext} from "react"

type UserContextType = {
    plan: "free" | "pro"
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({children,value} : {children: React.ReactNode, value: UserContextType}){   
    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser(){
    const context = useContext(UserContext)

    if(!context){
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}