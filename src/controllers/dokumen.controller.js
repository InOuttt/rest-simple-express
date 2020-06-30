const { BaseController, BaseHandler } = require("./base.controller");
const { ValidationError } = require("objection");
const HttpException = require("http-errors");

const minioConfig = require("../../config/minio.config");
const minio = require("../utils/minio-wrapper");
const bucket_name = "sipd";
const JSZip = require("jszip");

class dokumenController extends BaseController {
  static get model() {
    return require("../models/rpjmd/trx-dokumen.model");
  }

  static async download(req, res, next) {
    try {
      if (!req.query.tipe_file && !req.query.ref_id && !req.params.id) {
        return next(
          new HttpException(
            400,
            "one of tipe_file, ref_id, params id is required"
          )
        );
      }

      let datas = this.model.query().select("*").modify('defaultSelects');
      if (req.params.id) 
        datas = datas.where("id", "=", req.params.id);
      if (req.query.tipe_file)
        datas = datas.where("tipe_file", "=", req.query.tipe_file);
      if (req.query.ref_id)
        datas = datas.where("ref_id", "=", req.query.ref_id);

      datas = await datas;

      if (datas && Array.isArray(datas) && datas.length > 1) {
        let zip = new JSZip();
        for (const data of datas) {
          // let fileName = data.nama_file.substring(data.nama_file.indexOf('-') + 1, data.nama_file.length);
          let fileName = data.nama_file;

          await minioConfig
            .getObject(bucket_name, data.path + "/" + data.nama_file)
            .then(async (stream) => {
              zip.file(fileName, stream);
            })
            .catch((err) => {
              return next(err);
            });
        }
        res.attachment("sipd-document.zip");
        zip
          .generateNodeStream({ type: "nodebuffer", streamFiles: true })
          .pipe(res);
      } else if (datas && Array.isArray(datas) && datas.length === 1) {
        let data = datas[0];
        minioConfig.getObject(
          bucket_name,
          data.path + "/" + data.nama_file,
          function (error, stream) {
            if (error) {
              return res.status(500).send(error);
            }
            res.attachment(data.nama_file);
            stream.pipe(res);
          }
        );
      } else {
        console.log(datas);
        return next(HttpException(400, "File Not Found"));
      }
    } catch (e) {
      console.log(e);
      return next(e);
    }
  }
}

module.exports = dokumenController;
