FROM node:19-alpine3.16 as production

WORKDIR /app

COPY . .

RUN npm i

EXPOSE 8080:8080

CMD ["npm", "run", "start:docker"]