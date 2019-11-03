function sysnotify (data, status = 'ok', timeout = 4500) {
  let d = document.getElementById('sys-notify');
  if (!d) {return ;}
  d.style.cssText = 'z-index:999;position:fixed;width:50%;left:25%;top:0;line-height:1.8rem;padding:0.6rem;text-align:center;';
  if (status == 'ok') {
    d.style.cssText += 'background-color:#f1f2f8;';
  } else {
    d.style.cssText += 'background-color:#e56718;';
  }
  d.innerHTML = data;
  setTimeout(() => {
      d.innerHTML = '';
      d.style.cssText = '';
  }, timeout);
}

function adminLogin() {
  let u = {
    username : document.getElementById('username').value.trim(),
    passwd : document.getElementById('passwd').value.trim()
  };


  fetch('/adminlogin',{
    method : 'POST',
    mode : 'cors',
    headers : {
      'content-type' : 'application/x-www-form-urlencoded'
    },
    body : `username=${encodeURIComponent(u.username)}&passwd=${encodeURIComponent(u.passwd)}`
  }).then(res => {
    return res.json();
  })
  .then(d => {
    if (d.status === 'OK') {
      localStorage.setItem('session', d.data.token);
      localStorage.setItem('sessiontime', `${Date.now()}`);
      localStorage.setItem('userinfo', JSON.stringify(d.data.user));
      location.href = '/adminpage/home';
    } else {
      sysnotify(d.errmsg, 'err');
    }
  })
  .catch(err => {console.log(err);});

}

function checkAdminInfo () {
  try {
    let user = JSON.parse(localStorage.getItem('userinfo'));
    let sesstime = parseInt(localStorage.getItem('sessiontime'));
    if (sesstime + user.expires < Date.now()) {
        return ;
    }
  } catch (err) {
    return ;
  }
  location.href="/adminpage/home";
}

checkAdminInfo();
