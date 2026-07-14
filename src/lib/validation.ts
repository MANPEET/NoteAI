export function validateRegisterInput({name,email, password}: {name: string, email: string,password : string}){
    if (!name?.trim() || !email?.trim() || !password) {
        return "Name, email and password are required"
    }

    if (name.trim().length < 2) {
        return "Name must be at least 2 characters"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
        return "Enter a valid email address"
    }

    const passwordError = validatePassword(password)
    if (passwordError) return passwordError

    return null
}


export function validatePassword(password: string) : string | null{
    if(password.length < 8) return "Password must be at least 8 characters"
    if(!/[A-za-z]/.test(password)) return "Password must contain at least one letter"
    if(!/[0-9]/.test(password)) return "Password must contain at least one digit"
    if(!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character"
    return null
}

export function generateOtp(){
    return Math.floor(100000 + Math.random() * 900000).toString()
}