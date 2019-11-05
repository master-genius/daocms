const titbit = require('titbit');
const cluster = require('cluster');
const tbload = require('titbit-loader');
const pg = require('pg');
const cfg = require('./config');
const dbcfg = require('./dbconfig');
const docs = require('./model/docs');
const admin = require('./model/admin');
const usertoken = require('./user');
const api = require('./api');
const crypto = require('crypto');
const page = require('./apage');
const fs = require('fs');
const cms = require('./cms');
const funcs = require('./functions');

var app = new titbit ({
  debug : true,
  bodyMaxSize: 4000000,
  useLimit: true,
  maxConn : 1024,
  maxIPRequest: 500,
  showLoadInfo: false,
});

if (cluster.isWorker) {
  var _pgdb = new pg.Pool(dbcfg);
  app.service.pool = _pgdb;

  app.service.admin = new admin(_pgdb);

  app.service.docs = new docs(_pgdb);
  app.service.api = new api();
  app.service.adminkey = cfg.adminkey;
  app.service.user = usertoken;

  //用于管理员账户的记录功能，至于其中如何记录数据则交给具体请求，
  //此处仅仅是提供了一个请求内全局可用的对象。
  app.service.alog = {
    failed : {},
  };

  app.service.imagepath = __dirname + '/../images';
  app.service.funcs = funcs;

  app.service.siteimgpath = __dirname + '/images';
}

if (cluster.isWorker) {
  let tb = new tbload();
  tb.init(app);

  let siteinfo = {
    sitename : '',
    footer : '',
    title : '',
    theme : 'default'
  };

  try {
    siteinfo.title = fs.readFileSync('./siteinfo/title', {encoding:'utf8'});
    siteinfo.theme = fs.readFileSync('./siteinfo/theme', {encoding:'utf8'});
    siteinfo.sitename = fs.readFileSync('./siteinfo/sitename', {encoding:'utf8'});
  } catch (err) {
    console.log(err.message);
  }

  let gjs = '';
  let gcss = '';
  try {
    gjs = fs.readFileSync('./adminpages/global.js', {encoding:'utf8'});
    gcss = fs.readFileSync('./adminpages/global.css', {encoding:'utf8'});
  } catch(err){}

  let adminpage = new page({
    title : siteinfo.title,
    sitename : siteinfo.sitename,
    topinfo: cms.topinfo,
    footer : cms.footer,
    menu : cms.menu,
    globaljs : gjs,
    globalcss : gcss,
    initjs : `var _apidomain='${cfg.apidomain}:${cfg.port}';var _adminapi='${cfg.adminapi}';\n`,
  });

  app.service.adminpage = adminpage;
  app.service.siteinfo = siteinfo;

  adminpage.initpage('./adminpages', 'home');
  adminpage.initpage('./adminpages', 'login');
  adminpage.initpage('./adminpages', 'admin');
  adminpage.initpage('./adminpages', 'site');
  adminpage.initpage('./adminpages', 'docs');
  adminpage.page40x();

  app.get('/adminpage/:name', async c => {
    try {
      c.res.body = adminpage.find(c.param.name);
      if (c.res.body === null) {
        c.res.body = adminpage.find('404');
        c.status(404);
      }
    } catch (err) {
      c.status (404);
    }
  }, '@page-static');

  var faviconCache = null;
  app.router.get('/favicon.ico', async c => {
    try {
        c.setHeader('content-type', 'image/x-icon');
        c.res.encoding = 'binary';
        if (faviconCache) {
            c.res.body = faviconCache.data;
            c.setHeader('content-length', faviconCache.length);
        }
        c.res.body = await funcs.readFile('./favicon.ico', 'binary');
        faviconCache = {
            data : c.res.body,
            length: c.res.body.length
        };
    } catch (err) {
        console.log(err);
        c.res.body = '';
    }
  });

  var _staticCache = {};
  var loadStatic = async function (stname) {
      if (_staticCache[stname]) {
          return _staticCache[stname];
      }
      let stdata = await funcs.readFile('./static/'+stname);
      _staticCache[stname] = stdata;
      return _staticCache[stname];
  }

  app.router.get('/static/*', async c => {
    if (c.param.starPath.indexOf('.css') > 0) {
        c.setHeader('content-type', 'text/css; charset=utf-8');
    } else if (c.param.starPath.indexOf('.js') > 0) {
        c.setHeader('content-type', 'text/javascript; charset=utf-8');
    }
    try {
        c.res.body = await loadStatic(c.param.starPath);
        c.setHeader('cache-control', 'public,max-age=86400');
    } catch (err) {
        c.status(404);
    }
  }, '@page-static');

}

if (cluster.isWorker) {
  var _apikey = {
    token       : '',
    key         : '',
    createTime  : 0,
  };

  var makeApiKey = function () {
    let h = crypto.createHash('md5');
    _apikey.key = `dj_${parseInt(Math.random()*100000)}`;
    h.update(_apikey.key+'linuslinux');
    _apikey.token = h.digest('hex');
    _apikey.createTime = Date.now();
  };

  makeApiKey();
  setInterval(() => {
    makeApiKey();
  }, 3600000);

  app.router.get('/page-apikey', async c => {
    c.res.body = _apikey;
  });
}

if (process.argv.indexOf('-d') > 0) {
  app.config.daemon = true;
  app.config.showLoadInfo = true;
}

app.daemon(cfg.port, cfg.host);
