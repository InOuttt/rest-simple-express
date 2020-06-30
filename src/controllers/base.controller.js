const textReplace = require('../utils/text-replace.utils');
const { 
  checkSchema, 
  validationResult 
} = require('express-validator');
const HttpException = require('http-errors')

const {
  ValidationError,
  NotFoundError,
  DBError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError
} = require('objection');

class BaseHandler {

  static error(err, res) {
    if (err instanceof ValidationError) {
      switch (err.type) {
        case 'ModelValidation':
          res.status(400).json({
            message: err.message,
            code: err.type,
            source: err.data
          });
          break;
        case 'RelationExpression':
          res.status(400).json({
            message: err.message,
            code: 'RelationExpression',
            source: {}
          });
          break;
        case 'UnallowedRelation':
          res.status(400).json({
            message: err.message,
            code: err.type,
            source: {}
          });
          break;
        case 'InvalidGraph':
          res.status(400).json({
            message: err.message,
            code: err.type,
            source: {}
          });
          break;
        default:
          res.status(400).json({
            message: err.message,
            code: 'UnknownValidationError',
            source: {},
            raw: err
          });
          break;
      }
    } else if (err instanceof NotFoundError) {
      res.status(404).json({
        message: err.message,
        code: 'NotFound',
        source: {}
      });
    } else if (err instanceof UniqueViolationError) {
      res.status(409).json({
        message: err.message,
        code: 'UniqueViolation',
        source: {
          columns: err.columns,
          table: err.table,
          constraint: err.constraint
        }
      });
    } else if (err instanceof NotNullViolationError) {
      res.status(400).json({
        message: err.message,
        code: 'NotNullViolation',
        source: {
          column: err.column,
          table: err.table
        }
      });
    } else if (err instanceof ForeignKeyViolationError) {
      res.status(409).json({
        message: err.message,
        code: 'ForeignKeyViolation',
        source: {
          table: err.table,
          constraint: err.constraint
        }
      });
    } else if (err instanceof CheckViolationError) {
      res.status(400).json({
        message: err.message,
        code: 'CheckViolation',
        source: {
          table: err.table,
          constraint: err.constraint
        }
      });
    } else if (err instanceof DataError) {
      var errMessage = err.message.indexOf('-') > -1 
        ? err.message.split('-')[1] : err.message;
      res.status(400).json({
        message: errMessage,
        code: 'InvalidData',
        source: {}
      });
    } else if (err instanceof DBError) {
      var errMessage = err.message.indexOf('-') > -1 
        ? err.message.split('-')[1] : err.message;      
      res.status(500).json({
        message: err.message,
        code: 'UnknownDatabaseError',
        source: {}
      });
    } else {
      res.status(500).json({
        message: err.message,
        code: 'UnknownError',
        source: {}
      });
    }
  }  
}

class BaseController {

  static get model() {
    throw new TypeError('This method should be overridden by inheriting classes.');
  }

  static get querySchema() {
    let defaultVal = {
      in: ['query'],
      optional: { options: { nullable: true } },
      // isAlphanumeric: true,
      trim: true,
      escape: true
    };

    let intVal = {
      isAlpha: false,
      isInt: true,
      toInt: true
    };

    return {
      'filter.*': defaultVal,
      'where.*': defaultVal,
      'page.offset': { ...defaultVal, ...intVal },
      'page.size': { ...defaultVal, ...intVal },
      'order': defaultVal
    };
  }

  static get mask() {
    return {};
  }

  static get reverseMask() {
    let reverseMask = [];
    Object.keys(this.mask).forEach(function (key) {
      reverseMask[this[key]] = key;
    }, this.mask)
    return reverseMask;
  }

  static get defaultResponse() {
    return {
      'name': 'Success',
      'message': 'Success',
      'code': '200',
      'error': null,
      'data': null
    }
  }

  static get defaultResponseIndex() {
    return {
      'total': 0,
      'skip': 0
    }
  }

  static get getRelation() {
    return [];
  }

  static setMetaFromResult(data, page, res) {
    if (typeof data.total !== 'undefined') {
      const tp = Math.ceil(data.total / data.results.length);
      res.set({
        'X-Total': data.total,
        'X-Total-Pages': tp,
        'X-Per-Page': data.results.length,
        'X-Page': page,
        'X-Next-Page': tp > page + 1 ? page + 1 : page,
        'X-Prev-Page': page > 1 && tp > page ? page - 1 : page
      });      
    }
  }

  reg(route) {
    // console.log(this.get);
    route.get('/' + this.name, checkSchema(this.querySchema), this.get);
  }

  static async checkId(id) {
    if (id.match(/^\s*$/)) 
      throw new HttpException(400, "id: should not be empty")

    let findOne = await this.model.checkById(this.model, id)
    if (!findOne) 
      throw new HttpException(400, "Data with this id can not be found")
  }

