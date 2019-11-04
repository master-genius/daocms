class image {
  constructor () {
    this.typemap = {
      'j_'  : 'image/jpeg',
      'p_'  : 'image/png',
      'g_'  : 'image/gif',
    };

    this.typepre = {
      'image/jpeg'  : 'j_',
      'image/png'   : 'p_',
      'image/gif'   : 'g_'
    };

    this.typeext = {
      'image/jpeg'  : '.jpg',
      'image/png'   : '.png',
      'image/gif'   : '.gif'
    };
  }

  async get (c) {

  }

  async list (c) {

  }

  async create (c) {
    let imgfile = c.getFile('image');
    let imgname = c.service.funcs.sha1(`${imgfile.filename}${Date.now()}`);
    let tpre = this.typepre[ imgfile['content-type'] ];
    
    imgname = `${tpre}${imgname}${this.typeext[ imgfile['content-type'] ]}`;
    let imgdir = `${c.service.imagepath}/${c.service.funcs.formatTime(null,'short')}`;
    try {
      fs.accessSync(imgdir, fs.constants.F_OK);
    } catch (err) {
      fs.mkdirSync(imgdir);
    }

    try {
        let r = await c.moveFile(imgfile, {
          filename: imgname,
          path : imgdir
        });
        c.res.body = c.service.api.ret(0, imgname);
    } catch (err) {
        c.res.body = c.service.api.ret('EUDEF', err.message);
    }
  }

  __mid () {
    return [
      {
        name : 'imagefilter',
        path : ['create']
      }
    ];
  }

}

module.exports = image;
