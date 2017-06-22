/*
* MAX UI v.3.6 DEBUG
*/
/*
* sockjs-0.3.min.js
*/
SockJS=function(){var a=document,b=window,c={},d=function(){};d.prototype.addEventListener=function(a,b){this._listeners||(this._listeners={}),a in this._listeners||(this._listeners[a]=[]);var d=this._listeners[a];c.arrIndexOf(d,b)===-1&&d.push(b);return},d.prototype.removeEventListener=function(a,b){if(!(this._listeners&&a in this._listeners))return;var d=this._listeners[a],e=c.arrIndexOf(d,b);if(e!==-1){d.length>1?this._listeners[a]=d.slice(0,e).concat(d.slice(e+1)):delete this._listeners[a];return}return},d.prototype.dispatchEvent=function(a){var b=a.type,c=Array.prototype.slice.call(arguments,0);this["on"+b]&&this["on"+b].apply(this,c);if(this._listeners&&b in this._listeners)for(var d=0;d<this._listeners[b].length;d++)this._listeners[b][d].apply(this,c)};var e=function(a,b){this.type=a;if(typeof b!="undefined")for(var c in b){if(!b.hasOwnProperty(c))continue;this[c]=b[c]}};e.prototype.toString=function(){var a=[];for(var b in this){if(!this.hasOwnProperty(b))continue;var c=this[b];typeof c=="function"&&(c="[function]"),a.push(b+"="+c)}return"SimpleEvent("+a.join(", ")+")"};var f=function(a){var b=this;b._events=a||[],b._listeners={}};f.prototype.emit=function(a){var b=this;b._verifyType(a);if(b._nuked)return;var c=Array.prototype.slice.call(arguments,1);b["on"+a]&&b["on"+a].apply(b,c);if(a in b._listeners)for(var d=0;d<b._listeners[a].length;d++)b._listeners[a][d].apply(b,c)},f.prototype.on=function(a,b){var c=this;c._verifyType(a);if(c._nuked)return;a in c._listeners||(c._listeners[a]=[]),c._listeners[a].push(b)},f.prototype._verifyType=function(a){var b=this;c.arrIndexOf(b._events,a)===-1&&c.log("Event "+JSON.stringify(a)+" not listed "+JSON.stringify(b._events)+" in "+b)},f.prototype.nuke=function(){var a=this;a._nuked=!0;for(var b=0;b<a._events.length;b++)delete a[a._events[b]];a._listeners={}};var g="abcdefghijklmnopqrstuvwxyz0123456789_";c.random_string=function(a,b){b=b||g.length;var c,d=[];for(c=0;c<a;c++)d.push(g.substr(Math.floor(Math.random()*b),1));return d.join("")},c.random_number=function(a){return Math.floor(Math.random()*a)},c.random_number_string=function(a){var b=(""+(a-1)).length,d=Array(b+1).join("0");return(d+c.random_number(a)).slice(-b)},c.getOrigin=function(a){a+="/";var b=a.split("/").slice(0,3);return b.join("/")},c.isSameOriginUrl=function(a,c){return c||(c=b.location.href),a.split("/").slice(0,3).join("/")===c.split("/").slice(0,3).join("/")},c.getParentDomain=function(a){if(/^[0-9.]*$/.test(a))return a;if(/^\[/.test(a))return a;if(!/[.]/.test(a))return a;var b=a.split(".").slice(1);return b.join(".")},c.objectExtend=function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a};var h="_jp";c.polluteGlobalNamespace=function(){h in b||(b[h]={})},c.closeFrame=function(a,b){return"c"+JSON.stringify([a,b])},c.userSetCode=function(a){return a===1e3||a>=3e3&&a<=4999},c.countRTO=function(a){var b;return a>100?b=3*a:b=a+200,b},c.log=function(){b.console&&console.log&&console.log.apply&&console.log.apply(console,arguments)},c.bind=function(a,b){return a.bind?a.bind(b):function(){return a.apply(b,arguments)}},c.flatUrl=function(a){return a.indexOf("?")===-1&&a.indexOf("#")===-1},c.amendUrl=function(b){var d=a.location;if(!b)throw new Error("Wrong url for SockJS");if(!c.flatUrl(b))throw new Error("Only basic urls are supported in SockJS");return b.indexOf("//")===0&&(b=d.protocol+b),b.indexOf("/")===0&&(b=d.protocol+"//"+d.host+b),b=b.replace(/[/]+$/,""),b},c.arrIndexOf=function(a,b){for(var c=0;c<a.length;c++)if(a[c]===b)return c;return-1},c.arrSkip=function(a,b){var d=c.arrIndexOf(a,b);if(d===-1)return a.slice();var e=a.slice(0,d);return e.concat(a.slice(d+1))},c.isArray=Array.isArray||function(a){return{}.toString.call(a).indexOf("Array")>=0},c.delay=function(a,b){return typeof a=="function"&&(b=a,a=0),setTimeout(b,a)};var i=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,j={"\0":"\\u0000","\x01":"\\u0001","\x02":"\\u0002","\x03":"\\u0003","\x04":"\\u0004","\x05":"\\u0005","\x06":"\\u0006","\x07":"\\u0007","\b":"\\b","\t":"\\t","\n":"\\n","\x0b":"\\u000b","\f":"\\f","\r":"\\r","\x0e":"\\u000e","\x0f":"\\u000f","\x10":"\\u0010","\x11":"\\u0011","\x12":"\\u0012","\x13":"\\u0013","\x14":"\\u0014","\x15":"\\u0015","\x16":"\\u0016","\x17":"\\u0017","\x18":"\\u0018","\x19":"\\u0019","\x1a":"\\u001a","\x1b":"\\u001b","\x1c":"\\u001c","\x1d":"\\u001d","\x1e":"\\u001e","\x1f":"\\u001f",'"':'\\"',"\\":"\\\\","\x7f":"\\u007f","\x80":"\\u0080","\x81":"\\u0081","\x82":"\\u0082","\x83":"\\u0083","\x84":"\\u0084","\x85":"\\u0085","\x86":"\\u0086","\x87":"\\u0087","\x88":"\\u0088","\x89":"\\u0089","\x8a":"\\u008a","\x8b":"\\u008b","\x8c":"\\u008c","\x8d":"\\u008d","\x8e":"\\u008e","\x8f":"\\u008f","\x90":"\\u0090","\x91":"\\u0091","\x92":"\\u0092","\x93":"\\u0093","\x94":"\\u0094","\x95":"\\u0095","\x96":"\\u0096","\x97":"\\u0097","\x98":"\\u0098","\x99":"\\u0099","\x9a":"\\u009a","\x9b":"\\u009b","\x9c":"\\u009c","\x9d":"\\u009d","\x9e":"\\u009e","\x9f":"\\u009f","\xad":"\\u00ad","\u0600":"\\u0600","\u0601":"\\u0601","\u0602":"\\u0602","\u0603":"\\u0603","\u0604":"\\u0604","\u070f":"\\u070f","\u17b4":"\\u17b4","\u17b5":"\\u17b5","\u200c":"\\u200c","\u200d":"\\u200d","\u200e":"\\u200e","\u200f":"\\u200f","\u2028":"\\u2028","\u2029":"\\u2029","\u202a":"\\u202a","\u202b":"\\u202b","\u202c":"\\u202c","\u202d":"\\u202d","\u202e":"\\u202e","\u202f":"\\u202f","\u2060":"\\u2060","\u2061":"\\u2061","\u2062":"\\u2062","\u2063":"\\u2063","\u2064":"\\u2064","\u2065":"\\u2065","\u2066":"\\u2066","\u2067":"\\u2067","\u2068":"\\u2068","\u2069":"\\u2069","\u206a":"\\u206a","\u206b":"\\u206b","\u206c":"\\u206c","\u206d":"\\u206d","\u206e":"\\u206e","\u206f":"\\u206f","\ufeff":"\\ufeff","\ufff0":"\\ufff0","\ufff1":"\\ufff1","\ufff2":"\\ufff2","\ufff3":"\\ufff3","\ufff4":"\\ufff4","\ufff5":"\\ufff5","\ufff6":"\\ufff6","\ufff7":"\\ufff7","\ufff8":"\\ufff8","\ufff9":"\\ufff9","\ufffa":"\\ufffa","\ufffb":"\\ufffb","\ufffc":"\\ufffc","\ufffd":"\\ufffd","\ufffe":"\\ufffe","\uffff":"\\uffff"},k=/[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g,l,m=JSON&&JSON.stringify||function(a){return i.lastIndex=0,i.test(a)&&(a=a.replace(i,function(a){return j[a]})),'"'+a+'"'},n=function(a){var b,c={},d=[];for(b=0;b<65536;b++)d.push(String.fromCharCode(b));return a.lastIndex=0,d.join("").replace(a,function(a){return c[a]="\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4),""}),a.lastIndex=0,c};c.quote=function(a){var b=m(a);return k.lastIndex=0,k.test(b)?(l||(l=n(k)),b.replace(k,function(a){return l[a]})):b};var o=["websocket","xdr-streaming","xhr-streaming","iframe-eventsource","iframe-htmlfile","xdr-polling","xhr-polling","iframe-xhr-polling","jsonp-polling"];c.probeProtocols=function(){var a={};for(var b=0;b<o.length;b++){var c=o[b];a[c]=y[c]&&y[c].enabled()}return a},c.detectProtocols=function(a,b,c){var d={},e=[];b||(b=o);for(var f=0;f<b.length;f++){var g=b[f];d[g]=a[g]}var h=function(a){var b=a.shift();d[b]?e.push(b):a.length>0&&h(a)};return c.websocket!==!1&&h(["websocket"]),d["xhr-streaming"]&&!c.null_origin?e.push("xhr-streaming"):d["xdr-streaming"]&&!c.cookie_needed&&!c.null_origin?e.push("xdr-streaming"):h(["iframe-eventsource","iframe-htmlfile"]),d["xhr-polling"]&&!c.null_origin?e.push("xhr-polling"):d["xdr-polling"]&&!c.cookie_needed&&!c.null_origin?e.push("xdr-polling"):h(["iframe-xhr-polling","jsonp-polling"]),e};var p="_sockjs_global";c.createHook=function(){var a="a"+c.random_string(8);if(!(p in b)){var d={};b[p]=function(a){return a in d||(d[a]={id:a,del:function(){delete d[a]}}),d[a]}}return b[p](a)},c.attachMessage=function(a){c.attachEvent("message",a)},c.attachEvent=function(c,d){typeof b.addEventListener!="undefined"?b.addEventListener(c,d,!1):(a.attachEvent("on"+c,d),b.attachEvent("on"+c,d))},c.detachMessage=function(a){c.detachEvent("message",a)},c.detachEvent=function(c,d){typeof b.addEventListener!="undefined"?b.removeEventListener(c,d,!1):(a.detachEvent("on"+c,d),b.detachEvent("on"+c,d))};var q={},r=!1,s=function(){for(var a in q)q[a](),delete q[a]},t=function(){if(r)return;r=!0,s()};c.attachEvent("unload",t),c.unload_add=function(a){var b=c.random_string(8);return q[b]=a,r&&c.delay(s),b},c.unload_del=function(a){a in q&&delete q[a]},c.createIframe=function(b,d){var e=a.createElement("iframe"),f,g,h=function(){clearTimeout(f);try{e.onload=null}catch(a){}e.onerror=null},i=function(){e&&(h(),setTimeout(function(){e&&e.parentNode.removeChild(e),e=null},0),c.unload_del(g))},j=function(a){e&&(i(),d(a))},k=function(a,b){try{e&&e.contentWindow&&e.contentWindow.postMessage(a,b)}catch(c){}};return e.src=b,e.style.display="none",e.style.position="absolute",e.onerror=function(){j("onerror")},e.onload=function(){clearTimeout(f),f=setTimeout(function(){j("onload timeout")},2e3)},a.body.appendChild(e),f=setTimeout(function(){j("timeout")},15e3),g=c.unload_add(i),{post:k,cleanup:i,loaded:h}},c.createHtmlfile=function(a,d){var e=new ActiveXObject("htmlfile"),f,g,i,j=function(){clearTimeout(f)},k=function(){e&&(j(),c.unload_del(g),i.parentNode.removeChild(i),i=e=null,CollectGarbage())},l=function(a){e&&(k(),d(a))},m=function(a,b){try{i&&i.contentWindow&&i.contentWindow.postMessage(a,b)}catch(c){}};e.open(),e.write('<html><script>document.domain="'+document.domain+'";'+"</s"+"cript></html>"),e.close(),e.parentWindow[h]=b[h];var n=e.createElement("div");return e.body.appendChild(n),i=e.createElement("iframe"),n.appendChild(i),i.src=a,f=setTimeout(function(){l("timeout")},15e3),g=c.unload_add(k),{post:m,cleanup:k,loaded:j}};var u=function(){};u.prototype=new f(["chunk","finish"]),u.prototype._start=function(a,d,e,f){var g=this;try{g.xhr=new XMLHttpRequest}catch(h){}if(!g.xhr)try{g.xhr=new b.ActiveXObject("Microsoft.XMLHTTP")}catch(h){}if(b.ActiveXObject||b.XDomainRequest)d+=(d.indexOf("?")===-1?"?":"&")+"t="+ +(new Date);g.unload_ref=c.unload_add(function(){g._cleanup(!0)});try{g.xhr.open(a,d,!0)}catch(i){g.emit("finish",0,""),g._cleanup();return}if(!f||!f.no_credentials)g.xhr.withCredentials="true";if(f&&f.headers)for(var j in f.headers)g.xhr.setRequestHeader(j,f.headers[j]);g.xhr.onreadystatechange=function(){if(g.xhr){var a=g.xhr;switch(a.readyState){case 3:try{var b=a.status,c=a.responseText}catch(a){}b===1223&&(b=204),c&&c.length>0&&g.emit("chunk",b,c);break;case 4:var b=a.status;b===1223&&(b=204),g.emit("finish",b,a.responseText),g._cleanup(!1)}}},g.xhr.send(e)},u.prototype._cleanup=function(a){var b=this;if(!b.xhr)return;c.unload_del(b.unload_ref),b.xhr.onreadystatechange=function(){};if(a)try{b.xhr.abort()}catch(d){}b.unload_ref=b.xhr=null},u.prototype.close=function(){var a=this;a.nuke(),a._cleanup(!0)};var v=c.XHRCorsObject=function(){var a=this,b=arguments;c.delay(function(){a._start.apply(a,b)})};v.prototype=new u;var w=c.XHRLocalObject=function(a,b,d){var e=this;c.delay(function(){e._start(a,b,d,{no_credentials:!0})})};w.prototype=new u;var x=c.XDRObject=function(a,b,d){var e=this;c.delay(function(){e._start(a,b,d)})};x.prototype=new f(["chunk","finish"]),x.prototype._start=function(a,b,d){var e=this,f=new XDomainRequest;b+=(b.indexOf("?")===-1?"?":"&")+"t="+ +(new Date);var g=f.ontimeout=f.onerror=function(){e.emit("finish",0,""),e._cleanup(!1)};f.onprogress=function(){e.emit("chunk",200,f.responseText)},f.onload=function(){e.emit("finish",200,f.responseText),e._cleanup(!1)},e.xdr=f,e.unload_ref=c.unload_add(function(){e._cleanup(!0)});try{e.xdr.open(a,b),e.xdr.send(d)}catch(h){g()}},x.prototype._cleanup=function(a){var b=this;if(!b.xdr)return;c.unload_del(b.unload_ref),b.xdr.ontimeout=b.xdr.onerror=b.xdr.onprogress=b.xdr.onload=null;if(a)try{b.xdr.abort()}catch(d){}b.unload_ref=b.xdr=null},x.prototype.close=function(){var a=this;a.nuke(),a._cleanup(!0)},c.isXHRCorsCapable=function(){return b.XMLHttpRequest&&"withCredentials"in new XMLHttpRequest?1:b.XDomainRequest&&a.domain?2:L.enabled()?3:4};var y=function(a,d,e){if(this===b)return new y(a,d,e);var f=this,g;f._options={devel:!1,debug:!1,protocols_whitelist:[],info:undefined,rtt:undefined},e&&c.objectExtend(f._options,e),f._base_url=c.amendUrl(a),f._server=f._options.server||c.random_number_string(1e3),f._options.protocols_whitelist&&f._options.protocols_whitelist.length?g=f._options.protocols_whitelist:(typeof d=="string"&&d.length>0?g=[d]:c.isArray(d)?g=d:g=null,g&&f._debug('Deprecated API: Use "protocols_whitelist" option instead of supplying protocol list as a second parameter to SockJS constructor.')),f._protocols=[],f.protocol=null,f.readyState=y.CONNECTING,f._ir=S(f._base_url),f._ir.onfinish=function(a,b){f._ir=null,a?(f._options.info&&(a=c.objectExtend(a,f._options.info)),f._options.rtt&&(b=f._options.rtt),f._applyInfo(a,b,g),f._didClose()):f._didClose(1002,"Can't connect to server",!0)}};y.prototype=new d,y.version="0.3.4",y.CONNECTING=0,y.OPEN=1,y.CLOSING=2,y.CLOSED=3,y.prototype._debug=function(){this._options.debug&&c.log.apply(c,arguments)},y.prototype._dispatchOpen=function(){var a=this;a.readyState===y.CONNECTING?(a._transport_tref&&(clearTimeout(a._transport_tref),a._transport_tref=null),a.readyState=y.OPEN,a.dispatchEvent(new e("open"))):a._didClose(1006,"Server lost session")},y.prototype._dispatchMessage=function(a){var b=this;if(b.readyState!==y.OPEN)return;b.dispatchEvent(new e("message",{data:a}))},y.prototype._dispatchHeartbeat=function(a){var b=this;if(b.readyState!==y.OPEN)return;b.dispatchEvent(new e("heartbeat",{}))},y.prototype._didClose=function(a,b,d){var f=this;if(f.readyState!==y.CONNECTING&&f.readyState!==y.OPEN&&f.readyState!==y.CLOSING)throw new Error("INVALID_STATE_ERR");f._ir&&(f._ir.nuke(),f._ir=null),f._transport&&(f._transport.doCleanup(),f._transport=null);var g=new e("close",{code:a,reason:b,wasClean:c.userSetCode(a)});if(!c.userSetCode(a)&&f.readyState===y.CONNECTING&&!d){if(f._try_next_protocol(g))return;g=new e("close",{code:2e3,reason:"All transports failed",wasClean:!1,last_event:g})}f.readyState=y.CLOSED,c.delay(function(){f.dispatchEvent(g)})},y.prototype._didMessage=function(a){var b=this,c=a.slice(0,1);switch(c){case"o":b._dispatchOpen();break;case"a":var d=JSON.parse(a.slice(1)||"[]");for(var e=0;e<d.length;e++)b._dispatchMessage(d[e]);break;case"m":var d=JSON.parse(a.slice(1)||"null");b._dispatchMessage(d);break;case"c":var d=JSON.parse(a.slice(1)||"[]");b._didClose(d[0],d[1]);break;case"h":b._dispatchHeartbeat()}},y.prototype._try_next_protocol=function(b){var d=this;d.protocol&&(d._debug("Closed transport:",d.protocol,""+b),d.protocol=null),d._transport_tref&&(clearTimeout(d._transport_tref),d._transport_tref=null);for(;;){var e=d.protocol=d._protocols.shift();if(!e)return!1;if(y[e]&&y[e].need_body===!0&&(!a.body||typeof a.readyState!="undefined"&&a.readyState!=="complete"))return d._protocols.unshift(e),d.protocol="waiting-for-load",c.attachEvent("load",function(){d._try_next_protocol()}),!0;if(!!y[e]&&!!y[e].enabled(d._options)){var f=y[e].roundTrips||1,g=(d._options.rto||0)*f||5e3;d._transport_tref=c.delay(g,function(){d.readyState===y.CONNECTING&&d._didClose(2007,"Transport timeouted")});var h=c.random_string(8),i=d._base_url+"/"+d._server+"/"+h;return d._debug("Opening transport:",e," url:"+i," RTO:"+d._options.rto),d._transport=new y[e](d,i,d._base_url),!0}d._debug("Skipping transport:",e)}},y.prototype.close=function(a,b){var d=this;if(a&&!c.userSetCode(a))throw new Error("INVALID_ACCESS_ERR");return d.readyState!==y.CONNECTING&&d.readyState!==y.OPEN?!1:(d.readyState=y.CLOSING,d._didClose(a||1e3,b||"Normal closure"),!0)},y.prototype.send=function(a){var b=this;if(b.readyState===y.CONNECTING)throw new Error("INVALID_STATE_ERR");return b.readyState===y.OPEN&&b._transport.doSend(c.quote(""+a)),!0},y.prototype._applyInfo=function(b,d,e){var f=this;f._options.info=b,f._options.rtt=d,f._options.rto=c.countRTO(d),f._options.info.null_origin=!a.domain;var g=c.probeProtocols();f._protocols=c.detectProtocols(g,e,b)};var z=y.websocket=function(a,d){var e=this,f=d+"/websocket";f.slice(0,5)==="https"?f="wss"+f.slice(5):f="ws"+f.slice(4),e.ri=a,e.url=f;var g=b.WebSocket||b.MozWebSocket;e.ws=new g(e.url),e.ws.onmessage=function(a){e.ri._didMessage(a.data)},e.unload_ref=c.unload_add(function(){e.ws.close()}),e.ws.onclose=function(){e.ri._didMessage(c.closeFrame(1006,"WebSocket connection broken"))}};z.prototype.doSend=function(a){this.ws.send("["+a+"]")},z.prototype.doCleanup=function(){var a=this,b=a.ws;b&&(b.onmessage=b.onclose=null,b.close(),c.unload_del(a.unload_ref),a.unload_ref=a.ri=a.ws=null)},z.enabled=function(){return!!b.WebSocket||!!b.MozWebSocket},z.roundTrips=2;var A=function(){};A.prototype.send_constructor=function(a){var b=this;b.send_buffer=[],b.sender=a},A.prototype.doSend=function(a){var b=this;b.send_buffer.push(a),b.send_stop||b.send_schedule()},A.prototype.send_schedule_wait=function(){var a=this,b;a.send_stop=function(){a.send_stop=null,clearTimeout(b)},b=c.delay(25,function(){a.send_stop=null,a.send_schedule()})},A.prototype.send_schedule=function(){var a=this;if(a.send_buffer.length>0){var b="["+a.send_buffer.join(",")+"]";a.send_stop=a.sender(a.trans_url,b,function(b,c){a.send_stop=null,b===!1?a.ri._didClose(1006,"Sending error "+c):a.send_schedule_wait()}),a.send_buffer=[]}},A.prototype.send_destructor=function(){var a=this;a._send_stop&&a._send_stop(),a._send_stop=null};var B=function(b,d,e){var f=this;if(!("_send_form"in f)){var g=f._send_form=a.createElement("form"),h=f._send_area=a.createElement("textarea");h.name="d",g.style.display="none",g.style.position="absolute",g.method="POST",g.enctype="application/x-www-form-urlencoded",g.acceptCharset="UTF-8",g.appendChild(h),a.body.appendChild(g)}var g=f._send_form,h=f._send_area,i="a"+c.random_string(8);g.target=i,g.action=b+"/jsonp_send?i="+i;var j;try{j=a.createElement('<iframe name="'+i+'">')}catch(k){j=a.createElement("iframe"),j.name=i}j.id=i,g.appendChild(j),j.style.display="none";try{h.value=d}catch(l){c.log("Your browser is seriously broken. Go home! "+l.message)}g.submit();var m=function(a){if(!j.onerror)return;j.onreadystatechange=j.onerror=j.onload=null,c.delay(500,function(){j.parentNode.removeChild(j),j=null}),h.value="",e(!0)};return j.onerror=j.onload=m,j.onreadystatechange=function(a){j.readyState=="complete"&&m()},m},C=function(a){return function(b,c,d){var e=new a("POST",b+"/xhr_send",c);return e.onfinish=function(a,b){d(a===200||a===204,"http status "+a)},function(a){d(!1,a)}}},D=function(b,d){var e,f=a.createElement("script"),g,h=function(a){g&&(g.parentNode.removeChild(g),g=null),f&&(clearTimeout(e),f.parentNode.removeChild(f),f.onreadystatechange=f.onerror=f.onload=f.onclick=null,f=null,d(a),d=null)},i=!1,j=null;f.id="a"+c.random_string(8),f.src=b,f.type="text/javascript",f.charset="UTF-8",f.onerror=function(a){j||(j=setTimeout(function(){i||h(c.closeFrame(1006,"JSONP script loaded abnormally (onerror)"))},1e3))},f.onload=function(a){h(c.closeFrame(1006,"JSONP script loaded abnormally (onload)"))},f.onreadystatechange=function(a){if(/loaded|closed/.test(f.readyState)){if(f&&f.htmlFor&&f.onclick){i=!0;try{f.onclick()}catch(b){}}f&&h(c.closeFrame(1006,"JSONP script loaded abnormally (onreadystatechange)"))}};if(typeof f.async=="undefined"&&a.attachEvent)if(!/opera/i.test(navigator.userAgent)){try{f.htmlFor=f.id,f.event="onclick"}catch(k){}f.async=!0}else g=a.createElement("script"),g.text="try{var a = document.getElementById('"+f.id+"'); if(a)a.onerror();}catch(x){};",f.async=g.async=!1;typeof f.async!="undefined"&&(f.async=!0),e=setTimeout(function(){h(c.closeFrame(1006,"JSONP script loaded abnormally (timeout)"))},35e3);var l=a.getElementsByTagName("head")[0];return l.insertBefore(f,l.firstChild),g&&l.insertBefore(g,l.firstChild),h},E=y["jsonp-polling"]=function(a,b){c.polluteGlobalNamespace();var d=this;d.ri=a,d.trans_url=b,d.send_constructor(B),d._schedule_recv()};E.prototype=new A,E.prototype._schedule_recv=function(){var a=this,b=function(b){a._recv_stop=null,b&&(a._is_closing||a.ri._didMessage(b)),a._is_closing||a._schedule_recv()};a._recv_stop=F(a.trans_url+"/jsonp",D,b)},E.enabled=function(){return!0},E.need_body=!0,E.prototype.doCleanup=function(){var a=this;a._is_closing=!0,a._recv_stop&&a._recv_stop(),a.ri=a._recv_stop=null,a.send_destructor()};var F=function(a,d,e){var f="a"+c.random_string(6),g=a+"?c="+escape(h+"."+f),i=0,j=function(a){switch(i){case 0:delete b[h][f],e(a);break;case 1:e(a),i=2;break;case 2:delete b[h][f]}},k=d(g,j);b[h][f]=k;var l=function(){b[h][f]&&(i=1,b[h][f](c.closeFrame(1e3,"JSONP user aborted read")))};return l},G=function(){};G.prototype=new A,G.prototype.run=function(a,b,c,d,e){var f=this;f.ri=a,f.trans_url=b,f.send_constructor(C(e)),f.poll=new $(a,d,b+c,e)},G.prototype.doCleanup=function(){var a=this;a.poll&&(a.poll.abort(),a.poll=null)};var H=y["xhr-streaming"]=function(a,b){this.run(a,b,"/xhr_streaming",bd,c.XHRCorsObject)};H.prototype=new G,H.enabled=function(){return b.XMLHttpRequest&&"withCredentials"in new XMLHttpRequest&&!/opera/i.test(navigator.userAgent)},H.roundTrips=2,H.need_body=!0;var I=y["xdr-streaming"]=function(a,b){this.run(a,b,"/xhr_streaming",bd,c.XDRObject)};I.prototype=new G,I.enabled=function(){return!!b.XDomainRequest},I.roundTrips=2;var J=y["xhr-polling"]=function(a,b){this.run(a,b,"/xhr",bd,c.XHRCorsObject)};J.prototype=new G,J.enabled=H.enabled,J.roundTrips=2;var K=y["xdr-polling"]=function(a,b){this.run(a,b,"/xhr",bd,c.XDRObject)};K.prototype=new G,K.enabled=I.enabled,K.roundTrips=2;var L=function(){};L.prototype.i_constructor=function(a,b,d){var e=this;e.ri=a,e.origin=c.getOrigin(d),e.base_url=d,e.trans_url=b;var f=d+"/iframe.html";e.ri._options.devel&&(f+="?t="+ +(new Date)),e.window_id=c.random_string(8),f+="#"+e.window_id,e.iframeObj=c.createIframe(f,function(a){e.ri._didClose(1006,"Unable to load an iframe ("+a+")")}),e.onmessage_cb=c.bind(e.onmessage,e),c.attachMessage(e.onmessage_cb)},L.prototype.doCleanup=function(){var a=this;if(a.iframeObj){c.detachMessage(a.onmessage_cb);try{a.iframeObj.iframe.contentWindow&&a.postMessage("c")}catch(b){}a.iframeObj.cleanup(),a.iframeObj=null,a.onmessage_cb=a.iframeObj=null}},L.prototype.onmessage=function(a){var b=this;if(a.origin!==b.origin)return;var c=a.data.slice(0,8),d=a.data.slice(8,9),e=a.data.slice(9);if(c!==b.window_id)return;switch(d){case"s":b.iframeObj.loaded(),b.postMessage("s",JSON.stringify([y.version,b.protocol,b.trans_url,b.base_url]));break;case"t":b.ri._didMessage(e)}},L.prototype.postMessage=function(a,b){var c=this;c.iframeObj.post(c.window_id+a+(b||""),c.origin)},L.prototype.doSend=function(a){this.postMessage("m",a)},L.enabled=function(){var a=navigator&&navigator.userAgent&&navigator.userAgent.indexOf("Konqueror")!==-1;return(typeof b.postMessage=="function"||typeof b.postMessage=="object")&&!a};var M,N=function(a,d){parent!==b?parent.postMessage(M+a+(d||""),"*"):c.log("Can't postMessage, no parent window.",a,d)},O=function(){};O.prototype._didClose=function(a,b){N("t",c.closeFrame(a,b))},O.prototype._didMessage=function(a){N("t",a)},O.prototype._doSend=function(a){this._transport.doSend(a)},O.prototype._doCleanup=function(){this._transport.doCleanup()},c.parent_origin=undefined,y.bootstrap_iframe=function(){var d;M=a.location.hash.slice(1);var e=function(a){if(a.source!==parent)return;typeof c.parent_origin=="undefined"&&(c.parent_origin=a.origin);if(a.origin!==c.parent_origin)return;var e=a.data.slice(0,8),f=a.data.slice(8,9),g=a.data.slice(9);if(e!==M)return;switch(f){case"s":var h=JSON.parse(g),i=h[0],j=h[1],k=h[2],l=h[3];i!==y.version&&c.log('Incompatibile SockJS! Main site uses: "'+i+'", the iframe:'+' "'+y.version+'".');if(!c.flatUrl(k)||!c.flatUrl(l)){c.log("Only basic urls are supported in SockJS");return}if(!c.isSameOriginUrl(k)||!c.isSameOriginUrl(l)){c.log("Can't connect to different domain from within an iframe. ("+JSON.stringify([b.location.href,k,l])+")");return}d=new O,d._transport=new O[j](d,k,l);break;case"m":d._doSend(g);break;case"c":d&&d._doCleanup(),d=null}};c.attachMessage(e),N("s")};var P=function(a,b){var d=this;c.delay(function(){d.doXhr(a,b)})};P.prototype=new f(["finish"]),P.prototype.doXhr=function(a,b){var d=this,e=(new Date).getTime(),f=new b("GET",a+"/info"),g=c.delay(8e3,function(){f.ontimeout()});f.onfinish=function(a,b){clearTimeout(g),g=null;if(a===200){var c=(new Date).getTime()-e,f=JSON.parse(b);typeof f!="object"&&(f={}),d.emit("finish",f,c)}else d.emit("finish")},f.ontimeout=function(){f.close(),d.emit("finish")}};var Q=function(b){var d=this,e=function(){var a=new L;a.protocol="w-iframe-info-receiver";var c=function(b){if(typeof b=="string"&&b.substr(0,1)==="m"){var c=JSON.parse(b.substr(1)),e=c[0],f=c[1];d.emit("finish",e,f)}else d.emit("finish");a.doCleanup(),a=null},e={_options:{},_didClose:c,_didMessage:c};a.i_constructor(e,b,b)};a.body?e():c.attachEvent("load",e)};Q.prototype=new f(["finish"]);var R=function(){var a=this;c.delay(function(){a.emit("finish",{},2e3)})};R.prototype=new f(["finish"]);var S=function(a){if(c.isSameOriginUrl(a))return new P(a,c.XHRLocalObject);switch(c.isXHRCorsCapable()){case 1:return new P(a,c.XHRLocalObject);case 2:return new P(a,c.XDRObject);case 3:return new Q(a);default:return new R}},T=O["w-iframe-info-receiver"]=function(a,b,d){var e=new P(d,c.XHRLocalObject);e.onfinish=function(b,c){a._didMessage("m"+JSON.stringify([b,c])),a._didClose()}};T.prototype.doCleanup=function(){};var U=y["iframe-eventsource"]=function(){var a=this;a.protocol="w-iframe-eventsource",a.i_constructor.apply(a,arguments)};U.prototype=new L,U.enabled=function(){return"EventSource"in b&&L.enabled()},U.need_body=!0,U.roundTrips=3;var V=O["w-iframe-eventsource"]=function(a,b){this.run(a,b,"/eventsource",_,c.XHRLocalObject)};V.prototype=new G;var W=y["iframe-xhr-polling"]=function(){var a=this;a.protocol="w-iframe-xhr-polling",a.i_constructor.apply(a,arguments)};W.prototype=new L,W.enabled=function(){return b.XMLHttpRequest&&L.enabled()},W.need_body=!0,W.roundTrips=3;var X=O["w-iframe-xhr-polling"]=function(a,b){this.run(a,b,"/xhr",bd,c.XHRLocalObject)};X.prototype=new G;var Y=y["iframe-htmlfile"]=function(){var a=this;a.protocol="w-iframe-htmlfile",a.i_constructor.apply(a,arguments)};Y.prototype=new L,Y.enabled=function(){return L.enabled()},Y.need_body=!0,Y.roundTrips=3;var Z=O["w-iframe-htmlfile"]=function(a,b){this.run(a,b,"/htmlfile",bc,c.XHRLocalObject)};Z.prototype=new G;var $=function(a,b,c,d){var e=this;e.ri=a,e.Receiver=b,e.recv_url=c,e.AjaxObject=d,e._scheduleRecv()};$.prototype._scheduleRecv=function(){var a=this,b=a.poll=new a.Receiver(a.recv_url,a.AjaxObject),c=0;b.onmessage=function(b){c+=1,a.ri._didMessage(b.data)},b.onclose=function(c){a.poll=b=b.onmessage=b.onclose=null,a.poll_is_closing||(c.reason==="permanent"?a.ri._didClose(1006,"Polling error ("+c.reason+")"):a._scheduleRecv())}},$.prototype.abort=function(){var a=this;a.poll_is_closing=!0,a.poll&&a.poll.abort()};var _=function(a){var b=this,d=new EventSource(a);d.onmessage=function(a){b.dispatchEvent(new e("message",{data:unescape(a.data)}))},b.es_close=d.onerror=function(a,f){var g=f?"user":d.readyState!==2?"network":"permanent";b.es_close=d.onmessage=d.onerror=null,d.close(),d=null,c.delay(200,function(){b.dispatchEvent(new e("close",{reason:g}))})}};_.prototype=new d,_.prototype.abort=function(){var a=this;a.es_close&&a.es_close({},!0)};var ba,bb=function(){if(ba===undefined)if("ActiveXObject"in b)try{ba=!!(new ActiveXObject("htmlfile"))}catch(a){}else ba=!1;return ba},bc=function(a){var d=this;c.polluteGlobalNamespace(),d.id="a"+c.random_string(6,26),a+=(a.indexOf("?")===-1?"?":"&")+"c="+escape(h+"."+d.id);var f=bb()?c.createHtmlfile:c.createIframe,g;b[h][d.id]={start:function(){g.loaded()},message:function(a){d.dispatchEvent(new e("message",{data:a}))},stop:function(){d.iframe_close({},"network")}},d.iframe_close=function(a,c){g.cleanup(),d.iframe_close=g=null,delete b[h][d.id],d.dispatchEvent(new e("close",{reason:c}))},g=f(a,function(a){d.iframe_close({},"permanent")})};bc.prototype=new d,bc.prototype.abort=function(){var a=this;a.iframe_close&&a.iframe_close({},"user")};var bd=function(a,b){var c=this,d=0;c.xo=new b("POST",a,null),c.xo.onchunk=function(a,b){if(a!==200)return;for(;;){var f=b.slice(d),g=f.indexOf("\n");if(g===-1)break;d+=g+1;var h=f.slice(0,g);c.dispatchEvent(new e("message",{data:h}))}},c.xo.onfinish=function(a,b){c.xo.onchunk(a,b),c.xo=null;var d=a===200?"network":"permanent";c.dispatchEvent(new e("close",{reason:d}))}};return bd.prototype=new d,bd.prototype.abort=function(){var a=this;a.xo&&(a.xo.close(),a.dispatchEvent(new e("close",{reason:"user"})),a.xo=null)},y.getUtils=function(){return c},y.getIframeTransport=function(){return L},y}(),"_sockjs_onload"in window&&setTimeout(_sockjs_onload,1),typeof define=="function"&&define.amd&&define("sockjs",[],function(){return SockJS})
/*
* stomp.js
*/
Stomp=function(){var s,r,n,t={}.hasOwnProperty;r=function(){function d(b,c,a){this.command=b;this.headers=null!=c?c:{};this.body=null!=a?a:""}d.prototype.toString=function(){var b,c,a,d;b=[this.command];d=this.headers;for(c in d)t.call(d,c)&&(a=d[c],b.push(""+c+":"+a));this.body&&b.push("content-length:"+(""+this.body).length);b.push("\n"+this.body);return b.join("\n")};d._unmarshallSingle=function(b){var c,a,l,f,e,p,h,g,q;f=b.search(/\n\n/);c=b.substring(0,f).split("\n");l=c.shift();e={};h=function(a){return a.replace(/^\s+|\s+$/g,
"")};p=a=null;a=g=0;for(q=c.length;0<=q?g<q:g>q;a=0<=q?++g:--g)p=c[a],a=p.indexOf(":"),e[h(p.substring(0,a))]=h(p.substring(a+1));c="";f+=2;if(e["content-length"])a=parseInt(e["content-length"]),c=(""+b).substring(f,f+a);else for(a=null,a=h=f,g=b.length;f<=g?h<g:h>g;a=f<=g?++h:--h){a=b.charAt(a);if("\x00"===a)break;c+=a}return new d(l,e,c)};d.unmarshall=function(b){var c,a,l,f;l=b.split(/\x00\n*/);f=[];c=0;for(a=l.length;c<a;c++)b=l[c],0<(null!=b?b.length:void 0)&&f.push(d._unmarshallSingle(b));return f};
d.marshall=function(b,c,a){return(new d(b,c,a)).toString()+"\x00"};return d}();s=function(){function d(b){this.ws=b;this.ws.binaryType="arraybuffer";this.counter=0;this.connected=!1;this.heartbeat={outgoing:1E4,incoming:1E4};this.subscriptions={}}d.prototype._transmit=function(b,c,a){b=r.marshall(b,c,a);"function"===typeof this.debug&&this.debug(">>> "+b);return this.ws.send(b)};d.prototype._setupHeartbeat=function(b){var c,a,d,f,e=this;if((a=b.version)===n.VERSIONS.V1_1||a===n.VERSIONS.V1_2)if(c=
function(){var a,c,d,e;d=b["heart-beat"].split(",");e=[];a=0;for(c=d.length;a<c;a++)f=d[a],e.push(parseInt(f));return e}(),a=c[0],c=c[1],0!==this.heartbeat.outgoing&&0!==c&&(d=Math.max(this.heartbeat.outgoing,c),"function"===typeof this.debug&&this.debug("send PING every "+d+"ms"),this.pinger="undefined"!==typeof window&&null!==window?window.setInterval(function(){e.ws.send("\n");return"function"===typeof e.debug?e.debug(">>> PING"):void 0},d):void 0),0!==this.heartbeat.incoming&&0!==a)return d=Math.max(this.heartbeat.incoming,
a),"function"===typeof this.debug&&this.debug("check PONG every "+d+"ms"),this.ponger="undefined"!==typeof window&&null!==window?window.setInterval(function(){var a;a=Date.now()-e.serverActivity;if(a>2*d)return"function"===typeof e.debug&&e.debug("did not receive server activity for the last "+a+"ms"),e._cleanUp()},d):void 0};d.prototype.connect=function(b,c,a,d,f){var e=this;this.connectCallback=a;"function"===typeof this.debug&&this.debug("Opening Web Socket...");this.ws.onmessage=function(a){var b,
c,f,m,k;if("undefined"!==typeof ArrayBuffer&&a.data instanceof ArrayBuffer){a=new Uint8Array(a.data);"function"===typeof e.debug?e.debug("--- got data length: "+a.length):void 0;m=[];c=0;for(f=a.length;c<f;c++)b=a[c],m.push(String.fromCharCode(b));a=m.join("")}else a=a.data;e.serverActivity=Date.now();if("\n"===a)"function"===typeof e.debug&&e.debug("<<< PONG");else{"function"===typeof e.debug&&e.debug("<<< "+a);m=r.unmarshall(a);k=[];c=0;for(f=m.length;c<f;c++)switch(a=m[c],a.command){case "CONNECTED":"function"===
typeof e.debug&&e.debug("connected to server "+a.headers.server);e.connected=!0;e._setupHeartbeat(a.headers);k.push("function"===typeof e.connectCallback?e.connectCallback(a):void 0);break;case "MESSAGE":b=e.subscriptions[a.headers.subscription];k.push("function"===typeof b?b(a):void 0);break;case "RECEIPT":k.push("function"===typeof e.onreceipt?e.onreceipt(a):void 0);break;case "ERROR":k.push("function"===typeof d?d(a):void 0);break;default:k.push("function"===typeof e.debug?e.debug("Unhandled frame: "+
a):void 0)}return k}};this.ws.onclose=function(){var a;a="Whoops! Lost connection to "+e.ws.url;"function"===typeof e.debug&&e.debug(a);return"function"===typeof d?d(a):void 0};return this.ws.onopen=function(){var a;"function"===typeof e.debug&&e.debug("Web Socket Opened...");a={"accept-version":n.VERSIONS.supportedVersions(),"heart-beat":[e.heartbeat.outgoing,e.heartbeat.incoming].join()};f&&(a.host=f);b&&(a.login=b);c&&(a.passcode=c);return e._transmit("CONNECT",a)}};d.prototype.disconnect=function(b){this._transmit("DISCONNECT");
this.ws.onclose=null;this._cleanUp();return"function"===typeof b?b():void 0};d.prototype._cleanUp=function(){this.ws.close();this.connected=!1;this.pinger&&"undefined"!==typeof window&&null!==window&&window.clearInterval(this.pinger);if(this.ponger)return"undefined"!==typeof window&&null!==window?window.clearInterval(this.ponger):void 0};d.prototype.send=function(b,c,a){null==c&&(c={});null==a&&(a="");c.destination=b;return this._transmit("SEND",c,a)};d.prototype.subscribe=function(b,c,a){null==a&&
(a={});a.id||(a.id="sub-"+this.counter++);a.destination=b;this.subscriptions[a.id]=c;this._transmit("SUBSCRIBE",a);return a.id};d.prototype.unsubscribe=function(b){delete this.subscriptions[b];return this._transmit("UNSUBSCRIBE",{id:b})};d.prototype.begin=function(b){return this._transmit("BEGIN",{transaction:b})};d.prototype.commit=function(b){return this._transmit("COMMIT",{transaction:b})};d.prototype.abort=function(b){return this._transmit("ABORT",{transaction:b})};d.prototype.ack=function(b,
c,a){null==a&&(a={});a["message-id"]=b;a.subscription=c;return this._transmit("ACK",a)};d.prototype.nack=function(b,c,a){null==a&&(a={});a["message-id"]=b;a.subscription=c;return this._transmit("NACK",a)};return d}();return n={libVersion:"2.0.0-next",VERSIONS:{V1_0:"1.0",V1_1:"1.1",V1_2:"1.2",supportedVersions:function(){return"1.1,1.0"}},client:function(d,b){var c;null==b&&(b=["v10.stomp","v11.stomp"]);c=new (n.WebSocketClass||WebSocket)(d,b);return new s(c)},over:function(d){return new s(d)},Frame:r}}();
/*
* json2
*/
var JSON;JSON||(JSON={});
(function(){function m(a){return 10>a?"0"+a:a}function r(a){s.lastIndex=0;return s.test(a)?'"'+a.replace(s,function(a){var c=u[a];return"string"===typeof c?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function p(a,l){var c,d,h,q,g=e,f,b=l[a];b&&"object"===typeof b&&"function"===typeof b.toJSON&&(b=b.toJSON(a));"function"===typeof k&&(b=k.call(l,a,b));switch(typeof b){case "string":return r(b);case "number":return isFinite(b)?String(b):"null";case "boolean":case "null":return String(b);case "object":if(!b)return"null";
e+=n;f=[];if("[object Array]"===Object.prototype.toString.apply(b)){q=b.length;for(c=0;c<q;c+=1)f[c]=p(c,b)||"null";h=0===f.length?"[]":e?"[\n"+e+f.join(",\n"+e)+"\n"+g+"]":"["+f.join(",")+"]";e=g;return h}if(k&&"object"===typeof k)for(q=k.length,c=0;c<q;c+=1)"string"===typeof k[c]&&(d=k[c],(h=p(d,b))&&f.push(r(d)+(e?": ":":")+h));else for(d in b)Object.prototype.hasOwnProperty.call(b,d)&&(h=p(d,b))&&f.push(r(d)+(e?": ":":")+h);h=0===f.length?"{}":e?"{\n"+e+f.join(",\n"+e)+"\n"+g+"}":"{"+f.join(",")+
"}";e=g;return h}}"function"!==typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(a){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+m(this.getUTCMonth()+1)+"-"+m(this.getUTCDate())+"T"+m(this.getUTCHours())+":"+m(this.getUTCMinutes())+":"+m(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(a){return this.valueOf()});var t=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
s=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,n,u={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},k;"function"!==typeof JSON.stringify&&(JSON.stringify=function(a,l,c){var d;n=e="";if("number"===typeof c)for(d=0;d<c;d+=1)n+=" ";else"string"===typeof c&&(n=c);if((k=l)&&"function"!==typeof l&&("object"!==typeof l||"number"!==typeof l.length))throw Error("JSON.stringify");return p("",{"":a})});
"function"!==typeof JSON.parse&&(JSON.parse=function(a,e){function c(a,d){var g,f,b=a[d];if(b&&"object"===typeof b)for(g in b)Object.prototype.hasOwnProperty.call(b,g)&&(f=c(b,g),void 0!==f?b[g]=f:delete b[g]);return e.call(a,d,b)}var d;a=String(a);t.lastIndex=0;t.test(a)&&(a=a.replace(t,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return d=eval("("+a+")"),"function"===typeof e?c({"":d},""):d;throw new SyntaxError("JSON.parse");})})();
/*
* jquery.iecors.js
*/
(function(b){b.ajaxSettings.xdr=function(){return window.XDomainRequest?new window.XDomainRequest:null};(function(a){b.extend(b.support,{iecors:!!a})})(b.ajaxSettings.xdr());b.support.iecors&&b.ajaxTransport(function(a){return{send:function(b,d){var c=a.xdr();c.onload=function(){d(200,"OK",{text:c.responseText},{"Content-Type":c.contentType})};a.xhrFields&&(xhr.onerror=a.xhrFields.error,xhr.ontimeout=a.xhrFields.timeout);c.open(a.type,a.url);c.send(a.hasContent&&a.data||null)},abort:function(){xdr.abort()}}})})(jQuery);
/*
* jquery.easydate.js
*/
(function(a){function c(a,c,b){isNaN(c)||1==c||(a+="s");return b.locale[a]||a}a.easydate={};a.easydate.locales={};a.easydate.locales.en={future_format:"%s %t",past_format:"%t %s",second:"second",seconds:"seconds",minute:"minute",minutes:"minutes",hour:"hour",hours:"hours",day:"day",days:"days",week:"week",weeks:"weeks",month:"month",months:"months",year:"year",years:"years",yesterday:"yesterday",tomorrow:"tomorrow",now:"just now",ago:"ago","in":"in"};a.easydate.locales.ca={future_format:"%s %t",past_format:"%s %t",
second:"segon",seconds:"segons",minute:"minut",minutes:"minuts",hour:"hora",hours:"hores",day:"dia",days:"dies",week:"setmana",weeks:"setmanes",month:"mes",months:"mesos",year:"any",years:"anys",yesterday:"ahir",tomorrow:"dem\u00e0",now:"fa un moment",ago:"fa","in":"en"};a.easydate.locales.es={future_format:"%s %t",past_format:"%s %t",second:"segundo",seconds:"segundos",minute:"minuto",minutes:"minutos",hour:"hora",hours:"horas",day:"dia",days:"dias",week:"semana",weeks:"semanas",month:"mes",months:"meses",
year:"a\u00f1o",years:"a\u00f1os",yesterday:"ayer",tomorrow:"ma\u00f1ana",now:"hace un instante",ago:"hace","in":"en"};var k={live:!0,set_title:!0,format_future:!0,format_past:!0,units:[{name:"now",limit:5},{name:"second",limit:60,in_seconds:1},{name:"minute",limit:3600,in_seconds:60},{name:"hour",limit:86400,in_seconds:3600},{name:"yesterday",limit:172800,past_only:!0},{name:"tomorrow",limit:172800,future_only:!0},{name:"day",limit:604800,in_seconds:86400},{name:"week",limit:2629743,in_seconds:604800},
{name:"month",limit:31556926,in_seconds:2629743},{name:"year",limit:Infinity,in_seconds:31556926}],uneasy_format:function(a){return a.toLocaleDateString()},locale:a.easydate.locales.en};a.easydate.format_date=function(g,h){var b=a.extend({},k);b.locale=a.easydate.locales[h];var d=((new Date).getTime()-g.getTime())/1E3,e=Math.abs(d);if(!(isNaN(d)||!b.format_future&&0>d||!b.format_past&&0<d)){for(var l in b.units){var f=b.units[l];if(!(f.past_only&&0>d||f.future_only&&0<d)&&e<f.limit){if(isNaN(f.in_seconds))return c(f.name,
NaN,b);e/=f.in_seconds;e=Math.round(e);return(0>d?c("future_format",NaN,b).replace("%s",c("in",NaN,b)):c("past_format",NaN,b).replace("%s",c("ago",NaN,b))).replace("%t",e+" "+c(f.name,e,b))}}return b.uneasy_format(g)}}})(jQuery);
/*
* hogan.js
*/
var HoganTemplate=function(){function q(a){this.text=a}q.prototype={r:function(a,b,e){return""},v:function(a){a=String(null===a?"":a);return v.test(a)?a.replace(x,"&amp;").replace(y,"&lt;").replace(z,"&gt;").replace(n,"&#39;").replace(l,"&quot;"):a},render:function(a,b,e){return this.r(a,b,e)},rp:function(a,b,e,d){return(a=e[a])?a.r(b,e,d):""},rs:function(a,b,e){var d="",g=a[a.length-1];if(!s(g))return e(a,b);for(var c=0;c<g.length;c++)a.push(g[c]),d+=e(a,b),a.pop();return d},s:function(a,b,e,d,g,
c,h){if(s(a)&&0===a.length)return!1;d||"function"!=typeof a||(a=this.ls(a,b,e,g,c,h));e=""===a||!!a;!d&&e&&b&&b.push("object"==typeof a?a:b[b.length-1]);return e},d:function(a,b,e,d){var g=a.split("."),c=this.f(g[0],b,e,d),h=null;if("."===a&&s(b[b.length-2]))return b[b.length-1];for(a=1;a<g.length;a++)c&&"object"==typeof c&&g[a]in c?(h=c,c=c[g[a]]):c="";if(d&&!c)return!1;d||"function"!=typeof c||(b.push(h),c=this.lv(c,b,e),b.pop());return c},f:function(a,b,e,d){for(var g=!1,c=null,h=!1,p=b.length-
1;0<=p;p--)if((c=b[p])&&"object"==typeof c&&a in c){g=c[a];h=!0;break}if(!h)return d?!1:"";d||"function"!=typeof g||(g=this.lv(g,b,e));return g},ho:function(a,b,e,d,g){a=a.call(b,d,function(c){return Hogan.compile(c,{delimiters:g}).render(b,e)});this.b=Hogan.compile(a.toString(),{delimiters:g}).render(b,e);return!1},b:"",ls:function(a,b,e,d,g,c){b=b[b.length-1];var h=a.call(b);return 0<a.length?this.ho(a,b,e,this.text.substring(d,g),c):"function"==typeof h?this.ho(h,b,e,this.text.substring(d,g),c):
h},lv:function(a,b,e){b=b[b.length-1];return Hogan.compile(a.call(b).toString()).render(b,e)}};var x=/&/g,y=/</g,z=/>/g,n=/\'/g,l=/\"/g,v=/[&<>\"\']/,s=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)};return q}(),Hogan=function(){function q(c,a){function p(){0<r.length&&(m.push(new String(r)),r="")}function b(c,a){p();var h;if(h=c)a:{h=!0;for(var f=q;f<m.length;f++)if(h=m[f].tag&&g[m[f].tag]<g._v||!m[f].tag&&null===m[f].match(s),!h){h=!1;break a}}if(h){h=q;for(var e;h<
m.length;h++)m[h].tag||((e=m[h+1])&&">"==e.tag&&(e.indent=m[h].toString()),m.splice(h,1))}else a||m.push({tag:"\n"});l=!1;q=m.length}function f(c,a){var h="="+t,p=c.indexOf(h,a),b=x(c.substring(c.indexOf("=",a)+1,p)).split(" ");u=b[0];t=b[1];return p+h.length-1}var e=c.length,d=0,w=null,n=null,r="",m=[],l=!1,k=0,q=0,u="{{",t="}}";a&&(a=a.split(" "),u=a[0],t=a[1]);for(k=0;k<e;k++)0==d?y(u,c,k)?(--k,p(),d=1):"\n"==c.charAt(k)?b(l):r+=c.charAt(k):1==d?(k+=u.length-1,w=(n=g[c.charAt(k+1)])?c.charAt(k+
1):"_v","="==w?(k=f(c,k),d=0):(n&&k++,d=2),l=k):y(t,c,k)?(m.push({tag:w,n:x(r),otag:u,ctag:t,i:"/"==w?l-t.length:k+u.length}),r="",k+=t.length-1,d=0,"{"==w&&k++):r+=c.charAt(k);b(l,!0);return m}function x(c){return c.trim?c.trim():c.replace(/^\s*|\s*$/g,"")}function y(c,a,p){if(a.charAt(p)!=c.charAt(0))return!1;for(var b=1,f=c.length;b<f;b++)if(a.charAt(p+b)!=c.charAt(b))return!1;return!0}function z(c,a,b,e){a=[];for(var f=null,d=null;0<c.length;){d=c.shift();if(!(f="#"==d.tag)&&!(f="^"==d.tag))a:{for(var f=
d,g=e,l=0,n=g.length;l<n;l++)if(g[l].o==f.n){f.tag="#";f=!0;break a}f=void 0}if(f)b.push(d),d.nodes=z(c,d.tag,b,e);else if("/"==d.tag){if(0===b.length)throw Error("Closing tag without opener: /"+d.n);f=b.pop();if(c=d.n!=f.n){a:{c=0;for(b=e.length;c<b;c++)if(e[c].c==d.n&&e[c].o==f.n){e=!0;break a}e=void 0}c=!e}if(c)throw Error("Nesting error: "+f.n+" vs. "+d.n);f.end=d.i;return a}a.push(d)}if(0<b.length)throw Error("missing closing tag: "+b.pop().n);return a}function n(c){return c.replace(d,"\\\\").replace(a,
'\\"').replace(b,"\\n").replace(e,"\\r")}function l(c){return~c.indexOf(".")?"d":"f"}function v(c){for(var a="",b=0,d=c.length;b<d;b++){var f=c[b].tag;if("#"==f)var f=c[b].nodes,e=l(c[b].n),g=c[b].i,q=c[b].end,s=c[b].otag+" "+c[b].ctag,f="if(_.s(_."+e+'("'+n(c[b].n)+'",c,p,1),c,p,0,'+g+","+q+', "'+s+'")){b += _.rs(c,p,function(c,p){ var b = "";'+v(f)+'return b;});c.pop();}else{b += _.b; _.b = ""};',a=a+f;else"^"==f?(f=c[b].nodes,f="if (!_.s(_."+l(c[b].n)+'("'+n(c[b].n)+'",c,p,1),c,p,1,0,0,"")){'+
v(f)+"};",a+=f):"<"==f||">"==f?a+='b += _.rp("'+n(c[b].n)+'",c[c.length - 1],p,"'+(c[b].indent||"")+'");':"{"==f||"&"==f?(f="b += (_."+l(c[b].n)+'("'+n(c[b].n)+'",c,p,0));',a+=f):"\n"==f?a+='b += "\\n"'+(c.length-1==b?"":" + i")+";":"_v"==f?(f="b += (_.v(_."+l(c[b].n)+'("'+n(c[b].n)+'",c,p,0)));',a+=f):void 0===f&&(f='"'+n(c[b])+'"',a+="b += "+f+";")}return a}var s=/\S/,a=/\"/g,b=/\n/g,e=/\r/g,d=/\\/g,g={"#":1,"^":2,"/":3,"!":4,">":5,"<":6,"=":7,_v:8,"{":9,"&":10};return{scan:q,parse:function(c,a){a=
a||{};return z(c,"",[],a.sectionTags||[])},cache:{},compile:function(a,b){b=b||{};var d=this.cache[a];if(d)return d;var e=this.parse(q(a,b.delimiters),b),d=b,e='i = i || "";var c = [cx];var b = i + "";var _ = this;'+v(e)+"return b;";d.asString?d="function(cx,p,i){"+e+";}":(d=new HoganTemplate(a),d.r=new Function("cx","p","i",e));return this.cache[a]=d}}}();
"undefined"!==typeof module&&module.exports?(module.exports=Hogan,module.exports.Template=HoganTemplate):"function"===typeof define&&define.amd?define(function(){return Hogan}):"undefined"!==typeof exports&&(exports.Hogan=Hogan,exports.HoganTemplate=HoganTemplate);
/*
* jquery.mousewheel.js
*/
/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 *
 * Requires: 1.2.2+
 */
(function(d){function e(a){var b=a||window.event,c=[].slice.call(arguments,1),f=0,e=0,g=0,a=d.event.fix(b);a.type="mousewheel";b.wheelDelta&&(f=b.wheelDelta/120);b.detail&&(f=-b.detail/3);g=f;b.axis!==void 0&&b.axis===b.HORIZONTAL_AXIS&&(g=0,e=-1*f);b.wheelDeltaY!==void 0&&(g=b.wheelDeltaY/120);b.wheelDeltaX!==void 0&&(e=-1*b.wheelDeltaX/120);c.unshift(a,f,e,g);return(d.event.dispatch||d.event.handle).apply(this,c)}var c=["DOMMouseScroll","mousewheel"];if(d.event.fixHooks)for(var h=c.length;h;)d.event.fixHooks[c[--h]]=
d.event.mouseHooks;d.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var a=c.length;a;)this.addEventListener(c[--a],e,false);else this.onmousewheel=e},teardown:function(){if(this.removeEventListener)for(var a=c.length;a;)this.removeEventListener(c[--a],e,false);else this.onmousewheel=null}};d.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})})(jQuery);/*
* max.templates.js
*/
var max = max || {};

