var _dlist = [];

function getDoc(id) {

}

function fmtDoc(d) {
  return `<div></div>`;
}

function docList () {
  apiCall('/api/content').then(d => {
    console.log(d);
  }).catch(err => {

  });
}

window.onload = function() {
  //_pagi.pageTemp('#pagination');
  docList()
}