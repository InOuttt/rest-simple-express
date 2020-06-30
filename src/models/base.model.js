const Model = require('../../config/db.config');
const { v4: uuidv4 } = require('uuid');
const { raw } = require('objection');

class BaseModel extends Model {

  static get getSchema() {
    return 'sipd';
  }
  static get prefixTable() {
    return BaseModel.getSchema + '.sipd_';
  }

  static get idColumn() {
    return 'id';
  }  
 
  static pageSize() {
    return 25;
  }

  static tableMetadata() {
    return {
      columns: Object.keys(this.jsonSchema.properties)
    };
  }

  $formatJson(json) {
    json = super.$formatJson(json);

    Object.keys(BaseModel.baseJsonSchema)
      .forEach(function(key) {
        if(key != "id") delete json[key]
      });

    return json;
  }  

  $parseDatabaseJson(json) {
    json = super.$parseDatabaseJson(json);
    
    Object.keys(json).forEach(prop => {
      const value = json[prop];
      
      if (value instanceof Date) {
        json[prop] = value.toISOString();
      }
    });

    return json;
  }  

  static async checkById(model, id) {
    return await model.query().findOne(raw('id::text'), id).where({status_aktif:1})
  }

  static buildWhere(builder, params, operator='=') {
    if (params instanceof Object) {
      let attr = this.tableMetadata().columns;
      let filter = Object.keys(params)
        .filter(function(key) {
          return attr.includes(key)
        })
        .forEach(function(key, idx) {
          let val = params[key]
          val = operator == 'like' ? '%' + params[key] + '%' : params[key];
          builder.where(key, operator, val);
        });
    }
    return builder;
  }

  static builderWithGraphFetched(builder) {
    // Get the children
    let relations = this.getRelations();
    if (Object.keys(relations).length > 0) {
      // Gather the children keys
      let relationKeys = [];
      for (var key in relations) {
        let childModifiers = relations[key].relatedModelClass.modifiers;
        
        // Add (defaultSelects) to children keys when it's available
        if (childModifiers && childModifiers.defaultSelects != undefined) {
          relationKeys.push(key + '(defaultSelects)')
        } else {
          relationKeys.push(key)
        }
      }
  
      // Use "withGraphFetched" to get the children
      if (relationKeys.length > 0) {
        let keys = (relationKeys.length === 1) ? relationKeys[0] : '[' + relationKeys.join(',') + ']' ; 
        builder.withGraphFetched(keys);
      }
    }

    return builder;
  }

  static buildQueryWithGraphFetched(builder) {
    // Add (defaultSelects) to root when it's available
    if (this.modifiers && this.modifiers.defaultSelects != undefined) {
      builder.modify('defaultSelects');
    }
    builder = this.builderWithGraphFetched(builder);
    return builder;
  }

  static buildWhereAdditional(builder, op) {
    return builder;
  }

  static buildQuery(op) {
    const model = this;

    let builder = this.query();
    builder = this.buildQueryWithGraphFetched(builder);
    
    const idxId = 'id';
    const idxFilter = 'filter';
    const idxWhere = 'where';
    const idxOrder = 'order';
    const idxSort = 'sort';
    const idxPage = 'page';
    const idxSize = 'size';
    const idxEmpty = 'empty';

    if (op instanceof Object) {
      if (typeof op[idxId] !== 'undefined')
        builder = builder.where('id', op[idxId])

      builder = this.buildWhere(builder, op[idxFilter]);
      builder = this.buildWhere(builder, op[idxWhere], 'like');
      builder = this.buildWhereAdditional(builder, op);

      // if (typeof op[idxOrder] === 'string' 
      //   && this.tableMetadata().columns.includes(op[idxOrder]))
      //   builder = builder.orderBy(op[idxOrder]);

      if (typeof op[idxOrder] !== 'undefined' && this.tableMetadata().columns.includes(op[idxOrder])) {
        let order = this.tableName + "." + op[idxOrder];
        if (typeof op[idxSort] !== 'undefined') {
          builder = builder.orderBy(order, op[idxSort]);
        } else {
          builder = builder.orderBy(order);
        }
      }

      if(op[idxEmpty]) {
        Object.keys(op[idxEmpty])
          .forEach(function(key) {
            let val = op[idxEmpty][key]
            if(val === "1")
              builder = builder.whereNotNull(key)
            else
              builder = builder.whereNull(key)
          });
      }

      if (typeof op[idxPage] !== 'undefined') {
        let offset = (
          (op[idxPage]['offset'] !== undefined) 
          ? op[idxPage]['offset'] 
          : ((op[idxPage] !== undefined) ? op[idxPage] : 0)
        );
        let limit = (
          (op[idxPage]['size'] !== undefined) 
          ? op[idxPage]['size'] 
          : ((op[idxSize] !== undefined) ? op[idxSize] : this.pageSize())
        );
        builder = builder.page(offset, limit);
      } else {
        builder = builder.page(0, this.pageSize());
      }

    }
    
    return builder;
  }

  static get baseJsonSchema() {

    return {
      id : {
        type: 'string',
        format: 'uuid'
      },

      created_date: {
        type: 'string',
        format: 'date-time'
      },
      created_by: {
        type: 'string'
      },
      updated_date: {
        type: 'string',
        format: 'date-time'
      },
      updated_by: {
        type: 'string'
      },
      deleted_date: {
        type: 'string',
        format: 'date-time'
      },
      status_aktif: {
        type: 'number',
        default: 1
      }
    };
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext);
   
    this.created_date =  new Date().toISOString();
    this.id = uuidv4();
  }

  async $beforeUpdate(queryContext) {
    await super.$beforeUpdate(queryContext);
    
    this.updated_date =  new Date().toISOString();
    if(this.status_aktif === 0) {
      this.deleted_date = this.updated_date;
    }
  }

  async $beforeDelete(queryContext) {
    await super.$beforeDelete(queryContext);
    
    this.deleted_date =  new Date().toISOString();
  }
}

module.exports = BaseModel;