/**
 * @fileoverview Provides hogan compiled templates
 *               ready to render.
 */


max.templates = function() {

// construct and compile templates
var MSTCH_MAXUI_MAIN_UI = '\
<div id="maxui-container">\
{{#username}}\
 <div id="maxui-mainpanel">\
\
   <div id="maxui-conversations" style="height:0px; {{showConversations}}">\
       <div id="maxui-common-header" style="height:0px;">\
          <div id="maxui-back-conversations" class="maxui-togglebar">\
              <a class="maxui-icon-" href="#"> {{literals.conversations_list}}</a>\
              <h3 class="maxui-title">displayName</h3>\
          </div>\
       </div>\
       <div class="maxui-wrapper">\
           <div id="maxui-conversations-list" class="maxui-activities">\
               <span id="maxui-info">{{literals.no_conversations}}<span>\
           </div>\
\
           <div id="maxui-messages" style="{{messagesStyle}}">\
               <div id="maxui-message-list">\
               </div>\
           </div>\
        </div>\
           <div id="maxui-scrollbar">\
                  <div class="maxui-dragger handle"/>\
           </div>\
   </div>\
\
<div id="maxui-show-conversations" class="maxui-togglebar maxui-icon-" style="{{showConversationsToggle}}"><a href="#">{{literals.conversations}}</a></div>\
\
    <div id="maxui-conversation-predictive" class="maxui-predictive" style="display:none;"><ul></ul></div>\
    <div id="maxui-add-people-box" style="display:none;">\
        <div>\
          <label class="maxui-label">{{literals.participants}}: <span class="maxui-count">(1/20)</span></label>\
          <input tabindex="20" type="text" data-literal="{{literals.search_people}}" value="{{literals.search_people}}" class="maxui-text-input" id="add-user-input">\
        </div>\
        <div id="maxui-new-participants" style="display:none;"></div>\
        <div id="maxui-new-displayName" style="display:none;">\
            <label class="maxui-label">{{literals.conversation_name}}: </label>\
            <input tabindex="21" type="text" class="maxui-simple-text-input"/>\
        </div>\
    </div>\
\
   <div id="maxui-newactivity">\
   </div>\
\
   <div id="maxui-search" class="folded">\
       <a id="maxui-search-toggle" class="maxui-disabled maxui-icon-" href="#" alt="obre-tanca"></a>\
       <a href="#" id="maxui-favorites-filter" title="{{literals.favorites_filter_hint}}"><i class="maxui-icon-star"/></a>\
       <div id="maxui-search-box">\
          <input id="maxui-search-text" type="search" data-literal="{{literals.search_text}}" class="maxui-empty maxui-text-input" value="{{literals.search_text}}" />\
       </div>\
       <div id="maxui-search-filters"></div>\
   </div>\
\
   <div id="maxui-show-timeline" class="maxui-togglebar maxui-icon-" style="{{showTimelineToggle}}"><a href="#">{{literals.activity}}</a></div>\
\
      <div id="maxui-activity-sort">\
        <a class="maxui-sort-action maxui-most-recent active" href="#">{{literals.recent_activity}}</a>\
        /\
        <a class="maxui-sort-action maxui-most-valued" href="#">{{literals.valued_activity}}</a>\
      </div>\
   <div id="maxui-timeline" style="{{showTimeline}}">\
      <div class="maxui-wrapper">\
          <div id="maxui-preload" class="maxui-activities" style="height:0px;overflow:hidden">\
              <div class="maxui-wrapper">\
              </div>\
          </div>\
          <div id="maxui-activities" class="maxui-activities">\
          </div>\
          <div id="maxui-more-activities">\
              <input type="button" class="maxui-button" value="{{literals.load_more}}">\
          </div>\
      </div>\
   </div>\
  </div>\
 </div>\
{{/username}}\
{{^username}}\
  No s\'ha definit cap usuari\
{{/username}}\
</div>\
';

var MSTCH_MAXUI_POSTBOX = '\
      <a href="#" class="maxui-avatar">\
          <img src="{{avatar}}">\
      </a>\
      <div id="maxui-newactivity-box">\
           <textarea class="maxui-empty maxui-text-input" data-literal="{{textLiteral}}">{{textLiteral}}</textarea>\
           <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{buttonLiteral}}">\
      </div>\
      <div id="maxui-predictive" class="maxui-predictive" style="display:none;"><ul></ul></div>\
';

var MSTCH_MAXUI_ACTIVITY = '\
<div class="maxui-activity" id="{{id}}" userid="{{actor.id}}" username="{{actor.username}}">\
    <div class="maxui-activity-content">\
        <div class="maxui-topright">\
            {{^showLikesCount}}<span class="maxui-publisheddate">{{date}}</span>{{/showLikesCount}}\
            {{#showLikesCount}}<span class="maxui-likescount"><strong>{{likes}}</strong><i class="maxui-icon-thumbs-up"></i></span>{{/showLikesCount}}\
        </div>\
        <div class="maxui-actor">\
              <a href="#"><span class="maxui-avatar"><img src="{{avatarURL}}"></span>\
		          <span class="maxui-displayname">{{actor.displayName}}</span></a>\
          <span class="maxui-username">{{actor.username}}&nbsp;</span>\
        </div>\
        <div class="maxui-activity-message">\
            <p class="maxui-body">{{&text}}</p>\
        </div>\
    </div>\
    <div class="maxui-footer">\
        {{#publishedIn}}\
        <div class="maxui-origin maxui-icon-">\
               {{literals.context_published_in}}\
               <a href="{{publishedIn.url}}">{{publishedIn.displayName}}</a>\
               {{#via}}\
                   {{literals.generator_via}}\
                   <span class="maxui-via">\
                   {{via}}\
                   </span>\
               {{/via}}\
        </div>\
        {{/publishedIn}}\
        <div class="maxui-actions">\
            <a href="" class="maxui-action maxui-commentaction maxui-icon- {{^replies}}maxui-empty{{/replies}}"><strong>{{replies.length}}</strong> {{literals.toggle_comments}}</a>\
            <a href="" class="maxui-action maxui-favorites {{#favorited}}maxui-favorited{{/favorited}} maxui-icon-">{{literals.favorite}}</a>\
            <a href="" class="maxui-action maxui-likes {{#liked}}maxui-liked{{/liked}} maxui-icon-">{{literals.like}}</a>\
            {{#canDeleteActivity}}\
            <a href="" class="maxui-action maxui-delete maxui-icon-">{{literals.delete_activity_icon}}</a>\
            <div class="maxui-popover left">\
                <div class="maxui-arrow"></div>\
                    <h3 class="maxui-popover-title">{{literals.delete_activity_confirmation}}</h3>\
                    <div class="maxui-popover-content">\
                      <input type="button" class="maxui-button delete" value="{{literals.delete_activity_delete}}">\
                      <input type="button" class="maxui-button cancel" value="{{literals.delete_activity_cancel}}">\
                    </div>\
            </div>\
            {{/canDeleteActivity}}\
            \
        </div>\
    </div>\
\
    <div class="maxui-comments" style="display: none">\
        <div class="maxui-commentsbox">\
            {{#replies}}\
                {{> comment}}\
            {{/replies}}\
        </div>\
        <div class="maxui-newcommentbox">\
                <textarea class="maxui-empty maxui-text-input" id="maxui-commentBox" data-literal="{{literals.new_comment_text}}">{{literals.new_comment_text}}</textarea>\
                <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{literals.new_comment_post}}"/>\
        </div>\
    </div>\
\
    <div class="maxui-clear"></div>\
</div>\
';

var MSTCH_MAXUI_CONVERSATION = '\
<div class="maxui-conversation" id="{{id}}" data-displayname="{{displayName}}">\
    <div class="maxui-activity-content">\
        <div class="maxui-topright">\
            <span class="maxui-publisheddate">{{date}}</span>\
            <a class="maxui-enterconversation maxui-icon-" href="#"></a>\
        </div>\
        <div class="maxui-actor">\
              <a href="#"><span class="maxui-avatar"><img src="{{avatarURL}}"></span>\
              <span class="maxui-displayname">{{displayName}}</span></a>\
              <span class="maxui-message-count">{{messages}}</span>\
        </div>\
        <div>\
            <p class="maxui-body">{{&text}}</p>\
        </div>\
    </div>\
\
    <div class="maxui-clear"></div>\
</div>\
';

var MSTCH_MAXUI_MESSAGE = '\
<div class="maxui-message {{origin}}" id="{{id}}">\
    <div class="maxui-activity-content">\
        <span class="maxui-avatar"><img src="{{avatarURL}}"></span>\
        <div class="maxui-balloon">\
            <p class="maxui-body">{{&text}}</p>\
            <span class="maxui-publisheddate">{{date}}</span>\
        </div>\
    </div>\
    <div class="maxui-clear"></div>\
</div>\
';

var MSTCH_MAXUI_COMMENT = '\
<div class="maxui-comment" id="{{id}}" userid="{{actor.id}}" displayname="{{actor.username}}">\
    <div class="maxui-activity-content">\
       <span class="maxui-publisheddate">{{date}}</span>\
       <div class="maxui-actor">\
      	   <a href="#">\
		       <span class="maxui-avatar"><img src="{{avatarURL}}"></span>\
		       <span class="maxui-displayname">{{actor.displayName}}</span></a> \
	         <span class="maxui-username">{{actor.username}}</span>\
       </div>\
       <div>\
           <p class="maxui-body">{{&text}}</p>\
           {{#canDeleteComment}}\
           <span class="maxui-delete-comment maxui-icon-"></span>\
           <div class="maxui-popover left">\
                <div class="maxui-arrow"></div>\
                    <h3 class="maxui-popover-title">{{literals.delete_activity_confirmation}}</h3>\
                    <div class="maxui-popover-content">\
                      <input type="button" class="maxui-button delete" value="{{literals.delete_activity_delete}}">\
                      <input type="button" class="maxui-button cancel" value="{{literals.delete_activity_cancel}}">\
                    </div>\
           </div>\
           {{/canDeleteComment}}\
       </div>\
    </div>\
</div>\
';

var MSTCH_MAXUI_PREDICTIVE_ITEM = '\
<li class="{{cssclass}}">\
{{username}}\
</li>\
';


var MSTCH_MAXUI_FILTERS = '\
{{#filters}}\
    {{#visible}}\
    <div class="maxui-filter maxui-{{type}}" type="{{type}}" value="{{value}}"><span>{{prepend}}{{value}}<a class="maxui-close" href=""><i class="maxui-icon-cancel-circled" alt="tanca"/></a></span></div>\
    {{/visible}}\
{{/filters}}\
';

var MSTCH_MAXUI_PARTICIPANTS = '\
{{#persons}}\
<div class="maxui-filter maxui-participant" type="participant" username="{{username}}"><span>{{prepend}}{{username}}<a class="maxui-close" href=""><i class="maxui-icon-cancel-circled" alt="tanca"/></a></span></div>\
{{/persons}}\
';

var templates = {
         mainUI: Hogan.compile(MSTCH_MAXUI_MAIN_UI),
        postBox: Hogan.compile(MSTCH_MAXUI_POSTBOX),
       activity: Hogan.compile(MSTCH_MAXUI_ACTIVITY),
        comment: Hogan.compile(MSTCH_MAXUI_COMMENT),
        filters: Hogan.compile(MSTCH_MAXUI_FILTERS),
   participants: Hogan.compile(MSTCH_MAXUI_PARTICIPANTS),
   conversation: Hogan.compile(MSTCH_MAXUI_CONVERSATION),
        message: Hogan.compile(MSTCH_MAXUI_MESSAGE),
     predictive: Hogan.compile(MSTCH_MAXUI_PREDICTIVE_ITEM)
  }

  return templates
}
/*
* max.literals.js
*/
var max = max || {};

