const fs = require('fs');
const mime = require('mime');

const FILE_NOT_FOUND = 'ENOENT';
const MEGABYTE = Math.pow(2, 20);

module.exports = class File {
    constructor(path, maxSize = MEGABYTE) {
        this.path = path;
        this.maxSize = maxSize;
    }

    sendTo(res) {
        const file = fs.ReadStream(this.path);
        file.on('error', (err) => {
            if (err.code === FILE_NOT_FOUND) {
                res.statusCode = 404;
                res.end('File not found');
            } else {
                res.statusCode = 400;
                res.end('Bad request');
            }
        });

        file.pipe(res);
        res.setHeader('Content-Type', `${mime.lookup(this.path, 'text/html')}`);

        res.on('close', () => file.destroy());
    }

    save(req, res) {
        fs.access(this.path, fs.constants.F_OK, (err) => {
           if (!err) {
               res.statusCode = 409;
               res.end('File already exists');
               req.destroy();
               return;
           }

            if (req.headers['content-length'] > this.maxSize) {
                res.statusCode = 413;
                res.end('File to large');
                req.destroy();
                return;
            }

            const file = fs.createWriteStream(this.path, {code: 'w'});
            req.pipe(file);

            file.on('error', (err) => {
                res.statusCode = 400;
                res.end(`Bad request: ${err.message}`)
            });
            file.on('finish', () => {
                res.end('File saved');
            });
        });
    }

    remove(res) {
        fs.access(this.path, fs.constants.F_OK, (err) => {
            if (err) {
                res.statusCode = 404;
                res.end('File not found');
                return;
            }

            fs.unlink(this.path, (err) => {
                if (err) {
                    res.statusCode = 400;
                    res.end(`Bad request: ${err.message}`)
                    return;
                }

                res.statusCode = 200;
                res.end(`File deleted`);
            })
        });
    }
};
