if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const minioConfig = require('../../config/minio.config')

var minioClient = {

    checkBucket: function (options) {
        if (!options) throw 'Invalid Parameter'
        minioConfig.bucketExists(options.bucket, function(err, exists) {
            if (err) {
                return console.log(err);
            }
            if (exists) {
                console.log('Bucket exists.')
                return exists;
            }
        })
    },

    createBucket: function (options) {
        console.log(options);
        if (!options) throw 'Invalid Parameter'
        minioConfig.makeBucket(options.bucket, function(err) {
            if (err) {
                return console.log('Error creating bucket.', err)
            }
            return console.log('Bucket ' + options.bucket + ' created successfully')
        })
    },

    uploadFile: function (options) {
        let res = false;
        minioConfig.bucketExists(options.bucket, function(err, exists) {
            if (err) {
                return console.log(err)
            }
            if (exists) {
                console.log('Bucket exists.')
                minioConfig.putObject(options.bucket, options.fileName, options.file, "application/octet-stream", function(err, etag) {
                    if (err) {
                        return console.log(err)
                    }
                    return console.log('File ' + options.fileName + ' uploaded successfully.')
                });
            } else {
                minioConfig.makeBucket(options.bucket, function(err) {
                    if (err) {
                        return console.log('Error creating bucket.', err)
                    }
                    minioConfig.putObject(options.bucket, options.fileName, options.file, "application/octet-stream", function(err, etag) {
                        if (err) {
                            return console.log(err)
                        }
                        return console.log('File ' + options.fileName + ' uploaded successfully.')
                    });
                    return console.log('Bucket ' + options.bucket + ' created successfully')
                })
            }
        })
    }
}

module.exports = minioClient