/**
 * @fileoverview Provides literals in several languages
  */


max.literals = function(language) {

    var maxui = {}
    maxui['en'] = {'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                       'new_activity_text': 'Write something...',
                       'activity': 'activity',
                       'conversations': 'private conversations',
                       'conversations_list': 'conversations list',
                       'participants': 'Talk to',
                       'search_people': "Write somebody's name...",
                       'conversation_name': 'Conversation name',
                       'message': 'Message',
                       'no_conversations': 'No conversations already',
                       'no_match_found': 'No match found',
                       'new_conversation_text': 'Add participants and send a message to start a conversation',
                       'new_activity_post': "Post activity",
                       'toggle_comments': "comments",
                       'new_comment_text': "Comment something...",
                       'new_comment_post': "Post comment",
                       'load_more': "Load more",
                       'context_published_in': "Published in",
                       'generator_via': "via",
                       'search_text': "Search...",
                       'and_more': "and more...",
                       'new_message_post': "Send message",
                       'post_permission_unauthorized': "You''re not authorized to post on this context",
                       'post_permission_not_here': "You're not mentioning @anyone",
                       'post_permission_not_enough_participants': "You have to add participants",
                       'post_permission_missing_displayName': "You have to name the conversation",
                       'delete_activity_confirmation': "Are you sure?",
                       'delete_activity_delete': "Delete",
                       'delete_activity_cancel': "Cancel",
                       'delete_activity_icon': "delete",
                       'favorites_filter_hint': 'Filter by favorited activity',
                       'favorites': 'Favorites',
                       'favorite': 'favorite',
                       'unfavorite': 'unfavorite',
                       'like': 'like',
                       'unlike': 'unlike',
                       'recent_activity': "Latest activity",
                       'valued_activity': "Most valued activity",
                       'recent_favorited_activity': "Latest favorites",
                       'valued_favorited_activity': "Most valued favorites"                       
        }

    maxui['es'] = {'months': ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                       'new_activity_text': 'Escribe algo...',
                       'activity': 'actividad',
                       'conversations': 'conversaciones privadas',
                       'conversations_list': 'lista de conversaciones',
                       'participants': 'Conversar con',
                       'search_people': 'Escribe el nombre de alguien...',
                       'conversation_name': 'Nombre de la conversación',
                       'message': 'Mensaje',
                       'no_conversations': 'No hay conversaciones',
                       'no_match_found': 'No hay coincidencias',
                       'new_conversation_text': 'Añade participantes y envia el mensaje para iniciar una conversación',
                       'new_activity_post': "Publica",
                       'toggle_comments': "comentarios",
                       'new_comment_text': "Comenta algo...",
                       'new_comment_post': "Comenta",
                       'load_more': "Cargar más",
                       'context_published_in': "Publicado en",
                       'generator_via': "via",
                       'search_text': "Busca...",
                       'and_more': "i más...",
                       'new_message_post':'Envia el mensaje',
                       'post_permission_unauthorized': 'No estas autorizado a publicar en este contexto',
                       'post_permission_not_here': "No estas citando a @nadie",
                       'post_permission_not_enough_participants': "Tienes que añadir participantes",
                       'post_permission_missing_displayName': "Tienes que dar un nombre a la conversación",
                       'delete_activity_confirmation': "Estás seguro?",
                       'delete_activity_delete': "Borrar",
                       'delete_activity_cancel': "Cancelar",
                       'delete_activity_icon': "borrar",
                       'favorites_filter_hint': 'Filtra por actividad favorita',
                       'favorites': 'Favoritos',
                       'favorite': 'favorito',
                       'unfavorite': 'quitar favorito',
                       'like': 'me gusta',
                       'unlike': 'ya no me gusta',
                       'recent_activity': "Últimas actividades",
                       'valued_activity': "Actividades más valoradas",
                       'recent_favorited_activity': "Últimas favoritas",
                       'valued_favorited_activity': "Favoritas más valoradas"                       
        }

    maxui['ca'] = {'months': ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'],
                       'new_activity_text': 'Escriu alguna cosa...',
                       'activity': 'activitat',
                       'conversations': 'converses privades',
                       'conversations_list': 'llista de converses',
                       'participants': 'Conversa amb',
                       'search_people': "Escriu el nom d''algú...",
                       'conversation_name': 'Nom de la conversa',
                       'message': 'Missatge',
                       'no_conversations': 'No hi ha converses',
                       'no_match_found': "No s'han trobat coincidències",
                       'new_conversation_text': 'Afegeix participants i envia el missatge per iniciar una conversa',
                       'new_activity_post': "Publica",
                       'toggle_comments': "comentaris",
                       'new_comment_text': "Comenta alguna cosa...",
                       'new_comment_post': "Comenta",
                       'load_more': "Carrega'n més",
                       'context_published_in': "Publicat a",
                       'generator_via': "via",
                       'search_text': "Busca...",
                       'and_more': "i més...",
                       'new_message_post':'Envia el missatge',
                       'post_permission_unauthorized': 'No estàs autoritzat a publicar en aquest contexte',
                       'post_permission_not_here': "No estas citant a @ningú",
                       'post_permission_not_enough_participants': "Has d'afegir participants",
                       'post_permission_missing_displayName': "Tens que posar nom a la conversa",
                       'delete_activity_confirmation': "Estàs segur?",
                       'delete_activity_delete': "Esborra",
                       'delete_activity_cancel': "No ho toquis!",
                       'delete_activity_icon': "esborra",
                       'favorites_filter_hint': 'Filtra per activitat favorita',
                       'favorites': 'Favorits',
                       'favorite': 'favorit',
                       'unfavorite': 'treure favorit',
                       'like': "m'agrada",
                       'unlike': "ja no m'agrada",
                       'recent_activity': "Darreres activitats",
                       'valued_activity': "Activitats més valorades",
                       'recent_favorited_activity': "Darreres favorites",
                       'valued_favorited_activity': "Favorites més valorades"

        }

    return maxui[language]
}
/*
* max.utils.js
*/
var max = max || {};

