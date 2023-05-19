module.exports = (fn) => (req, res, next) => {
	if (fn.constructor.name === 'AsyncFunc') return fn(req, res, next).catch(next);

	try {
		fn(req, res, next);
	} catch (error) {
		next(error);
	}
};