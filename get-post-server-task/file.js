const fs = require('fs');
const mime = require('mime');

const FILE_NOT_FOUND = 'ENOENT';
const MEGABYTE = Math.pow(2, 20);

module.exports = class File {
    constructor(path, req, res, maxSize = MEGABYTE) {
        this.path = path;
        this.maxSize = maxSize;
        this.req = req;
        this.res = res;
    }

    sendTo() {
        const fileStream = fs.createReadStream(this.path);
        fileStream.pipe(this.res);

        fileStream.on('open', () => {
            this.res.setHeader('Content-Type', `${mime.lookup(this.path)}`);
        });
        fileStream.on('error', (err) => {
            if (err.code === FILE_NOT_FOUND) {
                this.res.statusCode = 404;
                this.res.end('File not found');
            } else if (!this.res.headersSent) {
                this.res.statusCode = 500;
                this.res.end('Bad request');
            } else {
                this.res.end();
            }
        });

        this.res.on('close', () => fileStream.destroy());
    }

    save() {
        let size = 0;
        const writeStream = new fs.WriteStream(this.path, {flags: 'wx'});

        this.req.on('data', (chunk) => {
            size += chunk.length;
            if (size > this.maxSize) {
                this.res.statusCode = 413;
                this.res.setHeader('Connection', 'close');
                this.res.end('File to large');

                writeStream.destroy();
                fs.unlink(this.path, err => {});
            }
        });
        this.req.on('close', () => {
            // console.log('file save request closed');
            writeStream.destroy();
            fs.unlink(this.path, err => {});
            // console.log('save file aborted');
        });

        this.req.on('end', () => {
            // console.log('file save request ended');
        });

        this.req.on('aborted', () => {
            // console.log('file save request aborted');
        });

        this.req.pipe(writeStream);

        writeStream.on('open', () => {
            // console.log('write stream opened');
            // process.nextTick(() => {
            //     writeStream.emit('error');
            // });
        });
        writeStream.on('finish', () => {
            // console.log('file save finish');
        });

        writeStream.on('error', (err) => {
            // console.log('file save error');
            if (err && (err.code === 'EEXIST' || err.code === 'EISDIR')) {
                this.res.statusCode = 409;
                this.res.end('File already exists');
            } else {
                if (!this.res.headersSent) {
                    this.res.statusCode = 500;
                    this.res.setHeader('Connection', 'close');
                    this.res.end("Internal error");
                } else {
                    this.res.end();
                }

                fs.unlink(this.path, err => {});
            }
        });
        writeStream.on('close', () => {
            // console.log('save file stream closed');
            this.res.statusCode = 201;
            this.res.end('Created!');
        });
    }

    remove() {
        fs.unlink(this.path, (err) => {
            if (err) {
                if (err.code === FILE_NOT_FOUND) {
                    this.res.statusCode = 404;
                    this.res.end('File not found');
                } else {
                    this.res.statusCode = 500;
                    this.res.end("Internal error");
                }
                return;
            }

            this.res.statusCode = 200;
            this.res.end(`File deleted`);
        });
    }
};

/*
TODO:
 - res.destroy(); похоже что оно закрывает сокет
 - this.res.setHeader('Connection', 'close'); vs req.destroy
 - error event in req and res

- Зачем res.destroy() в обработчике ошибки в receiveFile
    - Если закоментить только res.destroy(), то больше никаие обработчики req и writeStream не срабоатют
    - Если закоментить только res.end(), то обработаются события aborted и close у request и close writeStream
    - Если в receiveFile закоментить res.end() в res.destroy() то сработает событие end у request
- В случае ошибки writeStream в какой момент он закроется?
*/