/**
 * @fileoverview Provides support functions not directly
 *               related to UI construction
 **/
max.utils = function() {

  var settings = undefined

  return {

    setSettings: function(maxui_settings) {
      settings = maxui_settings
    },

    /**
    *    Stops propagation of an event, to avoid arrows, esc, enter keys
    *    bubbling to an input, Used in conjunction with the users prediction box
    *
    *    @param {Event} e       The DOM event we want to freeze
    **/
    freezeEvent: function (e) {
          if (e.preventDefault) e.preventDefault();
          e.returnValue = false;
          e.cancelBubble = true;
          if (e.stopPropagation) e.stopPropagation();
          return false;
    },

    /**  Strips whitespace at the beggining and end of a string and optionaly between
    *
    *    @param {String} s       A text that may contain whitespaces
    *    @param {Boolean} multi  If true, reduces multiple consecutive whitespaces to one
    **/
    normalizeWhiteSpace: function (s, multi) {

        s = s.replace(/(^\s*)|(\s*$)/gi,"");
        s = s.replace(/\n /,"\n");

        var trimMulti=true
        if (arguments.length>1)
            trimMulti=multi
        if (trimMulti==true)
            s = s.replace(/[ ]{2,}/gi," ");
        return s;
    },

    /**  Searches for urls and hashtags in text and transforms to hyperlinks
    *    @param {String} text     String containing 0 or more valid links embedded with any other text
    **/
    formatText: function (text){
        if (text) {

            // Format hyperlinks
            text = text.replace(
                /((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi,
                function(url){
                    var full_url = url;
                    if (!full_url.match('^https?:\/\/')) {
                        full_url = 'http://' + full_url;
                    }
                    return '<a href="' + full_url + '">' + url + '</a>';
                }
            );

            // Format hashtags links
            text = text.replace(
                /(\s|^)#{1}(\w+)/gi,
                function(){
                    var pre = arguments[1]
                    var tag = arguments[2]
                    return '<a class="maxui-hashtag" href="#" value="'+tag+'">'+pre+'#'+tag+'</a>';
                }
            );

            // Format line breaks
            text = text.replace(/\r?\n/gi, '<br/>')

        }
        return text;
    },

    /**  Identifies cors funcionalities and returns a boolean
         indicating wheter the browser is or isn't CORS capable
    **/
    isCORSCapable: function() {
        var xhrObject = new XMLHttpRequest();
            //check if the XHR tobject has CORS functionalities
            if (xhrObject.withCredentials!=undefined){
                return true;
              }
            else {
                return false;
              }
    },

    /**  Removes elements from array by value
    **/
    removeValueFrom: function(arr){
        var what, a= arguments, L= a.length, ax;
        while(L> 1 && arr.length){
            what= a[--L];
            while((ax= arr.indexOf(what))!= -1){
                arr.splice(ax, 1);
            }
        }
        return arr;
    },

    /**  Returns the numner of milliseconds since epoch
    **/
    timestamp: function() {
        var date = new Date()
        return date / 1
    },


    /**  Returns an human readable date from a timestamp in rfc3339 format (cross-browser)
    *    @param {String} timestamp    A date represented as a string in rfc3339 format '2012-02-09T13:06:43Z'
    **/
    formatDate: function(timestamp, lang) {
        var today = new Date()
        var thisdate = new Date()
        var match = timestamp.match(
          "^([-+]?)(\\d{4,})(?:-?(\\d{2})(?:-?(\\d{2})" +
          "(?:[Tt ](\\d{2})(?::?(\\d{2})(?::?(\\d{2})(?:\\.(\\d{1,3})(?:\\d+)?)?)?)?" +
          "(?:[Zz]|(?:([-+])(\\d{2})(?::?(\\d{2}))?)?)?)?)?)?$");
        if (match) {
            for (var ints = [2, 3, 4, 5, 6, 7, 8, 10, 11], i = ints.length - 1; i >= 0; --i)
                match[ints[i]] = (typeof match[ints[i]] != "undefined" && match[ints[i]].length > 0) ? parseInt(match[ints[i]], 10) : 0;

            if (match[1] == '-') // BC/AD
                match[2] *= -1;

            var ms = Date.UTC(
               match[2], // Y
               match[3] - 1, // M
               match[4], // D
               match[5], // h
               match[6], // m
               match[7], // s
               match[8] // ms
              );

            if (typeof match[9] != "undefined" && match[9].length > 0) // offset
                ms += (match[9] == '+' ? -1 : 1) * (match[10]*3600*1000 + match[11]*60*1000); // oh om
            if (match[2] >= 0 && match[2] <= 99) // 1-99 AD
                ms -= 59958144000000;

            thisdate.setTime(ms);
            if ((today.getTime() - ms ) < 259200000) {
                formatted = jQuery.easydate.format_date(thisdate, lang)
            } else {
                if (lang == 'en') {
                  formatted = '{0} {1}'.format(match[4], settings.literals.months[match[3]-1])
                } else if (lang == 'es') {
                  formatted = '{0} de {1}'.format(match[4], settings.literals.months[match[3]-1])
                } else if (lang == 'ca') {
                  prefix = 'de '
                  if (match[3] == 4 || match[3] == 8 || match[3] == 10 ) {
                    prefix = "d'"
                  }
                  formatted = '{0} {2}{1}'.format(match[4], settings.literals.months[match[3]-1], prefix)
                }

                // append year if post is + year old
                if ((today.getTime() - ms ) > 31536000000) {
                    formatted += ' ' + match[2]
                }

            }
            return formatted
         }
         else
             return null;
    },

    /**  Returns an utf8 decoded string
    *    @param {String} str_data    an utf-8 String
    **/
    utf8_decode: function(str_data) {
        // Converts a UTF-8 encoded string to ISO-8859-1
        //
        // version: 1109.2015
        // discuss at: http://phpjs.org/functions/utf8_decode
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // +      input by: Aman Gupta
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: Norman "zEh" Fuchs
        // +   bugfixed by: hitwork
        // +   bugfixed by: Onno Marsman
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: utf8_decode('Kevin van Zonneveld');
        // *     returns 1: 'Kevin van Zonneveld'
        var tmp_arr = [],
            i = 0,
            ac = 0,
            c1 = 0,
            c2 = 0,
            c3 = 0;

        str_data += '';

        while (i < str_data.length) {
            c1 = str_data.charCodeAt(i);
            if (c1 < 128) {
                tmp_arr[ac++] = String.fromCharCode(c1);
                i++;
            } else if (c1 > 191 && c1 < 224) {
                c2 = str_data.charCodeAt(i + 1);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = str_data.charCodeAt(i + 1);
                c3 = str_data.charCodeAt(i + 2);
                tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }

        return tmp_arr.join('');
    },

  sha1: function(msg) {

          function rotate_left(n,s) {
            var t4 = ( n<<s ) | (n>>>(32-s));
            return t4;
          };

          function lsb_hex(val) {
            var str="";
            var i;
            var vh;
            var vl;

            for( i=0; i<=6; i+=2 ) {
              vh = (val>>>(i*4+4))&0x0f;
              vl = (val>>>(i*4))&0x0f;
              str += vh.toString(16) + vl.toString(16);
            }
            return str;
          };

          function cvt_hex(val) {
            var str="";
            var i;
            var v;

            for( i=7; i>=0; i-- ) {
              v = (val>>>(i*4))&0x0f;
              str += v.toString(16);
            }
            return str;
          };


          function Utf8Encode(string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

              var c = string.charCodeAt(n);

              if (c < 128) {
                utftext += String.fromCharCode(c);
              }
              else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
              }
              else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
              }

            }

            return utftext;
          };

      var blockstart;
      var i, j;
      var W = new Array(80);
      var H0 = 0x67452301;
      var H1 = 0xEFCDAB89;
      var H2 = 0x98BADCFE;
      var H3 = 0x10325476;
      var H4 = 0xC3D2E1F0;
      var A, B, C, D, E;
      var temp;

      msg = Utf8Encode(msg);

      var msg_len = msg.length;

      var word_array = new Array();
      for( i=0; i<msg_len-3; i+=4 ) {
        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
        word_array.push( j );
      }

      switch( msg_len % 4 ) {
        case 0:
          i = 0x080000000;
        break;
        case 1:
          i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
        break;

        case 2:
          i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
        break;

        case 3:
          i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8  | 0x80;
        break;
      }

      word_array.push( i );

      while( (word_array.length % 16) != 14 ) word_array.push( 0 );

      word_array.push( msg_len>>>29 );
      word_array.push( (msg_len<<3)&0x0ffffffff );


      for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {

        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for( i= 0; i<=19; i++ ) {
          temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }

        for( i=20; i<=39; i++ ) {
          temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }

        for( i=40; i<=59; i++ ) {
          temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }

        for( i=60; i<=79; i++ ) {
          temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
          E = D;
          D = C;
          C = rotate_left(B,30);
          B = A;
          A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;

      }

      var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

      return temp.toLowerCase();

    }

  }

}/*
* max.client.js
*/
if (!Object.keys) {
    Object.keys = function (obj) {
        var keys = [],
            k;
        for (k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
                keys.push(k);
            }
        }
        return keys;
    };
}

