(function() {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }

  function fn() {
    document.getElementById('main').append(generateLoader('Loading configuration'));
    document.getElementById('disconnect').querySelector('input[type=submit]').addEventListener('click', handleDisconnect);
    document.getElementById('connect').querySelector('input[type=submit]').addEventListener('click', handleConnect);
    getStatus();
  }

  function getStatus() {
    let espStatusXhr = new  XMLHttpRequest();
    espStatusXhr.open('GET', '/esp', true);

    espStatusXhr.onload = () => {
      let status = JSON.parse(espStatusXhr.responseText).data;
      let statusHtml = '';

      Object.keys(status.attributes).forEach(
        key => {
          statusHtml += '<tr><th>' + key + '</th>';
          statusHtml += '<td>' + status.attributes[key] + '</td></tr>';
        }
      );

      document.getElementById('status').innerHTML = statusHtml;
      document.getElementById('loader').remove();

      if(status.attributes.sta_ip === null) {
        document.getElementById('main').insertBefore(generateLoader('Scaning for networks'), document.getElementById('main').firstChild);
        getWiFis();
      } else {
        document.getElementById('disconnect').className = '';
      }
    };

    espStatusXhr.send();
  }

  function getWiFis() {
    let wifiScanXhr = new XMLHttpRequest();
    wifiScanXhr.open('GET', '/wifi', true);

    wifiScanXhr.onload = () => {
        if (wifiScanXhr.status === 200) {
            let wifis = JSON.parse(wifiScanXhr.responseText).data;

            wifis.filter(
              (wifi, i, wifis) => !wifis.some(
                  w => w.attributes.ssid === wifi.attributes.ssid && w.attributes.rssi > wifi.attributes.rssi
              )
            ).sort(
              (a, b) => {
                if(a.attributes.rssi > b.attributes.rssi) {
                  return -1;
                } else if (a.attributes.rssi < b.attributes.rssi) {
                  return 1;
                } else {
                  return 0;
                }
              }
            ).forEach(
                (wifi) => {
                  document.getElementById('wifis').append(
                    generateWiFiWidget(wifi.attributes.ssid, wifi.attributes.rssi, wifi.attributes.encryption)
                  );
                }
            );

            if(wifis.length === 0) {
              document.getElementById('connect').querySelector('h4').innerHTML = 'No networks found'
            }

            document.getElementById('connect').className = '';
            document.getElementById('loader').remove();
        }
    };

    wifiScanXhr.send();
  }

  function handleDisconnect(e) {
    e.preventDefault();
    let disconnectXhr = new  XMLHttpRequest();
    disconnectXhr.open('delete', '/wifi', true);
    disconnectXhr.onload = () => {
      location.reload();
    }
    disconnectXhr.send();
  }

  function handleConnect(e) {
    e.preventDefault();
    let ssid = e.target.parentNode.querySelectorAll('input')[0].value;
    let pass = e.target.parentNode.querySelectorAll('input')[1].value;
    let postParams = 'ssid='+ssid;
    let connectXhr = new  XMLHttpRequest();
    connectXhr.open('post', '/wifi', true);
    connectXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    connectXhr.onload = () => {
      location.reload();
      document.getElementById('loader').remove();
    }

    connectXhr.onerror = () => {
      document.getElementById('connect').querySelector('h4').innerHTML = 'Failed to connect'
      document.getElementById('connect').className = '';
      document.getElementById('loader').remove();
    };

    if(pass.length > 8) {
      postParams += '&pass=' + pass;
    }
    connectXhr.send(postParams);

    document.getElementById('main').insertBefore(generateLoader('Connecting to network'), document.getElementById('main').firstChild);
    document.getElementById('connect').className = 'hide';
    window.scrollTo(0,0);
  }

  function generateLoader(message) {
    let loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = '<div class="spinner">\
        <div class="bounce1"></div>\
        <div class="bounce2"></div>\
        <div class="bounce3"></div>\
      </div>\
      <span><em>' + message + '</em></span>';

    return loader;
  }

  function generateWiFiWidget(ssid, rssi, encryption) {
    let widget = document.createElement('div'),
      signalStrength = getSignalStrength(rssi);

    widget.setAttribute('data-ssid', ssid);
    widget.className = 'wifi';

    if(signalStrength > 80) {
      widget.className += ' good-signal';
    } else if(signalStrength > 60) {
      widget.className += ' average-signal';
    } else {
      widget.className += ' bad-signal';
    }

    widget.innerHTML = '<div class="wifi-content ' + (encryption === null ? 'unlocked' : 'locked') + '">\
      <div class="text">\
        <div class="text-header">' + ssid + '</div>\
        <div class="text-label">' + signalStrength + '% strength\
         | ' + (encryption === null ? 'Open' : encryption.toLocaleUpperCase()) + '</div>\
      </div>\
    </div>';

    widget.addEventListener('click', handleWidgetClick);

    return widget;
  }

  function handleWidgetClick(e) {
    document.getElementById('ssid').scrollIntoView();
    document.getElementById('ssid').value = e.currentTarget.querySelector('[class="text-header"]').innerText;
  }

  function getSignalStrength(rssi) {
    return Math.min(100, 2*(rssi+100));
  }
})();
