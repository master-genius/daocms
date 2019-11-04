var _pagesize = 12;
var _total = 0;
var _curpage = 1;

async function getDoc (id) {
  _dm.loading();
  return userApiCall('/content/'+id).then(d => {
    if (d.status === 'OK') {
      return d.data;
    } else {
      sysnotify('获取文档失败', 'err');
      return false;
    }
  }).catch (err => {
    sysnotify(err.message, 'err');
    return false;
  }).finally(() => {
    _dm.unloading(); 
  });
}

async function neDoc (id = null) {
  if (id === null) {
    wo.set('edit-id', 'null');
    wo.set('edit-status', 'on');
    showEditDoc();
    loadCache();
  } else {
    try {
      let d = await getDoc(id);
      if (d === false) {
        return ;
      }
      wo.set('edit-id', id);
      wo.set('edit-status', 'on');
      showEditDoc(d);
    } catch (err){
      return ;
    }
  }
}

function showEditDoc(nd = null) {
  let d = {
    title : '',
    content : '',
    keywords : '',
    ctype : '',
    doctype : '',
    is_public : '',
    addtime : '',
    updatetime : '',
    gid : '',
  };
  if (nd !== null) {
    d = nd;
  }
  var dochtml = `
  <div class="grid-x">
    <div class="cell small-12 medium-8 large-6" style="text-align:center;">
      <a href="javascript:offEdit();"><h1>X</h1></a>
    </div>
  </div>

  <div class="grid-x" style="padding: 0.8rem;">
    
    <div class="cell medium-1 large-1 hide-for-small-only"></div>
    <div class="cell small-12 medium-8 large-7">
      <form onsubmit="return false;">
        <input type="text" id="doc-title" value="${d.title}">
        <div id="content-editor" style="padding-left:0.2rem;padding-right:0.2rem;">
          <div id="editor-zone">
            <div id="editor-menu" class="editor-menu" style="margin-bottom: 0.5rem;border-left:solid 0.06rem #696969;background:#efedf5;"></div>

            <div id="editor-block" class="editor-block" style="height:30rem;width:100%;border-left:solid 0.06rem #696969;border-bottom:dashed 0.06rem #696969;" spellcheck="false" onkeydown="return mdKeyDown(this, event);" onkeyup="return mdKeyUp(this, event);"></div>
          </div>
        </div>
      </form>
    </div>
    <div class="cell medium-3 large-4 hide-for-small-only"></div>
  </div>`;
  syscover(dochtml);
  initEditor(d.content);
}

function offEdit() {
  unsyscover();
  wo.set('edit-status', 'off');
}

var _editor = null;
function initEditor (html = '') {
  if (_editor === null) {
    var E = window.wangEditor;
    _editor = new E('#editor-menu', '#editor-block');
  }
  
  _editor.customConfig.uploadImgMaxLength = 1;
  _editor.customConfig.zIndex = 0;
  _editor.customConfig.onchangeTimeout  = 1500;

  _editor.customConfig.onchange= function(html) {
    saveContent();
  }

  _editor.customConfig.customUploadImg = function (files, insert) {

    for (var i=0; i< files.length; i++) {
      let postdata = new FormData();
      postdata.append('image', files[i]);

      userApiCall('/image/', {
        method : 'POST',
        body : postdata
      })
      .then(d => {
        if (d.status === 'OK') {
          insert(`/image/${d.data.path}/${d.data.name}`);
        } else {
          sysnotify(d.errmsg, 'err');
        }
      })
      .catch (err => {
        console.log(err);
      });
    }
  }

  _editor.customConfig.menus = [
      'head',  // 标题
      'bold',  // 粗体
      'fontSize',  // 字号
      'fontName',  // 字体
      'italic',  // 斜体
      'underline',  // 下划线
      'strikeThrough',  // 删除线
      'foreColor',  // 文字颜色
      'backColor',  // 背景颜色
      'link',  // 插入链接
      'list',  // 列表
      'justify',  // 对齐方式
      'quote',  // 引用
      'image',  // 插入图片
      'table',  // 表格
      'code',  // 插入代码
      'undo',  // 撤销
      'redo'  // 重复
  ];
  _editor.create();
  if (html.length > 0) {
    _editor.txt.html(html);
  }
}

function loadCache () {

}

function saveContent () {

}

window.onload = function () {
  if (wo.get('edit-status') === 'on') {
    let id = wo.get('edit-id');
    neDoc(id === 'null' ? null : id);
  }
};