String.prototype.format = function(){
    var pattern = /\{\d+\}/g;
    var args = arguments;
    return this.replace(pattern, function(capture){ return args[capture.match(/\d+/)]; });
    }

function MaxClient () {

    this.ROUTES = {   users : '/people',
                      user : '/people/{0}',
                      avatar : '/people/{0}/avatar',
                      user_activities : '/people/{0}/activities',
                      timeline : '/people/{0}/timeline',
                      user_comments : '/people/{0}/comments',
                      user_shares : '/people/{0}/shares',
                      user_likes : '/people/{0}/likes',
                      follows : '/people/{0}/follows',
                      follow : '/people/{0}/follows/{1}',
                      subscriptions : '/people/{0}/subscriptions',
                      activities : '/contexts/{0}/activities',
                      activity : '/activities/{0}',
                      comments : '/activities/{0}/comments',
                      comment : '/activities/{0}/comments/{1}',
                      likes : '/activities/{0}/likes',
                      like : '/activities/{0}/likes/{1}',
                      favorites : '/activities/{0}/favorites',
                      favorite : '/activities/{0}/favorites/{1}',
                      shares : '/activities/{0}/shares',
                      share : '/activities/{0}/shares/{1}',
                      conversations : '/conversations',
                      messages: '/conversations/{0}/messages',
                      context: '/contexts/{0}'

                   }
};

MaxClient.prototype.configure = function(settings) {
  this.url = settings.server
	this.mode = settings.mode
  this.token = settings.token
  this.actor = {
            "objectType": "person",
            "username": settings.username
        }

};

MaxClient.prototype.POST = function(route, query, callback) {
    maxclient = this
    resource_uri = '{0}{1}'.format(this.url, route)
    // Get method-defined triggers
    var triggers = {}
    if (arguments.length>3) triggers = arguments[3]

    if (this.mode=='jquery')
    {
           jQuery.ajax( {url: resource_uri,
             beforeSend: function(xhr) {
                 xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                 xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                 xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
             },
			     type: 'POST',
			     data: JSON.stringify(query),
			     async: true,
			     dataType: 'json'
			    })
         .done( function(result) {
            callback.call(result)
            if (triggers.done) jQuery(window).trigger(triggers.done, result)
          })
         .fail( function(xhr) {
            jQuery(window).trigger('maxclienterror',xhr)
            if (triggers.fail) jQuery(window).trigger(triggers.fail, xhr)
          })

    }
    else
    {
	    var params = {}
	    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON
	    params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST
	    params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 1
	    params[gadgets.io.RequestParameters.POST_DATA] = JSON.stringify(query)

      var headers = {"X-Oauth-Token": maxclient.token,
                     "X-Oauth-Username": maxclient.actor.username,
                     "X-Oauth-Scope": 'widgetcli'}
      params[gadgets.io.RequestParameters.HEADERS] = headers

	    gadgets.io.makeRequest(
	                   resource_uri,
	                   function(result) { callback.call(result.data) },
	                   params
	                    )


    }
    return true
};

MaxClient.prototype.DELETE = function(route, query, callback) {
    maxclient = this
    resource_uri = '{0}{1}'.format(this.url, route)
    // Get method-defined triggers
    var triggers = {}
    if (arguments.length>2) triggers = arguments[2]

    if (this.mode=='jquery')
    {
           jQuery.ajax( {url: resource_uri,
             beforeSend: function(xhr) {
                 xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                 xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                 xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
                 xhr.setRequestHeader("X-HTTP-Method-Override", 'DELETE');
             },
           type: 'POST',
           data: JSON.stringify(query),
           async: true,
           dataType: 'json'
          })
         .done( function(result) {
            callback.call(result)
            if (triggers.done) jQuery(window).trigger(triggers.done, result)
          })
         .fail( function(xhr) {
            jQuery(window).trigger('maxclienterror',xhr)
            if (triggers.fail) jQuery(window).trigger(triggers.fail, xhr)
          })

    }
    else
    {
      var params = {}
      params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON
      params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST
      params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 1
      params[gadgets.io.RequestParameters.POST_DATA] = JSON.stringify(query)

      var headers = {"X-Oauth-Token": maxclient.token,
                     "X-Oauth-Username": maxclient.actor.username,
                     "X-Oauth-Scope": 'widgetcli'}
      params[gadgets.io.RequestParameters.HEADERS] = headers

      gadgets.io.makeRequest(
                     resource_uri,
                     function(result) { callback.call(result.data) },
                     params
                      )


    }
    return true
};
MaxClient.prototype.GET = function(route, query, callback) {
    maxclient = this
    resource_uri = '{0}{1}'.format(this.url, route)

    // Get method-defined triggers
    var triggers = {}
    if (arguments.length>3) triggers = arguments[3]

    if (Object.keys(query).length >0)
    {
        resource_uri+='?'+jQuery.param(query, true)
    }
    if (this.mode=='jquery')
    {
	    jQuery.ajax( {url: resource_uri,
             beforeSend: function(xhr) {
                 xhr.setRequestHeader("X-Oauth-Token", maxclient.token);
                 xhr.setRequestHeader("X-Oauth-Username", maxclient.actor.username);
                 xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
             },
			     type: 'GET',
			     async: true,
			     dataType: 'json'
			    })
         .done( function(result) {
            if (triggers.done) jQuery(window).trigger(triggers.done)
            callback.call(result)
          })
         .fail( function(xhr) {
            jQuery(window).trigger('maxclienterror',xhr)
            if (triggers.fail) jQuery(window).trigger(triggers.fail)
          })

	}
	else
	{
	    var params = {}
	    params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON
	    params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.GET
	    params[gadgets.io.RequestParameters.REFRESH_INTERVAL] = 1

      var headers = {"X-Oauth-Token": maxclient.token,
                     "X-Oauth-Username": maxclient.actor.username,
                     "X-Oauth-Scope": 'widgetcli'}
      params[gadgets.io.RequestParameters.HEADERS] = headers

	    gadgets.io.makeRequest(
	                   resource_uri,
	                   function(result) { callback.call(result.data) },
	                   params
	                    )

     }
   //return {json:ajax_result,statuscode:xhr['statusText']}
   return true
	}

MaxClient.prototype.getUserTimeline = function(username, callback) {
	var route = this.ROUTES['timeline'].format(username);
  if (arguments.length>2)
      var query=arguments[2]
  else
      var query={}
  this.GET(route,query,callback)
};

MaxClient.prototype.getUserData = function(username, callback) {
    var route = this.ROUTES['user'].format(username);
    var query = {}
    this.GET(route,query,callback)
};

MaxClient.prototype.getUsersList = function(userquery, callback) {
    var route = this.ROUTES['users']
    var query = {username:userquery}
    this.GET(route,query,callback)
};

MaxClient.prototype.getContext = function(chash, callback) {
    var route = this.ROUTES['context'].format(chash)
    var query = {}
    this.GET(route,query,callback)
};

MaxClient.prototype.getActivities = function(options, callback) {
  var route = this.ROUTES['activities'].format(options.context);
  var query = {}
  if (arguments.length>2)
      query=arguments[2]
  if (options.tags)
      if (options.tags.length>0)
          query['context_tags'] = options.tags
  this.GET(route,query,callback)
};

MaxClient.prototype.getConversationsForUser = function(username, callback) {
  var route = this.ROUTES['conversations'];
  query={}
  this.GET(route,query,callback)
};

MaxClient.prototype.getMessagesForConversation = function(hash, callback) {
  var route = this.ROUTES['messages'].format(hash);
  query={}
  this.GET(route,query,callback)
};

MaxClient.prototype.getCommentsForActivity = function(activityid, callback) {
  route = this.ROUTES['comments'].format(activityid);
  var query = {}
  this.GET(route,query,callback)
};


MaxClient.prototype.addComment = function(comment, activity, callback) {

    var query = {
        "actor": {},
        "object": {
            "objectType": "comment",
            "content": ""
            }
        }

    query.actor = this.actor
    query.object.content = comment

	  route = this.ROUTES['comments'].format(activity);
    this.POST(route,query,callback)

};


MaxClient.prototype.addActivity = function(text,contexts,callback) {
    query = {
        "object": {
            "objectType": "note",
            "content": ""
            }
        }
     if (contexts.length>0)
        { query.contexts = []
          for (ct=0;ct<contexts.length;ct++)
          {
            query.contexts.push({'objectType':'context','url':contexts[ct]})
          }
        }

    query.object.content = text

    //We have a generator
    if (arguments.length>3)
        {
          query.generator = arguments[3]
        }

  	route = this.ROUTES['user_activities'].format(this.actor.username);
    trigger = {'done': 'maxui-posted-activity',
               'fail': 'maxui-failed-activity'}
    this.POST(route,query,callback, trigger)
};

MaxClient.prototype.removeActivity = function(activity_id,callback) {
    route = this.ROUTES['activity'].format(activity_id);
    this.DELETE(route, {}, callback)
}

MaxClient.prototype.removeActivityComment = function(activity_id,comment_id,callback) {
    route = this.ROUTES['comment'].format(activity_id, comment_id);
    this.DELETE(route, {}, callback)
}

MaxClient.prototype.addMessageAndConversation = function(params,callback) {
    query = {
        "object": {
            "objectType": "note",
            "content": params.message
            },
        "contexts": [ { 'objectType': 'conversation',
                        'participants': params.participants
                      }
                    ]
        }

    if (params.displayName) {
      query.contexts[0].displayName = params.displayName
    }


    route = this.ROUTES['conversations']
    this.POST(route,query,callback)
};

MaxClient.prototype.addMessage = function(text,chash,callback) {
    query = {
        "object": {
            "objectType": "note",
            "content": ""
            }
        }

    query.object.content = text

    route = this.ROUTES['messages'].format(chash)
    this.POST(route,query,callback)
};

MaxClient.prototype.follow = function(username, callback ) {
    query = {
        "object": {
            "objectType": "person",
            "username": ""
            }
        }

    query.object.username = username

	route = this.ROUTES['follow'].format(this.actor.username,username);
    resp = this.POST(route,query, callback)
};

MaxClient.prototype.favoriteActivity = function(activityid, callback ) {
  query = {}

  route = this.ROUTES['favorites'].format(activityid);
  resp = this.POST(route, query, callback)
};

MaxClient.prototype.unfavoriteActivity = function(activityid, callback ) {
  query = {}
  route = this.ROUTES['favorite'].format(activityid, this.actor.username);
  resp = this.DELETE(route, query, callback)
};

MaxClient.prototype.likeActivity = function(activityid, callback ) {
  query = {}

  route = this.ROUTES['likes'].format(activityid);
  resp = this.POST(route, query, callback)
};

