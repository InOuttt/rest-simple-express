if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const Minio = require('minio');

const minioConfig = new Minio.Client({
    endPoint: "127.0.0.1",
    port: 8009,
    useSSL: false,
    accessKey: process.env.MINIO_KEY,
    secretKey: process.env.MINIO_SECRET
});

module.exports = minioConfig;