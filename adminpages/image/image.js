var _pagesize = 6;
var _imageList = [];
var _total_page = 1;

function totalPage (t, p) {
  return (t % p == 0) ? (t/p) : (parseInt(t/p)+1);
}

function renderImageList () {
  let d = document.getElementById('image-list');
  if (!d) {return ;}
  let page = parseInt(wo.get('img-page'));
  if (page > _total_page) {
    page = 1;
    wo.set('img-page', page);
    _pagi.setpi(page, _total_page);
  }
  
  let offset = (page-1)*_pagesize;

  _dm.renderList(d, _imageList.slice(offset, offset+_pagesize), (m) => {
    return `<div class="cell small-12 medium-6 large-4" style="padding:0.5rem;">
      <img src="${location.protocol}//${location.host}/image/${m}">
      <pre style="overflow-x:auto;">${location.protocol}//${location.host}/image/${m}</pre>
      <input type="checkbox" value="${m}" class="image-check-list">
    </div>`;
  });
  document.body.scrollTop = 0;
}

async function getImages() {
  return userApiCall('/image').then(d => {
    _imageList = d;
    _total_page = totalPage(_imageList.length, _pagesize);
    _pagi.setpi(wo.get('img-page'), _total_page);
    renderImageList();
  })
  .catch(err => {
    sysnotify(err.message, 'err');
  });
}

if (wo.get('img-init') === null) {
  wo.set('img-init', '1');
  wo.set('img-page', '1');
  wo.set('total-page', '1');
}

function selectAllImages(t) {
  let stat = t.checked;
  let nds = document.querySelectorAll('.image-check-list');
  for(let i=0;i<nds.length;i++) {
    nds[i].checked = stat;
  }
}

function deleteSelectImages() {
  let nds = _dm.getSelect('.image-check-list', false, 'value');
  if (nds.length <= 0) {
    return ;
  }
  if (!confirm('确认删除？')) {
    return ;
  }
  syscover(`<div style="text-align:center;padding:0.8rem;margin-top:3rem;">
    <h4>delete ···</h4>
  </div>`);
  return userApiCall('/image', {
    method : 'DELETE',
    headers : {
      'content-type' : 'text/plain'
    },
    body : JSON.stringify(nds)
  })
  .then(d => {
    if (d.status === 'OK') {
      sysnotify('OK');
    } else {
      sysnotify(d.errmsg, 'err');
    }
    getImages();
  })
  .catch(err => {
    sysnotify(err.message, 'err');
  })
  .finally(() => {
    setTimeout(() => {
      unsyscover();
    }, 800);
  });
}

function getdelLog(logid) {
  return userApiCall('/image/'+logid, {
    method : 'PUT',
    mode : 'cors',
    headers : {
      'content-type' : 'text/plain'
    },
    body : logid
  }).then(d => {
    if (d.status === 'OK') {
      sysnotify('删除完成');
      getImages();
    }
  })
  .catch (err => {

  });
}

window.onload = function () {
  _pagi.pageTemp('#pagination');
  _pagi.pageEvent((p) => {
    wo.set('img-page', p);
    renderImageList();
  });
  getImages();
};