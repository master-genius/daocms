class page {

  constructor (options = {}) {
    this.fs = options.fs;
    this.si = options.siteinfo;
    this.funcs = options.funcs;
    this.path = options.path;

    this.pi = {
      globalcss : '',
      initjs : '',
      globaljs : '',
      title : '',
      footer : '',
      topinfo : '',
      sitename : '',
      menu : '',
      js : '',
      header : '',
      css : '',
      main : ''
    };

    this.pageCache = {};
  }

  init () {
    let gjs = '';
    let gcss = '';
    try {
      gjs = this.fs.readFileSync(`${this.path}/global.js`, {encoding:'utf8'});
    } catch(err){}

    try {
      gcss = this.fs.readFileSync(`${this.path}/global.css`, {encoding:'utf8'});
    } catch (err){}
    this.pi.globalcss = gcss;
    this.pi.globaljs = gjs;
    let pages = this.fs.readdirSync(this.path+'/pages');
    this.loadpage(pages);
  }

  reload (si) {
    this.si = si;
    this.init();
  }

  resetpi () {
    this.pi.js = '';
    this.pi.header = '';
    this.css = '';
    this.main = '';
  }

  loadpage(pages) {
    for (let i=0; i<pages.length; i++) {
      this.initpage(this.path+'/pages', pages[i]);
    }
    this.page40x();
  }

  fmtpage (p) {
    var html = `<!DOCTYPE html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,height=device-height">
        <title>${this.si.title}</title>
        <link href="/theme/css/mini-nord.min.css" rel="stylesheet">
        ${p.header}
        <style>
          ${p.globalcss}
          ${p.css}
        </style>
        <script>
        ${p.initjs}
        ${p.globaljs}
        </script>
      </head>
      <body>
        <div class="container">
          <div class="row">
            <div class="col-sm-1 col-md-1 col-lg-2"></div>
            <div class="col-sm-10 col-md-10 col-lg-8">
              <header id="menu">
                <a href="/" class="button">首页</a>
              </header>
            </div>
            <div class="col-sm-1 col-md-1 col-lg-2"></div>
          </div>
        </div>
        
        <div class="container" id="__main__" style="margin-top:0.5rem;">
          <div class="row">
            <div class="col-sm-1 col-md-1 col-lg-2"></div>
            <div class="col-sm-10 col-md-10 col-lg-8">
              ${p.main}
            </div>
            <div class="col-sm-1 col-md-1 col-lg-2"></div>
          </div>
        </div>

        <div class="container">
          ${p.footer}
        </div>
        <div id="sys-notify"></div>
        <div id="sys-cover"></div>
        <div id="sys-loading"></div>
        <script>
          ${p.js}
        </script>
        <script>
          function setMainSize() {
            let d = document.getElementById('__main__');
            if (d) {
              d.style.minHeight = document.documentElement.clientHeight * 0.85 + 'px';
            }
          }
          if (typeof window.onresize === 'function') {
              let _wrz = window.onresize;
              window.onresize = function () {
                  setMainSize();
                  _wrz();
              };
          } else {
            window.onresize = function () {
              setMainSize();
            };
          }
          setMainSize();
        </script>
      </body>
    </html>`;
    return html;
  }

  initpage (pdir, pname) {
    let headerfile = `${pdir}/${pname}/header.html`;
    let htmlfile = `${pdir}/${pname}/${pname}.html`;
    let cssfile = `${pdir}/${pname}/${pname}.css`;
    let jsfile = `${pdir}/${pname}/${pname}.js`;

    this.resetpi();

    try {
      this.fs.accessSync(headerfile, this.fs.constants.F_OK);
      this.pi.header = fs.readFileSync(headerfile, {encoding:'utf8'});
    } catch (err) {}

    try {
      this.fs.accessSync(htmlfile, this.fs.constants.F_OK);
      this.pi.main = this.fs.readFileSync(htmlfile, {encoding:'utf8'});
    } catch (err) {
      console.log(err);
    }

    try {
      this.fs.accessSync(cssfile, this.fs.constants.F_OK);
      this.pi.css = fs.readFileSync(cssfile, {encoding:'utf8'});
    } catch (err) {
      //console.log(err);
    }

    try {
      this.fs.accessSync(jsfile, this.fs.constants.F_OK);
      this.pi.js = this.fs.readFileSync(jsfile, {encoding:'utf8'});
    } catch (err) {
      //console.log(err);
    }
    let pdata = '';
    if (pname === 'login') {
      pdata = this.loginpage(this.pi);
    } else {
      pdata = this.fmtpage(this.pi);
    }
    this.pageCache[ pname ] = pdata.replace(/^\s+/mg,'');
    return pdata;
  }

  page40x () {
    let p = this.pi;
    let html = `<!DOCTYPE html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,height=device-height">
        <title>${p.title}</title>
        <link href="https://cdn.bootcss.com/foundation/6.5.3/css/foundation.min.css" rel="stylesheet">
        ${p.header}
        <style>
          ${p.globalcss}
        </style>
      </head>
      <body>
        <div class="full-container">
          <div class="grid-x">
            <div class="cell small-12" style="padding:0.4rem;line-height:2.2rem;text-align:center;background:#f2f1f9;">
              ${p.sitename}
            </div>
          </div>
        </div>

        <div class="full-container" id="main">
          <div class="grid-x">
            <div class="cell small-1 medium-3 large-4"></div>
            <div class="cell small-10 medium-6 large-4">
              <h3>404 : 没有此页面，请点击回到首页</h3>
              <a href="/">首页</a>
            </div>
            <div class="cell small-1 medium-3 large-4"></div>
          </div>
        </div>

        <div class="full-container">
          ${p.footer}
        </div>
        <div id="sys-notify"></div>
        <script>
          function setMainSize() {
            let d = document.getElementById('main');
            if (d) {
              d.style.minHeight = document.documentElement.clientHeight * 0.85 + 'px';
            }
          }
          if (typeof window.onresize === 'function') {
              let _wrz = window.onresize;
              window.onresize = function () {
                  setMainSize();
                  _wrz();
              };
          } else {
            window.onresize = function () {
              setMainSize();
            };
          }
          setMainSize();
        </script>
      </body>
    </html>`;
    this.pageCache [ '404' ] = html;
  }

  find (pname) {
    if (this.pageCache[pname] !== undefined) {
      return this.pageCache[pname];
    }
    return null;
  }

}

module.exports = page;
