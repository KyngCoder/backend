class AppError extends Error{
    constructor(message, statusCode) {
        super(message);
        this.message = message;
        this.statusCode = statusCode || 500;
        this.status = `${statusCode}`.startsWith('4')? "failed" : "server error" ;
        this.isCustomError = true;
        Error.captureStackTrace(this, this.constructor);
        
    }
}

module.exports = AppError;