  static async baseGetValidation(req, res){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var jsonError = errors.array()
        .map(function (err) {
          return {
            status: 422,
            code: 'QueryValidationError',
            title: err.param + ' have ' + err.msg,
            message: err.msg
          }
        })
      return res.status(422).json({ errors: jsonError });
    }
  }

  /** use example on controllers/rpjpd/arah-kebijakan.controller .get(req, res, next) */
  static async baseGet(req, res, next, result) {
    try {
      let response = this.defaultResponse;

      if (typeof result === 'undefined') {
        if (req.params.id !== undefined) req.query.id = req.params.id;
        result = await this.buildQuery(req.query, req);
      }
      let data = result;
      BaseController.setMetaFromResult(result, 1, res);

      if (typeof result.total !== 'undefined') {
        //data = result.results;
        data = await this.restoreMaskedFields(result.results);
        response.index = this.defaultResponseIndex;
        response.index.total = result.total;
      }

      if (req.params.id === undefined) {
        // Find All
        response.data = data;
      } else {
        // Find One
        response.data = data[0];
      }
      
      response.code = 200;
      res.status(200).json(response);
    } catch (e) {
      console.log(e);
      BaseHandler.error(e, res);
    }
  }

  static async get(req, res, next) {
    try {
      if (req.params.id !== undefined) await this.checkId(req.params.id)
      await this.baseGetValidation(req, res)
      await this.baseGet(req, res, next)
    } catch (e) {
      console.log(e)
      e = await this.restoreErrorMessage(e)
      BaseHandler.error(e, res)
    }
  }

  static get currentModel() {
    return this.model
  }

  static buildQuery(query, req) {
    return this.currentModel.buildQuery(query);
  }

  static async buildInsertQuery(model, req, res, next) {
    return await model.query().insert(req.body).returning('*')
  }

  static async basePost(model, req, res, next) {
    req.body = await this.maskingFields(req.body)
    let response = this.defaultResponse
    try {
      const data = await this.buildInsertQuery(model, req, res, next)

      response.data = data
      response.code = 201

      res.status(201).json(response)
    } catch (e) {
      console.log(e)
      e = await this.restoreErrorMessage(e)
      BaseHandler.error(e, res)
    }
  }

  static async post(req, res, next) {
    await this.basePost(this.model, req, res, next)
  }

  static async basePatchAction(model, req, res, next) {
    const result = await model.query().patchAndFetchById(req.params.id, req.body)
    return result
  }

  static async basePatch(model, req, res, next) {
    req.body = await this.maskingFields(req.body);
    let response = this.defaultResponse;
    try {
      const result = await this.basePatchAction(model, req, res, next)
      response.data = result;
      response.code = 204;
      res.status(204).json(result)
    } catch (e) {
      console.log(e);
      e = await this.restoreErrorMessage(e);
      BaseHandler.error(e, res);
    }   
  }

  static async patch(req, res, next) {
    try {
      if (req.params.id !== undefined) await this.checkId(req.params.id)
      await this.basePatch(this.model, req, res, next)
    } catch (e) {
      console.log(e)
      e = await this.restoreErrorMessage(e)
      BaseHandler.error(e, res)
    }
  }  

  static async baseDelete(model, req, res, next) {
    try {
      const result = await model.query().patchAndFetchById(req.params.id, {status_aktif: 0});
        // .deleteById(req.params.id); 
      res.status(204)
        .json(result)
    } catch (e) {
      console.log(e);
      BaseHandler.error(e, res);
    } 
  }

  static async delete(req, res, next) {
    await this.baseDelete(this.model, req, res, next)
  }

  static async maskingFields(datas, notRemovedDatas = []) {
    Object.keys(datas).forEach(function (key) {
      if (this[key] !== undefined) {
        datas[this[key]] = datas[key];
        if(notRemovedDatas[key] === undefined) 
          delete datas[key];
      }
    }, this.mask)
    return datas;
  }

  // ================================================================================================
  // Masking array of objects that is usually in JSON. Example:
  // - <root>\src\controllers\rkpd\rkpd.controller.js
  // ================================================================================================
  // static get maskChildrenBab() {
  //   return {
  //       no: 'kode_bab',
  //       isi_bab: 'desk_bab',
  //   };
  // }
  // ================================================================================================
  // let reqChildrenBab = req.body.bab;
  // reqChildrenBab = await this.maskingFieldsArrayOfObject(this.maskChildrenBab, reqChildrenBab);
  // ================================================================================================
  static async maskingFieldsArrayOfObject(masker, arrayDatas, notRemovedDatas = []) {
    let newArrayDatas = [];

    Object.keys(arrayDatas).forEach(function (arrayKey) {
      let datas = arrayDatas[arrayKey];

      Object.keys(datas).forEach(function (key) {
        if (this[key] !== undefined) {
          datas[this[key]] = datas[key];
          if (notRemovedDatas[key] === undefined) 
            delete datas[key];
        }
      }, masker)

      newArrayDatas.push(datas);
    })

    return arrayDatas;
  }

  static async restoreMaskedFields(datas) {
    if(datas !== undefined && datas.length > 0) {
      Object.keys(this.mask).forEach(function (key) {
        datas[key] = datas[this[key]];
        delete datas[this[key]];
      }, this.mask)
    }
    return datas;
  }

  static async restoreErrorMessage(error) {
    error.message = textReplace(error.message, this.reverseMask);
    error.data = await this.restoreMaskedFields(error.data, this.mask);

    return error;
  }

}


module.exports = {
  BaseController,
  BaseHandler
}