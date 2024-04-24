export const frontendURL = process.env.FRONTEND_URL || ['http://localhost:5173'];

export const corsOptions = {
    origin :  (origin, callback) => { 
        if(frontendURL.indexOf(origin) !== -1 || !origin){
            callback(null, true)
        }else{
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    optionSuccessStatus: 200
}