FROM node:6.6.0
# как разделять front и back. Через реверс прокси на nginx'е?
# как испльзовать в разработке и в проде? В разработке хочу держать исходники и node_modules локально.
# И не пересобирать контенйер при установке новых зависимостей.
# rm -v как работает?

RUN mkdir -p /src/app
WORKDIR /src/app

VOLUME ["/src/app", "/src/node_modules"]

EXPOSE 8080

CMD [ "npm", "start" ]