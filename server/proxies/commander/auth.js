'use strict';
var bcrypt = require('bcrypt');

module.exports = class Auth {
    constructor(password_hash) {
        this._hash = password_hash;
    }


    express(req, res, next) {
        const token = req.headers['authorization'];
        if (!token || token.length <= 0) {
            return res.status(403).send('no authorization token found');
        }

        if (!bcrypt.compareSync(token, this._hash)) {
            return res.status(403).send('wrong token');
        }

        next();
    }


    socketio(socket, next) {
        if (!socket.handshake.query || !socket.handshake.query.token ||
            socket.handshake.query.token.length <= 0) {
            return next(new Error('no token found'));
        }

        const token = socket.handshake.query.token;

        if (!bcrypt.compareSync(token, this._hash)) {
            return next(new Error('wrong token'));
        }

        next();
    }
};