MaxClient.prototype.unlikeActivity = function(activityid, callback ) {
  query = {}
  route = this.ROUTES['like'].format(activityid, this.actor.username);
  resp = this.DELETE(route, query, callback)
};/*
* max.ui.js
*/
(function(jq) {
    /**
    *    MaxUI plugin definition
    *    @param {Object} options    Object containing overrides for default values
    **/
    jq.fn.maxUI = function(options) {

        // Keep a reference of the context object
        var maxui = this
        maxui.templates = max.templates()
        maxui.utils = max.utils()

        var defaults = {'maxRequestsAPI' : 'jquery',
                        'maxServerURL' : 'https://max.upc.edu',
                        'readContext': undefined,
                        'writeContexts' : [],
                        'activitySource': 'timeline',
                        'enableAlerts': false,
                        'UISection': 'timeline',
                        'disableTimeline': false,
                        'disableConversations': false,
                        'conversationsSection': 'conversations',
                        'currentConversationSection': 'conversations',
                        'activitySortOrder': 'activities',
                        'transports': undefined,
                        'domain': undefined,
                        'maximumConversations': 20,
                        'contextTagsFilter': []
                        }

        maxui.scrollbar = {
            dragging: false,
            width: 10,
            handle: {
                height: 20
            }
        }

        // extend defaults with user-defined settings
        maxui.settings = jq.extend(defaults,options)

        // save the undotted username for stomp messages
        maxui.settings.stomp_username = maxui.settings.username.replace('.','_')

        // Check timeline/activities consistency
        if (maxui.settings.UISection == 'timeline' && maxui.settings.activitySource == 'timeline' && maxui.settings.readContext)
        {
            maxui.settings.readContext = undefined
            maxui.settings.writeContexts = []
        }

        // Extract domain out of maxserver url, if present
        // Matches several cases, but always assumes the domain is the last
        // part of the path. SO, urls with subpaths, always will be seen as a
        // domain urls, examples:
        //
        // http://max.upcnet.es  --> NO DOMAIN
        // http://max.upcnet.es/  --> NO DOMAIN
        // http://max.upcnet.es/demo  --> domain "demo"
        // http://max.upcnet.es/demo/  --> domain "demo"
        // http://max.upcnet.es/subpath/demo/  --> domain "demo"
        // http://max.upcnet.es/subpath/demo  --> domain "demo"

        server_regex = regex = /(?:^https?:\/\/)*(.*?)(?:\/([^\/]*)+)?\/?$/g;
        groups = regex.exec(maxui.settings.maxServerURL)
        if (groups[2]) {
            maxui.settings.domain = groups[2]
        }


        // Get language from options or set default.
        // Set literals in the choosen language and extend from user options
        maxui.language = options.language || 'en'
        user_literals = options.literals || {}
        maxui.settings.literals = jq.extend(max.literals(maxui.language), user_literals)

        // Configure maxui without CORS if CORS not available
        if (!maxui.utils.isCORSCapable())
            {
                // IF it has been defined an alias, set as max server url
                if (maxui.settings.maxServerURLAlias)
                maxui.settings.maxServerURL = maxui.settings.maxServerURLAlias
            }

        if (maxui.settings.readContext)
        {
            // Calculate readContextHash
            maxui.settings.readContextHash = maxui.utils.sha1(maxui.settings.readContext)

            // Add read context to write contexts
            maxui.settings.writeContexts.push(maxui.settings.readContext)

            // Store the hashes of the write contexts
            maxui.settings.writeContextsHashes = []
            for (wc=0;wc<maxui.settings.writeContexts.length;wc++) {
                maxui.settings.writeContextsHashes.push(maxui.utils.sha1(maxui.settings.writeContexts[wc]))
            }
        }

        //set default avatar and profile url pattern if user didn't provide it
        if (!maxui.settings.avatarURLpattern)
              maxui.settings['avatarURLpattern'] = maxui.settings.maxServerURL+'/people/{0}/avatar'

        if (!maxui.settings.contextAvatarURLpattern)
               maxui.settings['contextAvatarURLpattern'] = maxui.settings.maxServerURL+'/contexts/{0}/avatar'

        if (!maxui.settings.conversationAvatarURLpattern)
               maxui.settings['conversationAvatarURLpattern'] = maxui.settings.maxServerURL+'/conversations/{0}/avatar'

        // Disable profileURL by now

        // if (!maxui.settings.profileURLpattern)
        //        maxui.settings['profileURLpattern'] = maxui.settings.maxServerURL+'/profiles/{0}'

        // Catch errors triggered by failed max api calls
        if (maxui.settings.enableAlerts)
        jq(window).bind('maxclienterror', function(event,xhr) {
            var error = JSON.parse(xhr.responseText)
            alert('The server responded with a "{0}" error, with the following message: "{1}". \n\nPlease try again later or contact administrator at admin@max.upc.edu.'.format(error.error,error.error_description))
        })

        // Init MAX Client
        this.maxClient = new MaxClient()
        var maxclient_config = {  server:    maxui.settings.maxServerURL,
                                    mode:    maxui.settings.maxRequestsAPI,
                                   username: maxui.settings.username,
                                   token:    maxui.settings.oAuthToken
                               }
        this.maxClient.configure(maxclient_config)

        // Make settings available to utils package
        maxui.utils.setSettings(maxui.settings)

        // Get user data and start ui rendering when completed
        this.maxClient.getUserData(maxui.settings.username, function() {

            //Determine if user can write in writeContexts
            var userSubscriptions = {}
            if (this.subscribedTo)
            {
                if (this.subscribedTo)
                {
                    if (this.subscribedTo.length>0)
                    {
                        for (sc=0;sc<this.subscribedTo.length;sc++)
                        {
                            var subscription = this.subscribedTo[sc]
                            userSubscriptions[subscription.hash]={}
                            userSubscriptions[subscription.hash]['permissions']={}
                            for (pm=0;pm<subscription.permissions.length;pm++)
                            {
                                var permission=subscription.permissions[pm]
                                userSubscriptions[subscription.hash]['permissions'][permission]=true
                            }
                        }
                    }
                }
            }

            maxui.settings.subscriptions = userSubscriptions

            // Start socket listener

            if (!maxui.settings.disableConversations) {

                // Collect conversation ids
                maxui.conversations = []
                var talking_items = this.talkingIn || []
                for (co=0;co<talking_items.length;co++) {
                    maxui.conversations.push(talking_items[co].id)
                }

                // Stomp.js boilerplate
                ws = new SockJS(maxui.settings.maxTalkURL);
                maxui.client = Stomp.over(ws);

                 var on_connect = function(x) {
                    for (co=0;co<maxui.conversations.length;co++) {
                        conversation_id = maxui.conversations[co]
                        maxui.client.subscribe('/exchange/{0}'.format(conversation_id), function(d) {maxui.insertMessage(d)})
                    }
                    maxui.client.subscribe('/exchange/new/{0}'.format(maxui.settings.username), function(d) {
                        data = JSON.parse(d.body)
                        if (maxui.settings.UISection == 'conversations' && maxui.settings.conversationsSection == 'conversations')
                            maxui.printConversations( function() { maxui.toggleSection('conversations')
                                                                   $('.maxui-message-count:first').css({'background-color':'red'})
                                                                 })
                        maxui.client.subscribe('/exchange/{0}'.format(data.conversation), function(d) {maxui.insertMessage(d)})
                    });
                };

                var on_error =  function(error) {
                  console.log(error.body);
                };
                if (maxui.settings.enableAlerts)
                    maxui.client.debug = function(a){console.log(a);};

                maxui.client.heartbeat.outgoing = 0;
                maxui.client.heartbeat.incoming = 0;
                var stomp_user_with_domain = ""
                if (maxui.settings.domain) {
                    stomp_user_with_domain += maxui.settings.domain + ':'
                }
                stomp_user_with_domain += maxui.settings.username
                maxui.client.connect(stomp_user_with_domain, maxui.settings.oAuthToken, on_connect, on_error, '/');
            }

            // render main interface

            var showCT = maxui.settings.UISection == 'conversations'
            var showTL = maxui.settings.UISection == 'timeline'
            var toggleTL = maxui.settings.disableTimeline == false && !showTL
            var toggleCT = maxui.settings.disableConversations == false && !showCT
            var containerWidth = maxui.width() - maxui.scrollbar.width

            var params = {
                                  username: maxui.settings.username,
                                  literals: maxui.settings.literals,
                         showConversations: showCT ? 'display:block;' : 'display:none;',
                   showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;',
                              showTimeline: showTL ? 'display:block;' : 'display:none;',
                        showTimelineToggle: toggleTL ? 'display:block;' : 'display:none;',
                             messagesStyle: 'width:{0}px;left:{0}px;'.format(containerWidth)
                     }
            var mainui = maxui.templates.mainUI.render(params)
            maxui.html(mainui)
            if (maxui.settings.UISection=='conversations')
                maxui.printConversations( function() { maxui.bindEvents()
                                                       maxui.toggleSection('conversations')
                                                     })
            else if (maxui.settings.UISection=='timeline')
                maxui.printActivities({}, function() { maxui.bindEvents() })
        })

        // allow jq chaining
        return maxui;
    };


    jq.fn.insertMessage = function(d) {
        maxui = this

        data = JSON.parse(d.body)
        console.log('New message from user {0} on {1}'.format(data.username, data.conversation))
        if (maxui.settings.UISection == 'conversations' && maxui.settings.conversationsSection == 'messages') {
            maxui.printMessages(data.conversation, function() {
                maxui.scrollbar.setContentPosition(100)
            })

        }
        else if (maxui.settings.UISection == 'conversations' && maxui.settings.conversationsSection == 'conversations')
            maxui.printConversations( function() {
                maxui.toggleSection('conversations')
                $('.maxui-message-count:first').css({'background-color':'red'})
            })
    }

    jq.fn.bindEvents =function() {

        maxui = this

        maxui.scrollbar.$dragger = jq('.maxui-dragger')
        maxui.scrollbar.$bar = jq('#maxui-scrollbar')

        jq('#maxui-conversations').on('mousewheel', function(event, delta, deltaX, deltaY) {
            event.preventDefault()
            event.stopPropagation()

            if (maxui.scrollbar.enabled()) {
                var movable_height = maxui.scrollbar.$target.height() - maxui.scrollbar.maxtop - maxui.scrollbar.handle.height
                var actual_margin = parseInt(maxui.scrollbar.$target.css('margin-top'))
                var new_margin = actual_margin + (deltaY * -1 * 30)
                if (new_margin > 0) new_margin = 0
                if (new_margin < (movable_height * -1)) new_margin = movable_height * -1

                maxui.scrollbar.$target.css({'margin-top': new_margin})
                var new_margin = new_margin * -1
                var relative_pos = ( new_margin * 100 ) / movable_height
                maxui.scrollbar.setDraggerPosition(relative_pos)
            }
        })

        maxui.scrollbar.setHeight = function(height) {
            var wrapper_top = $('#maxui-conversations .maxui-wrapper').offset().top - maxui.offset().top -1
            console.log(wrapper_top)
            maxui.scrollbar.$bar.css({'height':height, 'top':wrapper_top})
            maxui.scrollbar.maxtop = height - maxui.scrollbar.handle.height -2
        }
        maxui.scrollbar.setTarget = function(selector) {
            maxui.scrollbar.$target = jq(selector)
        }
        maxui.scrollbar.setDraggerPosition = function(relative_pos) {
            margintop = (maxui.scrollbar.maxtop * relative_pos) / 100
            maxui.scrollbar.$dragger.css({'margin-top': margintop})
        }
        maxui.scrollbar.setContentPosition = function(relative_pos) {
            if (maxui.scrollbar.enabled()) {
                var movable_height = maxui.scrollbar.$target.height() - maxui.scrollbar.maxtop - maxui.scrollbar.handle.height
                var margintop = (movable_height * relative_pos) / 100
                maxui.scrollbar.$target.css({'margin-top': margintop * -1})
                maxui.scrollbar.setDraggerPosition(relative_pos)
            } else {
                maxui.scrollbar.$target.css({'margin-top': ''})
                maxui.scrollbar.setDraggerPosition(0)
            }
        }
        maxui.scrollbar.enabled = function() {
            return maxui.scrollbar.$target.height() > maxui.scrollbar.maxtop
        }

        jq(document).on('mousemove' ,function(event) {

            if (maxui.scrollbar.dragging) {
                event.stopPropagation()
                event.preventDefault()

                // drag only if target content is taller than scrollbar
                if (maxui.scrollbar.enabled()) {

                    // Calculate dragger position, constrained to actual limits
                    var margintop = event.clientY - maxui.scrollbar.$bar.offset().top
                    if (margintop < 0) margintop = 0
                    if (margintop >= maxui.scrollbar.maxtop) margintop = maxui.scrollbar.maxtop

                    // Calculate dragger position relative to 100 and move content
                    var relative_position = (margintop * 100) / maxui.scrollbar.maxtop
                    maxui.scrollbar.setContentPosition(relative_position)
                }
            }
        })

        jq(document.body).on('mousedown', '.maxui-dragger', function(event) {
            event.stopPropagation()
            event.preventDefault()
            maxui.scrollbar.dragging = true
        })

        jq(document).on('mouseup', function(event) {
            maxui.scrollbar.dragging = false
        })


        //Assign click to loadmore
        jq('#maxui-more-activities .maxui-button').click(function (event) {
            event.preventDefault()
            if (jq('#maxui-search').hasClass('folded'))
            {
                maxui.loadMoreActivities()
            }
            else
            {
                last_result_id = jq('.maxui-activity:last').attr('id')
                maxui.reloadFilters(last_result_id)
            }
            })

        //Assign click to toggle search filters if any search filter defined
        jq('#maxui-search-toggle').click(function (event) {
            event.preventDefault()
            if (!jq(this).hasClass('maxui-disabled'))
            {
                jq('#maxui-search').toggleClass('folded')
                if (jq('#maxui-search').hasClass('folded'))
                    maxui.printActivities({})
                else
                    maxui.reloadFilters()
            }
            })

        //Assign Commentbox toggling via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-commentaction',function (event) {
            event.preventDefault()
            window.status=''
            jq(this).closest('.maxui-activity').find('.maxui-comments').toggle(200)
            })

        //Assign Username and avatar clicking via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-actor',function (event) {
            event.preventDefault()
            var actor = jq(this).find('.maxui-username').text()
            maxui.addFilter({type:'actor', value:actor})
            jq('#maxui-search').toggleClass('folded',false)

            })

        //Assign Username and avatar clicking via delegating the click to the activities container
        jq('#maxui-search').on('click','#maxui-favorites-filter',function (event) {
            event.preventDefault()
            var favoritesButton = jq(event.currentTarget)
            var filterFavorites = !favoritesButton.hasClass('active')
            if (filterFavorites) {
                maxui.addFilter({type:'favorites', value:true, visible:false})
                var valued_literal = maxui.settings.literals.valued_favorited_activity
                var recent_literal = maxui.settings.literals.recent_favorited_activity
            } else {
                maxui.delFilter({type:'favorites', value:true})
                var valued_literal = maxui.settings.literals.valued_activity
                var recent_literal = maxui.settings.literals.recent_activity                
            }
            favoritesButton.toggleClass('active', filterFavorites)
            jq('#maxui-activity-sort .maxui-most-recent').text(recent_literal)
            jq('#maxui-activity-sort .maxui-most-valued').text(valued_literal)
            })

        //Assign hashtag filtering via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-hashtag',function (event) {
            event.preventDefault()
            maxui.addFilter({type:'hashtag', value:jq(this).attr('value')})
            jq('#maxui-search').toggleClass('folded',false)
            })

        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-search-filters').on('click','.maxui-close',function (event) {
            event.preventDefault()
            var filter = jq(this.parentNode.parentNode)
            maxui.delFilter({type:filter.attr('type'), value:filter.attr('value')})
            })

        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-new-participants').on('click','.maxui-close',function (event) {
            event.preventDefault()
            var filter = jq(this.parentNode.parentNode)
            maxui.delPerson({username:filter.attr('username')})
            })

        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-new-displayName').on('keyup','input',function (event) {
            event.preventDefault()
            maxui.reloadPersons()

            })

        //Assign user mention suggestion to textarea by click
        jq('#maxui-newactivity').on('click','.maxui-prediction',function (event) {
            event.preventDefault()

            var $selected = jq(this)
            var $area = jq('#maxui-newactivity-box textarea')
            var $predictive = jq('#maxui-newactivity #maxui-predictive')
            var text = $area.val()

            var matchMention = new RegExp('^\\s*@([\\w\\.]+)')
            var match = text.match(matchMention)
            var replacement = text.replace(matchMention, '@'+$selected.text()+' ')
            $predictive.hide()
            $area.val(replacement)
            $area.focus()
            })

        // Close predictive window if clicked outside
        jq(document).on('click', function(event) {
            var $predictive = jq('#maxui-conversation-predictive')
            $predictive.hide()
        })

       //Assign user mention suggestion to input by click
        jq('#maxui-conversation-predictive').on('click','.maxui-prediction',function (event) {
            event.preventDefault()
            console.log('click')
            var $selected = jq(this)
            var $area = jq('#maxui-add-people-box .maxui-text-input')
            var $predictive = jq('#maxui-conversation-predictive')
            var text = $area.val()

            var matchMention = new RegExp('^\\s*([\\w\\.]+)\s*')
            var match = text.match(matchMention)
            var replacement = text.replace(matchMention, $selected.text())

            maxui.addPerson({'username': replacement})
            $predictive.hide()
            $area.val('').focus()
            })

        //Assign activation of conversations section by its button
        jq('#maxui-show-conversations').on('click',function (event) {
            event.preventDefault()
            window.status=''
            maxui.printConversations( function() { maxui.toggleSection('conversations') })

            })

        //Assign activation of conversations section by its button
        jq('#maxui-back-conversations').on('click',function (event) {
            event.preventDefault()
            window.status=''
            maxui.printConversations( function() { maxui.toggleMessages('conversations') })
            })

        //Assign activation of timeline section by its button
        jq('#maxui-show-timeline').on('click',function (event) {
            event.preventDefault()
            window.status=''
            maxui.printActivities({}, function() { maxui.toggleSection('timeline') })
            })

        //Assign activation of messages section by delegating the clicl of a conversation arrow to the conversations container
        jq('#maxui-conversations').on('click', '.maxui-conversation',function (event) {
            event.preventDefault()
            window.status=''
            var conversation_hash = jq(event.target).closest('.maxui-conversation').attr('id')
            var conversation_displayName = jq(event.target).closest('.maxui-conversation').attr('data-displayname')
            maxui.settings.currentConversation = {'hash': conversation_hash, 'displayName': conversation_displayName}
            maxui.printMessages(conversation_hash, function() { maxui.toggleMessages('messages') })
            })

        //Toggle favorite status via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-action.maxui-favorites',function (event) {
            event.preventDefault()
            var $favorites = jq(this)
            var $activity = jq(this).closest('.maxui-activity')
            var activityid = $activity.attr('id')
            var favorited = $favorites.hasClass('maxui-favorited')

            if (favorited) {
                maxui.maxClient.unfavoriteActivity(activityid, function(event) {
                    $favorites.toggleClass('maxui-favorited', false)
                })
            } else {
                maxui.maxClient.favoriteActivity(activityid, function(event) {
                    $favorites.toggleClass('maxui-favorited', true)
                })

            }
        })

        //Toggle like status via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-action.maxui-likes',function (event) {
            event.preventDefault()
            var $likes = jq(this)
            var $activity = jq(this).closest('.maxui-activity')
            var activityid = $activity.attr('id')
            var liked = $likes.hasClass('maxui-liked')

            if (liked) {
                maxui.maxClient.unlikeActivity(activityid, function(event) {
                    $likes.toggleClass('maxui-liked', false)
                })
            } else {
                maxui.maxClient.likeActivity(activityid, function(event) {
                    $likes.toggleClass('maxui-liked', true)
                })
            }
        })

        //Assign activity removal confirmation dialog toggle via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-action.maxui-delete',function (event) {
            console.log('delete')
            event.preventDefault()
            var $activity = jq(this).closest('.maxui-activity')
            var $dialog = $activity.find('.maxui-actions > .maxui-popover')

            if (!$dialog.is(':visible')) {
                jq('.maxui-popover').css({opacity:0}).hide()
                $dialog.show()
                $dialog.animate({opacity:1}, 300)
            } else {
                $dialog.animate({opacity:0}, 300)
                jq('.maxui-popover').css({opacity:0}).hide()
            }
        })

        //Assign activity removal confirmation dialog via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-actions .maxui-button.cancel',function (event) {
            event.preventDefault()
            var $activity = jq(this).closest('.maxui-activity')
            // Hide all visible dialogs
            $popover = jq('.maxui-popover:visible').css({opacity:0})
            $popover.hide()
        })

        //Assign activity removal via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-actions .maxui-button.delete',function (event) {
            console.log('delete activityid')
            event.preventDefault()
            var $activity = jq(this).closest('.maxui-activity')
            var activityid = $activity.attr('id')
            maxui.maxClient.removeActivity(activityid, function(event) {
                var $popover =jq('.maxui-popover:visible').animate({opacity:0}, 300)
                $activity.css({height:$activity.height(), 'min-height':'auto'})
                $activity.animate({height: 0, opacity:0}, 100, function(event) {
                    $activity.remove()
                    $popover.hide()

                })
            })

        })

        //Assign activity comment removal confirmation dialog toggle via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-delete-comment',function (event) {
            event.preventDefault()
            var $comment = jq(this).closest('.maxui-comment')
            var $dialog = $comment.find('.maxui-popover')

            if (!$dialog.is(':visible')) {
                jq('.maxui-popover').css({opacity:0}).hide()
                $dialog.show()
                $dialog.animate({opacity:1}, 300)
            } else {
               $dialog.animate({opacity:0}, 300)
               jq('.maxui-popover').css({opacity:0}).hide()
            }
        })

        //Assign activity comment removal confirmation dialog via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-comment .maxui-button.cancel',function (event) {
            event.preventDefault()
            var $comment = jq(this).closest('.maxui-comment')
            var $dialog = $comment.find('.maxui-popover')

            $popover = jq('.maxui-popover').css({opacity:0})
            $popover.hide()
        })


        //Assign activity comment removal via delegating the click to the activities container
        jq('#maxui-activities').on('click','.maxui-comment .maxui-button.delete',function (event) {
            console.log('delete comment')
            event.preventDefault()
            var $comment = jq(this).closest('.maxui-comment')
            var $activity = $comment.closest('.maxui-activity')
            var activityid = $activity.attr('id')
            var commentid = $comment.attr('id')
            maxui.maxClient.removeActivityComment(activityid, commentid, function() {
                var $popover =jq('.maxui-popover').animate({opacity:0}, 300)
                $comment.css({height:$activity.height(), 'min-height':'auto'})
                $comment.animate({height: 0, opacity:0}, 100, function(event) {
                    $comment.remove()
                    $popover.hide()
                })
            })

        })


        jq('#maxui-activity-sort').on('click', 'a.maxui-sort-action.maxui-most-recent', function (event) {
            event.preventDefault()
            $sortbutton = jq(this)
            if (!$sortbutton.hasClass('active')) {
                jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false)
                $sortbutton.toggleClass('active', true)
                maxui.printActivities({})
            }

        })

        jq('#maxui-activity-sort').on('click', 'a.maxui-sort-action.maxui-most-valued', function (event) {
            event.preventDefault()
            $sortbutton = jq(this)
            if (!$sortbutton.hasClass('active')) {
                jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false)
                $sortbutton.toggleClass('active', true)
                maxui.printActivities({sortBy: 'likes'})
            }

        })
// **************************************************************************************
//                    add people predicting
// **************************************************************************************
        var selector = '.maxui-text-input'
        jq('#maxui-add-people-box')
        .on('focusin',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized==literal )
                      jq(this).val('')
        })

         .on('keydown', selector, function(event) {
           if ( jq('#maxui-conversation-predictive:visible').length>0 &&  (event.which==40 || event.which==38 || event.which==13 || event.which==9)) {
              maxui.utils.freezeEvent(event)
           }
         })

        .on('keyup',selector, function(event) {
                  event.preventDefault()
                  event.stopPropagation()
                  var text = jq(this).val()
                  var normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if (normalized=='')
                  {   jq(this).attr('class','maxui-empty maxui-text-input')
                      jq(this).removeAttr('title')
                  }
                  else
                  {   if (maxui.settings.canwrite) {
                          jq(this).attr('class','maxui-text-input')
                      }
                  }
                  var key = event.which
                  var matchMention = new RegExp('^\\s*([\\w\\.]+)\\s*')
                  var match = text.match(matchMention)

                  var matchMentionEOL = new RegExp('^\\s*([\\w\\.]+)\\s*$')
                  var matchEOL = text.match(matchMentionEOL)

                  var $selected = jq('#maxui-conversation-predictive .maxui-prediction.selected')
                  var $area = jq(this)
                  var $predictive = jq('#maxui-conversation-predictive')
                  var num_predictions = $predictive.find('.maxui-prediction').length
                  var is_predicting = jq('#maxui-conversation-predictive:visible').length>0

                  // Up & down
                  if (key==40 && is_predicting && num_predictions>1) {
                    var $next = $selected.next()
                    $selected.removeClass('selected')
                    if ($next.length>0) $next.addClass('selected')
                    else {$selected.siblings(':first').addClass('selected')}
                  }
                  else if (key==38 && is_predicting && num_predictions>1) {
                    var $prev = $selected.prev()
                    $selected.removeClass('selected')
                    if ($prev.length>0) $prev.addClass('selected')
                    else {$selected.siblings(':last').addClass('selected')}
                  }
                  else if (key==27) {
                    $predictive.hide()
                  }
                  else if ((key==13 || key==9) && is_predicting) {
                    console.log('intro')
                    var matchMention2 = new RegExp('^\\s*([\\w\\.]+\\s*)')
                    var replacement = text.replace(matchMention2, $selected.text())
                    console.log(replacement)
                    maxui.addPerson({'username': replacement})
                    $predictive.hide()
                    $area.val('').focus()
                  }

                  else //1
                  {
                      if (maxui.settings.conversationsSection=='conversations') {
                          if (match) {
                              $area.attr('class','maxui-text-input')
                              if (matchEOL) {
                                  $predictive.show()
                                  $predictive.html('<ul></ul>')
                                  maxui.printPredictions(match[1], '#maxui-conversation-predictive')
                              }
                          }

                          else {
                              $predictive.hide()
                              $area.attr('class','maxui-empty maxui-text-input')
                              if (!text.match(RegExp('^\\s*@')) ) {
                                  $area.attr('class','maxui-text-input error')
                                  $area.attr('title', maxui.settings.literals.post_permission_not_here)
                              }
                          }
                      }
                 } //1


        })

        .on('focusout',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized=='' )
                      jq(this).val(literal)
        })


