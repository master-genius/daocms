const titbit = require('titbit');
const cluster = require('cluster');
const tbload = require('titbit-loader');
const pg = require('pg');
const cfg = require('./config');
const dbcfg = require('./dbconfig');
const docs = require('./model/docs');
const admin = require('./model/admin');
const siteinfo = require('./model/siteinfo');
const usertoken = require('./lib/user');
const api = require('./api');
//const crypto = require('crypto');
const page = require('./apage');
const fs = require('fs');
const cms = require('./cms');
const funcs = require('./functions');
const theme = require('./theme');

var app = new titbit ({
  debug : true,
  bodyMaxSize: 4000000,
  useLimit: true,
  maxConn : 1024,
  maxIPRequest: 500,
  //showLoadInfo: false,
  loadInfoFile : '/tmp/loadinfo.log'
});

if (cluster.isWorker) {
  var _pgdb = new pg.Pool(dbcfg);
  app.service.pool = _pgdb;

  app.service.admin = new admin(_pgdb);

  app.service.docs = new docs(_pgdb);
  app.service.api = new api();
  app.service.adminkey = cfg.adminkey;
  app.service.user = usertoken;

  app.service.imagepath = __dirname + '/../images';
  app.service.funcs = funcs;

  app.service.siteimgpath = __dirname + '/images';
  app.service.alog = {};
  app.service.cors = cfg.cors;
  app.service.usePassCallback = false;
  app.service.permsource = '';
  if (cfg.usePassCallback && typeof cfg.passCallback === 'function') {
    app.service.usePassCallback = cfg.usePassCallback;
    app.service.passCallback = cfg.passCallback;
    app.service.permsource = cfg.permsource;
  }
}

var _themeStaticCache = {};

if (cluster.isWorker) {
  let tb = new tbload();
  tb.init(app);

  app.service.siteinfo = new siteinfo({
    path : __dirname + '/siteinfo',
    watchFile : __dirname + '/watcher/reload-siteinfo',
    watchTheme :  __dirname + '/watcher/change-theme',
    themedir : __dirname + '/themes'
  });
  app.service.siteinfo.init();
  var adminpage = new page({
    path : __dirname + '/adminpages',
    title : app.service.siteinfo.info.title,
    sitename : app.service.siteinfo.info.sitename,
    topinfo: app.service.siteinfo.info.sitename+'管理后台',
    footer : cms.footer,
    menu : cms.menu,
    initjs : `var _apidomain='${cfg.apidomain}:${cfg.port}';`
              +`var _adminapi='${cfg.adminapi}';\n`,
  });

  var admpagelist = ['home','login','admin','site','docs', 'image'];
  app.service.adminpage = adminpage;
  adminpage.init(admpagelist);
  adminpage.page40x();

  app.service.theme = new theme({
    path : __dirname + '/themes',
    name : app.service.siteinfo.info.theme,
    siteinfo : app.service.siteinfo.info,
  });

  try {
    app.service.theme.load();
  } catch (err) {
    console.log(err);
  }

  fs.watch('./watcher', (evt, name) => {
    if (name === 'reload-siteinfo') {
      app.service.siteinfo.reload();
      adminpage.setinfo({
        title : app.service.siteinfo.info.title,
        sitename : app.service.siteinfo.info.sitename,
        topinfo: app.service.siteinfo.info.sitename+'管理后台',
      });
      adminpage.init(admpagelist);
      adminpage.page40x();
      //console.log(app.service.siteinfo.info);
      setTimeout(() => {
        app.service.theme.reload(app.service.siteinfo.info);
      }, 1000);
    } else if (name === 'change-theme') {
      _themeStaticCache = {};
      app.service.theme.setTheme(app.service.siteinfo.info.theme);
    }
  });

}

if (cluster.isWorker) {
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
  }, '@admin-page');

  app.get('/', async c => {
    c.res.body = c.service.theme.find('home');
  }, '@page-static');

  var faviconCache = null;
  app.router.get('/favicon.ico', async c => {
    try {
      c.setHeader('content-type', 'image/x-icon');
      c.res.encoding = 'binary';
      if (faviconCache && (faviconCache.time + 300000) > Date.now()) {
        c.res.body = faviconCache.data;
        c.setHeader('content-length', faviconCache.length);
      } else {
        c.res.body = await funcs.readFile('./favicon.ico', 'binary');
        faviconCache = {
          data : c.res.body,
          length: c.res.body.length,
          time: Date.now()
        };
      }
    } catch (err) {
      //console.log(err);
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

  app.router.get('/theme/*', async c => {
    if (c.param.starPath.indexOf('.css') > 0) {
        c.setHeader('content-type', 'text/css; charset=utf-8');
    } else if (c.param.starPath.indexOf('.js') > 0) {
        c.setHeader('content-type', 'text/javascript; charset=utf-8');
    }
    if (_themeStaticCache[c.param.starPath] !== undefined) {
      c.setHeader('cache-control', 'public,max-age=86400');
      c.res.body = _themeStaticCache[c.param.starPath];
      return ;
    }
    try {
      c.setHeader('cache-control', 'public,max-age=86400');
      c.res.body = await funcs.readFile(
          `./themes/${c.service.siteinfo.info.theme}/${c.param.starPath}`);
      _themeStaticCache[c.param.starPath] = c.res.body;
    } catch (err) {
        c.status(404);
    }
  }, '@page-static');

  //如果你要去掉page，也是可以的，但是要保证此路由放在最后，也就是当前位置，
  //在此之前已经把所有的路由都加载完毕，否则如果是/:name则会影响其他路由的查找。
  app.get('/page/:name', async c => {
    try {
      c.res.body = c.service.theme.find(c.param.name);
      c.setHeader('cache-control', 'public,max-age=86400');
      if (c.res.body === null) {
        c.res.body = c.service.theme.find('404');
        c.status(404);
      }
    } catch (err) {
      c.status (404);
    }
  }, '@page-static');
}

if (cluster.isWorker) {
  //启用IP白名单中间件
  if (cfg.allowList.length > 0) {
    app.service.allowList = cfg.allowList;
    let alip = require('./middleware/allowlist');
    app.use(alip, {
      group : '/admin'
    });
    app.use(alip, {
      group: 'admin-page'
    });
  }
}

if (process.argv.indexOf('-d') > 0) {
  app.config.daemon = true;
  app.config.showLoadInfo = true;
}

app.daemon(cfg.port, cfg.host);
