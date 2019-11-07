var roleMap = {
  'root' : '超级管理员',
  'super' : '管理员',
  'editor' : '编辑'
};

var _info = {
  cpu : {
    '1m' : '',
    '5m' : '',
    '15m' : ''
  },
  pids : [],
  masterpid : ''
};

window.onload = function () {
  let u = getUser();
  document.getElementById('user-role').innerHTML = '用户角色：' + roleMap[u.role];
  document.getElementById('siteurl').innerHTML = 
    `<a href="${location.protocol}//${location.host}" target="_blank">进入网站</a>`;
  if (document.getElementById('loadinfo')) {
    document.getElementById('loadinfo').innerHTML = fmtLoadInfo(_info);
  }
  getLoadInfo();
};

function getLoadInfo() {
  var failedCount = 0;
  var interval = setInterval(() => {
    userApiCall('/loadinfo', {dataType:'text'}).then(d => {
      //ld.innerHTML = d.replace(/\n/ig, '<br>');
      showLoadInfo(d);
    })
    .catch(err => {
      failedCount += 1;
      if (failedCount > 100) {
        clearInterval(interval);
      }
    });
  }, 2400);
}

function showLoadInfo (di) {
  let ld = document.getElementById('loadinfo');
  if (!ld) {
    return ;
  }
  ld.innerHTML = fmtLoadInfo(parseLoadInfo(di));
}

function parseLoadInfo(di) {
  _info = {
    cpu : {
      '1m' : '',
      '5m' : '',
      '15m' : ''
    },
    pids : [],
    masterpid : ''
  };
  let arr = di.split('\n').filter(p => p.length > 0);
  let tmp = '';
  let buf ='';
  for (let i=0; i<arr.length; i++) {
    tmp = arr[i].trim();
    if (tmp.indexOf('PID') == 0) {
      continue;
    } else if (tmp.indexOf('CPU') == 0) {
      buf = tmp.split('m: ').filter(p => p.length > 0).slice(1);
      _info.cpu['1m'] = buf[0].split(' ')[0];
      _info.cpu['5m'] = buf[1].split(' ')[0];
      _info.cpu['15m'] = buf[2].split(' ')[0];
      continue;
    } else if (tmp.indexOf('Master') == 0) {
      _info.masterpid = tmp.split(':')[1].trim();
    } else if (tmp.indexOf('Listen') == 0) {
      continue;
    } else {
      buf = tmp.split(' ').filter(p => p.length > 0);
      _info.pids.push({
        pid : buf[0],
        cpu : buf[1],
        mem : buf[2].substring(0, buf[2].length-1),
        heap : buf[3],
        conn : buf[4]
      });
    }
  }
  return _info;
}

function fmtCPU(c) {
  let w = parseFloat(c.cpu);
  let color = ['#4cb8ac', '#d56922', '#d5222a'];
  let ind = 0;
  if (w > 45 && w < 60) {
    ind = 1;
  } else if (w >= 60) {
    ind = 2;
  }
  let spaces = '';
  spaces = '&nbsp;'.repeat(w+1);
  return `<div style="padding:0.2rem;margin-bottom:0.2rem;background-color:#eaeaef;border-radius:0.1rem;">
    <div>PID: ${c.pid}&nbsp;&nbsp;内存占用：${c.mem}M&nbsp;&nbsp;连接数：${c.conn}</div>
    <div style="margin-bottom:0.4rem;line-height:1.8rem;">
      <span>CPU: ${c.cpu}</span>
      <span style="width:${w}%;background-color:${color[ind]};">${spaces}</span>
    </div>
  </div>`;
}

function fmtLoadInfo (info) {
  let pidhtml = '';
  for (let i=0; i < info.pids.length; i++) {
    pidhtml += fmtCPU(info.pids[i]);
  }
  let html = `<div class="cell small-12 medium-5 large-5" style="padding:0.2rem;">
    <h4>系统整体情况</h4>
    <p>1分钟平均进程数：${info.cpu['1m']}</p>
    <p>5分钟平均进程数：${info.cpu['5m']}</p>
    <p>15分钟平均进程数：${info.cpu['15m']}</p>
    <p style="line-height:2.4rem;background-color:#dad5df;">master进程PID：${info.masterpid}</p>
    <p class="help-text" style="font-size:86%;">
      如果要终止服务，可以连接服务器通过终端终止PID为${info.masterpid}的进程。 
    </p>
  </div>
  <div class="cell small-12 medium-7 large-7">
    <h4>进程负载信息</h4>
    ${pidhtml}
  </div>`;

  return html;
}