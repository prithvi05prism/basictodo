const globalErrorHandler = (err, req, res, next) => {
    console.log("[globalError Handler] There was an error: ");
    console.log(err);

    return res.status(500).send({
        status: "failure",
        message: "Internal Server Error"
    });
};

const requestLogger = (req, res, next) => {
    req.time = new Date(Date.now()).toString();
    console.log("[requestLogger] Req: ", req.method, req.hostname, req.path, req.time);
    return next();
}

module.exports = {globalErrorHandler, requestLogger};