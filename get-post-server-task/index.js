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
const File = require('./file');

function buildFilePath(pathname) {
    if (pathname === '/') {
        return (path.join(__dirname, '/public/index.html'));
    }

    return (path.join(__dirname, 'files', pathname));
}

function requestHandler(cb) {
    return (pathname, req, res) => {
        const file = new File(buildFilePath(pathname));
        cb(file, req, res);
    }
}

const handlers = {
    'GET': requestHandler((file, req, res) => file.sendTo(res)),
    'POST':  requestHandler((file, req, res) => file.save(req, res)),
    'DELETE': requestHandler((file, req, res) => file.remove(res))
};

require('http').createServer(function (req, res) {
    let pathname = decodeURI(url.parse(req.url).pathname);
    console.log('pathname:', pathname);
    if (req.method in handlers) {
        handlers[req.method](pathname, req, res);
    } else {
        res.statusCode = 502;
        res.end("Not implemented");
    }
}).listen(3000);
