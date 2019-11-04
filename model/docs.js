const funcs = require('../functions');

var docs = function (db) {
  if (!(this instanceof docs)) {
    return new docs(db);
  }
  this.db = db;
  this.genid = function (pstr = '') {
    let pre = `${Date.now()}${Math.random()}${pstr}`;
    return funcs.sha1(pre);
  };
};

docs.prototype.parseCond = function (args, uid = null) {

  let offset = 0;
  let pagesize = 12;
  let kwd = null;

  if (args.kwd !== undefined) {
    kwd = args.kwd.replace(/[\;\*\s]+/ig, '%');
    kwd = `%${kwd}%`;
  }

  if (args.pagesize !== undefined && !isNaN(args.pagesize)) {
    pagesize = parseInt(args.pagesize);
    if (pagesize <= 0 || pagesize > 50) {
      pagesize = 12;
    }
  }

  if (args.offset !== undefined && !isNaN(args.offset)) {
    offset = parseInt(args.offset);
    if (offset < 0) {offset = 0;}
  }

  let gid = null;
  if (args.gid !== undefined && !isNaN(args.gid)) {
    gid = args.gid;
  }

  let isdel = null;
  if (args.isdel !== undefined) {
    isdel = args.isdel ? 1 : 0;
  }

  let condsql = '';
  let limitsql = ` LIMIT ${pagesize} OFFSET ${offset}`;
  if (kwd !== null) {
    condsql += ` (title ILIKE '${kwd}' OR keywords ILIKE '${kwd}') `;
  }
  if (gid !== null) {
    if (kwd !== null) {
      condsql += ` AND `;
    }
    condsql += ` gid LIKE '%${gid}%' `;
  }

  if (isdel !== null) {
    if (kwd || gid) {
      condsql += ' AND ';
    }
    condsql += ` is_delete=${isdel}`;
  }

  if (uid !== null) {
    if (condsql.length > 0) {
      condsql += ' AND ';
    }
    condsql += ` adminname=${uid}`;
  }

  if (condsql.length > 0) {
    condsql = ` WHERE ${condsql} `;
  }

  return {
    limit : limitsql,
    cond : condsql
  };
};

docs.prototype.count = async function (args = {}) {
  let r = this.parseCond
};

docs.prototype.doclist = async function (args = {}) {
  
  let r = this.parseCond(args);

  let sql = 'SELECT id,title,keywords,addtime,updatetime,doctype,ctype FROM docs ';

  sql += r.cond + ' AND is_public=1 AND is_hidden=1 ' 
      + ' ORDER BY updatetime DESC ' + r.limit;

  let ret = await this.db.query(sql);

  return ret.rows;
};

docs.prototype.adoclist = async function (args = {}) {
  let r = this.parseCond(args);
  let sql = 'SELECT * FROM docs ';
  sql += r.cond + ' ORDER BY updatetime DESC ' + r.limit;

  let ret = await this.db.query(sql);
  return ret.rows;
};


docs.prototype.get = async function (id) {
  let sql = 'SELECT id,content,tags,keywords,updatetime,doctype,ctype FROM docs WHERE id=$1 AND is_public=1 AND is_hidden=1';

  let ret = await this.db.query(sql, [
    id
  ]);

  if (ret.rowCount > 0) {
    return ret.rows[0];
  }
  return null;
};

docs.prototype.aget = async function (id, uid=null) {
  let sql = 'SELECT * FROM docs WHERE id=$1';

  let a = [id];

  if (uid !== null) {
    sql += ' AND adminname=$2';
    a.push(uid);
  }

  let ret = await this.db.query(sql, a);

  if (ret.rowCount > 0) {
    return ret.rows[0];
  }
  return null;
};

docs.prototype.post = async function (data) {
  let nd = {
    title : '',
    content : '',
    keywords : '',
    adminid : '',
    adminname : '',
    doctype : 'rich-text',
    ctype : 'news',
    is_public : 0,
    gid : 0,
  };

  for (let k in nd) {
    if (data[k] !== undefined) {
      nd[k] = data[k];
    }
  }

  nd.id = this.genid();
  nd.addtime = nd.updatetime = funcs.formatTime(null, 'middle');

  let sql = 'INSERT INTO docs (id, title, content, keywords, doctype, adminname, ctype, is_public, addtime, updatetime, gid) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11)';

  let args = [
    nd.id, nd.title, nd.content, nd.keywords, nd.doctype, nd.adminname, 
    nd.ctype, nd.is_public, nd.addtime, nd.updatetime, nd.gid
  ];

  let ret = await this.db.query(sql, args);
  if (ret.rowCount <= 0) {
    return false;
  }
  return nd.id;
};

docs.prototype.remove = async function (id, uid = null, soft = true) {
  let sql = 'DELETE FROM docs WHERE id=$1';
  
  if (soft) {
    sql = 'UPDATE docs set is_delete=1 WHERE id=$1';
  }

  let a = [id];
  if (uid) {
    a.push(uid);
    sql += ' AND adminname=$2';
  }
  let ret = await this.db.query(sql, a);
  if (ret.rowCount <= 0) {
    return false;
  }
  return true;
};

docs.prototype.removeAll = async function (idlist, uid=null, soft = true) {
  let sql = 'DELETE FROM docs WHERE id IN ';
  if (soft) {
    sql = 'UPDATE docs SET is_delete=1 WHERE id IN ';
  }

  let idsql = '(';
  for (let i=0; i < idlist.length; i++) {
    idsql += `'${idlist[i]}',`;
  }
  idsql = idsql.substring(0, idsql.length-1) + ')';
  sql += idsql;

  if (uid) {
    sql += ' AND adminname=' + uid;
  }

  let ret = await this.db.query(sql);
  return ret.rowCount;
};

docs.prototype.update = async function (data, uid = null) {
  let sql = 'UPDATE docs SET title=$1,content=$2,keywords=$3,is_public=$4,updatetime=$5,gid=$6 WHERE id=$7';
  let a = [
    data.title, data.content, data.keywords,data.is_public, 
    funcs.formatTime(null, 'middle'), data.id, data.gid
  ];
  if (uid !== null) {
    a.push(uid);
    sql += ' AND adminname=$8';
  }

  let ret = await this.db.query(sql, args);
  if (ret.rowCount <= 0) {
    return false;
  }
  return true;
};

docs.prototype.setPublic = async function (idlist, stat = 1, uid = null) {
  let sql = 'UPDATE docs set is_public=$1 WHERE id IN ';
  let idsql = '(';
  for (let i=0; i<idlist.length; i++) {
    idsql += `'${idlist[i]}',`;
  }
  idsql = idsql.substring(0, idsql.length-1) + ')';
  sql += idsql;
  let a = [stat];
  if (uid) {
    sql += ' AND adminname=$2';
    a.push(uid);
  }
  let ret = await this.db.query(sql, a);
  return ret.rowCount;
};

module.exports = docs;