// **************************************************************************************



        //Assign Activity post action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-newactivity','#maxui-newactivity-box', {}, function(text)
                {

                if (maxui.settings.UISection=='timeline') {
                    maxui.sendActivity(text)
                    jq('#maxui-search').toggleClass('folded',true)
                }

                else if (maxui.settings.UISection=='conversations') {
                    if (maxui.settings.conversationsSection=='conversations') {

                        var participants_box = $('#maxui-new-participants')[0]
                        var participants = []
                        for (i=0;i<participants_box.people.length;i++)
                            participants.push(participants_box.people[i].username)
                        var message = jq('#maxui-newactivity textarea').val()

                        var options = {
                            participants: participants,
                            message: message
                        }

                        if (participants.length>1) {
                            var displayName = jq('#maxui-add-people-box #maxui-new-displayName input').val()
                            options.displayName = displayName
                        }
                        maxui.createConversationAndSendMessage(options, function() {
                            participants_box.people = []
                            maxui.reloadPersons()
                        })
                    }
                    else {
                      maxui.sendMessage(text, maxui.settings.currentConversation.hash)

                    }

                }


                },
                function(text, area, button, ev) {

                  var key = ev.which
                  var matchMention = new RegExp('^\\s*@([\\w\\.]+)\s*')
                  var match = text.match(matchMention)

                  var matchMentionEOL = new RegExp('^\\s*@([\\w\\.]+)\s*$')
                  var matchEOL = text.match(matchMentionEOL)

                  var $selected = jq('#maxui-newactivity .maxui-prediction.selected')
                  var $area = jq(area)
                  var $predictive = jq('#maxui-newactivity #maxui-predictive')
                  var num_predictions = $predictive.find('.maxui-prediction').length
                  var is_predicting = jq('#maxui-newactivity #maxui-predictive:visible').length>0

                  // Up & down
                  if (key==40 && is_predicting && num_predictions>1) {
                    var $next = $selected.next()
                    $selected.removeClass('selected')
                    if ($next.length>0) $next.addClass('selected')
                    else {$selected.siblings(':first').addClass('selected')}
                  }
                  else if (key==38 && is_predicting && num_predictions>1) {
                    var $prev = $selected.prev()
                    $selected.removeClass('selected')
                    if ($prev.length>0) $prev.addClass('selected')
                    else {$selected.siblings(':last').addClass('selected')}
                  }
                  else if (key==27) {
                    $predictive.hide()
                  }
                  else if ((key==13 || key==9) && is_predicting) {
                    var matchMention2 = new RegExp('^\\s*@([\\w\\.]+)')
                    var replacement = text.replace(matchMention2, '@'+$selected.text()+' ')
                    $predictive.hide()
                    $area.val(replacement).focus()
                  }

                  else if (text=='') {
                      if (maxui.settings.UISection=='timeline')
                          jq(button).val(maxui.settings.literals.new_activity_post)
                  }

                  else //1
                  {
                      if (maxui.settings.UISection=='timeline') {

                          if (match) {
                              jq(button).val(maxui.settings.literals.new_message_post)
                              if (matchEOL) {
                                  $predictive.show()
                                  $predictive.html('<ul></ul>')
                                  maxui.printPredictions(match[1], '#maxui-newactivity #maxui-predictive')
                              }
                              jq(button).removeAttr('disabled')
                              jq(button).attr('class','maxui-button')
                              $area.attr('class','maxui-text-input')


                          }
                          else {
                              jq(button).val(maxui.settings.literals.new_activity_post)
                              $predictive.hide()
                              if (!text.match(RegExp('^\\s*@')) && !maxui.settings.canwrite) {
                                  $area.attr('class','maxui-text-input error')
                                  $area.attr('title', maxui.settings.literals.post_permission_unauthorized)
                              }                          }
                      }

                      else if (maxui.settings.UISection=='conversations') {

                          if (maxui.settings.conversationsSection=='conversations') {
                            maxui.reloadPersons()
                          }
                          else if (maxui.settings.conversationsSection=='messages') {
                              $predictive.hide()
                              jq(button).removeAttr('disabled')
                              jq(button).attr('class','maxui-button')
                              $area.attr('class','maxui-text-input')
                          }


                      } //elseif

                  } //1
                }) //function



        //Assign Commentbox send comment action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-activities', '.maxui-newcommentbox', {}, function(text)
               {
               var activityid = jq(this).closest('.maxui-activity').attr('id')
               maxui.maxClient.addComment(text, activityid, function() {
                            jq('#activityContainer textarea').val('')
                            var activity_id = this.object.inReplyTo[0].id
                            maxui.printCommentsForActivity(activity_id)
                            jq('#'+activity_id+' .maxui-newcommentbox textarea').val('')
                            jq('#'+activity_id+' .maxui-newcommentbox .maxui-button').attr('disabled','disabled')
                            })
              })

        //Assign Search box search action And input behaviour
        maxui.bindActionBehaviour('#maxui-search','#maxui-search-box', {}, function(text)
               {
                console.log('behaviour')
               maxui.textSearch(text)
               jq('#maxui-search').toggleClass('folded',false)
               jq('#maxui-search-text').val('')
               })
        // // Execute search if <enter> pressed
        // jq('#maxui-search .maxui-text-input').keyup(function(e) {
        //           if (e.keyCode == 13) {
        //             console.log('enter')
        //              maxui.textSearch(jq(this).attr('value'))
        //              jq('#maxui-search').toggleClass('folded',false)
        //           }
        // });
    }

    /**
    *    Takes a  button-input pair identified by 'maxui-button' and 'maxui-text-input'
    *    classes respectively, contained in a container and applies focusin/out
    *    and clicking behaviour
    *
    *    @param {String} delegate         CSS selector identifying the parent container on which to delegate events
    *    @param {String} target           CSS selector identifying the direct container on which execute events
    *    @param {object} options          Extra options, currently ignore-button, to avoid button updates
    *    @param {Function} clickFunction  Function to execute when click on the button
    **/
    jq.fn.bindActionBehaviour = function(delegate, target, options, clickFunction) {

        // Clear input when focusing in only if user hasn't typed anything yet
        var maxui = this
        var selector = target+' .maxui-text-input'
        if (arguments.length>4) { var extra_bind = arguments[4] }
        else { var extra_bind = null }
        jq(delegate)

        .on('focusin',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized==literal )
                      jq(this).val('')
        })

         .on('keydown', selector, function(event) {
           if ( jq(delegate + ' #maxui-predictive:visible').length>0 &&  (event.which==40 || event.which==38 || event.which==13 || event.which==9)) {
              maxui.utils.freezeEvent(event)
           } else if(event.which==13 && event.shiftKey==false && !options.ignore_button) {
                event.preventDefault()
                var $area = jq(this).parent().find('.maxui-text-input')
                var literal = $area.attr('data-literal')
                var text = $area.val()
                var normalized = maxui.utils.normalizeWhiteSpace(text,false)

                if (normalized!=literal & normalized!='')
                    clickFunction.apply(this,[text])

           }


         })

        .on('keyup',selector, function(event) {
                  event.preventDefault()
                  event.stopPropagation()
                  var text = jq(this).val()
                  var button = jq(this).parent().find('.maxui-button')
                  var normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if (normalized=='' && !options.ignore_button)
                  {   jq(button).attr('disabled', 'disabled')
                      jq(button).attr('class','maxui-button maxui-disabled')
                      jq(this).attr('class','maxui-empty maxui-text-input')
                      jq(this).removeAttr('title')
                  }
                  else
                  {   if (maxui.settings.canwrite && !options.ignore_button) {
                          jq(button).removeAttr('disabled')
                          jq(button).attr('class','maxui-button')
                          jq(this).attr('class','maxui-text-input')
                      }
                  }

                  if (extra_bind!=null) {
                    extra_bind(text, this, button, event)
                  }


        })

        .on('focusout',selector, function(event) {
                  event.preventDefault()
                  var text = jq(this).val()
                  var literal = jq(this).attr('data-literal')
                  normalized = maxui.utils.normalizeWhiteSpace(text,false)
                  if ( normalized=='' )
                      jq(this).val(literal)
        })

        .on('click',target+' .maxui-button',function (event) {
            event.preventDefault()
            var $area = jq(this).parent().find('.maxui-text-input')
            var literal = $area.attr('data-literal')
            var text = $area.val()
            var normalized = maxui.utils.normalizeWhiteSpace(text,false)

            if ((normalized!=literal & normalized!='') || options.empty_click)
                clickFunction.apply(this,[text])
            })

    }

    /**
    *    Updates the search filters with a new collection of keywords/hashtags extracted of
    *    a user-entered text, and reloads the search query. Identifies special characters
    *    at the first position of each keyword to identify keyword type
    *
    *    @param {String} text    A string containing whitespace-separated keywords/#hashtags
    **/
    jq.fn.textSearch = function (text) {
                maxui = this
                //Normalize spaces
                normalized = maxui.utils.normalizeWhiteSpace(text)
                var keywords = normalized.split(' ')
                for (kw=0;kw<keywords.length;kw++)
                {
                    var kwtype = 'keyword'
                    var keyword = keywords[kw]

                    switch (keyword[0])
                    {
                    case '#': var kwtype='hashtag';
                              var keyword = keyword.substr(1);
                              break;
                    case '@': var kwtype='actor';
                              var keyword = keyword.substr(1);
                              break;
                    default:  var kwtype = 'keyword';
                              break;
                    }

                    if (keyword.length>=3)
                        this.addFilter({type:kwtype, value:keyword}, false)
                }
                this.reloadFilters()
    }


    /**
    *    Prepares a object with the current active filters
    *
    *    @param {String} (optional)    A string containing the id of the last activity loaded
    **/
    jq.fn.getFilters = function() {

        var maxui=this
        var params = {filters:maxui.filters}
        if (params.filters == undefined) {
            params.filters = []
        }
        var filters = {}
        // group filters
        enableSearchToggle = false
        for (f=0;f<params.filters.length;f++) {
            var filter = params.filters[f]

            // Enable toggle button only if there's at least one visible filter
            if (filter.visible) {
                enableSearchToggle = true
            }
            if (!filters[filter.type]) {
                filters[filter.type]=[]
            }
            filters[filter.type].push(filter.value)
        }

        // Accept a optional parameter indicating search start point
        if (arguments.length>0)
            filters['before'] = arguments[0]

        return {filters: filters, visible:enableSearchToggle}
   }


    /**
    *    Reloads the current filters UI and executes the search, optionally starting
    *    at a given point of the timeline
    *
    *    @param {String} (optional)    A string containing the id of the last activity loaded
    **/
    jq.fn.reloadFilters = function() {

        var maxui=this
        var params = {filters:maxui.filters}
        var activity_items = maxui.templates.filters.render(params)
        jq('#maxui-search-filters').html(activity_items)

        // Accept a optional parameter indicating search start point
        if (arguments.length>0) {
            filters = maxui.getFilters(arguments[0])
        } else {
            filters = maxui.getFilters()
        }

        maxui.printActivities()

        //Enable or disable filter toogle if there are visible filters defined (or not)
        jq('#maxui-search').toggleClass('folded',!filters.visible)
   }


    /**
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    **/
    jq.fn.delFilter = function(filter) {
        maxui = this
        var deleted = false
        var index = -1
        for (i=0;i<maxui.filters.length;i++)
             if (maxui.filters[i].value==filter.value & maxui.filters[i].type==filter.type)
              {
                 deleted = true
                 maxui.filters.splice(i,1)
              }
        if (deleted)
            this.reloadFilters()
    }

    /**
    *    Adds a new filter to the search if its not present
    *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
    **/
    jq.fn.addFilter = function(filter) {
        maxui = this
        var reload=true
        //Reload or not by func argument
        if (arguments.length>1)
            reload=arguments[1]

        if (!maxui.filters)
            { maxui.filters = []}


        // show filters bu default unless explicitly specified on filter argument
        if (!filter.hasOwnProperty('visible')) {
            filter.visible = true
        }

        switch (filter.type)
        {
        case "hashtag": filter['prepend']='#';break;
        case "actor": filter['prepend']='@';break;
        default:        filter['prepend']='';break;
        }


        var already_filtered = false
        for (i=0;i<maxui.filters.length;i++)
             if (maxui.filters[i].value==filter.value & maxui.filters[i].type==filter.type)
                 already_filtered = true

         if (!already_filtered)
         {
            maxui.filters.push(filter)
            if(reload==true)
                this.reloadFilters()
         }
    }

    /**
    *    Reloads the current filters UI and executes the search, optionally starting
    *    at a given point of the timeline
    *
    *    @param {String} (optional)    A string containing the id of the last activity loaded
    **/
    jq.fn.reloadPersons = function() {

        var maxui=this
        $participants_box = jq('#maxui-new-participants')
        participants_box = $participants_box[0]
        if (!participants_box.people) {
            participants_box.people = []
        }
        $button = jq('#maxui-newactivity input.maxui-button')

        $newmessagebox = jq('#maxui-newactivity')
        var message = $newmessagebox.find('textarea').val()
        var placeholder = $newmessagebox.find('textarea').attr('data-literal')
        message = maxui.utils.normalizeWhiteSpace(message)

        $newdisplaynamebox = jq('#maxui-add-people-box #maxui-new-displayName')
        var displayName = $newdisplaynamebox.find('input').val()
        displayName = maxui.utils.normalizeWhiteSpace(displayName)

        var params = {persons:participants_box.people}
        var participants_items = maxui.templates.participants.render(params)
        jq('#maxui-new-participants').html(participants_items)


        jq('#maxui-add-people-box .maxui-label .maxui-count').text('({0}/{1})'.format(participants_box.people.length + 1,maxui.settings.maximumConversations))

        if (participants_box.people.length>0) {
            if ((participants_box.people.length==1 || displayName!='') && message!='' && message!=placeholder) {
                $button.removeAttr('disabled')
                $button.attr('class','maxui-button')
                $newmessagebox.find('textarea').attr('class','maxui-text-input')
            } else {
                $button.attr('disabled', 'disabled')
                $button.attr('class','maxui-button maxui-disabled')
                if (displayName=='') {
                    $newmessagebox.find('textarea').attr('class','maxui-text-input error')
                    $newmessagebox.find('textarea').attr('title', maxui.settings.literals.post_permission_missing_displayName)
                }
            }

            $participants_box.show()
            $newmessagebox.show()
            if (participants_box.people.length>1) {
                $newdisplaynamebox.show()
            } else {
                $newdisplaynamebox.hide()
                $newdisplaynamebox.find('.maxui-text-input').val('')
            }

        } else {
            $button.attr('disabled', 'disabled')
            $button.attr('class','maxui-button maxui-disabled')
            $participants_box.hide()
            $newmessagebox.find('textarea').attr('class','maxui-text-input error')
            $newmessagebox.find('textarea').attr('title', maxui.settings.literals.post_permission_not_enough_participants)

            $newdisplaynamebox.hide()
            $newdisplaynamebox.find('.maxui-text-input').val('')
        }
   }

    /**
    *    Removes a person from the list of new conversation
    *    @param {String} person    A String representing a user's username
    **/
    jq.fn.delPerson = function(person) {
        maxui = this
        var deleted = false
        var index = -1
        participants_box = $('#maxui-new-participants')[0]
        for (i=0;i<participants_box.people.length;i++)
             if (participants_box.people[i].username == person.username)
              {
                 deleted = true
                 participants_box.people.splice(i,1)
              }
        if (deleted)
            this.reloadPersons()
    }

    /**
    *    Adds a new person to the list of new conversation
    *    @param {String} person    A String representing a user's username
    **/
    jq.fn.addPerson = function(person) {
        maxui = this
        participants_box = $('#maxui-new-participants')[0]
        var reload=true
        //Reload or not by func argument
        if (arguments.length>1)
            reload=arguments[1]

        var already_filtered = false

        if (!participants_box.people)
            { participants_box.people = []}

        if (person.username != maxui.settings.username && participants_box.people.length < (maxui.settings.maximumConversations -1) ) {
            for (i=0;i<participants_box.people.length;i++)
                 if (participants_box.people[i].username == person.username)
                     already_filtered = true

             if (!already_filtered)
             {
                participants_box.people.push(person)
                if(reload==true)
                    this.reloadPersons()
             }
        }
    }

    /**
    *    Toggles between Conversations and Messages
    **/
    jq.fn.toggleMessages = function(sectionToEnable) {
        maxui = this

        var $conversations = jq('#maxui-conversations')
        var $conversations_list = jq('#maxui-conversations-list')
        var $conversations_wrapper = $conversations.find('.maxui-wrapper')
        var $messages = jq('#maxui-messages')
        var $message_list = jq('#maxui-message-list')
        var $postbox = jq('#maxui-newactivity-box textarea')
        var $common_header = $conversations.find('#maxui-common-header')
        var $addpeople = jq('#maxui-add-people-box')

        var widgetWidth = maxui.width() // Real width of the widget, without the two 1-pixel borders
        var sectionHorizontalPadding = 20
        var widgetBorder = 2
        var widgetScrollbar = maxui.scrollbar.width
        var sectionsWidth = widgetWidth - widgetScrollbar - widgetBorder
        var height = 320


        if (sectionToEnable=='messages' && sectionToEnable!=maxui.settings.conversationsSection)
        {
            $addpeople.animate({'height': 0, 'padding-top':0, 'padding-bottom':0}, 400, function(event) {
                $addpeople.css({'border-color': 'transparent'})
            })
            $common_header.find('h3').text(maxui.settings.currentConversation.displayName)
            $conversations_list.animate({'margin-left':sectionsWidth * (-1) }, 400)
            $messages.animate({'left':0, 'margin-left':0}, 400, function(event) {
                $conversations_wrapper.height(height - 31 - 45)
                $common_header.animate({'height':45}, 100, function(event) {
                    maxui.scrollbar.setHeight(height-31-45)
                    maxui.scrollbar.setTarget('#maxui-conversations #maxui-messages')
                    maxui.scrollbar.setContentPosition(100)
                })
            })
            $messages.width(sectionsWidth)
            maxui.settings.conversationsSection='messages'
            var literal = maxui.settings.literals.new_activity_text
            $postbox.val(literal).attr('data-literal', literal)

        }
        if (sectionToEnable=='conversations' && sectionToEnable!=maxui.settings.conversationsSection) {
            $common_header.animate({'height':0}, 100, function(event) {
                $addpeople.css({'border-color': '#ccc'})
                maxui.scrollbar.setHeight(height-31)
                maxui.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list')
                maxui.scrollbar.setContentPosition(0)
                $addpeople.animate({'height': 19, 'padding-top':6, 'padding-bottom':6}, 400, function(event) {
                    $addpeople.removeAttr('style')
                })
            })
            $conversations_wrapper.height(height - 31)
            var widgetWidth = $conversations_list.width()+11 // +2 To include border
            $conversations_list.animate({'margin-left':0 }, 400)
            $messages.animate({'left':widgetWidth + 20 }, 400)
            maxui.settings.conversationsSection='conversations'
            var literal = maxui.settings.literals.new_conversation_text
            $postbox.val(literal).attr('data-literal', literal)
        }
    }


    /**
    *    Toggles between main sections
    **/
    jq.fn.toggleSection = function(sectionToEnable) {
        maxui = this
        var $search = jq('#maxui-search')
        var $activitysort = jq('#maxui-activity-sort')
        var $timeline = jq('#maxui-timeline')
        var $timeline_wrapper = jq('#maxui-timeline .maxui-wrapper')
        var $conversations = jq('#maxui-conversations')
        var $common_header = $conversations.find('#maxui-common-header')
        var $back_conversations = $conversations.find('#maxui-back-conversations')
        var $conversations_user_input = $conversations.find('input#add-user-input')
        var $conversations_list = jq('#maxui-conversations #maxui-conversations-list')
        var $conversations_wrapper = jq('#maxui-conversations .maxui-wrapper')
        var $postbutton = jq('#maxui-newactivity-box .maxui-button')
        var $conversationsbutton = jq('#maxui-show-conversations')
        var $timelinebutton = jq('#maxui-show-timeline')
        var $addpeople = jq('#maxui-add-people-box')

        var widgetWidth = maxui.width() // Real width of the widget, without the two 1-pixel borders
        var sectionPadding = 10
        var widgetBorder = 1
        var sectionsWidth = widgetWidth - maxui.scrollbar.width - (sectionPadding * 2) - (widgetBorder * 2)
        var height = 320

        if (sectionToEnable=='conversations' && maxui.settings.currentConversationSection=='conversations')
        {

          //$conversations.width($conversations.width())
          //$conversations_list.width($conversations.width())
          var height = 320
          $conversations.show()
          $addpeople.show()

          $common_header.animate({'height':0}, 400)
          $conversations_user_input.focus()
          $conversations.animate({'height':height-31}, 400, function(event) {
            $conversations_wrapper.height(height - 31)
          })
          $conversations_list.width(sectionsWidth)
          $timeline.animate({'height':0}, 400)
          $search.hide(400)
          $activitysort.hide(400)
          maxui.settings.UISection='conversations'
          $postbutton.val(maxui.settings.literals.new_message_post)
          $conversationsbutton.hide()
          if (!maxui.settings.disableTimeline) $timelinebutton.show()
          maxui.scrollbar.setHeight(height-31)
          maxui.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list')
        }
        if (sectionToEnable=='timeline')
        {
          $timeline.show()
          var timeline_height = $timeline_wrapper.height()
          $timeline.animate({'height':timeline_height}, 400, function(event) {
              $timeline.css('height','')
          })
          $conversations.animate({'height':0}, 400, function(event) {
              $conversations.hide()
              $addpeople.hide()
          })
          $search.show(400)
          $activitysort.show(400)
          //maxui.settings.currentConversationSection=='conversations'
          maxui.settings.UISection='timeline'
          $postbutton.val(maxui.settings.literals.new_activity_post)
          if (!maxui.settings.disableConversations) $conversationsbutton.show()
          $timelinebutton.hide()

        }

        }


    /**
    *    Returns the current settings of the plugin
    **/
    jq.fn.Settings = function() {
        maxui = this
        return maxui.settings
        }


    /**
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    **/
    jq.fn.createConversationAndSendMessage = function (options, post_creation) {
        maxui = this
        var func_params = []

        options.participants.push(maxui.settings.username)
        func_params.push(options)

        if (maxui.settings.UISection=='conversations') {
            func_params.push( function() {
                            post_creation()
                            var chash = this.contexts[0].id
                            var activityid = this.id

                            maxui.settings.currentConversation = {hash: chash}
                            if (options.displayName) {
                                maxui.settings.currentConversation.displayName = options.displayName
                            } else {
                                maxui.settings.currentConversation.displayName = options.participants[0].displayName
                            }

                            maxui.printMessages(chash, function() {
                                   maxui.toggleMessages('messages')
                                   id = maxui.client.subscribe('/exchange/{0}'.format(chash), function(d) {maxui.insertMessage(d)})
                            })
                       })
        } else {
            func_params.push( function() {
                            jq('#maxui-newactivity textarea').val('')
                            jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                            maxui.printConversations( function() { maxui.toggleSection('conversations') })
                           })
        }

        var messageAdder = maxui.maxClient.addMessageAndConversation
        messageAdder.apply(maxui.maxClient, func_params)

    }

    /**
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    **/
    jq.fn.sendMessage = function (text, chash) {
        maxui = this
        var func_params = []
        func_params.push(text)
        func_params.push(chash)
        func_params.push( function() {
                            jq('#maxui-newactivity textarea').val('')
                            jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                            maxui.printMessages(chash, function() {maxui.toggleMessages('messages')})
                            // var activityid = this.id
                            // maxui.io.emit('talk', { conversation: chash, timestamp: maxui.utils.timestamp(), messageID: activityid } )

                           })

        var messageAdder = maxui.maxClient.addMessage
        messageAdder.apply(maxui.maxClient, func_params)

    }

    /**
    *    Sends a post when user clicks `post activity` button with
    *    the current contents of the `maxui-newactivity` textarea
    **/
    jq.fn.sendActivity = function () {
        maxui=this
        var text = jq('#maxui-newactivity textarea').val()
        var func_params = []
        func_params.push(text)
        func_params.push(maxui.settings.writeContexts)
        func_params.push( function() {
                              jq('#maxui-newactivity textarea').val('')
                              jq('#maxui-newactivity .maxui-button').attr('disabled','disabled')
                              var first = jq('.maxui-activity:first')
                              if (first.length>0)
                                  { filter = {after:first.attr('id')}
                                    maxui.printActivities(filter)
                                  }
                              else {
                                    maxui.printActivities({})
                                  }
                              })

        //Pass generator to activity post if defined
        if (maxui.settings.generatorName) { func_params.push(maxui.settings.generatorName) }

        var activityAdder = maxui.maxClient.addActivity
        activityAdder.apply(maxui.maxClient, func_params)

    }

    /**
    *    Loads more activities from max posted earlier than
    *    the oldest loaded activity
    **/
    jq.fn.loadMoreActivities = function () {
        maxui=this
        filter = {before:jq('.maxui-activity:last').attr('id')}
        maxui.printActivities(filter)

    }


    /**
    *    Renders the conversations list of the current user, defined in settings.username
    **/
    jq.fn.printPredictions = function(query, predictive_selector) {
        var maxui = this

        var func_params = []
        func_params.push(query)
        func_params.push( function() { maxui.formatPredictions(this, predictive_selector) })

        var userListRetriever = this.maxClient.getUsersList
        userListRetriever.apply(this.maxClient,func_params)
    }

    /**
    *
    *
    **/
    jq.fn.formatPredictions = function(items, predictive_selector) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var predictions = ''



        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var prediction = items[i]
            if (prediction.username != maxui.username)
                {
                var avatar_url = maxui.settings.avatarURLpattern.format(prediction.username)
                var params = {
                                   username: prediction.username,
                                  avatarURL: avatar_url,
                                   cssclass: 'maxui-prediction' + (i == 0 && ' selected' || '')
                             }

                // Render the conversations template and append it at the end of the rendered covnersations
                predictions = predictions + maxui.templates.predictive.render(params)
                }
            }

        if (predictions == '') {
            predictions = '<li>' + maxui.settings.literals.no_match_found + '</li>'
        }

        jq(predictive_selector + ' ul').html(predictions)

        if (arguments.length>2) {
          var callback = arguments[2]
          callback()
        }
    }



    /**
    *    Renders the conversations list of the current user, defined in settings.username
    **/
    jq.fn.printConversations = function() {
        var maxui = this
        // Render the postbox UI if user has permission

        var showCT = maxui.settings.UISection == 'conversations'
        var toggleCT = maxui.settings.disableConversations == false && !showCT

        var params = {        avatar: maxui.settings.avatarURLpattern.format(maxui.settings.username),
                        allowPosting: true,
                       buttonLiteral: maxui.settings.literals.new_message_post,
                         textLiteral: maxui.settings.literals.new_conversation_text,
                            literals: maxui.settings.literals,
             showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;'
                    }
        var postbox = maxui.templates.postBox.render(params)
        var $postbox = jq('#maxui-newactivity')
        $postbox.html(postbox)



        var func_params = []
        func_params.push(maxui.settings.username)
        if (arguments.length>0)
        {
            var callback = arguments[0]
            func_params.push( function() {
                                  maxui.formatConversations(this, callback)

                                })
        }
        else
        {
            func_params.push( function() { maxui.formatConversations(this) })
        }

        var conversationsRetriever = this.maxClient.getConversationsForUser
        conversationsRetriever.apply(this.maxClient,func_params)
    }

    /**
    *
    *
    **/
    jq.fn.formatConversations = function(items) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var conversations = ''

        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var conversation = items[i]

            if (conversation.participants.length <= 2) {
                if (conversation.participants[0].username == maxui.settings.username) {
                    var partner = conversation.participants[1] }
                else {
                    var partner = conversation.participants[0]
                }

                var avatar_url = maxui.settings.avatarURLpattern.format(partner.username)
            } else {
                var avatar_url = maxui.settings.conversationAvatarURLpattern.format(conversation.id)
            }
                var displayName = conversation.displayName

            var params = {
                                   id: conversation.id,
                          displayName: displayName,
                                 text: maxui.utils.formatText(conversation.lastMessage.content),
                             messages: conversation.messages,
                             literals: maxui.settings.literals,
                                 date: maxui.utils.formatDate(conversation.lastMessage.published, maxui.language),
                            avatarURL: avatar_url
                         }

            // Render the conversations template and append it at the end of the rendered covnersations
            conversations = conversations + maxui.templates.conversation.render(params)

            }
        if (items.length>0) {
            jq('#maxui-conversations-list').html(conversations)
        }

        if (arguments.length>1) {
          var callback = arguments[1]
          callback()
        }
    }

    /**
    *    Renders the messages of the choosen conversation
    **/
    jq.fn.printMessages = function(conversation_hash) {
        var maxui = this

        var func_params = []
        func_params.push(conversation_hash)
        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function() {
                                  maxui.formatMessages(this, callback)

                                })
        }
        else
        {
            func_params.push( function() { maxui.formatMessages(this) })
        }

        var messagesRetriever = this.maxClient.getMessagesForConversation
        messagesRetriever.apply(this.maxClient,func_params)
    }

    /**
    *
    *
    **/
    jq.fn.formatMessages = function(items) {
        var maxui = this;

        // String to store the generated html pieces of each conversation item
        var messages = ''

        // Iterate through all the conversations
        for (i=0;i<items.length;i++)
            {
            var message = items[i]
            var avatar_url = maxui.settings.avatarURLpattern.format(message.actor.username)

            // Store in origin, who is the sender of the message, the authenticated user or anyone else
            origin = 'maxui-user-notme'
            if (message.actor.username==maxui.settings.username) origin = 'maxui-user-me'

            var params = {
                                   id: message.id,
                                 text: maxui.utils.formatText(message.object.content),
                                 date: maxui.utils.formatDate(message.published, maxui.language),
                               origin: origin,
                             literals: maxui.settings.literals,
                             avatarURL: avatar_url
                         }

            // Render the conversations template and append it at the end of the rendered covnersations
            messages = messages + maxui.templates.message.render(params)

            }
        jq('#maxui-messages #maxui-message-list').html(messages)

        if (arguments.length>1) {
          var callback = arguments[1]
          callback()
        }
    }

    /**
    *    Renders the N activities passed in items on the timeline slot. This function is
    *    meant to be called as a callback of a call to a max webservice returning a list
    *    of activity objects
    *
    *    @param {String} items     a list of objects representing activities, returned by max
    *    @param {String} insertAt  were to prepend or append activities, 'beginning' or 'end
    *    @param {Function} (optional)  A function to call when all formatting is finished
    **/
    jq.fn.formatActivities = function(items, insertAt) {
            var maxui = this;
            var activities = ''

            // Iterate through all the activities
            for (i=0;i<items.length;i++)
                {
                    var activity = items[i]

                    // Take first context (if exists) to display in the 'published on' field
                    // XXX TODO Build a coma-separated list of contexts ??
                    var contexts = undefined
                    if (activity.hasOwnProperty('contexts'))
                         {
                             if (activity.contexts.length>0)
                                 contexts = activity.contexts[0]
                         }

                    // Take generator property (if exists) and set it only if it's different
                    // from the application name defined in settings
                    var generator = undefined
                    if (activity.hasOwnProperty('generator'))
                         {
                            if (activity.generator!=maxui.settings.generatorName)
                                generator = activity.generator
                         }

                    // Prepare avatar image url depending on actor type
                    var avatar_url = ''
                    if (activity.actor.objectType=='person') {
                        avatar_url = maxui.settings.avatarURLpattern.format(activity.actor.username)
                      }
                    else if (activity.actor.objectType=='context') {
                        avatar_url = maxui.settings.contextAvatarURLpattern.format(activity.actor.hash)
                      }
                    // Take replies (if exists) and format to be included as a formatted
                    // subobject ready for hogan
                    var replies = []
                    if (activity.replies)
                        {
                            if (activity.replies.length>0)
                                {
                                    for (r=0;r<activity.replies.length;r++)
                                        {
                                        var comment = activity.replies[r]
                                        reply = {
                                                           id: comment.id,
                                                       actor: comment.actor,
                                                         date: maxui.utils.formatDate(comment.published,maxui.language),
                                                         text: maxui.utils.formatText(comment.content),
                                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username),
                                             canDeleteComment: comment.deletable,
                                                     literals: maxui.settings.literals

                                                }
                                        replies.push(reply)
                                        }
                                }
                        }

                    // Take all the latter properties and join them into an object
                    // containing all the needed params to render the template
                        var params = {
                                           id: activity.id,
                                        actor: activity.actor,
                                     literals: maxui.settings.literals,
                                         date: maxui.utils.formatDate(activity.published, maxui.language),
                                         text: maxui.utils.formatText(activity.object.content),
                                      replies: replies,
                                    favorited: activity.favorited,
                                        likes: activity.likesCount ? activity.likesCount : 0,
                               showLikesCount: maxui.currentSortOrder == 'likes',
                                        liked: activity.liked,

                                    avatarURL: avatar_url,
                                  publishedIn: contexts,
                            canDeleteActivity: activity.deletable,
                                          via: generator

                                 }
                    // Render the activities template and append it at the end of the rendered activities
                    // partials is used to render each comment found in the activities
                    var partials = {comment: maxui.templates.comment}
                    var activities = activities + maxui.templates.activity.render(params, partials)
                }


            // Prepare animation and insert activities at the top of activity stream
            if (insertAt == 'beggining')
            {
                // Load all the activities in a overflow-hidden div to calculate the height
                jq('#maxui-preload .maxui-wrapper').prepend(activities)
                var ritems = jq('#maxui-preload .maxui-wrapper .maxui-activity')
                var heightsum = 0
                for (i=0;i<ritems.length;i++)
                      heightsum += jq(ritems[i]).height()+18

                // Move the hidden div to be hidden on top of the last activity and behind the main UI
                var currentPreloadHeight = jq('#maxui-preload').height()
                jq('#maxui-preload').height(heightsum-currentPreloadHeight)
                jq('#maxui-preload').css( {"margin-top":(heightsum-currentPreloadHeight)*-1})

                // Animate it to appear sliding on the bottom of the main UI
                jq('#maxui-preload').animate({"margin-top":0}, 200, function()
                   {
                        // When the animation ends, move the new activites to its native container
                        jq('#maxui-preload .maxui-wrapper').html("")
                        jq('#maxui-activities').prepend(activities)
                        jq('#maxui-preload').height(0)

                   })

            }
            // Insert at the end
            else if (insertAt == 'end')
                jq('#maxui-activities').append(activities)
            // Otherwise, replace everything
            else
                jq('#maxui-activities').html(activities)

          // if Has a callback, execute it
          if (arguments.length>2)
              {
                arguments[2].call()
              }

        }

    /**
    *    Renders the N comments passed in items on the timeline slot. This function is
    *    meant to be called as a callback of a call to a max webservice returning comments
    *    @param {String} items         a list of objects representing comments, returned by max
    *    @param {String} activity_id   id of the activity where comments belong to
    **/
    jq.fn.formatComment = function(items, activity_id) {
            // When receiving the list of activities from max
            // construct the object for Hogan
            // `activities `contain the list of activity objects
            // `formatedDate` contain a function maxui will be rendered inside the template
            //             to obtain the published date in a "human readable" way
            // `avatarURL` contain a function maxui will be rendered inside the template
            //             to obtain the avatar url for the activity's actor

            // Save reference to the maxui class, as inside below defined functions
            // the this variable will contain the activity item being processed
            maxui = this;
            var comments = ''

            for (i=0;i<items.length;i++)
                {
                    var comment = items[i]

                    var params = {   literals:maxui.settings.literals,
                                           id: comment.id,
                                       actor: comment.actor,
                                         date: maxui.utils.formatDate(comment.published, maxui.language),
                                         text: maxui.utils.formatText(comment.content),
                                    avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username),
                             canDeleteComment: comment.deletable
                                 }
                    // Render the comment template and append it at the end of the rendered comments
                    var comments = comments + maxui.templates.comment.render(params)
                }
            // Insert new comments by replacing previous comments with all comments
            jq('.maxui-activity#'+activity_id+' .maxui-commentsbox').html(comments)
            // Update comment count
            comment_count = jq('.maxui-activity#'+activity_id+' .maxui-commentaction strong')
            jq(comment_count).text(eval(jq(comment_count).text())+1)
        }


    /**
    *    Renders the postbox
    **/
    jq.fn.renderPostbox = function() {
        var maxui = this
        // Render the postbox UI if user has permission
        var showCT = maxui.settings.UISection == 'conversations'
        var toggleCT = maxui.settings.disableConversations == false && !showCT

        var params = {        avatar: maxui.settings.avatarURLpattern.format(maxui.settings.username),
                        allowPosting: maxui.settings.canwrite,
                       buttonLiteral: maxui.settings.literals.new_activity_post,
                         textLiteral: maxui.settings.literals.new_activity_text,
                            literals: maxui.settings.literals,
             showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;'
                    }
        var postbox = maxui.templates.postBox.render(params)
        var $postbox = jq('#maxui-newactivity')
        $postbox.html(postbox)


    }


    /**
    *    Renders the timeline of the current user, defined in settings.username
    **/
    jq.fn.printActivities = function(ufilters) {
        // save a reference to the container object to be able to access it
        // from callbacks defined in inner levels
        var maxui = this

        var func_params = []
        var insert_at = 'replace'

        // Get current defined filters and update with custom
        var filters = maxui.getFilters().filters
        jq.extend(filters, ufilters)

        if (filters.before)
            {insert_at = 'end'}
        if (filters.after)
            {insert_at = 'beggining'}

        if (!filters.sortBy) {
            if (jq('#maxui-activity-sort .maxui-sort-action.maxui-most-valued').hasClass('active')) {
                filters.sortBy = 'likes'
            } else {
                filters.sortBy = maxui.settings.activitySortOrder
            }
        }

        maxui.currentSortOrder = filters.sortBy

        if (maxui.settings.activitySource=='timeline')
        {
            var activityRetriever = this.maxClient.getUserTimeline
            func_params.push(maxui.settings.username)
        }
        else if (maxui.settings.activitySource=='activities')
        {
            var activityRetriever = this.maxClient.getActivities
            options = {
                context: maxui.settings.readContextHash,
                tags: maxui.settings.contextTagsFilter
            }
            func_params.push(options)
        }

        if (arguments.length>1)
        {
            var callback = arguments[1]
            func_params.push( function(event) {
                var items = this
                // Determine write permission, granted by default if we don't find a restriction
                maxui.settings.canwrite = true

                // If we don't have a context, we're in timeline, so we can write
                if (maxui.settings.activitySource == 'activities') {
                    maxui.maxClient.getContext(
                        maxui.settings.readContextHash,
                        function (event) {
                            var context = this

                            // Add read context if user is not subscribed to it{
                            var subscriptions = maxui.settings.subscriptions
                            if (!subscriptions[context.hash])
                            {
                                subscriptions[context.hash]={}
                                subscriptions[context.hash]['permissions']={}

                                // Check only for public defaults, as any other permission would require
                                // a susbcription, that we already checked that doesn't exists
                                subscriptions[context.hash]['permissions']['read'] = context.permissions.read=='public'
                                subscriptions[context.hash]['permissions']['write'] = context.permissions.write=='public'
                            }

                            // Iterate through all the defined write contexts to check for write permissions on
                            // the current user
                            for (wc=0;wc<maxui.settings.writeContexts.length;wc++)
                                {
                                    var write_context = maxui.settings.writeContextsHashes[wc]
                                    if (subscriptions[write_context]['permissions'])
                                    {
                                      if (subscriptions[write_context]['permissions'].write!=true)
                                      {
                                          maxui.settings.canwrite = false
                                      }
                                    }
                                    else { maxui.settings.canwrite = false }
                                }


                            maxui.renderPostbox()
                            // format the result items as activities
                            maxui.formatActivities(items, insert_at, callback)

                        }
                    )
                } else {
                    maxui.renderPostbox(items, insert_at, callback)
                            // format the result items as activities
                    maxui.formatActivities(items, insert_at, callback)
                }

            })
        }
        else
        {
            func_params.push( function() {
                maxui.formatActivities(this, insert_at)})
        }


        // if passed as param, assume an object with search filtering params
        // one or all of [limit, before, after, hashtag]
        func_params.push(filters)

        activityRetriever.apply(this.maxClient,func_params)
        }

    /**
    *    Renders the timeline of the current user, defined in settings.username
    **/
    jq.fn.printCommentsForActivity = function(activity_id) {


        var maxui = this
        var func_params = []

        func_params.push(activity_id)
        func_params.push(function() {maxui.formatComment(this, activity_id)})
        this.maxClient.getCommentsForActivity.apply(this.maxClient, func_params)

    }


})(jQuery);
/*
* max.loader.js
*/
window.setTimeout(function () {
    if(window._MAXUI.onReady && !window._MAXUI.hasRun){
        window._MAXUI.hasRun = true;
        _MAXUI.onReady();
    }
  },0)
