/**
 ЗАДАЧА
 Написать HTTP-сервер для загрузки и получения файлов
 - Все файлы находятся в директории files
 - Структура файлов НЕ вложенная.

 - Виды запросов к серверу
 GET /file.ext
 - выдаёт файл file.ext из директории files,

 POST /file.ext
 - пишет всё тело запроса в файл files/file.ext и выдаёт ОК
 - если файл уже есть, то выдаёт ошибку 409
 - при превышении файлом размера 1MB выдаёт ошибку 413

 DELETE /file.ext (?)
 - удаляет файл
 - выводит 200 OK
 - если файла нет, то ошибка 404

 Вместо file может быть любое имя файла.
 Так как поддиректорий нет, то при наличии / или .. в пути сервер должен выдавать ошибку 400.

 - Сервер должен корректно обрабатывать ошибки "файл не найден" и другие (ошибка чтения файла)
 - index.html или curl для тестирования

 - Необходимо выставлять правильный content-type с использованием модуля mime

 */

// Пример простого сервера в качестве основы

const url = require('url');
const path = require('path');
const http = require('http');
const File = require('./file');

const invalidPath = /(\.{2}\/)|([^.]\/)/;

function buildFilePath(pathname) {
    if (invalidPath.test(pathname)) {
        throw new Error('Invalid path');
    }

    if (pathname === '/') {
        return path.normalize(path.join(__dirname, '/public/index.html'));
    }

    return path.normalize(path.join(__dirname, 'files', pathname));
}

function requestHandler(cb) {
    return (pathname, req, res) => {
        let file;

        try {
            file = new File(buildFilePath(pathname), req, res);
        } catch (e) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
        }

        cb(file);
    }
}

const handlers = {
    'GET': requestHandler((file) => file.sendTo()),
    'POST':  requestHandler((file) => file.save()),
    'DELETE': requestHandler((file) => file.remove())
};


function startServer(host = 'localhost', port = 3000) {
    http.createServer(function (req, res) {
        let pathname;

        try {
            pathname = decodeURI(url.parse(req.url).pathname);
        } catch (e) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
        }

        if (pathname.indexOf('\0') !== -1) {
            res.statusCode = 400;
            res.end('Bad request');
            return;
        }

        if (req.method in handlers) {
            handlers[req.method](pathname, req, res);
        } else {
            res.statusCode = 502;
            res.end("Not implemented");
        }
    }).listen(port, host);
}

if (module.parent) {
    module.exports = startServer;
} else {
    startServer();
}

