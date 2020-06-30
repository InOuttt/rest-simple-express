FROM node:10-alpine
WORKDIR /application
COPY . /application
RUN npm install --production
CMD ["node", "index.js"]
