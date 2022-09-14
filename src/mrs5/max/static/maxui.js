var Hogan = {};

(function (Hogan, useArrayBuffer) {
  Hogan.Template = function (renderFunc, text, compiler, options) {
    this.r = renderFunc || this.r;
    this.c = compiler;
    this.options = options;
    this.text = text || '';
    this.buf = (useArrayBuffer) ? [] : '';
  }

  Hogan.Template.prototype = {
    // render: replaced by generated code.
    r: function (context, partials, indent) { return ''; },

    // variable escaping
    v: hoganEscape,

    // triple stache
    t: coerceToString,

    render: function render(context, partials, indent) {
      return this.ri([context], partials || {}, indent);
    },

    // render internal -- a hook for overrides that catches partials too
    ri: function (context, partials, indent) {
      return this.r(context, partials, indent);
    },

    // tries to find a partial in the curent scope and render it
    rp: function(name, context, partials, indent) {
      var partial = partials[name];

      if (!partial) {
        return '';
      }

      if (this.c && typeof partial == 'string') {
        partial = this.c.compile(partial, this.options);
      }

      return partial.ri(context, partials, indent);
    },

    // render a section
    rs: function(context, partials, section) {
      var tail = context[context.length - 1];

      if (!isArray(tail)) {
        section(context, partials, this);
        return;
      }

      for (var i = 0; i < tail.length; i++) {
        context.push(tail[i]);
        section(context, partials, this);
        context.pop();
      }
    },

    // maybe start a section
    s: function(val, ctx, partials, inverted, start, end, tags) {
      var pass;

      if (isArray(val) && val.length === 0) {
        return false;
      }

      if (typeof val == 'function') {
        val = this.ls(val, ctx, partials, inverted, start, end, tags);
      }

      pass = (val === '') || !!val;

      if (!inverted && pass && ctx) {
        ctx.push((typeof val == 'object') ? val : ctx[ctx.length - 1]);
      }

      return pass;
    },

    // find values with dotted names
    d: function(key, ctx, partials, returnFound) {
      var names = key.split('.'),
          val = this.f(names[0], ctx, partials, returnFound),
          cx = null;

      if (key === '.' && isArray(ctx[ctx.length - 2])) {
        return ctx[ctx.length - 1];
      }

      for (var i = 1; i < names.length; i++) {
        if (val && typeof val == 'object' && names[i] in val) {
          cx = val;
          val = val[names[i]];
        } else {
          val = '';
        }
      }

      if (returnFound && !val) {
        return false;
      }

      if (!returnFound && typeof val == 'function') {
        ctx.push(cx);
        val = this.lv(val, ctx, partials);
        ctx.pop();
      }

      return val;
    },

    // find values with normal names
    f: function(key, ctx, partials, returnFound) {
      var val = false,
          v = null,
          found = false;

      for (var i = ctx.length - 1; i >= 0; i--) {
        v = ctx[i];
        if (v && typeof v == 'object' && key in v) {
          val = v[key];
          found = true;
          break;
        }
      }

      if (!found) {
        return (returnFound) ? false : "";
      }

      if (!returnFound && typeof val == 'function') {
        val = this.lv(val, ctx, partials);
      }

      return val;
    },

    // higher order templates
    ho: function(val, cx, partials, text, tags) {
      var compiler = this.c;
      var options = this.options;
      options.delimiters = tags;
      var text = val.call(cx, text);
      text = (text == null) ? String(text) : text.toString();
      this.b(compiler.compile(text, options).render(cx, partials));
      return false;
    },

    // template result buffering
    b: (useArrayBuffer) ? function(s) { this.buf.push(s); } :
                          function(s) { this.buf += s; },
    fl: (useArrayBuffer) ? function() { var r = this.buf.join(''); this.buf = []; return r; } :
                           function() { var r = this.buf; this.buf = ''; return r; },

    // lambda replace section
    ls: function(val, ctx, partials, inverted, start, end, tags) {
      var cx = ctx[ctx.length - 1],
          t = null;

      if (!inverted && this.c && val.length > 0) {
        return this.ho(val, cx, partials, this.text.substring(start, end), tags);
      }

      t = val.call(cx);

      if (typeof t == 'function') {
        if (inverted) {
          return true;
        } else if (this.c) {
          return this.ho(t, cx, partials, this.text.substring(start, end), tags);
        }
      }

      return t;
    },

    // lambda replace variable
    lv: function(val, ctx, partials) {
      var cx = ctx[ctx.length - 1];
      var result = val.call(cx);

      if (typeof result == 'function') {
        result = coerceToString(result.call(cx));
        if (this.c && ~result.indexOf("{\u007B")) {
          return this.c.compile(result, this.options).render(cx, partials);
        }
      }

      return coerceToString(result);
    }

  };

  var rAmp = /&/g,
      rLt = /</g,
      rGt = />/g,
      rApos =/\'/g,
      rQuot = /\"/g,
      hChars =/[&<>\"\']/;


  function coerceToString(val) {
    return String((val === null || val === undefined) ? '' : val);
  }

  function hoganEscape(str) {
    str = coerceToString(str);
    return hChars.test(str) ?
      str
        .replace(rAmp,'&amp;')
        .replace(rLt,'&lt;')
        .replace(rGt,'&gt;')
        .replace(rApos,'&#39;')
        .replace(rQuot, '&quot;') :
      str;
  }

  var isArray = Array.isArray || function(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
  };

})(typeof exports !== 'undefined' ? exports : Hogan);




(function (Hogan) {
  // Setup regex  assignments
  // remove whitespace according to Mustache spec
  var rIsWhitespace = /\S/,
      rQuot = /\"/g,
      rNewline =  /\n/g,
      rCr = /\r/g,
      rSlash = /\\/g,
      tagTypes = {
        '#': 1, '^': 2, '/': 3,  '!': 4, '>': 5,
        '<': 6, '=': 7, '_v': 8, '{': 9, '&': 10
      };

  Hogan.scan = function scan(text, delimiters) {
    var len = text.length,
        IN_TEXT = 0,
        IN_TAG_TYPE = 1,
        IN_TAG = 2,
        state = IN_TEXT,
        tagType = null,
        tag = null,
        buf = '',
        tokens = [],
        seenTag = false,
        i = 0,
        lineStart = 0,
        otag = '{{',
        ctag = '}}';

    function addBuf() {
      if (buf.length > 0) {
        tokens.push(new String(buf));
        buf = '';
      }
    }

    function lineIsWhitespace() {
      var isAllWhitespace = true;
      for (var j = lineStart; j < tokens.length; j++) {
        isAllWhitespace =
          (tokens[j].tag && tagTypes[tokens[j].tag] < tagTypes['_v']) ||
          (!tokens[j].tag && tokens[j].match(rIsWhitespace) === null);
        if (!isAllWhitespace) {
          return false;
        }
      }

      return isAllWhitespace;
    }

    function filterLine(haveSeenTag, noNewLine) {
      addBuf();

      if (haveSeenTag && lineIsWhitespace()) {
        for (var j = lineStart, next; j < tokens.length; j++) {
          if (!tokens[j].tag) {
            if ((next = tokens[j+1]) && next.tag == '>') {
              // set indent to token value
              next.indent = tokens[j].toString()
            }
            tokens.splice(j, 1);
          }
        }
      } else if (!noNewLine) {
        tokens.push({tag:'\n'});
      }

      seenTag = false;
      lineStart = tokens.length;
    }

    function changeDelimiters(text, index) {
      var close = '=' + ctag,
          closeIndex = text.indexOf(close, index),
          delimiters = trim(
            text.substring(text.indexOf('=', index) + 1, closeIndex)
          ).split(' ');

      otag = delimiters[0];
      ctag = delimiters[1];

      return closeIndex + close.length - 1;
    }

    if (delimiters) {
      delimiters = delimiters.split(' ');
      otag = delimiters[0];
      ctag = delimiters[1];
    }

    for (i = 0; i < len; i++) {
      if (state == IN_TEXT) {
        if (tagChange(otag, text, i)) {
          --i;
          addBuf();
          state = IN_TAG_TYPE;
        } else {
          if (text.charAt(i) == '\n') {
            filterLine(seenTag);
          } else {
            buf += text.charAt(i);
          }
        }
      } else if (state == IN_TAG_TYPE) {
        i += otag.length - 1;
        tag = tagTypes[text.charAt(i + 1)];
        tagType = tag ? text.charAt(i + 1) : '_v';
        if (tagType == '=') {
          i = changeDelimiters(text, i);
          state = IN_TEXT;
        } else {
          if (tag) {
            i++;
          }
          state = IN_TAG;
        }
        seenTag = i;
      } else {
        if (tagChange(ctag, text, i)) {
          tokens.push({tag: tagType, n: trim(buf), otag: otag, ctag: ctag,
                       i: (tagType == '/') ? seenTag - ctag.length : i + otag.length});
          buf = '';
          i += ctag.length - 1;
          state = IN_TEXT;
          if (tagType == '{') {
            if (ctag == '}}') {
              i++;
            } else {
              cleanTripleStache(tokens[tokens.length - 1]);
            }
          }
        } else {
          buf += text.charAt(i);
        }
      }
    }

    filterLine(seenTag, true);

    return tokens;
  }

  function cleanTripleStache(token) {
    if (token.n.substr(token.n.length - 1) === '}') {
      token.n = token.n.substring(0, token.n.length - 1);
    }
  }

  function trim(s) {
    if (s.trim) {
      return s.trim();
    }

    return s.replace(/^\s*|\s*$/g, '');
  }

  function tagChange(tag, text, index) {
    if (text.charAt(index) != tag.charAt(0)) {
      return false;
    }

    for (var i = 1, l = tag.length; i < l; i++) {
      if (text.charAt(index + i) != tag.charAt(i)) {
        return false;
      }
    }

    return true;
  }

  function buildTree(tokens, kind, stack, customTags) {
    var instructions = [],
        opener = null,
        token = null;

    while (tokens.length > 0) {
      token = tokens.shift();
      if (token.tag == '#' || token.tag == '^' || isOpener(token, customTags)) {
        stack.push(token);
        token.nodes = buildTree(tokens, token.tag, stack, customTags);
        instructions.push(token);
      } else if (token.tag == '/') {
        if (stack.length === 0) {
          throw new Error('Closing tag without opener: /' + token.n);
        }
        opener = stack.pop();
        if (token.n != opener.n && !isCloser(token.n, opener.n, customTags)) {
          throw new Error('Nesting error: ' + opener.n + ' vs. ' + token.n);
        }
        opener.end = token.i;
        return instructions;
      } else {
        instructions.push(token);
      }
    }

    if (stack.length > 0) {
      throw new Error('missing closing tag: ' + stack.pop().n);
    }

    return instructions;
  }

  function isOpener(token, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].o == token.n) {
        token.tag = '#';
        return true;
      }
    }
  }

  function isCloser(close, open, tags) {
    for (var i = 0, l = tags.length; i < l; i++) {
      if (tags[i].c == close && tags[i].o == open) {
        return true;
      }
    }
  }

  Hogan.generate = function (tree, text, options) {
    var code = 'var _=this;_.b(i=i||"");' + walk(tree) + 'return _.fl();';
    if (options.asString) {
      return 'function(c,p,i){' + code + ';}';
    }

    return new Hogan.Template(new Function('c', 'p', 'i', code), text, Hogan, options);
  }

  function esc(s) {
    return s.replace(rSlash, '\\\\')
            .replace(rQuot, '\\\"')
            .replace(rNewline, '\\n')
            .replace(rCr, '\\r');
  }

  function chooseMethod(s) {
    return (~s.indexOf('.')) ? 'd' : 'f';
  }

  function walk(tree) {
    var code = '';
    for (var i = 0, l = tree.length; i < l; i++) {
      var tag = tree[i].tag;
      if (tag == '#') {
        code += section(tree[i].nodes, tree[i].n, chooseMethod(tree[i].n),
                        tree[i].i, tree[i].end, tree[i].otag + " " + tree[i].ctag);
      } else if (tag == '^') {
        code += invertedSection(tree[i].nodes, tree[i].n,
                                chooseMethod(tree[i].n));
      } else if (tag == '<' || tag == '>') {
        code += partial(tree[i]);
      } else if (tag == '{' || tag == '&') {
        code += tripleStache(tree[i].n, chooseMethod(tree[i].n));
      } else if (tag == '\n') {
        code += text('"\\n"' + (tree.length-1 == i ? '' : ' + i'));
      } else if (tag == '_v') {
        code += variable(tree[i].n, chooseMethod(tree[i].n));
      } else if (tag === undefined) {
        code += text('"' + esc(tree[i]) + '"');
      }
    }
    return code;
  }

  function section(nodes, id, method, start, end, tags) {
    return 'if(_.s(_.' + method + '("' + esc(id) + '",c,p,1),' +
           'c,p,0,' + start + ',' + end + ',"' + tags + '")){' +
           '_.rs(c,p,' +
           'function(c,p,_){' +
           walk(nodes) +
           '});c.pop();}';
  }

  function invertedSection(nodes, id, method) {
    return 'if(!_.s(_.' + method + '("' + esc(id) + '",c,p,1),c,p,1,0,0,"")){' +
           walk(nodes) +
           '};';
  }

  function partial(tok) {
    return '_.b(_.rp("' +  esc(tok.n) + '",c,p,"' + (tok.indent || '') + '"));';
  }

  function tripleStache(id, method) {
    return '_.b(_.t(_.' + method + '("' + esc(id) + '",c,p,0)));';
  }

  function variable(id, method) {
    return '_.b(_.v(_.' + method + '("' + esc(id) + '",c,p,0)));';
  }

  function text(id) {
    return '_.b(' + id + ');';
  }

  Hogan.parse = function(tokens, text, options) {
    options = options || {};
    return buildTree(tokens, '', [], options.sectionTags || []);
  },

  Hogan.cache = {};

  Hogan.compile = function(text, options) {
    // options
    //
    // asString: false (default)
    //
    // sectionTags: [{o: '_foo', c: 'foo'}]
    // An array of object with o and c fields that indicate names for custom
    // section tags. The example above allows parsing of {{_foo}}{{/foo}}.
    //
    // delimiters: A string that overrides the default delimiters.
    // Example: "<% %>"
    //
    options = options || {};

    var key = text + '||' + !!options.asString;

    var t = this.cache[key];

    if (t) {
      return t;
    }

    t = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
    return this.cache[key] = t;
  };
})(typeof exports !== 'undefined' ? exports : Hogan);



;

(function(jQuery)
{
    /*

    Trimmed down to only the necessary bits

     * jQuery EasyDate 0.2.4 (jQueryRev: 54 jQuery)
     * Copyright (c) 2009 Parsha Pourkhomami (parshap@gmail.com)
     * Licensed under the MIT license.
     */

    jQuery.easydate = { };
    jQuery.easydate.locales = { };
    jQuery.easydate.locales.en = {
        "future_format": "%s %t",
        "past_format": "%t %s",
        "second": "second",
        "seconds": "seconds",
        "minute": "minute",
        "minutes": "minutes",
        "hour": "hour",
        "hours": "hours",
        "day": "day",
        "days": "days",
        "week": "week",
        "weeks": "weeks",
        "month": "month",
        "months": "months",
        "year": "year",
        "years": "years",
        "yesterday": "yesterday",
        "tomorrow": "tomorrow",
        "now": "just now",
        "ago": "ago",
        "in": "in"
    };

    jQuery.easydate.locales.ca = {
        "future_format": "%s %t",
        "past_format": "%s %t",
        "second": "segon",
        "seconds": "segons",
        "minute": "minut",
        "minutes": "minuts",
        "hour": "hora",
        "hours": "hores",
        "day": "dia",
        "days": "dies",
        "week": "setmana",
        "weeks": "setmanes",
        "month": "mes",
        "months": "mesos",
        "year": "any",
        "years": "anys",
        "yesterday": "ahir",
        "tomorrow": "demà",
        "now": "fa un moment",
        "ago": "fa",
        "in": "en"
    };


    jQuery.easydate.locales.es= {
        "future_format": "%s %t",
        "past_format": "%s %t",
        "second": "segundo",
        "seconds": "segundos",
        "minute": "minuto",
        "minutes": "minutos",
        "hour": "hora",
        "hours": "horas",
        "day": "dia",
        "days": "dias",
        "week": "semana",
        "weeks": "semanas",
        "month": "mes",
        "months": "meses",
        "year": "año",
        "years": "años",
        "yesterday": "ayer",
        "tomorrow": "mañana",
        "now": "hace un instante",
        "ago": "hace",
        "in": "en"
    };

    var defaults = {
        live: true,
        set_title: true,
        format_future: true,
        format_past: true,
        units: [
            { name: "now", limit: 5 },
            { name: "second", limit: 60, in_seconds: 1 },
            { name: "minute", limit: 3600, in_seconds: 60 },
            { name: "hour", limit: 86400, in_seconds: 3600  },
            { name: "yesterday", limit: 172800, past_only: true },
            { name: "tomorrow", limit: 172800, future_only: true },
            { name: "day", limit: 604800, in_seconds: 86400 },
            { name: "week", limit: 2629743, in_seconds: 604800  },
            { name: "month", limit: 31556926, in_seconds: 2629743 },
            { name: "year", limit: Infinity, in_seconds: 31556926 }
        ],
        uneasy_format: function(date)
        {
            return date.toLocaleDateString();
        },
        locale: jQuery.easydate.locales.en
    };

    function __(str, value, settings)
    {
        if(!isNaN(value) && value != 1)
            str = str + "s";
        return settings.locale[str] || str;
    }



    // Makes all future time calculations relative to the given date argument
    // instead of the system clock. The date argument can be a JavaScript Date
    // object or a RFC 1123 valid timestamp string. This is useful for
    // synchronizing the user's clock with a server-side clock.

    // Formats a Date object to a human-readable localized string.
    jQuery.easydate.format_date = function(date, language)
    {
        var settings = jQuery.extend({}, defaults);
        settings.locale = jQuery.easydate.locales[language]
        var now = new Date();
        var diff = (( now.getTime() - date.getTime()) / 1000);
        var diff_abs = Math.abs(diff);

        if(isNaN(diff))
          {

            return;

           }
        // Return if we shouldn't format this date because it is in the past
        // or future and our setting does not allow it.
        if((!settings.format_future && diff < 0) ||
            (!settings.format_past && diff > 0))
            return;

        for(var i in settings.units)
        {
            var unit = settings.units[i];

            // Skip this unit if it's for past dates only and this is a future
            // date, or if it's for future dates only and this is a past date.
            if((unit.past_only && diff < 0) || (unit.future_only && diff > 0))
                continue;

            if(diff_abs < unit.limit)
            {
                // Case for units that are not really measurement units - e.g.,
                // "yesterday" or "now".
                if(isNaN(unit.in_seconds))
                    return __(unit.name, NaN, settings);

                var val = diff_abs / unit.in_seconds;
                val = Math.round(val);
                var format_string;
                if(diff < 0)
                    format_string = __("future_format", NaN, settings)
                        .replace("%s", __("in", NaN, settings))
                else
                    format_string = __("past_format", NaN, settings)
                        .replace("%s", __("ago", NaN, settings))
                return format_string
                    .replace("%t", val + " " + __(unit.name, val, settings));
            }
        }

        // The date does not fall into any units' limits - use uneasy format.
        return settings.uneasy_format(date);
    }

})(jQuery);


;

(function( jQuery ) {
  // Create the request object
  // (This is still attached to ajaxSettings for backward compatibility)
  jQuery.ajaxSettings.xdr = function() {
    return (window.XDomainRequest ? new window.XDomainRequest() : null);
  };

  // Determine support properties
  (function( xdr ) {
    jQuery.extend( jQuery.support, { iecors: !!xdr });
  })( jQuery.ajaxSettings.xdr() );

  // Create transport if the browser can provide an xdr
  if ( jQuery.support.iecors ) {

    jQuery.ajaxTransport(function( s ) {
      var callback,
        xdr = s.xdr();

      return {
        send: function( headers, complete ) {
          xdr.onload = function() {
            var headers = { 'Content-Type': xdr.contentType };
            complete(200, 'OK', { text: xdr.responseText }, headers);
          };

          // Apply custom fields if provided
          if ( s.xhrFields ) {
            xhr.onerror = s.xhrFields.error;
            xhr.ontimeout = s.xhrFields.timeout;
          }

          xdr.open( s.type, s.url );

          // XDR has no method for setting headers O_o

          xdr.send( ( s.hasContent && s.data ) || null );
        },

        abort: function() {
          xdr.abort();
        }
      };
    });
  }
})( jQuery );


;

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix  = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind = ( 'onwheel' in document || document.documentMode >= 9 ) ?
                    ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice  = Array.prototype.slice,
        nullLowestDeltaTimeout, lowestDelta;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    var special = $.event.special.mousewheel = {
        version: '3.1.9',

        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
            // Store the line height and page height for this particular element
            $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
            $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        },

        getLineHeight: function(elem) {
            return parseInt($(elem)['offsetParent' in $.fn ? 'offsetParent' : 'parent']().css('fontSize'), 10);
        },

        getPageHeight: function(elem) {
            return $(elem).height();
        },

        settings: {
            adjustOldDeltas: true
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },

        unmousewheel: function(fn) {
            return this.unbind('mousewheel', fn);
        }
    });


    function handler(event) {
        var orgEvent   = event || window.event,
            args       = slice.call(arguments, 1),
            delta      = 0,
            deltaX     = 0,
            deltaY     = 0,
            absDelta   = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel';

        // Old school scrollwheel delta
        if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
        if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
        if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
        if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
        if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
            deltaX = deltaY * -1;
            deltaY = 0;
        }

        // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
        delta = deltaY === 0 ? deltaX : deltaY;

        // New school wheel delta (wheel event)
        if ( 'deltaY' in orgEvent ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( 'deltaX' in orgEvent ) {
            deltaX = orgEvent.deltaX;
            if ( deltaY === 0 ) { delta  = deltaX * -1; }
        }

        // No change actually happened, no reason to go any further
        if ( deltaY === 0 && deltaX === 0 ) { return; }

        // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages
        if ( orgEvent.deltaMode === 1 ) {
            var lineHeight = $.data(this, 'mousewheel-line-height');
            delta  *= lineHeight;
            deltaY *= lineHeight;
            deltaX *= lineHeight;
        } else if ( orgEvent.deltaMode === 2 ) {
            var pageHeight = $.data(this, 'mousewheel-page-height');
            delta  *= pageHeight;
            deltaY *= pageHeight;
            deltaX *= pageHeight;
        }

        // Store lowest absolute delta to normalize the delta values
        absDelta = Math.max( Math.abs(deltaY), Math.abs(deltaX) );

        if ( !lowestDelta || absDelta < lowestDelta ) {
            lowestDelta = absDelta;

            // Adjust older deltas if necessary
            if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
                lowestDelta /= 40;
            }
        }

        // Adjust older deltas if necessary
        if ( shouldAdjustOldDeltas(orgEvent, absDelta) ) {
            // Divide all the things by 40!
            delta  /= 40;
            deltaX /= 40;
            deltaY /= 40;
        }

        // Get a whole, normalized value for the deltas
        delta  = Math[ delta  >= 1 ? 'floor' : 'ceil' ](delta  / lowestDelta);
        deltaX = Math[ deltaX >= 1 ? 'floor' : 'ceil' ](deltaX / lowestDelta);
        deltaY = Math[ deltaY >= 1 ? 'floor' : 'ceil' ](deltaY / lowestDelta);

        // Add information to the event object
        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.
        event.deltaMode = 0;

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120
        if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

}));


;

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function () {
                return this.valueOf();
            };
    }

    var cx,
        escapable,
        gap,
        indent,
        meta,
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());



;

// Generated by CoffeeScript 1.12.6

/*
   Stomp Over WebSocket http://www.jmesnil.net/stomp-websocket/doc/ | Apache License V2.0

   Copyright (C) 2010-2013 [Jeff Mesnil](http://jmesnil.net/)
   Copyright (C) 2012 [FuseSource, Inc.](http://fusesource.com)
   Copyright (C) 2017 [Deepak Kumar](https://www.kreatio.com)
 */

(function() {
  var Byte, Client, Frame, Stomp,
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Byte = {
    LF: '\x0A',
    NULL: '\x00'
  };

  Frame = (function() {
    var unmarshallSingle;

    function Frame(command1, headers1, body1, escapeHeaderValues1) {
      this.command = command1;
      this.headers = headers1 != null ? headers1 : {};
      this.body = body1 != null ? body1 : '';
      this.escapeHeaderValues = escapeHeaderValues1 != null ? escapeHeaderValues1 : false;
    }

    Frame.prototype.toString = function() {
      var lines, name, ref, skipContentLength, value;
      lines = [this.command];
      skipContentLength = (this.headers['content-length'] === false) ? true : false;
      if (skipContentLength) {
        delete this.headers['content-length'];
      }
      ref = this.headers;
      for (name in ref) {
        if (!hasProp.call(ref, name)) continue;
        value = ref[name];
        if (this.escapeHeaderValues && this.command !== 'CONNECT' && this.command !== 'CONNECTED') {
          lines.push(name + ":" + (Frame.frEscape(value)));
        } else {
          lines.push(name + ":" + value);
        }
      }
      if (this.body && !skipContentLength) {
        lines.push("content-length:" + (Frame.sizeOfUTF8(this.body)));
      }
      lines.push(Byte.LF + this.body);
      return lines.join(Byte.LF);
    };

    Frame.sizeOfUTF8 = function(s) {
      if (s) {
        return encodeURI(s).match(/%..|./g).length;
      } else {
        return 0;
      }
    };

    unmarshallSingle = function(data, escapeHeaderValues) {
      var body, chr, command, divider, headerLines, headers, i, idx, j, k, len, len1, line, ref, ref1, ref2, start, trim;
      if (escapeHeaderValues == null) {
        escapeHeaderValues = false;
      }
      divider = data.search(RegExp("" + Byte.LF + Byte.LF));
      headerLines = data.substring(0, divider).split(Byte.LF);
      command = headerLines.shift();
      headers = {};
      trim = function(str) {
        return str.replace(/^\s+|\s+$/g, '');
      };
      ref = headerLines.reverse();
      for (j = 0, len1 = ref.length; j < len1; j++) {
        line = ref[j];
        idx = line.indexOf(':');
        if (escapeHeaderValues && command !== 'CONNECT' && command !== 'CONNECTED') {
          headers[trim(line.substring(0, idx))] = Frame.frUnEscape(trim(line.substring(idx + 1)));
        } else {
          headers[trim(line.substring(0, idx))] = trim(line.substring(idx + 1));
        }
      }
      body = '';
      start = divider + 2;
      if (headers['content-length']) {
        len = parseInt(headers['content-length']);
        body = ('' + data).substring(start, start + len);
      } else {
        chr = null;
        for (i = k = ref1 = start, ref2 = data.length; ref1 <= ref2 ? k < ref2 : k > ref2; i = ref1 <= ref2 ? ++k : --k) {
          chr = data.charAt(i);
          if (chr === Byte.NULL) {
            break;
          }
          body += chr;
        }
      }
      return new Frame(command, headers, body, escapeHeaderValues);
    };

    Frame.unmarshall = function(datas, escapeHeaderValues) {
      var frame, frames, last_frame, r;
      if (escapeHeaderValues == null) {
        escapeHeaderValues = false;
      }
      frames = datas.split(RegExp("" + Byte.NULL + Byte.LF + "*"));
      r = {
        frames: [],
        partial: ''
      };
      r.frames = (function() {
        var j, len1, ref, results;
        ref = frames.slice(0, -1);
        results = [];
        for (j = 0, len1 = ref.length; j < len1; j++) {
          frame = ref[j];
          results.push(unmarshallSingle(frame, escapeHeaderValues));
        }
        return results;
      })();
      last_frame = frames.slice(-1)[0];
      if (last_frame === Byte.LF || (last_frame.search(RegExp("" + Byte.NULL + Byte.LF + "*$"))) !== -1) {
        r.frames.push(unmarshallSingle(last_frame, escapeHeaderValues));
      } else {
        r.partial = last_frame;
      }
      return r;
    };

    Frame.marshall = function(command, headers, body, escapeHeaderValues) {
      var frame;
      frame = new Frame(command, headers, body, escapeHeaderValues);
      return frame.toString() + Byte.NULL;
    };

    Frame.frEscape = function(str) {
      return ("" + str).replace(/\\/g, "\\\\").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/:/g, "\\c");
    };

    Frame.frUnEscape = function(str) {
      return ("" + str).replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\c/g, ":").replace(/\\\\/g, "\\");
    };

    return Frame;

  })();

  Client = (function() {
    var now;

    function Client(ws_fn) {
      this.ws_fn = function() {
        var ws;
        ws = ws_fn();
        ws.binaryType = "arraybuffer";
        return ws;
      };
      this.reconnect_delay = 0;
      this.counter = 0;
      this.connected = false;
      this.heartbeat = {
        outgoing: 10000,
        incoming: 10000
      };
      this.maxWebSocketFrameSize = 16 * 1024;
      this.subscriptions = {};
      this.partialData = '';
    }

    Client.prototype.debug = function(message) {
      var ref;
      return typeof window !== "undefined" && window !== null ? (ref = window.console) != null ? ref.log(message) : void 0 : void 0;
    };

    now = function() {
      if (Date.now) {
        return Date.now();
      } else {
        return new Date().valueOf;
      }
    };

    Client.prototype._transmit = function(command, headers, body) {
      var out;
      out = Frame.marshall(command, headers, body, this.escapeHeaderValues);
      if (typeof this.debug === "function") {
        this.debug(">>> " + out);
      }
      while (true) {
        if (out.length > this.maxWebSocketFrameSize) {
          this.ws.send(out.substring(0, this.maxWebSocketFrameSize));
          out = out.substring(this.maxWebSocketFrameSize);
          if (typeof this.debug === "function") {
            this.debug("remaining = " + out.length);
          }
        } else {
          return this.ws.send(out);
        }
      }
    };

    Client.prototype._setupHeartbeat = function(headers) {
      var ref, ref1, serverIncoming, serverOutgoing, ttl, v;
      if ((ref = headers.version) !== Stomp.VERSIONS.V1_1 && ref !== Stomp.VERSIONS.V1_2) {
        return;
      }
      ref1 = (function() {
        var j, len1, ref1, results;
        ref1 = headers['heart-beat'].split(",");
        results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          v = ref1[j];
          results.push(parseInt(v));
        }
        return results;
      })(), serverOutgoing = ref1[0], serverIncoming = ref1[1];
      if (!(this.heartbeat.outgoing === 0 || serverIncoming === 0)) {
        ttl = Math.max(this.heartbeat.outgoing, serverIncoming);
        if (typeof this.debug === "function") {
          this.debug("send PING every " + ttl + "ms");
        }
        this.pinger = Stomp.setInterval(ttl, (function(_this) {
          return function() {
            _this.ws.send(Byte.LF);
            return typeof _this.debug === "function" ? _this.debug(">>> PING") : void 0;
          };
        })(this));
      }
      if (!(this.heartbeat.incoming === 0 || serverOutgoing === 0)) {
        ttl = Math.max(this.heartbeat.incoming, serverOutgoing);
        if (typeof this.debug === "function") {
          this.debug("check PONG every " + ttl + "ms");
        }
        return this.ponger = Stomp.setInterval(ttl, (function(_this) {
          return function() {
            var delta;
            delta = now() - _this.serverActivity;
            if (delta > ttl * 2) {
              if (typeof _this.debug === "function") {
                _this.debug("did not receive server activity for the last " + delta + "ms");
              }
              return _this.ws.close();
            }
          };
        })(this));
      }
    };

    Client.prototype._parseConnect = function() {
      var args, closeEventCallback, connectCallback, errorCallback, headers;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      headers = {};
      if (args.length < 2) {
        throw "Connect requires at least 2 arguments";
      }
      if (typeof args[1] === 'function') {
        headers = args[0], connectCallback = args[1], errorCallback = args[2], closeEventCallback = args[3];
      } else {
        switch (args.length) {
          case 6:
            headers.login = args[0], headers.passcode = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4], headers.host = args[5];
            break;
          default:
            headers.login = args[0], headers.passcode = args[1], connectCallback = args[2], errorCallback = args[3], closeEventCallback = args[4];
        }
      }
      return [headers, connectCallback, errorCallback, closeEventCallback];
    };

    Client.prototype.connect = function() {
      var args, out;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.escapeHeaderValues = false;
      out = this._parseConnect.apply(this, args);
      this.headers = out[0], this.connectCallback = out[1], this.errorCallback = out[2], this.closeEventCallback = out[3];
      this._active = true;
      return this._connect();
    };

    Client.prototype._connect = function() {
      var UTF8ArrayToStr, closeEventCallback, errorCallback, headers;
      headers = this.headers;
      errorCallback = this.errorCallback;
      closeEventCallback = this.closeEventCallback;
      if (!this._active) {
        this.debug('Client has been marked inactive, will not attempt to connect');
        return;
      }
      if (typeof this.debug === "function") {
        this.debug("Opening Web Socket...");
      }
      this.ws = this.ws_fn();
      UTF8ArrayToStr = (function(_this) {
        return function(array) {
          var c, char2, char3, i, len, out;
          out = "";
          len = array.length;
          i = 0;
          while (i < len) {
            c = array[i++];
            switch (c >> 4) {
              case 0:
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
              case 6:
              case 7:
                out += String.fromCharCode(c);
                break;
              case 12:
              case 13:
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
              case 14:
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
            }
          }
          return out;
        };
      })(this);
      this.ws.onmessage = (function(_this) {
        return function(evt) {
          var arr, client, data, frame, j, len1, messageID, onreceive, ref, subscription, unmarshalledData;
          data = typeof ArrayBuffer !== 'undefined' && evt.data instanceof ArrayBuffer ? (arr = new Uint8Array(evt.data), typeof _this.debug === "function" ? _this.debug("--- got data length: " + arr.length) : void 0, UTF8ArrayToStr(arr)) : evt.data;
          _this.serverActivity = now();
          if (data === Byte.LF) {
            if (typeof _this.debug === "function") {
              _this.debug("<<< PONG");
            }
            return;
          }
          if (typeof _this.debug === "function") {
            _this.debug("<<< " + data);
          }
          unmarshalledData = Frame.unmarshall(_this.partialData + data, _this.escapeHeaderValues);
          _this.partialData = unmarshalledData.partial;
          ref = unmarshalledData.frames;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            frame = ref[j];
            switch (frame.command) {
              case "CONNECTED":
                if (typeof _this.debug === "function") {
                  _this.debug("connected to server " + frame.headers.server);
                }
                _this.connected = true;
                _this.version = frame.headers.version;
                if (_this.version === Stomp.VERSIONS.V1_2) {
                  _this.escapeHeaderValues = true;
                }
                if (!_this._active) {
                  _this.disconnect();
                  return;
                }
                _this._setupHeartbeat(frame.headers);
                if (typeof _this.connectCallback === "function") {
                  _this.connectCallback(frame);
                }
                break;
              case "MESSAGE":
                subscription = frame.headers.subscription;
                onreceive = _this.subscriptions[subscription] || _this.onreceive;
                if (onreceive) {
                  client = _this;
                  if (_this.version === Stomp.VERSIONS.V1_2) {
                    messageID = frame.headers["ack"];
                  } else {
                    messageID = frame.headers["message-id"];
                  }
                  frame.ack = function(headers) {
                    if (headers == null) {
                      headers = {};
                    }
                    return client.ack(messageID, subscription, headers);
                  };
                  frame.nack = function(headers) {
                    if (headers == null) {
                      headers = {};
                    }
                    return client.nack(messageID, subscription, headers);
                  };
                  onreceive(frame);
                } else {
                  if (typeof _this.debug === "function") {
                    _this.debug("Unhandled received MESSAGE: " + frame);
                  }
                }
                break;
              case "RECEIPT":
                if (frame.headers["receipt-id"] === _this.closeReceipt) {
                  _this.ws.onclose = null;
                  _this.ws.close();
                  _this._cleanUp();
                  if (typeof _this._disconnectCallback === "function") {
                    _this._disconnectCallback();
                  }
                } else {
                  if (typeof _this.onreceipt === "function") {
                    _this.onreceipt(frame);
                  }
                }
                break;
              case "ERROR":
                if (typeof errorCallback === "function") {
                  errorCallback(frame);
                }
                break;
              default:
                if (typeof _this.debug === "function") {
                  _this.debug("Unhandled frame: " + frame);
                }
            }
          }
        };
      })(this);
      this.ws.onclose = (function(_this) {
        return function(closeEvent) {
          var msg;
          msg = "Whoops! Lost connection to " + _this.ws.url;
          if (typeof _this.debug === "function") {
            _this.debug(msg);
          }
          if (typeof closeEventCallback === "function") {
            closeEventCallback(closeEvent);
          }
          _this._cleanUp();
          if (typeof errorCallback === "function") {
            errorCallback(msg);
          }
          return _this._schedule_reconnect();
        };
      })(this);
      return this.ws.onopen = (function(_this) {
        return function() {
          if (typeof _this.debug === "function") {
            _this.debug('Web Socket Opened...');
          }
          headers["accept-version"] = Stomp.VERSIONS.supportedVersions();
          headers["heart-beat"] = [_this.heartbeat.outgoing, _this.heartbeat.incoming].join(',');
          return _this._transmit("CONNECT", headers);
        };
      })(this);
    };

    Client.prototype._schedule_reconnect = function() {
      if (this.reconnect_delay > 0) {
        if (typeof this.debug === "function") {
          this.debug("STOMP: scheduling reconnection in " + this.reconnect_delay + "ms");
        }
        return this._reconnector = setTimeout((function(_this) {
          return function() {
            if (_this.connected) {
              return typeof _this.debug === "function" ? _this.debug('STOMP: already connected') : void 0;
            } else {
              if (typeof _this.debug === "function") {
                _this.debug('STOMP: attempting to reconnect');
              }
              return _this._connect();
            }
          };
        })(this), this.reconnect_delay);
      }
    };

    Client.prototype.disconnect = function(disconnectCallback, headers) {
      var error;
      if (headers == null) {
        headers = {};
      }
      this._disconnectCallback = disconnectCallback;
      this._active = false;
      if (this.connected) {
        if (!headers.receipt) {
          headers.receipt = "close-" + this.counter++;
        }
        this.closeReceipt = headers.receipt;
        try {
          return this._transmit("DISCONNECT", headers);
        } catch (error1) {
          error = error1;
          return typeof this.debug === "function" ? this.debug('Ignoring error during disconnect', error) : void 0;
        }
      }
    };

    Client.prototype._cleanUp = function() {
      if (this._reconnector) {
        clearTimeout(this._reconnector);
      }
      this.connected = false;
      this.subscriptions = {};
      this.partial = '';
      if (this.pinger) {
        Stomp.clearInterval(this.pinger);
      }
      if (this.ponger) {
        return Stomp.clearInterval(this.ponger);
      }
    };

    Client.prototype.send = function(destination, headers, body) {
      if (headers == null) {
        headers = {};
      }
      if (body == null) {
        body = '';
      }
      headers.destination = destination;
      return this._transmit("SEND", headers, body);
    };

    Client.prototype.subscribe = function(destination, callback, headers) {
      var client;
      if (headers == null) {
        headers = {};
      }
      if (!headers.id) {
        headers.id = "sub-" + this.counter++;
      }
      headers.destination = destination;
      this.subscriptions[headers.id] = callback;
      this._transmit("SUBSCRIBE", headers);
      client = this;
      return {
        id: headers.id,
        unsubscribe: function(hdrs) {
          return client.unsubscribe(headers.id, hdrs);
        }
      };
    };

    Client.prototype.unsubscribe = function(id, headers) {
      if (headers == null) {
        headers = {};
      }
      delete this.subscriptions[id];
      headers.id = id;
      return this._transmit("UNSUBSCRIBE", headers);
    };

    Client.prototype.begin = function(transaction_id) {
      var client, txid;
      txid = transaction_id || "tx-" + this.counter++;
      this._transmit("BEGIN", {
        transaction: txid
      });
      client = this;
      return {
        id: txid,
        commit: function() {
          return client.commit(txid);
        },
        abort: function() {
          return client.abort(txid);
        }
      };
    };

    Client.prototype.commit = function(transaction_id) {
      return this._transmit("COMMIT", {
        transaction: transaction_id
      });
    };

    Client.prototype.abort = function(transaction_id) {
      return this._transmit("ABORT", {
        transaction: transaction_id
      });
    };

    Client.prototype.ack = function(messageID, subscription, headers) {
      if (headers == null) {
        headers = {};
      }
      if (this.version === Stomp.VERSIONS.V1_2) {
        headers["id"] = messageID;
      } else {
        headers["message-id"] = messageID;
      }
      headers.subscription = subscription;
      return this._transmit("ACK", headers);
    };

    Client.prototype.nack = function(messageID, subscription, headers) {
      if (headers == null) {
        headers = {};
      }
      if (this.version === Stomp.VERSIONS.V1_2) {
        headers["id"] = messageID;
      } else {
        headers["message-id"] = messageID;
      }
      headers.subscription = subscription;
      return this._transmit("NACK", headers);
    };

    return Client;

  })();

  Stomp = {
    VERSIONS: {
      V1_0: '1.0',
      V1_1: '1.1',
      V1_2: '1.2',
      supportedVersions: function() {
        return '1.2,1.1,1.0';
      }
    },
    client: function(url, protocols) {
      var ws_fn;
      if (protocols == null) {
        protocols = ['v10.stomp', 'v11.stomp', 'v12.stomp'];
      }
      ws_fn = function() {
        var klass;
        klass = Stomp.WebSocketClass || WebSocket;
        return new klass(url, protocols);
      };
      return new Client(ws_fn);
    },
    over: function(ws) {
      var ws_fn;
      ws_fn = typeof ws === "function" ? ws : function() {
        return ws;
      };
      return new Client(ws_fn);
    },
    Frame: Frame
  };

  Stomp.setInterval = function(interval, f) {
    return setInterval(f, interval);
  };

  Stomp.clearInterval = function(id) {
    return clearInterval(id);
  };

  if (typeof exports !== "undefined" && exports !== null) {
    exports.Stomp = Stomp;
  }

  if (typeof window !== "undefined" && window !== null) {
    window.Stomp = Stomp;
  } else if (!exports) {
    self.Stomp = Stomp;
  }

}).call(this);

;

//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisherâ€“Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate, context) {
    predicate = lookupIterator(predicate);
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate.call(context, elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);


;

//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

var uuid;

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define('uuid', [], function(){return uuid;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);


;

// UAParser.js v0.7.1
// Lightweight JavaScript-based User-Agent string parser
// https://github.com/faisalman/ua-parser-js
//
// Copyright © 2012-2014 Faisal Salman <fyzlman@gmail.com>
// Dual licensed under GPLv2 & MIT

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.1',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        MAJOR       = 'major',
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            for (var i in extensions) {
                if ("browser cpu device engine os".indexOf(i) !== -1 && extensions[i].length % 2 === 0) {
                    regexes[i] = extensions[i].concat(regexes[i]);
                }
            }
            return regexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function () {

            // loop through all regexes maps
            for (var result, i = 0, j, k, p, q, matches, match, args = arguments; i < args.length; i += 2) {

                var regex = args[i],       // even sequence (0,2,4,..)
                    props = args[i + 1];   // odd sequence (1,3,5,..)

                // construct object barebones
                if (typeof(result) === UNDEF_TYPE) {
                    result = {};
                    for (p in props) {
                        q = props[p];
                        if (typeof(q) === OBJ_TYPE) {
                            result[q[0]] = undefined;
                        } else {
                            result[q] = undefined;
                        }
                    }
                }

                // try matching uastring with regexes
                for (j = k = 0; j < regex.length; j++) {
                    matches = regex[j].exec(this.getUA());
                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof(q) === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof(q[1]) == FUNC_TYPE) {
                                        // assign modified match
                                        result[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        result[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof(q[1]) === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                result[q] = match ? match : undefined;
                            }
                        }
                        break;
                    }
                }

                if(!!matches) break; // break the loop immediately if match found
            }
            return result;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof(map[i]) === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                major : {
                    '1' : ['/8', '/1', '/3'],
                    '2' : '/4',
                    '?' : '/'
                },
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/((\d+)?[\w\.-]+)/i,                                 // Opera Mini
            /(opera\s[mobiletab]+).+version\/((\d+)?[\w\.-]+)/i,                // Opera Mobi/Tablet
            /(opera).+version\/((\d+)?[\w\.]+)/i,                               // Opera > 9.80
            /(opera)[\/\s]+((\d+)?[\w\.]+)/i                                    // Opera < 9.80

            ], [NAME, VERSION, MAJOR], [

            /\s(opr)\/((\d+)?[\w\.]+)/i                                         // Opera Webkit
            ], [[NAME, 'Opera'], VERSION, MAJOR], [

            // Mixed
            /(kindle)\/((\d+)?[\w\.]+)/i,                                       // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?((\d+)?[\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?((\d+)?[\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s((\d+)?[\w\.]+)/i,                                  // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)((?:\/)[\w\.]+)*/i,                                        // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron)\/((\d+)?[\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron
            ], [NAME, VERSION, MAJOR], [

            /(trident).+rv[:\s]((\d+)?[\w\.]+).+like\sgecko/i                   // IE11
            ], [[NAME, 'IE'], VERSION, MAJOR], [

            /(yabrowser)\/((\d+)?[\w\.]+)/i                                     // Yandex
            ], [[NAME, 'Yandex'], VERSION, MAJOR], [

            /(comodo_dragon)\/((\d+)?[\w\.]+)/i                                 // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION, MAJOR], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?((\d+)?[\w\.]+)/i,
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            /(uc\s?browser|qqbrowser)[\/\s]?((\d+)?[\w\.]+)/i
                                                                                //UCBrowser/QQBrowser
            ], [NAME, VERSION, MAJOR], [

            /(dolfin)\/((\d+)?[\w\.]+)/i                                        // Dolphin
            ], [[NAME, 'Dolphin'], VERSION, MAJOR], [

            /((?:android.+)crmo|crios)\/((\d+)?[\w\.]+)/i                       // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION, MAJOR], [

            /version\/((\d+)?[\w\.]+).+?mobile\/\w+\s(safari)/i                 // Mobile Safari
            ], [VERSION, MAJOR, [NAME, 'Mobile Safari']], [

            /version\/((\d+)?[\w\.]+).+?(mobile\s?safari|safari)/i              // Safari & Safari Mobile
            ], [VERSION, MAJOR, NAME], [

            /webkit.+?(mobile\s?safari|safari)((\/[\w\.]+))/i                   // Safari < 3.0
            ], [NAME, [MAJOR, mapper.str, maps.browser.oldsafari.major], [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/((\d+)?[\w\.]+)/i,                                    // Konqueror
            /(webkit|khtml)\/((\d+)?[\w\.]+)/i
            ], [NAME, VERSION, MAJOR], [

            // Gecko based
            /(navigator|netscape)\/((\d+)?[\w\.-]+)/i                           // Netscape
            ], [[NAME, 'Netscape'], VERSION, MAJOR], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?((\d+)?[\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/((\d+)?[\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/((\d+)?[\w\.]+).+rv\:.+gecko\/\d+/i,                    // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf)[\/\s]?((\d+)?[\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf
            /(links)\s\(((\d+)?[\w\.]+)/i,                                      // Links
            /(gobrowser)\/?((\d+)?[\w\.]+)*/i,                                  // GoBrowser
            /(ice\s?browser)\/v?((\d+)?[\w\._]+)/i,                             // ICE Browser
            /(mosaic)[\/\s]((\d+)?[\w\.]+)/i                                    // Mosaic
            ], [NAME, VERSION, MAJOR]

            /* /////////////////////
            // Media players BEGIN
            ////////////////////////

            , [

            /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
            /(coremedia) v((\d+)[\w\._]+)/i
            ], [NAME, VERSION, MAJOR], [

            /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
            ], [NAME, VERSION], [

            /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
            ], [NAME, VERSION, MAJOR], [

            /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                                // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                                // NSPlayer/PSP-InternetRadioPlayer/Videos
            /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
            /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
            /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
            ], [NAME, VERSION, MAJOR], [
            /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
            ], [NAME, VERSION, MAJOR], [

            /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
            ], [[NAME, 'Flip Player'], VERSION, MAJOR], [

            /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                                // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
            ], [NAME], [

            /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                                // Gstreamer
            ], [NAME, VERSION, MAJOR], [

            /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
            /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                                // Java/urllib/requests/wget/cURL
            /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
            ], [NAME, VERSION, MAJOR], [

            /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
            ], [[NAME, /_/g, ' '], VERSION, MAJOR], [

            /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                                // MPlayer SVN
            ], [NAME, VERSION], [

            /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
            ], [NAME, VERSION, MAJOR], [

            /(mplayer)/i,                                                       // MPlayer (no other info)
            /(yourmuze)/i,                                                      // YourMuze
            /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
            ], [NAME], [

            /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
            ], [NAME, VERSION, MAJOR], [

            /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
            ], [NAME, VERSION, MAJOR], [

            /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
            ], [NAME, VERSION, MAJOR], [

            /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
            /(winamp)\s((\d+)[\w\.-]+)/i,
            /(winamp)mpeg\/((\d+)[\w\.-]+)/i
            ], [NAME, VERSION, MAJOR], [

            /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                                // inlight radio
            ], [NAME], [

            /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                                // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                                // SoundTap/Totem/Stagefright/Streamium
            ], [NAME, VERSION, MAJOR], [

            /(smp)((\d+)[\d\.]+)/i                                              // SMP
            ], [NAME, VERSION, MAJOR], [

            /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
            /(vlc)\/((\d+)[\w\.-]+)/i,
            /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
            /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
            /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
            ], [NAME, VERSION, MAJOR], [

            /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
            /(windows-media-player)\/((\d+)[\w\.-]+)/i
            ], [[NAME, /-/g, ' '], VERSION, MAJOR], [

            /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                                // Windows Media Server
            ], [VERSION, MAJOR, [NAME, 'Windows']], [

            /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
            ], [NAME, VERSION, MAJOR], [

            /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
            /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
            ], [[NAME, 'rad.io'], VERSION, MAJOR]

            //////////////////////
            // Media players END
            ////////////////////*/

        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /(ia64(?=;)|68k(?=\))|arm(?=v\d+;)|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM, IRIX, MIPS, SPARC, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|huawei|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Huawei/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\((bb10);\s(\w+)/i                                                 // BlackBerry 10
            ], [[VENDOR, 'BlackBerry'], MODEL, [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+((transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7))/i
            ], [[VENDOR, 'Asus'], MODEL, [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])/i                                           // Sony Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /((playstation)\s[3portablevi]+)/i                                  // Playstation
            ], [[VENDOR, 'Sony'], MODEL, [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(Lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
            ], [[VENDOR, 'Lenovo'], MODEL, [TYPE, TABLET]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|huawei|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Huawei/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s((milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?))[\w\s]+build\//i,
            /(mot)[\s-]?(\w+)*/i
            ], [[VENDOR, 'Motorola'], MODEL, [TYPE, MOBILE]], [
            /android.+\s((mz60\d|xoom[\s2]{0,2}))\sbuild\//i
            ], [[VENDOR, 'Motorola'], MODEL, [TYPE, TABLET]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n8000|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-n900))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [
            /(sie)-(\w+)*/i                                                     // Siemens
            ], [[VENDOR, 'Siemens'], MODEL, [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w-;]{10}((a\d{3}))/i                               // Acer
            ], [[VENDOR, 'Acer'], MODEL, [TYPE, TABLET]], [

            /android\s3\.[\s\w-;]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, [TYPE, SMARTTV]], [
            /((nexus\s[45]))/i,                                                 // LG
            /(lg)[e;\s\/-]+(\w+)*/i
            ], [[VENDOR, 'LG'], MODEL, [TYPE, MOBILE]], [

            /android.+((ideatab[a-z0-9\-\s]+))/i                                // Lenovo
            ], [[VENDOR, 'Lenovo'], MODEL, [TYPE, TABLET]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /(mobile|tablet);.+rv\:.+gecko\//i                                  // Unidentifiable
            ], [[TYPE, util.lowerize], VENDOR, MODEL]
        ],

        engine : [[

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*|windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)\/([\w\.]+)/i,                                              // Tizen
            /(android|webos|palm\os|qnx|bada|rim\stablet\sos|meego)[\/\s-]?([\w\.]+)*/i,
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo
            /linux;.+(sailfish);/i                                              // Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids3portablevu]+)/i,                    // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk)[\/\s-]?([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(ip[honead]+)(?:.*os\s*([\w]+)*\slike\smac|;\sopera)/i             // iOS
            ], [[NAME, 'iOS'], [VERSION, /_/g, '.']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i                                    // Mac OS
            ], [NAME, [VERSION, /_/g, '.']], [

            // Other
            /(haiku)\s(\w+)/i,                                                  // Haiku
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(macintosh|mac(?=_powerpc)|plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////


    var UAParser = function (uastring, extensions) {

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;

        this.getBrowser = function () {
            return mapper.rgx.apply(this, rgxmap.browser);
        };
        this.getCPU = function () {
            return mapper.rgx.apply(this, rgxmap.cpu);
        };
        this.getDevice = function () {
            return mapper.rgx.apply(this, rgxmap.device);
        };
        this.getEngine = function () {
            return mapper.rgx.apply(this, rgxmap.engine);
        };
        this.getOS = function () {
            return mapper.rgx.apply(this, rgxmap.os);
        };
        this.getResult = function() {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        this.setUA(ua);
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR,
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };


    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof(module) !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
    } else {
        // browser env
        window.UAParser = UAParser;
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define('UAParser', [], function () {
                return UAParser;
            });
        }
        // jQuery/Zepto specific (optional)
        var $ = window.jQuery || window.Zepto;
        if (typeof($) !== UNDEF_TYPE) {
            var parser = new UAParser();
            $.ua = parser.getResult();
            $.ua.get = function() {
                return parser.getUA();
            };
            $.ua.set = function (uastring) {
                parser.setUA(uastring);
                var result = parser.getResult();
                for (var prop in result) {
                    $.ua[prop] = result[prop];
                }
            };
        }
    }

})(this);


;

/**
 * @fileoverview
 */
'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxPredictive.
         * Provides a dropdown list with autocompletion results
         * on top of a input, triggering events
         */
        function MaxPredictive(options) {
            var self = this;
            self.minchars = options.minchars;
            self.maxui = options.maxui;
            self.source = options.source;
            self.action = options.action;
            self.filter = options.filter;
            self.requests = {};
            self.$el = jq(options.list);
            self.$list = self.$el.find('ul');
            self.$el.on('click', '.maxui-prediction', function(event) {
                var $clicked = jq(event.currentTarget);
                self.select($clicked);
                self.choose(event);
            });
        }
        MaxPredictive.prototype.select = function($element) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            $selected.removeClass('selected');
            $element.addClass('selected');
        };
        MaxPredictive.prototype.choose = function(event) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            this.action.apply(self, [$selected]);
            self.hide();
        };
        MaxPredictive.prototype.moveup = function(event) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            var $prev = $selected.prev();
            if ($prev.length > 0) {
                self.select($prev);
            } else {
                self.select($selected.siblings(':last'));
            }
        };
        MaxPredictive.prototype.movedown = function(event) {
            var self = this;
            var $selected = self.$list.find('.maxui-prediction.selected');
            var $next = $selected.next();
            $selected.removeClass('selected');
            if ($next.length > 0) {
                self.select($next);
            } else {
                self.select($selected.siblings(':first'));
            }
        };
        MaxPredictive.prototype.matchingRequest = function(text) {
            var self = this;
            var previous_request;
            var previous_text = text.substr(0, text.length - 1);
            jq.each(self.requests, function(key, value) {
                if (previous_text === key) {
                    previous_request = value;
                }
            });
            if (previous_request && !previous_request.remaining) {
                // We have a previous request (-1) and the server told us that there's no remaining items
                // so we return the key of the stored request to use
                return previous_request.text;
            }
        };
        MaxPredictive.prototype.normalizeWhiteSpace = function(s, multi) {
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/\n /, "\n");
            var trimMulti = true;
            if (arguments.length > 1) {
                trimMulti = multi;
            }
            if (trimMulti === true) {
                s = s.replace(/[ ]{2,}/gi, " ");
            }
            return s;
        };
        // Fetch new predictions from source if needed, and render them
        // Also, predictions are stored in self.requests, so we try to repeat request only when needed
        // Algorith:
        //   1 - if the request is repeated, use the stored request
        //   2 - if we have a request that is shorter than 10, filter and use it, as there isn't more data in server to show
        //   3 - if we don't have any matching data for the current request, fetch it
        MaxPredictive.prototype.show = function(event) {
            var self = this;
            var $input = jq(event.target);
            var text = self.normalizeWhiteSpace($input.val(), false);
            if (text.length >= this.minchars) {
                var matching_request = self.matchingRequest(text);
                if (self.requests.hasOwnProperty(text)) {
                    self.render(text, text);
                } else if (matching_request) {
                    self.render(text, matching_request);
                } else {
                    this.source.apply(this, [event, text,
                        function(data) {
                            self.requests[text] = {
                                text: text,
                                data: data,
                                remaining: this.getResponseHeader('X-Has-Remaining-Items')
                            };
                            self.render(text, text);
                        }]);
                }
            } else {
                self.hide();
            }
        };
        MaxPredictive.prototype.render = function(query, request) {
            var self = this;
            var predictions = '';
            var items = self.requests[request].data;
            var filter = self.filter();
            // Iterate through all the users returned by the query
            var selected_index = false;
            for (var i = 0; i < items.length; i++) {
                var prediction = items[i];
                // Only add predictions of users that are not already in the conversation
                // and that match the text query search, 'cause we could be reading a used request
                var query_matches_username = prediction.username.search(new RegExp(query, "i")) >= 0;
                var query_matches_displayname = prediction.displayName.search(new RegExp(query, "i")) >= 0;
                var prediction_matches_query = query_matches_displayname || query_matches_username;
                if (filter.indexOf(prediction.username) === -1 && prediction_matches_query) {
                    var avatar_url = self.maxui.settings.avatarURLpattern.format(prediction.username);
                    var params = {
                        username: prediction.username,
                        displayName: prediction.displayName,
                        avatarURL: avatar_url,
                        cssclass: 'maxui-prediction' + (!selected_index && ' selected' || '')
                    };
                    // Render the conversations template and append it at the end of the rendered conversations
                    predictions = predictions + self.maxui.templates.predictive.render(params);
                    selected_index = true;
                }
            }
            if (predictions === '') {
                predictions = '<li>' + self.maxui.settings.literals.no_match_found + '</li>';
            }
            self.$list.html(predictions);
            self.$el.show();
        };
        MaxPredictive.prototype.hide = function(event) {
            var self = this;
            self.$el.hide();
        };
        /** MaxInput.
         * Provides common features for a input that shows/hides a placeholder on focus
         * and triggers events on ENTER and ESC
         */
        function MaxInput(options) {
            var self = this;
            self.input = options.input;
            self.$input = jq(self.input);
            self.placeholder = options.placeholder;
            self.$delegate = jq(options.delegate);
            self.setBindings();
            self.bindings = options.bindings;
            // Initialize input value with placeholder
            self.$input.val(self.placeholder);
        }
        MaxInput.prototype.normalizeWhiteSpace = function(s, multi) {
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/\n /, "\n");
            var trimMulti = true;
            if (arguments.length > 1) {
                trimMulti = multi;
            }
            if (trimMulti === true) {
                s = s.replace(/[ ]{2,}/gi, " ");
            }
            return s;
        };
        MaxInput.prototype.bind = function(eventName, callback) {
            var self = this;
            self.$delegate.on(eventName, self.input, callback);
        };
        MaxInput.prototype.execExtraBinding = function(context, event) {
            var self = this;
            if (self.bindings.hasOwnProperty(event.type)) {
                self.bindings[event.type].apply(context, [event]);
            }
        };
        MaxInput.prototype.getInputValue = function() {
            var self = this;
            var text = this.$input.val();
            return self.normalizeWhiteSpace(text, false);
        };
        MaxInput.prototype.setBindings = function() {
            var maxinput = this;
            // Erase placeholder when focusing on input and nothing written
            maxinput.bind('focusin', function(event) {
                event.preventDefault();
                event.stopPropagation();
                var normalized = maxinput.getInputValue();
                if (normalized === maxinput.placeholder) {
                    jq(this).val('');
                }
                maxinput.execExtraBinding(this, event);
            });
            // Put placeholder back when focusing out and nothing written
            maxinput.bind('focusout', function(event) {
                event.preventDefault();
                event.stopPropagation();
                var normalized = maxinput.getInputValue();
                if (normalized === '') {
                    jq(this).val(maxinput.placeholder);
                    maxinput.$input.toggleClass('maxui-empty', true);
                }
                maxinput.execExtraBinding(this, event);
            });
            // Execute custom bindings on the events triggered by some
            // keypresses in the "keyup" binding.
            var binded_key_events = 'maxui-input-submit maxui-input-cancel maxui-input-up maxui-input-down maxui-input-keypress';
            maxinput.bind(binded_key_events, function(event) {
                event.preventDefault();
                event.stopPropagation();
                maxinput.execExtraBinding(this, event);
            });
            maxinput.bind('maxui-input-clear', function(event) {
                maxinput.$input.val(maxinput.placeholder);
            });
            // Put placeholder back when focusing out and nothing written
            maxinput.bind('keydown', function(event) {
                if (event.which === 38) {
                    maxinput.$input.trigger('maxui-input-up', [event]);
                } else if (event.which === 40) {
                    maxinput.$input.trigger('maxui-input-down', [event]);
                }
                maxinput.$input.toggleClass('maxui-empty', false);
            });
            // Trigger events on ENTER, ESC
            maxinput.bind('keyup', function(event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.which === 13 && !event.shiftKey) {
                    maxinput.$input.trigger('maxui-input-submit', [event]);
                } else if (event.which === 27) {
                    maxinput.$input.trigger('maxui-input-cancel', [event]);
                } else if (event.which !== 38 && event.which !== 40) {
                    maxinput.$input.trigger('maxui-input-keypress', [event]);
                }
                maxinput.execExtraBinding(this, event);
            });
        };
        return {
            MaxInput: MaxInput,
            MaxPredictive: MaxPredictive
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);


;

'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxViewName
         *
         *
         */
        // Object representing an overlay wrapper
        function MaxOverlay(maxui) {
            var self = this;
            self.maxui = maxui;
            self.title = 'Overlay Title';
            self.content = '';
            self.el = '#maxui-overlay-panel';
            self.overlay_show_class = jq("#box_chat").length > 0 ? '#box_chat .maxui-overlay' : '.maxui-overlay';
            jq(self.el + ' .maxui-close').click(function(event) {
                event.preventDefault();
                event.stopPropagation();
                self.maxui.overlay.hide();
            });
        }
        MaxOverlay.prototype.$el = function() {
            return jq(this.el);
        };
        MaxOverlay.prototype.setTitle = function(title) {
            this.$el().find('#maxui-overlay-title').text(title);
        };
        MaxOverlay.prototype.setContent = function(content) {
            this.$el().find('#maxui-overlay-content').html(content);
        };
        MaxOverlay.prototype.configure = function(overlay) {
            this.setTitle(overlay.title);
            this.setContent(overlay.content);
            overlay.bind(this);
        };
        MaxOverlay.prototype.show = function(overlay) {
            var self = this;
            overlay.load(function(data) {
                self.configure(data);
            });
            jq(self.overlay_show_class).show();
            self.$el().animate({
                opacity: 1
            }, 200);
        };
        MaxOverlay.prototype.hide = function() {
            var self = this;
            self.$el().trigger('maxui-overlay-close', []);
            self.$el().animate({
                opacity: 0
            }, 200, function(event) {
                jq(self.overlay_show_class).hide();
            });
        };
        return {
            MaxOverlay: MaxOverlay
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);


;

'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxChatInfo
         *
         *
         */
        function MaxChatInfo(maxui) {
            var self = this;
            self.maxui = maxui;
            self.title = maxui.settings.literals.conversations_info_title;
            self.content = '<div>Hello world</div>';
            self.panelID = 'conversation-settings-panel';
            self.displayNameSlot = {
                show: function() {
                    var $panel = jq(self.getOwnerSelector(''));
                    var $displayNameEdit = jq(self.getOwnerSelector('> #maxui-conversation-displayname-edit'));
                    var $displayName = jq(self.getOwnerSelector('> .maxui-displayname'));
                    var $displayNameInput = jq(self.getOwnerSelector('> #maxui-conversation-displayname-edit input.maxui-displayname'));
                    $displayNameInput.width($panel.width() - 82);
                    $displayName.hide();
                    $displayNameEdit.show().val($displayName.text()).focus();
                },
                hide: function() {
                    var $displayNameEdit = jq(self.getOwnerSelector('> #maxui-conversation-displayname-edit'));
                    var $displayName = jq(self.getOwnerSelector('> .maxui-displayname'));
                    $displayName.show();
                    $displayNameEdit.hide().val('');
                },
                save: function() {
                    var $displayName = jq(self.getOwnerSelector('> .maxui-displayname'));
                    var $displayNameInput = jq(self.getOwnerSelector('> #maxui-conversation-displayname-edit input.maxui-displayname'));
                    maxui.maxClient.modifyConversation(self.data.id, $displayNameInput.val(), function(event) {
                        self.displayNameSlot.hide();
                        $displayName.text(this.displayName);
                        maxui.conversations.messagesview.setTitle(this.displayName);
                    });
                }
            };
        }
        MaxChatInfo.prototype.getOwnerSelector = function(selector) {
            return '#maxui-' + this.panelID + '.maxui-owner ' + selector;
        };
        MaxChatInfo.prototype.getSelector = function(selector) {
            return '#maxui-' + this.panelID + ' ' + selector;
        };
        MaxChatInfo.prototype.bind = function(overlay) {
            var self = this;
            // Clear previous overla usage bindings
            overlay.$el().unbind();
            // Gets fresh conversation data on overlay close, checking first if the conversation is still
            // on the list, otherwise, it means that the overlay was closed by a deletion, and so we don't reload anything
            overlay.$el().on('maxui-overlay-close', function(event) {
                var still_exists = _.where(self.maxui.conversations.listview.conversations, {
                    id: self.maxui.conversations.active
                });
                if (!_.isEmpty(still_exists)) {
                    self.maxui.conversations.listview.loadConversation(self.maxui.conversations.active);
                }
            });
            // Open displayName editing box when user clicks on displayName
            overlay.$el().on('click', self.getOwnerSelector('> .maxui-displayname'), function(event) {
                self.displayNameSlot.show();
            });
            // Saves or hides displayName editing box when user presses ENTER or ESC
            overlay.$el().on('keyup', self.getOwnerSelector('> #maxui-conversation-displayname-edit input.maxui-displayname'), function(event) {
                if (event.which === 27) {
                    self.displayNameSlot.hide();
                } else if (event.which === 13) {
                    self.displayNameSlot.save();
                }
            });
            // Saves displayName when user clicks the ok button
            overlay.$el().on('click', self.getOwnerSelector('#maxui-conversation-displayname-edit i.maxui-icon-ok-circled'), function(event) {
                self.displayNameSlot.save();
            });
            // Hides displayName editing box hen user clicks the cancel button
            overlay.$el().on('click', self.getOwnerSelector('#maxui-conversation-displayname-edit i.maxui-icon-cancel-circled'), function(event) {
                self.displayNameSlot.hide();
            });
            // Displays confirmation buttons when Owner clicks on kick user button
            // Displays confirmation buttons when Owner clicks on transfer ownership button
            overlay.$el().on('click', self.getOwnerSelector('.maxui-conversation-user-action'), function(event) {
                var $action = jq(event.currentTarget);
                var $participant = $action.closest('.maxui-participant');
                $participant.find('.maxui-conversation-confirmation:visible').hide();
                $participant.find('.maxui-conversation-user-action.active').removeClass('active');
                $action.addClass('active');
                if ($action.hasClass('maxui-icon-crown-plus')) {
                    $participant.find('.maxui-conversation-transfer-to').show();
                } else if ($action.hasClass('maxui-icon-trash')) {
                    $participant.find('.maxui-conversation-kick-user').show();
                }
            });
            // Transfers ownership to selected user and toggles ownership crown and classes accordingly
            overlay.$el().on('click', self.getSelector('.maxui-participant .maxui-conversation-transfer-to .maxui-icon-ok-circled'), function(event) {
                var $new_owner = jq(event.currentTarget).closest('.maxui-participant');
                var new_owner_username = $new_owner.attr('data-username');
                var $current_owner = jq(self.getSelector('.maxui-participant.maxui-owner'));
                var $current_crown = $current_owner.find('.maxui-icon-crown');
                var $new_crown = $new_owner.find('.maxui-icon-crown-plus');
                self.maxui.maxClient.transferConversationOwnership(self.data.id, new_owner_username, function(event) {
                    $new_owner.find('.maxui-conversation-transfer-to').hide();
                    $current_crown.removeClass('maxui-icon-crown').addClass('maxui-icon-crown-plus');
                    $new_crown.removeClass('maxui-icon-crown-plus').addClass('maxui-icon-crown');
                    $current_owner.removeClass('maxui-owner');
                    $new_owner.addClass('maxui-owner');
                    overlay.$el().find(self.getSelector('')).toggleClass('maxui-owner', false);
                    overlay.$el().find(self.getSelector('#maxui-new-participant')).remove();
                    $new_crown.removeClass('active');
                });
            });
            // Kicks user and toggles trashbin and classes accordingly
            overlay.$el().on('click', self.getSelector('.maxui-participant .maxui-conversation-kick-user .maxui-icon-ok-circled'), function(event) {
                var $kicked_user = jq(event.currentTarget).closest('.maxui-participant');
                var kicked_username = $kicked_user.attr('data-username');
                self.maxui.maxClient.kickUserFromConversation(self.data.id, kicked_username, function(event) {
                    $kicked_user.remove();
                });
            });
            // Cancels ownership transfer
            // Cancels user kicking
            overlay.$el().on('click', self.getSelector('.maxui-participant .maxui-conversation-confirmation .maxui-icon-cancel-circled'), function(event) {
                var $new_owner = jq(event.currentTarget).closest('.maxui-participant');
                $new_owner.find('.maxui-conversation-confirmation:visible').hide();
                var $new_owner_action_icon = $new_owner.find('.maxui-conversation-user-action.active');
                $new_owner_action_icon.removeClass('active');
            });
            // Create MaxInput with predictable functionality
            self.predictive = new max.views.MaxPredictive({
                maxui: self.maxui,
                minchars: 3,
                filter: function(event) {
                    return jq.map(self.data.participants, function(element, index) {
                        return element.username;
                    });
                },
                source: function(event, query, callback) {
                    self.maxui.maxClient.getUsersList(query, callback);
                },
                action: function($selected) {
                    // Action executed after a prediction item is selected, to add the user add confirmation buttons
                    var username = $selected.attr('data-username');
                    var displayName = $selected.attr('data-username');
                    var params = {
                        style: "opacity:0; height:0px;",
                        username: username,
                        displayName: displayName,
                        literals: self.maxui.settings.literals,
                        avatarURL: self.maxui.settings.avatarURLpattern.format(username)
                    };
                    var newuser = self.maxui.templates.participant.render(params);
                    var $participants = jq(self.getSelector('.maxui-participants > ul'));
                    $participants.append(newuser);
                    var $participant = jq(self.getSelector('.maxui-participant:last'));
                    $participant.animate({
                        height: 36
                    }, 100, function(event) {
                        $participant.animate({
                            opacity: 1
                        }, 200);
                    });
                    $participant.find('.maxui-conversation-add-user').show().focus();
                    jq(self.getSelector('#maxui-new-participant .maxui-text-input')).trigger('maxui-input-clear');
                },
                list: "#maxui-new-participant #maxui-conversation-predictive"
            });
            self.newparticipant = new max.views.MaxInput({
                input: "#maxui-new-participant .maxui-text-input",
                delegate: overlay.el,
                placeholder: self.maxui.settings.literals.conversations_info_add,
                bindings: {
                    'maxui-input-keypress': function(event) {
                        self.predictive.show(event);
                    },
                    'maxui-input-submit': function(event) {
                        self.predictive.choose(event);
                    },
                    'maxui-input-cancel': function(event) {
                        self.predictive.hide(event);
                    },
                    'maxui-input-up': function(event) {
                        self.predictive.moveup(event);
                    },
                    'maxui-input-down': function(event) {
                        self.predictive.movedown(event);
                    }
                }
            });
            // Confirmas adding a new user to the conversation
            overlay.$el().on('click', self.getOwnerSelector('.maxui-participant .maxui-conversation-add-user .maxui-icon-ok-circled'), function(event) {
                var $participant = jq(event.target).closest('.maxui-participant');
                var new_username = $participant.attr('data-username');
                self.maxui.maxClient.addUserToConversation(self.data.id, new_username, function(event) {
                    $participant.animate({
                        opacity: 0
                    }, 200, function(event) {
                        $participant.find('.maxui-conversation-add-user').remove();
                        $participant.animate({
                            opacity: 1
                        }, 200);
                        $participant.find('.maxui-conversation-user-action').show();
                    });
                });
            });
            // Cancels adding a new user to the conversation
            overlay.$el().on('click', self.getOwnerSelector('.maxui-participant .maxui-conversation-add-user .maxui-icon-cancel-circled'), function(event) {
                var $participant = jq(event.currentTarget).closest('.maxui-participant');
                $participant.animate({
                    opacity: 0
                }, 200, function(event) {
                    $participant.animate({
                        height: 0
                    }, 200, function(event) {
                        $participant.remove();
                    });
                });
            });
            // User Leaves conversation
            overlay.$el().on('click', self.getSelector('#maxui-conversation-leave .maxui-button'), function(event) {
                var leaving_username = self.maxui.settings.username;
                self.maxui.maxClient.kickUserFromConversation(self.data.id, leaving_username, function(event) {
                    self.maxui.conversations.listview.remove(self.data.id);
                    overlay.hide();
                    jq('#maxui-back-conversations a').trigger('click');
                });
            });
            // User clicks delete conversation button
            overlay.$el().on('click', self.getSelector('#maxui-conversation-delete .maxui-button'), function(event) {
                jq(self.getSelector('#maxui-conversation-delete .maxui-help')).show();
            });
            // User confirms deleting a conversation
            overlay.$el().on('click', self.getSelector('#maxui-conversation-delete .maxui-help .maxui-confirmation-ok'), function(event) {
                self.maxui.maxClient.deleteConversation(self.data.id, function(event) {
                    self.maxui.conversations.listview.remove(self.data.id);
                    overlay.hide();
                    jq('#maxui-back-conversations a').trigger('click');
                });
            });
            // User cancels deleting a conversation
            overlay.$el().on('click', self.getSelector('#maxui-conversation-delete .maxui-help .maxui-confirmation-cancel'), function(event) {
                jq(self.getSelector('#maxui-conversation-delete .maxui-help')).hide();
            });
        };
        MaxChatInfo.prototype.load = function(configurator) {
            var self = this;
            self.maxui.maxClient.getConversation(self.maxui.conversations.active, function(data) {
                self.maxui.maxClient.getConversationSubscription(self.maxui.conversations.active, self.maxui.settings.username, function(subscription) {
                    self.data = data;
                    var participants = [];
                    for (var pt = 0; pt < self.data.participants.length; pt++) {
                        var participant = self.data.participants[pt];
                        participant.avatarURL = self.maxui.settings.avatarURLpattern.format(participant.username);
                        participant.owner = participant.username === self.data.owner;
                        participants.push(participant);
                    }
                    var avatar_url = self.maxui.settings.conversationAvatarURLpattern.format(self.data.id);
                    var displayName = self.data.displayName;
                    if (self.data.participants.length <= 2) {
                        var partner = self.data.participants[0];
                        // Check if the partner choosed is the same as the logged user
                        // We can't be sure that the partner is the first or the second in the array
                        if (self.data.participants.length === 1) {
                            displayName = '[Archive] ' + partner.displayName;
                        } else if (self.data.participants[0].username === self.maxui.settings.username && self.data.participants.length > 1) {
                            partner = self.data.participants[1];
                        }
                        // User the user partner's avatar as conversation avatar
                        avatar_url = self.maxui.settings.avatarURLpattern.format(partner.username);
                    }
                    var params = {
                        displayName: displayName,
                        conversationAvatarURL: avatar_url,
                        participants: participants,
                        literals: self.maxui.settings.literals,
                        panelID: self.panelID,
                        published: self.maxui.utils.formatDate(self.data.published, self.maxui.language),
                        canManage: self.maxui.settings.username === self.data.owner,
                        canAdd: _.contains(subscription.permissions, 'invite')
                    };
                    self.content = self.maxui.templates.conversationSettings.render(params);
                    configurator(self);
                });
            });
        };
        return {
            MaxChatInfo: MaxChatInfo
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);


;

'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxScrollbar
         *
         *
         */
        function MaxScrollbar(options) {
            var self = this;
            self.maxui = options.maxui;
            self.width = options.width;
            self.handle = options.handle;
            self.dragging = false;
            self.scrollbar_selector = options.scrollbar;
            self.$bar = jq(self.scrollbar_selector);
            self.$dragger = self.$bar.find('.maxui-dragger');
            self.target_selector = options.target;
            self.$target = jq(self.target_selector);
            self.bind();
        }
        MaxScrollbar.prototype.bind = function() {
            var self = this;
            self.$target.on('mousewheel', function(event, delta, deltaX, deltaY) {
                event.preventDefault();
                event.stopPropagation();
                if (self.enabled()) {
                    var movable_height = self.$target.height() - self.maxtop - self.handle.height;
                    var actual_margin = parseInt(self.$target.css('margin-top'), 10);
                    var new_margin = actual_margin + (deltaY * 1 * 10);
                    if (new_margin > 0) {
                        new_margin = 0;
                    }
                    if (new_margin < (movable_height * -1)) {
                        new_margin = movable_height * -1;
                    }
                    self.$target.css({
                        'margin-top': new_margin
                    });
                    new_margin = new_margin * -1;
                    var relative_pos = (new_margin * 100) / movable_height;
                    self.setDraggerPosition(relative_pos);
                }
            });
            jq(document).on('mousemove', function(event) {
                if (self.dragging) {
                    event.stopPropagation();
                    event.preventDefault();
                    // drag only if target content is taller than scrollbar
                    if (self.enabled()) {
                        // Calculate dragger position, constrained to actual limits
                        var margintop = event.clientY + jq(window).scrollTop() - self.$bar.offset().top;
                        if (margintop < 0) {
                            margintop = 0;
                        }
                        if (margintop >= self.maxtop) {
                            margintop = self.maxtop;
                        }
                        // Calculate dragger position relative to 100 and move content
                        var relative_position = (margintop * 100) / self.maxtop;
                        self.setContentPosition(relative_position);
                    }
                }
            });
            jq(document.body).on('mousedown', '.maxui-dragger', function(event) {
                event.stopPropagation();
                event.preventDefault();
                self.dragging = true;
            });
            jq(document).on('mouseup', function(event) {
                self.dragging = false;
            });
        };
        MaxScrollbar.prototype.setHeight = function(height) {
            var self = this;
            var wrapper_top = jq('#maxui-conversations .maxui-wrapper').offset().top - self.maxui.offset().top - 1;
            self.$bar.css({
                'height': height,
                'top': wrapper_top
            });
            self.maxtop = height - self.handle.height - 2;
        };
        MaxScrollbar.prototype.setTarget = function(selector) {
            var self = this;
            self.$target = jq(selector);
        };
        MaxScrollbar.prototype.setDraggerPosition = function(relative_pos) {
            var self = this;
            var margintop = (self.maxtop * relative_pos) / 100;
            self.$dragger.css({
                'margin-top': margintop
            });
        };
        MaxScrollbar.prototype.setContentPosition = function(relative_pos) {
            var self = this;
            if (self.enabled()) {
                var movable_height = self.$target.height() - self.maxtop - self.handle.height;
                var margintop = (movable_height * relative_pos) / 100;
                self.$target.css({
                    'margin-top': margintop * -1
                });
                self.setDraggerPosition(relative_pos);
            } else {
                self.$target.css({
                    'margin-top': ''
                });
                self.setDraggerPosition(0);
            }
        };
        MaxScrollbar.prototype.enabled = function() {
            var self = this;
            return self.$target.height() > self.maxtop;
        };
        return {
            MaxScrollbar: MaxScrollbar
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);


;

'use strict';
var max = max || {};
(function(jq) {
    var views = function() {
        /** MaxConversationsList
         *
         *
         */
        function MaxConversationsList(maxconversations, options) {
            var self = this;
            self.conversations = [];
            self.mainview = maxconversations;
            self.maxui = self.mainview.maxui;
        }
        MaxConversationsList.prototype.load = function(conversations) {
            var self = this;
            if (_.isArray(conversations)) {
                self.conversations = conversations;
                self.render(false);
            } else if (_.isFunction(conversations)) {
                self.maxui.maxClient.getConversationsForUser.apply(self.maxui.maxClient, [
                    self.maxui.settings.username,
                    function(data) {
                        self.maxui.logger.info('Loaded {0} conversations from max'.format(self.maxui.settings.username), self.mainview.logtag);
                        self.conversations = data;
                        self.render();
                        // In this point, converations is a callback argument
                        conversations();
                    }
                ]);
            }
        };
        MaxConversationsList.prototype.loadConversation = function(conversation_hash) {
            var self = this;
            var callback;
            if (arguments.length > 1) {
                callback = arguments[1];
            }
            self.maxui.maxClient.getConversationSubscription(conversation_hash, self.maxui.settings.username, function(data) {
                if (_.findWhere(self.conversations, {
                        'id': data.id
                    })) {
                    self.conversations = _.map(self.conversations, function(conversation) {
                        if (conversation.id === data.id) {
                            return data;
                        } else {
                            return conversation;
                        }
                    });
                } else {
                    data.unread_messages = 1;
                    self.conversations.push(data);
                }
                self.sort();
                self.render();
                if (!_.isUndefined(callback)) {
                    callback.call(self.mainview);
                }
            });
        };
        MaxConversationsList.prototype.updateLastMessage = function(conversation_id, message) {
            var self = this;
            self.conversations = _.map(self.conversations, function(conversation) {
                if (conversation.id === conversation_id) {
                    conversation.lastMessage = message;
                    _.defaults(conversation, {
                        unread_messages: 0
                    });
                    if (self.maxui.settings.username !== message.user) {
                        conversation.unread_messages += 1;
                    }
                }
                return conversation;
            }, self);
            self.sort();
        };
        MaxConversationsList.prototype.resetUnread = function(conversation_id) {
            var self = this;
            self.conversations = _.map(self.conversations, function(conversation) {
                if (conversation.id === conversation_id) {
                    conversation.unread_messages = 0;
                }
                return conversation;
            }, self);
            self.mainview.updateUnreadConversations();
        };
        MaxConversationsList.prototype.sort = function() {
            var self = this;
            self.conversations = _.sortBy(self.conversations, function(conversation) {
                return conversation.lastMessage.published;
            });
            self.conversations.reverse();
        };
        MaxConversationsList.prototype.remove = function(conversation_id) {
            var self = this;
            self.conversations = _.filter(self.conversations, function(conversation) {
                return conversation.id !== conversation_id;
            });
            self.sort();
            self.render();
        };
        MaxConversationsList.prototype.insert = function(conversation) {
            var self = this;
            self.conversations.push(conversation);
            self.sort();
            self.render();
        };
        MaxConversationsList.prototype.show = function() {
            var self = this;
            self.mainview.loadWrappers();
            self.mainview.$newparticipants.show();
            jq('#maxui-newactivity-box > .upload-file').hide();
            jq('#maxui-newactivity-box > .upload-img').hide();
            jq('#maxui-newactivity-box > #preview').hide();
            // Load conversations from max if never loaded
            if (self.conversations.length === 0) {
                self.load();
                self.toggle();
                // Otherwise, just show them
            } else {
                self.render();
                self.toggle();
            }
        };
        MaxConversationsList.prototype.toggle = function() {
            var self = this;
            self.mainview.loadWrappers();
            var literal = '';
            if (!self.mainview.visible()) {
                self.mainview.$addpeople.css({
                    'border-color': '#ccc'
                });
                self.mainview.$common_header.removeClass('maxui-showing-messages').addClass('maxui-showing-conversations');
                self.mainview.scrollbar.setHeight(self.mainview.height - 75);
                self.mainview.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list');
                self.mainview.scrollbar.setContentPosition(0);
                self.mainview.$addpeople.animate({
                    'height': 19,
                    'padding-top': 6,
                    'padding-bottom': 6
                }, 400, function(event) {
                    self.mainview.$addpeople.removeAttr('style');
                });
                var widgetWidth = self.mainview.$conversations_list.width() + 11; // +2 To include border;
                self.mainview.$conversations_list.animate({
                    'margin-left': 0
                }, 400);
                self.mainview.$messages.animate({
                    'left': widgetWidth + 20
                }, 400);
                self.maxui.settings.conversationsSection = 'conversations';
                literal = self.maxui.settings.literals.new_conversation_text;
                self.mainview.$postbox.val(literal).attr('data-literal', literal);
            }
        };
        // Renders the conversations list of the current user, defined in settings.username
        MaxConversationsList.prototype.render = function() {
            var overwrite_postbox = true;
            if (arguments.length > 0) {
                overwrite_postbox = arguments[0];
            }
            var self = this;
            // String to store the generated html pieces of each conversation item
            // by default showing a "no conversations" message
            var html = '<span id="maxui-info">' + self.maxui.settings.literals.no_chats + '<span>';
            // Render the postbox UI if user has permission
            var showCT = self.maxui.settings.UISection === 'conversations';
            var toggleCT = self.maxui.settings.disableConversations === false && !showCT;
            var params = {
                avatar: self.maxui.settings.avatarURLpattern.format(self.maxui.settings.username),
                allowPosting: true,
                imgLiteral: self.maxui.settings.literals.new_img_post,
                fileLiteral: self.maxui.settings.literals.new_file_post,
                buttonLiteral: self.maxui.settings.literals.new_message_post,
                textLiteral: self.maxui.settings.literals.new_conversation_text,
                literals: self.maxui.settings.literals,
                showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;',
                showSubscriptionList: false
            };
            var postbox = self.maxui.templates.postBox.render(params);
            var $postbox = jq('#maxui-newactivity');
            if (overwrite_postbox) {
                $postbox.html(postbox);
            }
            // Reset the html container if we have conversations
            if (self.conversations.length > 0) {
                html = '';
            }
            // Iterate through all the conversations
            for (var i = 0; i < self.conversations.length; i++) {
                var conversation = self.conversations[i];
                var partner = conversation.participants[0];
                var avatar_url = self.maxui.settings.conversationAvatarURLpattern.format(conversation.id);
                var displayName = '';
                if (conversation.participants.length <= 2) {
                    if (conversation.participants.length === 1) {
                        partner = conversation.participants[0];
                        displayName += '[Archive] ';
                    } else if (conversation.participants[0].username === self.maxui.settings.username) {
                        partner = conversation.participants[1];
                    }
                    avatar_url = self.maxui.settings.avatarURLpattern.format(partner.username);
                }
                displayName += conversation.displayName;
                var conv_params = {
                    id: conversation.id,
                    displayName: displayName,
                    text: self.maxui.utils.formatText(conversation.lastMessage.content),
                    messages: conversation.unread_messages,
                    literals: self.maxui.settings.literals,
                    date: self.maxui.utils.formatDate(conversation.lastMessage.published, self.maxui.language),
                    avatarURL: avatar_url,
                    hasUnread: conversation.unread_messages > 0
                };
                // Render the conversations template and append it at the end of the rendered covnersations
                html += self.maxui.templates.conversation.render(conv_params);
            }
            jq('#maxui-conversations-list').html(html);
        };
        /** MaxConversationMessages
         *
         *
         */
        function MaxConversationMessages(maxconversations, options) {
            var self = this;
            self.messages = {};
            self.mainview = maxconversations;
            self.maxui = self.mainview.maxui;
            self.remaining = true;
        }
        // Loads the last 10 messages of a conversation
        MaxConversationMessages.prototype.load = function() {
            var self = this;
            var conversation_id = self.mainview.active;
            var set_unread = false;
            if (arguments.length > 0) {
                conversation_id = arguments[0];
                set_unread = true;
            }
            self.messages[conversation_id] = [];
            self.maxui.maxClient.getMessagesForConversation(conversation_id, {
                limit: 10
            }, function(messages) {
                self.maxui.logger.info('Loaded conversation {0} messages from max'.format(conversation_id), self.mainview.logtag);
                self.remaining = this.getResponseHeader('X-Has-Remaining-Items');
                _.each(messages, function(message, index, list) {
                    message.ack = true;
                    self.append(message);
                });
                // Update last message and unread indicators.
                // Increment of unread counter will be done only when loading a specific conversation.
                // As the only time we specify a conversation id is on refreshing,only then will increment unread count
                var last_message = _.last(self.messages[conversation_id]);
                self.mainview.listview.updateLastMessage(conversation_id, {
                    'content': last_message.data.text,
                    'published': last_message.published,
                    'user': last_message.user.username
                });
                self.mainview.listview.resetUnread(conversation_id);
                self.mainview.listview.render(false);
                self.mainview.updateUnreadConversations();
                self.render();
            });
        };
        MaxConversationMessages.prototype.ack = function(message) {
            var self = this;
            self.maxui.logger.info("Acknowledged Message {0} --> {1}".format(message.uuid, message.data.id), self.mainview.logtag);
            var $message = jq('#' + message.uuid);
            var own_message = $message.hasClass('maxui-user-me');
            var $message_ack = $message.find('.maxui-icon-check');
            //Set the ack check only on our messages
            if ($message_ack && own_message) {
                $message_ack.addClass('maxui-ack');
                // mark currentyly stored message as ack'd
                self.messages[self.mainview.active] = _.map(self.messages[self.mainview.active], function(stored_message) {
                    if (message.uuid === stored_message.uuid) {
                        stored_message.ack = true;
                    }
                    return stored_message;
                });
                // Change rendered message id
                $message.attr('id', message.data.id);
            }
        };
        MaxConversationMessages.prototype.exists = function(message) {
            var self = this;
            var found = _.findWhere(self.messages[message.destination], {
                "uuid": message.uuid
            });
            return _.isUndefined(found);
        };
        MaxConversationMessages.prototype.setTitle = function(title) {
            var self = this;
            self.mainview.$common_header.find('#maxui-back-conversations .maxui-title').text(title);
        };
        MaxConversationMessages.prototype.loadNew = function() {
            var self = this;
            var newest_loaded = _.last(self.messages[self.mainview.active]);
            self.maxui.maxClient.getMessagesForConversation(self.mainview.active, {
                limit: 10,
                after: newest_loaded.uuid
            }, function(messages) {
                self.remaining = this.getResponseHeader('X-Has-Remaining-Items');
                _.each(messages, function(message, index, list) {
                    message.ack = true;
                    self.prepend(message, index);
                });
                self.render();
            });
        };
        MaxConversationMessages.prototype.loadOlder = function() {
            var self = this;
            var older_loaded = _.first(self.messages[self.mainview.active]);
            self.maxui.maxClient.getMessagesForConversation(self.mainview.active, {
                limit: 10,
                before: older_loaded.uuid
            }, function(messages) {
                self.remaining = this.getResponseHeader('X-Has-Remaining-Items');
                _.each(messages, function(message, index, list) {
                    message.ack = true;
                    self.prepend(message, index);
                });
                self.render();
            });
        };
        MaxConversationMessages.prototype.append = function(message) {
            var self = this;
            var _message;
            // Convert activity from max to mimic rabbit response
            if (!_.has(message, 'data')) {
                _message = {
                    'action': 'add',
                    'object': 'message',
                    'user': {
                        'username': message.actor.username,
                        'displayname': message.actor.displayName
                    },
                    'published': message.published,
                    'data': {
                        'text': message.object.content,
                        'objectType': message.object.objectType
                    },
                    'uuid': message.id,
                    'destination': message.contexts[0].id,
                    'ack': message.ack
                };
                if (_.contains(['image', 'file'], message.object.objectType)) {
                    _message.data.fullURL = message.object.fullURL;
                    _message.data.thumbURL = message.object.thumbURL;
                    _message.data.filename = message.object.filename;
                }
                // If it's a message from max, update last message on listview
                self.mainview.listview.updateLastMessage(_message.destination, {
                    'content': _message.data.text,
                    'published': _message.published,
                    'user': _message.user.username
                });
            } else {
                _message = message;
                // Is a message from rabbit, update last message on listview and increment unread counter
                self.mainview.listview.updateLastMessage(_message.destination, {
                    'content': _message.data.text,
                    'published': _message.published,
                    'user': _message.user.username
                });
            }
            self.messages[_message.destination] = self.messages[_message.destination] || [];
            self.messages[_message.destination].push(_message);
        };
        MaxConversationMessages.prototype.prepend = function(message, index) {
            var self = this;
            var _message;
            // Convert activity from max to mimic rabbit response
            if (!_.has(message, 'data')) {
                _message = {
                    'action': 'add',
                    'object': 'message',
                    'user': {
                        'username': message.actor.username,
                        'displayname': message.actor.displayName
                    },
                    'published': message.published,
                    'data': {
                        'text': message.object.content,
                        'objectType': message.object.objectType
                    },
                    'uuid': message.id,
                    'destination': message.contexts[0].id,
                    'ack': message.ack
                };
                if (_.contains(['image', 'file'], message.object.objectType)) {
                    _message.data.fullURL = message.object.fullURL;
                    _message.data.thumbURL = message.object.thumbURL;
                    _message.data.filename = message.object.filename;
                }
            }
            self.messages[self.mainview.active] = self.messages[self.mainview.active] || [];
            self.messages[self.mainview.active].splice(index, 0, _message);
        };
        MaxConversationMessages.prototype.render = function() {
            var self = this;
            // String to store the generated html pieces of each conversation item
            var messages = '';
            // Iterate through all the conversations
            var images_to_render = [];
            if (self.messages[self.mainview.active]) {
                self.setTitle(self.mainview.getActive().displayName);
                for (var i = 0; i < self.messages[self.mainview.active].length; i++) {
                    var message = self.messages[self.mainview.active][i];
                    var avatar_url = self.maxui.settings.avatarURLpattern.format(message.user.username);
                    // Store in origin, who is the sender of the message, the authenticated user or anyone else
                    var origin = 'maxui-user-notme';
                    var others_message = true;
                    if (message.user.username === self.maxui.settings.username) {
                        origin = 'maxui-user-me';
                        others_message = false;
                    }
                    _.defaults(message.data, {
                        filename: message.uuid
                    });
                    var is_group_conversation = _.contains(_.findWhere(self.mainview.listview.conversations, {
                        id: self.mainview.active
                    }).tags, 'group');
                    var params = {
                        id: message.uuid,
                        text: self.maxui.utils.formatText(message.data.text),
                        date: self.maxui.utils.formatDate(message.published, self.maxui.language),
                        othersMessage: others_message,
                        literals: self.maxui.settings.literals,
                        avatarURL: avatar_url,
                        maxServerURL: self.maxui.settings.maxServerURL,
                        displayName: message.user.displayname,
                        showDisplayName: others_message && is_group_conversation,
                        ack: message.ack ? origin === 'maxui-user-me' : false,
                        fileDownload: message.data.objectType === 'file',
                        filename: message.data.filename,
                        auth: {
                            'token': self.maxui.settings.oAuthToken,
                            'username': self.maxui.settings.username
                        }
                    };
                    // Render the conversations template and append it at the end of the rendered covnersations
                    messages = messages + self.maxui.templates.message.render(params);
                    if (message.data.objectType === 'image') {
                        images_to_render.push(message);
                    }
                }
                jq('#maxui-messages #maxui-message-list').html(messages);
                _.each(images_to_render, function(message, index, list) {
                    self.maxui.maxClient.getMessageImage('/messages/{0}/image/thumb'.format(message.uuid), function(encoded_image_data) {
                        var imagetag = '<img class="maxui-embedded fullImage" alt="" src="data:image/png;base64,{0}" />'.format(encoded_image_data);
                        jq('.maxui-message#{0} .maxui-body'.format(message.uuid)).after(imagetag);
                        jq('.maxui-message#{0} img.fullImage'.format(message.uuid)).on('click', function() {
                            self.maxui.maxClient.getMessageImage(message.object.fullURL, function(encoded_image_data) {
                                var image = new Image();
                                image.src = "data:image/png;base64," + encoded_image_data;
                                var w = window.open("");
                                w.document.write(image.outerHTML);
                            });
                        });
                        self.mainview.scrollbar.setContentPosition(100);
                    });
                });
                var $moremessages = jq('#maxui-messages #maxui-more-messages');
                if (self.remaining === "1") {
                    $moremessages.show();
                } else {
                    $moremessages.hide();
                }
            }
        };
        MaxConversationMessages.prototype.show = function(conversation_hash) {
            var self = this;
            self.mainview.loadWrappers();
            // PLEASE CLEAN THIS SHIT
            var $button = jq('#maxui-newactivity').find('input.maxui-button');
            jq("#preview").empty();
            jq("#maxui-img").val("");
            jq("#maxui-file").val("");
            jq("#maxui-newactivity-box > .upload-img").removeClass("label-disabled");
            jq("#maxui-img").prop("disabled", false);
            jq("#maxui-newactivity-box > .upload-file").removeClass("label-disabled");
            jq("#maxui-file").prop("disabled", false);
            jq('#maxui-newactivity-box > .upload-file').show();
            jq('#maxui-newactivity-box > .upload-img').show();
            jq('#maxui-newactivity-box > #preview').show();
            $button.attr('class', 'maxui-button');
            self.mainview.$newmessagebox.find('textarea').attr('class', 'maxui-text-input');
            self.mainview.$newmessagebox.find('.maxui-error-box').animate({
                'margin-top': -26
            }, 200);
            self.mainview.$newparticipants.hide();
            // UNTIL HERE
            self.mainview.active = conversation_hash;
            self.mainview.listview.resetUnread(conversation_hash);
            // Load conversation messages from max if never loaded
            if (!_.has(self.messages, conversation_hash)) {
                self.load();
                self.toggle();
                // Otherwise, just show them
            } else {
                self.render();
                self.toggle();
            }
        };
        MaxConversationMessages.prototype.toggle = function() {
            var self = this;
            self.mainview.loadWrappers();
            var literal = '';
            if (self.maxui.settings.conversationsSection !== 'messages') {
                self.mainview.$addpeople.animate({
                    'height': 0,
                    'padding-top': 0,
                    'padding-bottom': 0
                }, 400, function(event) {
                    self.mainview.$addpeople.css({
                        'border-color': 'transparent'
                    });
                });
                self.setTitle(self.mainview.getActive().displayName);
                self.mainview.$common_header.removeClass('maxui-showing-conversations').addClass('maxui-showing-messages');
                self.mainview.$conversations_list.animate({
                    'margin-left': self.maxui.settings.sectionsWidth * (-1)
                }, 400);
                self.mainview.$messages.animate({
                    'left': 0,
                    'margin-left': 0
                }, 400, function(event) {
                    self.mainview.scrollbar.setHeight(self.mainview.height - 75);
                    self.mainview.scrollbar.setTarget('#maxui-conversations #maxui-messages');
                    self.mainview.scrollbar.setContentPosition(100);
                });
                self.mainview.$messages.width(self.maxui.settings.sectionsWidth);
                self.maxui.settings.conversationsSection = 'messages';
                literal = self.maxui.settings.literals.new_activity_text;
                self.mainview.$postbox.val(literal).attr('data-literal', literal);
            }
        };
        /** MaxConversations
         *
         *
         */
        function MaxConversations(maxui, options) {
            var self = this;
            self.logtag = 'CONVERSATIONS';
            self.el = '#maxui-conversations';
            self.$el = jq(self.el);
            self.maxui = maxui;
            self.height = 320;
            self.listview = new MaxConversationsList(self, {});
            self.messagesview = new MaxConversationMessages(self, {});
            self.conversationSettings = new max.views.MaxChatInfo(self.maxui);
            self.active = '';
        }
        MaxConversations.prototype.visible = function() {
            var self = this;
            return self.$conversations.is(':visible') && self.$conversations.height > 0;
        };
        MaxConversations.prototype.loadScrollbar = function() {
            var self = this;
            self.scrollbar = new max.views.MaxScrollbar({
                maxui: self.maxui,
                width: self.maxui.settings.scrollbarWidth,
                handle: {
                    height: 20
                },
                scrollbar: self.el + ' #maxui-scrollbar',
                target: self.el
            });
        };
        MaxConversations.prototype.getActive = function() {
            var self = this;
            return _.findWhere(self.listview.conversations, {
                'id': self.active
            });
        };
        MaxConversations.prototype.loadWrappers = function() {
            var self = this;
            self.$conversations = jq('#maxui-conversations');
            self.$conversations_list = jq('#maxui-conversations-list');
            self.$conversations_wrapper = self.$conversations.find('.maxui-wrapper');
            self.$messages = jq('#maxui-messages');
            self.$message_list = jq('#maxui-message-list');
            self.$postbox = jq('#maxui-newactivity-box textarea');
            self.$common_header = self.$conversations.find('#maxui-common-header');
            self.$addpeople = jq('#maxui-add-people-box');
            self.$newparticipants = jq('#maxui-new-participants');
            self.$newmessagebox = jq('#maxui-newactivity');
        };
        MaxConversations.prototype.render = function() {
            var self = this;
            self.loadScrollbar();
            self.bindEvents();
        };
        MaxConversations.prototype.bindEvents = function() {
            var self = this;
            // Show overlay with conversation info
            jq('#maxui-conversation-info').click(function(event) {
                event.preventDefault();
                event.stopPropagation();
                self.maxui.overlay.show(self.conversationSettings);
            });
            //Assign going back to conversations list
            jq('#maxui-back-conversations').on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                window.status = '';
                self.listview.show();
                jq('#maxui-newactivity-box > .upload-file').hide();
                jq('#maxui-newactivity-box > .upload-img').hide();
                jq('#maxui-newactivity-box > #preview').hide();
            });
            //Assign activation of messages section by delegating the clicl of a conversation arrow to the conversations container
            jq('#maxui-conversations').on('click', '.maxui-conversation', function(event) {
                event.preventDefault();
                event.stopPropagation();
                window.status = '';
                var conversation_hash = jq(event.target).closest('.maxui-conversation').attr('id');
                self.messagesview.show(conversation_hash);
            });
            /// Load older activities
            jq('#maxui-conversations').on('click', '#maxui-more-messages .maxui-button', function(event) {
                event.preventDefault();
                event.stopPropagation();
                window.status = '';
                self.messagesview.loadOlder();
            });
        };
        /**
         *    Sends a post when user clicks `post activity` button with
         *    the current contents of the `maxui-newactivity` textarea
         **/
        MaxConversations.prototype.send = function(text, media) {
            var self = this;
            var query = {};
            var message = {
                data: {
                    "text": text
                },
                action: 'add',
                object: 'message'
            };
            if (media === undefined) {
                query = {
                    "object": {
                        "objectType": "message",
                        "content": ""
                    }
                };
                var sent = self.maxui.messaging.send(message, '{0}.messages'.format(self.active));
                sent.ack = false;
                sent.destination = self.active;
                self.messagesview.append(sent);
                self.listview.updateLastMessage(self.active, {
                    'content': sent.data.text,
                    'published': sent.published,
                    'user': sent.user.username
                });
                jq('#maxui-newactivity textarea').val('');
                jq('#maxui-newactivity .maxui-button').attr('disabled', 'disabled');
            } else {
                if (media.type.split('/')[0] === 'image') {
                    query = {
                        "object": {
                            "objectType": "image",
                            "content": "",
                            "mimetype": media.type
                        }
                    };
                } else {
                    query = {
                        "object": {
                            "objectType": "file",
                            "content": "",
                            "mimetype": media.type
                        }
                    };
                }
                var route = self.maxui.maxClient.ROUTES.messages.format(self.active);
                let formData = new FormData();
                query.object.content = text;
                formData.append("json_data", JSON.stringify(query));
                formData.append("file", new Blob([media], {
                    type: media.type
                }), media.name);
                var callback = (function() {
                    jq('#maxui-newactivity textarea').val('');
                    jq('#maxui-newactivity .maxui-button').attr('disabled', 'disabled');
                    jq("#preview").empty();
                    jq("#maxui-img").val("");
                    jq("#maxui-file").val("");
                    jq("#maxui-newactivity-box > .upload-img").removeClass("label-disabled");
                    jq("#maxui-img").prop("disabled", false);
                    jq("#maxui-newactivity-box > .upload-file").removeClass("label-disabled");
                    jq("#maxui-file").prop("disabled", false);
                });
                self.maxui.maxClient.POSTFILE(route, formData, callback);
                setTimeout(function() {
                    self.messagesview.load();
                }, 500);
            }
            self.messagesview.show(self.active);
            // When images finish loading, setContentPosition is called again
            // from inside render method, to adjust to new height set by the image
            self.scrollbar.setContentPosition(100);
        };
        /**
         *    Creates a new conversation and shows it
         **/
        MaxConversations.prototype.create = function(options) {
            var self = this;
            options.participants.push(self.maxui.settings.username);
            self.maxui.maxClient.addMessageAndConversation(options, function(event) {
                var message = this;
                var chash = message.contexts[0].id;
                var conversation = {
                    'id': chash,
                    'displayName': message.contexts[0].displayName,
                    'lastMessage': {
                        'content': message.object.content,
                        'published': message.published
                    },
                    'participants': options.participants,
                    'tags': message.contexts[0].tags
                };
                self.active = chash;
                self.listview.insert(conversation);
                self.messagesview.remaining = 0;
                message.ack = true;
                self.loadWrappers();
                self.messagesview.append(message);
                self.messagesview.render();
                self.messagesview.show(chash);
                self.hideNameChat();
                self.$newparticipants[0].people = [];
                self.maxui.reloadPersons();
            });
        };
        MaxConversations.prototype.hideNameChat = function() {
            jq('#maxui-add-people-box #maxui-new-displayName input').val('');
            jq('#maxui-add-people-box #maxui-new-displayName').hide();
        };
        MaxConversations.prototype.updateUnreadConversations = function(data) {
            var self = this;
            var $showconversations = jq('#maxui-show-conversations .maxui-unread-conversations');
            var conversations_with_unread_messages = _.filter(self.listview.conversations, function(conversation) {
                if (conversation.unread_messages > 0) {
                    return conversation;
                }
            });
            var $menuBubble = jQuery('#menusup .fa-comment');
            if (conversations_with_unread_messages.length > 0) {
                $showconversations.text(conversations_with_unread_messages.length);
                $showconversations.removeClass('maxui-hidden');
                if ($menuBubble.length > 0) {
                    $menuBubble.addClass('flicker');
                }
            } else {
                $showconversations.addClass('maxui-hidden');
                if ($menuBubble.length > 0) {
                    $menuBubble.removeClass('flicker');
                }
            }
        };
        MaxConversations.prototype.ReceiveMessage = function(message) {
            var self = this;
            // Insert message only if the message is from another user.
            var message_from_another_user = message.user.username !== self.maxui.settings.username;
            var message_not_in_list = self.messagesview.exists(message);
            if (message_from_another_user || message_not_in_list) {
                if (message_from_another_user) {
                    self.maxui.logger.log('New message from user {0} on {1}'.format(message.user.username, message.destination), self.logtag);
                } else {
                    self.maxui.logger.log('Updating {1} messages sent from other {0} instances'.format(message.user.username, message.destination), self.logtag);
                }
                self.messagesview.append(message);
                self.updateUnreadConversations();
                if (self.maxui.settings.UISection === 'conversations' && self.maxui.settings.conversationsSection === 'messages') {
                    self.messagesview.render(false);
                    self.scrollbar.setContentPosition(100);
                } else if (self.maxui.settings.UISection === 'conversations' && self.maxui.settings.conversationsSection === 'conversations') {
                    self.listview.render(false);
                } else if (self.maxui.settings.UISection === 'timeline') {
                    self.listview.render(false);
                }
            } //else {
            //  Receiving our own message after going trough rabbitmq
            //}
        };
        MaxConversations.prototype.ReceiveConversation = function(message) {
            var self = this;
            // Insert conversation only if the message is from another user.
            var message_from_another_user = message.user.username !== self.maxui.settings.username;
            var message_not_in_list = self.messagesview.exists(message);
            if (message_from_another_user || message_not_in_list) {
                if (self.maxui.settings.UISection === 'conversations' && self.maxui.settings.conversationsSection === 'conversations') {
                    self.active = message.destination;
                    self.listview.loadConversation(message.destination, function(event) {
                        this.messagesview.show(message.destination);
                    });
                } else if (self.maxui.settings.UISection === 'conversations' && self.maxui.settings.conversationsSection === 'messages') {
                    self.active = message.destination;
                    self.listview.loadConversation(message.destination, function(event) {
                        this.messagesview.load();
                        this.listview.resetUnread(message.destination);
                    });
                } else if (self.maxui.settings.UISection === 'timeline') {
                    self.listview.loadConversation(message.destination, function(event) {
                        self.updateUnreadConversations();
                        self.listview.render();
                    });
                }
            }
        };
        return {
            MaxConversations: MaxConversations
        };
    };
    max.views = max.views || {};
    jq.extend(max.views, views());
})(jQuery);


;

/*jshint multistr: true */
/**
* @fileoverview Provides hogan compiled templates
*               ready to render.
*/
'use strict';

var max = max || {};

max.templates = function() {
    var templates = {
        activity: Hogan.compile('\
<div class="maxui-activity {{#flagged}}maxui-flagged{{/flagged}}" id="{{id}}" userid="{{actor.id}}" username="{{actor.username}}">\
            <div class="maxui-activity-content">\
                <div class="maxui-topright">\
                    {{^showLikesCount}}<span class="maxui-publisheddate">{{date}}</span>{{/showLikesCount}}\
                    {{#showLikesCount}}<span class="maxui-likescount"><strong>{{likes}}</strong><i class="maxui-icon-thumbs-up"></i></span>{{/showLikesCount}}\
                </div>\
                <div class="maxui-actor">\
                    <a href="{{portalURL}}/profile/{{actor.username}}" title="{{literals.open_profile}}">\
                        <span class="maxui-avatar maxui-big"><img src="{{avatarURL}}"></span>\
                    </a>\
                    <a class="maxui-filter-actor" href="#">\
                        <span class="maxui-displayname">{{actor.displayName}}</span>\
                    </a>\
                    <span class="maxui-username">{{actor.username}}&nbsp;</span>\
                </div>\
                <div class="maxui-activity-message">\
                    {{#fileDownload}}\
                    <form action="{{maxServerURL}}/activities/{{id}}/file/download" method="POST">\
                        <input type="hidden" name="X-Oauth-Token" value="{{auth.token}}">\
                        <input type="hidden" name="X-Oauth-Username" value="{{auth.username}}">\
                        <input type="hidden" name="X-Oauth-Scope" value="widgetcli">\
                        <input type="hidden" name="X-HTTP-Method-Override" value="GET">\
                        <span class="maxui-icon-download"></span><input type="submit" class="maxui-download" name="submit" value="{{filename}}">\
                    </form>\
                    {{/fileDownload}}\
                    <p class="maxui-body">{{&text}}</p>\
        \
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
                    <a href="" class="maxui-action maxui-commentaction maxui-icon- {{#replies}}maxui-has-comments{{/replies}}"><strong>{{replies.length}}</strong> {{literals.toggle_comments}}</a>\
                    <a href="" class="maxui-action maxui-favorites {{#favorited}}maxui-favorited{{/favorited}} maxui-icon-">{{literals.favorite}}</a>\
                    <a {{#showLikes}}title="{{likesUsernames}}" {{/showLikes}}href="" class="maxui-action maxui-likes {{#liked}}maxui-liked{{/liked}} maxui-icon-"><strong>{{likes}}</strong> {{literals.like}}</a>\
                    {{#canFlagActivity}}\
                    <a href="" class="maxui-action maxui-flag {{#flagged}}maxui-flagged{{/flagged}} maxui-icon-">{{literals.flag_activity_icon}}</a>\
                    {{/canFlagActivity}}\
                    {{#canDeleteActivity}}\
                    <a href="" class="maxui-action maxui-delete maxui-icon-">{{literals.delete_activity_icon}}</a>\
                    <div class="maxui-popover left">\
                        <div class="maxui-arrow"></div>\
                            <h3 class="maxui-popover-title">{{literals.delete_activity_confirmation}}</h3>\
                            <div class="maxui-popover-content">\
                              <input type="button" class="maxui-button-delete" value="{{literals.delete_activity_delete}}">\
                              <input type="button" class="maxui-button-cancel" value="{{literals.delete_activity_cancel}}">\
                            </div>\
                    </div>\
                    {{/canDeleteActivity}}\
        \
                </div>\
            </div>\
        \
            {{#canViewComments}}\
            <div class="maxui-comments" style="display: none">\
                <div class="maxui-commentsbox">\
                    {{#replies}}\
                        {{> comment}}\
                    {{/replies}}\
                </div>\
                {{#canWriteComment}}\
                <div class="maxui-newcommentbox">\
                        <textarea class="maxui-empty maxui-text-input" id="maxui-commentBox" data-literal="{{literals.new_comment_text}}">{{literals.new_comment_text}}</textarea>\
                        <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{literals.new_comment_post}}"/>\
                </div>\
                {{/canWriteComment}}\
            </div>\
            {{/canViewComments}}\
        \
            <div class="maxui-clear"></div>\
        </div>\
            '),
        comment: Hogan.compile('\
<div class="maxui-comment" id="{{id}}" userid="{{actor.id}}" displayname="{{actor.username}}">\
            <div class="maxui-activity-content">\
               <span class="maxui-publisheddate">{{date}}</span>\
               <div class="maxui-actor">\
                   <a href="{{portalURL}}/profile/{{actor.username}}" title="{{literals.open_profile}}">\
                       <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
                    </a>\
                    <a class="maxui-filter-actor" href="#">\
                       <span class="maxui-displayname">{{actor.displayName}}</span>\
                    </a>\
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
                              <input type="button" class="maxui-button-delete" value="{{literals.delete_activity_delete}}">\
                              <input type="button" class="maxui-button-cancel" value="{{literals.delete_activity_cancel}}">\
                            </div>\
                   </div>\
                   {{/canDeleteComment}}\
               </div>\
            </div>\
        </div>\
            '),
        conversation: Hogan.compile('\
<div class="maxui-conversation" id="{{id}}" data-displayname="{{displayName}}">\
            <div class="maxui-activity-content">\
                <div class="maxui-topright">\
        \
                    <div class="maxui-publisheddate">{{date}}</div>\
                    <div class="maxui-enterconversation">\
                        <a class="maxui-enterconversation maxui-icon-" href="#"></a>\
                        {{#hasUnread}}<span class="maxui-unread-messages">{{messages}}</span>{{/hasUnread}}\
                    </div>\
                </div>\
                <div class="maxui-actor">\
                    <a class="maxui-filter-actor" href="#">\
                        <span class="maxui-avatar maxui-big"><img src="{{avatarURL}}"></span>\
                        <span class="maxui-displayname">{{displayName}}</span>\
                    </a>\
                </div>\
                <div>\
                    <p class="maxui-body">{{&text}}</p>\
                </div>\
            </div>\
        \
            <div class="maxui-clear"></div>\
        </div>\
            '),
        conversationSettings: Hogan.compile('\
<div id="maxui-{{panelID}}" {{#canManage}}class="maxui-owner"{{/canManage}}>\
          <span class="maxui-avatar maxui-big"><img src="{{conversationAvatarURL}}"></span>\
          <div id="maxui-conversation-displayname-edit">\
              <input type="text" class="maxui-displayname" value="{{displayName}}"/>\
              <i class="maxui-icon-cancel-circled"></i>\
              <i class="maxui-icon-ok-circled"></i>\
          </div>\
          <span class="maxui-displayname">{{displayName}}</span>\
          <span class="maxui-published">{{literals.conversations_info_created}} {{published}}</span>\
          <div class="maxui-participants">\
            <h4>{{literals.conversations_info_participants}}</h4>\
            <ul>\
              {{#participants}}\
              <li class="maxui-participant {{#owner}}maxui-owner{{/owner}}" data-username="{{username}}">\
                  <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
                  <span class="maxui-displayname">{{displayName}}\
                      <i class="maxui-conversation-user-action maxui-icon-trash" {{^owner}}title="{{literals.conversations_info_kick_message_1}} {{displayName}} {{literals.conversations_info_kick_message_2}}"{{/owner}}></i>\
                      <i class="maxui-conversation-user-action maxui-icon-crown{{^owner}}-plus{{/owner}}" {{^owner}}title="{{literals.conversations_info_transfer_message_1}} {{displayName}} {{literals.conversations_info_transfer_message_2}}"{{/owner}}></i>\
                      <div class="maxui-conversation-transfer-to maxui-conversation-confirmation">\
                          <i class="maxui-icon-cancel-circled"></i>\
                          <i class="maxui-icon-ok-circled"></i>\
                      </div>\
                      <div class="maxui-conversation-kick-user maxui-conversation-confirmation">\
                          <i class="maxui-icon-cancel-circled"></i>\
                          <i class="maxui-icon-ok-circled"></i>\
                      </div>\
                  </span>\
                  <span class="maxui-username">{{username}}</span>\
              </li>\
              {{/participants}}\
            </ul>\
            {{#canAdd}}\
            <div id="maxui-new-participant">\
                <i class="maxui-icon-user-add"/>\
                <input type="text" class="maxui-text-input maxui-empty"/>\
                <div id="maxui-conversation-predictive" class="maxui-predictive" style="display:none;"><ul></ul></div>\
            </div>\
            {{/canAdd}}\
            </div>\
            <div id="maxui-conversation-leave">\
              <input type="button" class="maxui-button maxui-button-red maxui-button-wide" value="{{literals.conversations_info_leave}}">\
          </div>\
          <div id="maxui-conversation-delete">\
              <input type="button" class="maxui-button maxui-button-red maxui-button-wide" value="{{literals.conversations_info_delete}}">\
              <div class="maxui-help">\
                  <p><b>{{literals.conversations_info_delete_warning}}</b> {{literals.conversations_info_delete_help}}</p>\
                  <button class="maxui-button maxui-button-red maxui-confirmation-cancel">{{literals.cancel}}</button>\
                  <button class="maxui-button maxui-button-green maxui-confirmation-ok">{{literals.delete}}</button>\
              </div>\
          </div>\
        </div>\
            '),
        filters: Hogan.compile('\
{{#filters}}\
            {{#visible}}\
            <div class="maxui-filter maxui-{{type}}" type="{{type}}" value="{{value}}"><span>{{prepend}}{{value}}<a class="maxui-close" href=""><i class="maxui-icon-cancel-circled" alt="tanca"/></a></span></div>\
            {{/visible}}\
        {{/filters}}\
            '),
        mainUI: Hogan.compile('\
<div id="maxui-container" class="{{showMaxUIClass}}">\
        {{#username}}\
         <div id="maxui-mainpanel">\
           <div id="maxui-conversations" style="height:0px; {{showConversations}}">\
               <div id="maxui-common-header">\
                  <div id="maxui-conversations-header" class="maxui-togglebar">\
                      <h2 class="maxui-title">{{literals.conversations}}</h3></a>\
                  </div>\
                  <div id="maxui-back-conversations" class="maxui-togglebar">\
                      <a class="maxui-icon-" href="#"> {{literals.conversations_list}}\
                      <h3 class="maxui-title">displayName</h3></a>\
                      <i id="maxui-conversation-info" class="maxui-icon-cog"/>\
                  </div>\
               </div>\
               <div class="maxui-wrapper">\
                   <div id="maxui-conversations-list" class="maxui-activities">\
                       <span id="maxui-info">{{literals.no_chats}}<span>\
                   </div>\
        \
                   <div id="maxui-messages" style="{{messagesStyle}}">\
                       <div id="maxui-more-messages">\
                           <input type="button" class="maxui-button maxui-button-grey" value="{{literals.chats_load_older}}">\
                       </div>\
                       <div id="maxui-message-list">\
                       </div>\
                   </div>\
                </div>\
                   <div id="maxui-scrollbar">\
                          <div class="maxui-dragger handle"/>\
                   </div>\
           </div>\
        \
            <div id="maxui-show-conversations" class="maxui-togglebar maxui-icon-" style="{{showConversationsToggle}}">\
                <span class="maxui-unread-conversations maxui-hidden"></span> <a href="#">{{literals.conversations_lower}}</a>\
            </div>\
        \
            <div id="maxui-conversation-predictive" class="maxui-predictive" style="display:none;"><ul></ul></div>\
            <div id="maxui-add-people-box" style="display:none;">\
                <div>\
                  <label class="maxui-label">{{literals.participants}}: <span class="maxui-count">(1/20)</span></label>\
                  <input tabindex="20" type="text" data-literal="{{literals.conversations_info_add}}" value="{{literals.conversations_info_add}}" class="maxui-text-input" id="add-user-input">\
                </div>\
                <div id="maxui-new-participants" style="display:none;"></div>\
                <div id="maxui-new-displayName" style="display:none;">\
                    <label class="maxui-label">{{literals.conversation_name}}: </label>\
                    <input tabindex="21" type="text" class="maxui-simple-text-input"/>\
                </div>\
            </div>\
        \
           <div id="maxui-newactivity" {{#hidePostbox}}style="display:none;"{{/hidePostbox}}>\
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
                <a class="maxui-sort-action maxui-most-recent {{orderViewRecent}}" href="#">{{literals.recent_activity}}</a>\
                /\
                <a class="maxui-sort-action maxui-most-valued {{orderViewLikes}}" href="#">{{literals.valued_activity}}</a>\
                /\
                <a class="maxui-sort-action maxui-flagged {{orderViewFlagged}}" href="#">{{literals.flagged_activity}}</a>\
              </div>\
              <div id="maxui-news-activities" hidden>\
                  <input type="button" class="maxui-button" value="Carrega noves entrades">\
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
           <div id="maxui-overlay-background" class="maxui-overlay">\
           </div>\
           <div id="maxui-overlay-wrapper" class="maxui-overlay">\
               <div id="maxui-overlay-panel">\
                   <div id="maxui-overlay-header">\
                        <h3 id="maxui-overlay-title">I\'m a overlay</h3>\
                        <i class="maxui-close maxui-icon-cancel"/>\
                   </div>\
                   <div id="maxui-overlay-content">\
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
            '),
        message: Hogan.compile('\
<div class="maxui-message maxui-user-{{#othersMessage}}not{{/othersMessage}}me" id="{{id}}">\
            <div class="maxui-activity-content">\
                <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
                <div class="maxui-balloon">\
                    {{#fileDownload}}\
                    <form action="{{maxServerURL}}/messages/{{id}}/file/download" method="POST">\
                        <input type="hidden" name="X-Oauth-Token" value="{{auth.token}}">\
                        <input type="hidden" name="X-Oauth-Username" value="{{auth.username}}">\
                        <input type="hidden" name="X-Oauth-Scope" value="widgetcli">\
                        <input type="hidden" name="X-HTTP-Method-Override" value="GET">\
                        <span class="maxui-icon-download"></span><input type="submit" class="maxui-download" name="submit" value="{{filename}}">\
                    </form>\
                    {{/fileDownload}}\
                    {{#showDisplayName}}<span class="maxui-displayname">{{displayName}}</span>{{/showDisplayName}}\
                    <p class="maxui-body">{{&text}}</p>\
                    <span class="maxui-publisheddate">{{date}}</span>\
                    <i class="maxui-icon-check{{#ack}} maxui-ack{{/ack}}"></i>\
                </div>\
            </div>\
            <div class="maxui-clear"></div>\
        </div>\
            '),
        participant: Hogan.compile('\
  <li class="maxui-participant {{#owner}}maxui-owner{{/owner}}" data-username="{{username}}" style="{{style}}">\
              <span class="maxui-avatar maxui-little"><img src="{{avatarURL}}"></span>\
              <span class="maxui-displayname">{{displayName}}\
                  <i class="maxui-conversation-user-action maxui-icon-trash" {{^owner}}title="Click to kick {{displayName}} out of this conversation"{{/owner}} style="display:none;"></i>\
                  <i class="maxui-conversation-user-action maxui-icon-crown{{^owner}}-plus{{/owner}}" {{^owner}}title="Click to make {{displayName}} the owner of this conversation"{{/owner}} style="display:none;"></i>\
                  <div class="maxui-conversation-transfer-to maxui-conversation-confirmation">\
                      <i class="maxui-icon-cancel-circled"></i>\
                      <i class="maxui-icon-ok-circled"></i>\
                  </div>\
                  <div class="maxui-conversation-kick-user maxui-conversation-confirmation">\
                      <i class="maxui-icon-cancel-circled"></i>\
                      <i class="maxui-icon-ok-circled"></i>\
                  </div>\
                  <div class="maxui-conversation-add-user maxui-conversation-confirmation">\
                      <i class="maxui-icon-cancel-circled"></i>\
                      <i class="maxui-icon-ok-circled"></i>\
                  </div>\
              </span>\
              <span class="maxui-username">{{username}}</span>\
          </li>\
            '),
        participants: Hogan.compile('\
{{#persons}}\
        <div class="maxui-filter maxui-participant" type="participant" username="{{username}}"><span>{{prepend}}{{displayName}}<a class="maxui-close" href=""><i class="maxui-icon-cancel-circled" alt="tanca"/></a></span></div>\
        {{/persons}}\
            '),
        postBox: Hogan.compile('\
      <span class="maxui-avatar maxui-big">\
                  <img src="{{avatar}}">\
              </span>\
              <div id="maxui-newactivity-box">\
                   <div class="maxui-wrapper">\
                       <textarea class="maxui-empty maxui-text-input" data-literal="{{textLiteral}}">{{textLiteral}}</textarea>\
                       <div class="maxui-error-box"></div>\
                   </div>\
        \
                    {{#showSubscriptionList}}\
                    <select id="maxui-subscriptions">\
                      {{#subscriptionList}}\
                        <option value="{{hash}}">{{displayname}}</option>\
                      {{/subscriptionList}}\
                    </select>\
                    {{/showSubscriptionList}}\
                    <div id="preview"></div>\
                    <label for="maxui-file" class="upload-file">{{fileLiteral}}</label>\
                    <input type="file" id="maxui-file" class="maxui-file-image" accept="file/*" style="display:none">\
                    <label for="maxui-img" class="upload-img" style="">{{imgLiteral}}</label>\
                    <input type="file" id="maxui-img" class="maxui-file-image" accept="image/*" style="display:none">\
                   <input disabled="disabled" type="button" class="maxui-button maxui-disabled" value="{{buttonLiteral}}">\
              </div>\
            '),
        predictive: Hogan.compile('\
<li data-username="{{username}}" data-displayname="{{displayName}}" class="{{cssclass}}">\
        <img src="{{avatarURL}}"/><span>{{displayName}}</span>\
        </li>\
            ')
    };
    return templates;
};


;

/*global uuid */
/**
 * @fileoverview
 */
'use strict';
var max = max || {};
(function(jq) {
    /** MaxMessaging
     *
     *
     */
    function MaxMessaging(maxui) {
        var self = this;
        self.logtag = 'MESSAGING';
        self.maxui = maxui;
        self.active = false;
        self.vhost = '/';
        self.max_retries = 3;
        self.retry_interval = 3000;
        // Collect info from seettings
        self.debug = self.maxui.settings.enableAlerts;
        self.token = self.maxui.settings.oAuthToken;
        self.stompServer = self.maxui.settings.maxTalkURL;
        // Construct login merging username with domain (if any)
        // if domain explicitly specified, take it, otherwise deduce it from url
        if (maxui.settings.domain) {
            self.domain = maxui.settings.domain;
        } else {
            self.domain = self.domainFromMaxServer(self.maxui.settings.maxServerURL);
        }
        self.login = "";
        if (self.domain) {
            self.login += self.domain + ':';
        }
        self.login += self.maxui.settings.username;
        // Start socket
        //self.ws = new WebSocket('ws://localhost:8081/devel/ws');
        self.ws = new WebSocket(self.stompServer);
        self.bindings = [];
        self.specification = {
            uuid: {
                id: 'g',
                type: 'string'
            },
            user: {
                id: 'u',
                type: 'object',
                fields: {
                    'username': {
                        'id': 'u'
                    },
                    'displayname': {
                        'id': 'd'
                    }
                }
            },
            action: {
                id: 'a',
                type: 'char',
                values: {
                    'add': {
                        id: 'a'
                    },
                    'delete': {
                        id: 'd'
                    },
                    'modify': {
                        id: 'm'
                    },
                    'refresh': {
                        id: 'r'
                    },
                    'ack': {
                        id: 'k'
                    }
                }
            },
            object: {
                id: 'o',
                type: 'char',
                values: {
                    'message': {
                        id: 'm'
                    },
                    'conversation': {
                        id: 'c'
                    },
                    'tweet': {
                        id: 't'
                    },
                    'activity': {
                        id: 'a'
                    },
                    'context': {
                        id: 'x'
                    },
                    'comment': {
                        id: 't'
                    }
                }
            },
            data: {
                id: 'd',
                type: 'object'
            },
            source: {
                id: 's',
                type: 'char',
                values: {
                    max: {
                        id: 'm'
                    },
                    widget: {
                        id: 'w'
                    },
                    ios: {
                        id: 'i'
                    },
                    android: {
                        id: 'a'
                    },
                    tweety: {
                        id: 't'
                    },
                    maxbunny: {
                        id: 'b'
                    }
                }
            },
            domain: {
                id: 'i',
                type: 'string'
            },
            version: {
                id: 'v',
                type: 'string'
            },
            published: {
                id: 'p',
                type: 'date'
            }
        };
        // invert specification to acces by packed value
        self._specification = {};
        _.each(self.specification, function(svalue, sname, slist) {
            var spec = _.clone(svalue);
            if (_.has(spec, 'values')) {
                spec.values = {};
                _.each(svalue.values, function(vvalue, vname, vlist) {
                    spec.values[vvalue.id] = _.clone(vvalue);
                    spec.values[vvalue.id].name = vname;
                    delete spec.values[vvalue.id].id;
                });
            }
            if (_.has(spec, 'fields') && spec.type === 'object') {
                spec.fields = {};
                _.each(svalue.fields, function(vvalue, vname, vlist) {
                    spec.fields[vvalue.id] = _.clone(vvalue);
                    spec.fields[vvalue.id].name = vname;
                    delete spec.fields[vvalue.id].id;
                });
            }
            spec.name = sname;
            delete spec.id;
            self._specification[svalue.id] = spec;
        });
    }
    MaxMessaging.prototype.domainFromMaxServer = function(server) {
        //var self = this;
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
        var server_without_trailing_slash = server.replace(/\/$/, "");
        var dummy_a = document.createElement('a');
        dummy_a.href = server_without_trailing_slash;
        return _.last(dummy_a.pathname.split('/'));
    };
    MaxMessaging.prototype.start = function() {
        var self = this;
        self.maxui.logger.info('Connecting ...', self.logtag);
        self.connect();
        var current_try = 1;
        // Retry connection if initial failed
        var interval = setInterval(function(event) {
            if (!self.active && current_try <= self.max_retries) {
                self.maxui.logger.debug('Connection retry #{0}'.format(current_try), self.logtag);
                self.disconnect();
                self.ws = new WebSocket(self.maxui.settings.maxTalkURL);
                self.connect();
            } else {
                if (!self.active) {
                    self.maxui.logger.error('Connection failure after {0} reconnect attempts'.format(self.max_retries), self.logtag);
                }
                clearInterval(interval);
            }
            current_try += 1;
        }, self.retry_interval);
    };
    MaxMessaging.prototype.bind = function(params, callback) {
        var self = this;
        self.bindings.push({
            'key': self.pack(params),
            'callback': callback
        });
    };
    MaxMessaging.prototype.on_message = function(message, routing_key) {
        var self = this;
        var matched_bindings = _.filter(self.bindings, function(binding) {
            // compare the stored binding key with a normalized key from message
            var bind_key = _.pick(message, _.keys(binding.key));
            if (_.isEqual(binding.key, bind_key)) {
                return binding;
            }
        });
        if (_.isEmpty(matched_bindings)) {
            self.maxui.logger.warning('Ignoring received message\n{0}\n No binding found for this message'.format(message), self.logtag);
        } else {
            _.each(matched_bindings, function(binding, index, list) {
                self.maxui.logger.debug('Matched binding "{1}"'.format(message, binding.key), self.logtag);
                var unpacked = self.unpack(message);
                // format routing key to extract first part before dot (.)
                var destination = routing_key.replace(/(\w+)\.(.*)/g, "$1");
                unpacked.destination = destination;
                binding.callback(unpacked);
            });
        }
    };
    MaxMessaging.prototype.disconnect = function() {
        var self = this;
        self.stomp.disconnect();
        return;
    };
    MaxMessaging.prototype.connect = function() {
        var self = this;
        self.stomp = Stomp.over(self.ws);
        self.stomp.heartbeat.outgoing = 60000;
        self.stomp.heartbeat.incoming = 60000;
        self.stomp.reconnect_delay = 100;
        var heartbeat = [self.stomp.heartbeat.outgoing, self.stomp.heartbeat.incoming].join(',');
        self.stomp.debug = function(message) {
            self.maxui.logger.debug(message, self.logtag);
        };
        var product = 'maxui';
        if (self.maxui.settings.generator) {
            product += '[{0}]'.format(self.maxui.settings.generator);
        }
        var headers = {
            login: self.login,
            passcode: self.token,
            host: self.vhost,
            "heart-beat": heartbeat,
            product: product,
            "product-version": self.maxui.version,
            platform: '{0} {1} / {2} {3}'.format(jq.ua.browser.name, jq.ua.browser.version, jq.ua.os.name, jq.ua.os.version)
        };
        var connectCallback = function(x) {
            self.stomp.subscribe('/exchange/{0}.subscribe'.format(self.maxui.settings.username), function(stomp_message) {
                var data = JSON.parse(stomp_message.body);
                var routing_key = /([^/])+$/.exec(stomp_message.headers.destination)[0];
                self.on_message(data, routing_key);
            });
            self.active = true;
            self.maxui.logger.info('Succesfully connected to {0}'.format(self.stompServer), self.logtag);
        };
        var errorCallback = function(error) {
            self.maxui.logger.error(error);
        };
        self.stomp.connect(headers, connectCallback, errorCallback);
    };
    MaxMessaging.prototype.pack = function(message) {
        var self = this;
        var packed = {};
        var packed_key;
        _.each(message, function(value, key, list) {
            var spec = self.specification[key];
            if (_.isUndefined(spec)) {
                // Raise ??
            } else {
                var packed_value;
                if (_.has(spec, 'values')) {
                    if (_.has(spec.values, value)) {
                        packed_value = spec.values[value].id;
                    }
                } else {
                    packed_value = value;
                    if (_.has(spec, 'fields') && spec.type === 'object' && _.isObject(packed_value)) {
                        var packed_inner = {};
                        _.each(message[key], function(inner_value, inner_key, inner_list) {
                            if (_.has(spec.fields, inner_key)) {
                                packed_key = spec.fields[inner_key].id;
                            } else {
                                packed_key = inner_key;
                            }
                            packed_inner[packed_key] = inner_value;
                        });
                        packed_value = packed_inner;
                    }
                }
                if (!_.isUndefined(packed_value)) {
                    packed[spec.id] = packed_value;
                }
            }
        });
        return packed;
    };
    MaxMessaging.prototype.unpack = function(message) {
        var self = this;
        var unpacked = {};
        var unpacked_key;
        _.each(message, function(value, key, list) {
            var spec = self._specification[key];
            if (_.isUndefined(spec)) {
                // Raise ??
            } else {
                var unpacked_value;
                // change packed value if field has a values mapping
                if (_.has(spec, 'values')) {
                    if (_.has(spec.values, value)) {
                        unpacked_value = spec.values[value].name;
                    }
                    // otherwise leave the raw value
                } else {
                    unpacked_value = value;
                    //change inner object keys if the field has a field keys mapping
                    if (_.has(spec, 'fields') && spec.type === 'object' && _.isObject(unpacked_value)) {
                        var unpacked_inner = {};
                        _.each(message[key], function(inner_value, inner_key, inner_list) {
                            if (_.has(spec.fields, inner_key)) {
                                unpacked_key = spec.fields[inner_key].name;
                            } else {
                                unpacked_key = inner_key;
                            }
                            unpacked_inner[unpacked_key] = inner_value;
                        });
                        unpacked_value = unpacked_inner;
                    }
                }
                // Include key/value only if the value is defined
                if (!_.isUndefined(unpacked_value)) {
                    unpacked[spec.name] = unpacked_value;
                }
            }
        });
        return unpacked;
    };
    MaxMessaging.prototype.prepare = function(params) {
        var self = this;
        var base = {
            'source': 'widget',
            'version': self.maxui.version,
            'user': {
                'username': self.maxui.settings.username,
                'displayname': self.maxui.settings.displayName
            },
            'published': self.maxui.utils.rfc3339(self.maxui.utils.now()),
            'uuid': uuid.v1()
        };
        if (self.domain) {
            base.domain = self.domain;
        }
        // Overwrite any key-value pair in params already defined in base
        // Trim any key from params not in specification
        return _.extend(_.pick(params, _.keys(self.specification)), base);
    };
    MaxMessaging.prototype.send = function(message, routing_key) {
        var self = this;
        var message_unpacked = self.prepare(message);
        self.stomp.send('/exchange/{0}.publish/{1}'.format(self.maxui.settings.username, routing_key), {}, JSON.stringify(self.pack(message_unpacked)));
        return message_unpacked;
    };
    max.MaxMessaging = MaxMessaging;
})(jQuery);


;

'use strict';
var max = max || {};
(function(jq) {
    /** MaxLogging
     *
     *
     */
    var levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };

    function MaxLogging(options) {
        var self = this;
        self.level = 0;
    }
    MaxLogging.prototype.setLevel = function(level) {
        var self = this;
        self.level = levels[level];
    };
    MaxLogging.prototype.log = function(message, tag) {
        try {
            window.console.log('{0}: {1}'.format(tag, message));
        } catch (err) {}
    };
    MaxLogging.prototype.debug = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.debug) {
            self.log(message, tag);
        }
    };
    MaxLogging.prototype.info = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.info) {
            self.log(message, tag);
        }
    };
    MaxLogging.prototype.warn = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.warn) {
            self.log(message, tag);
        }
    };
    MaxLogging.prototype.error = function(message) {
        var tag = 'MAXUI';
        if (arguments.length > 1) {
            tag = arguments[1];
        }
        var self = this;
        if (self.level <= levels.error) {
            self.log(message, tag);
        }
    };
    max.MaxLogging = MaxLogging;
})(jQuery);


;

'use strict';
var max = max || {};
max.literals = function(language) {
    var maxui = {};
    maxui.en = {
        'cancel': 'Cancel',
        'delete': 'Delete',
        'months': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'new_activity_text': 'Write something...',
        'activity': 'activity',
        'conversations_lower': 'chats',
        'conversations': 'Chats',
        'conversations_list': 'chats list',
        'conversations_info_title': 'Chat information',
        'conversations_info_participants': 'Participants',
        'conversations_info_owner': 'owner',
        'conversations_info_add': 'Add participant...',
        'conversations_info_created': 'Created',
        'conversations_info_leave': 'Leave chat',
        'conversations_info_delete': 'Delete chat',
        'conversations_info_delete_warning': 'Warning!',
        'conversations_info_delete_help': 'If you delete the chat, the participants will not be able to see the messages anymore. To avoid this, cancel and transfer the ownership to someone else.',
        'conversations_info_kick_message_1': 'Click to kick',
        'conversations_info_kick_message_2': 'out of this chat',
        'conversations_info_transfer_message_1': 'Click to make',
        'conversations_info_transfer_message_2': 'the owner of this chat',
        'participants': 'Talk to',
        'chats_load_older': 'Load older',
        'conversation_name': 'Chat name',
        'message': 'Message',
        'no_chats': 'No chats already',
        'no_match_found': 'No match found',
        'new_conversation_text': 'Add participants and send a message to start a chat',
        'new_img_post': "Add image",
        'new_file_post': "Add file",
        'new_activity_post': "Post activity",
        'toggle_comments': "comments",
        'new_comment_text': "Comment something...",
        'new_comment_post': "Post comment",
        'load_more': "Load more",
        'context_published_in': "Published in",
        'generator_via': "via",
        'search_text': "Search in posts...",
        'and_more': "and more...",
        'new_message_post': "Send message",
        'post_permission_unauthorized': "You''re not authorized to post on this context",
        'post_permission_not_here': "You're not mentioning @anyone",
        'post_permission_not_enough_participants': "You have to add participants",
        'post_permission_missing_displayName': "You have to name the chat",
        'delete_activity_confirmation': "Are you sure?",
        'delete_activity_delete': "Delete",
        'delete_activity_cancel': "Cancel",
        'delete_activity_icon': "delete",
        'flag_activity_icon': "flagged",
        'favorites_filter_hint': 'Filter by favorited activity',
        'favorites': 'Favorites',
        'favorite': 'favorite',
        'unfavorite': 'unfavorite',
        'like': 'like',
        'unlike': 'unlike',
        'recent_activity': "Latest activity",
        'valued_activity': "Most valued activity",
        'flagged_activity': "Flagged activity",
        'recent_favorited_activity': "Latest favorites",
        'valued_favorited_activity': "Most valued favorites",
        'open_profile': "Show profile"
    };
    maxui.es = {
        'cancel': 'Cancelar',
        'delete': 'Eliminar',
        'months': ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
        'new_activity_text': 'Escribe algo...',
        'activity': 'actividad',
        'conversations_lower': 'chats',
        'conversations': 'Chats',
        'conversations_list': 'lista de chats',
        'conversations_info_title': 'Información del chat',
        'conversations_info_participants': 'Participantes',
        'conversations_info_owner': 'propietario',
        'conversations_info_add': 'Añade participante...',
        'conversations_info_created': 'Creada',
        'conversations_info_leave': 'Abandonar chat',
        'conversations_info_delete': 'Borra el chat',
        'conversations_info_delete_warning': 'Atención!',
        'conversations_info_delete_help': 'Si eliminas el chat, los participantes dejarán de ver los mensajes. Para evitar esto, cancela y luego traspasa el chat a otra persona.',
        'conversations_info_kick_message_1': 'Clica para echar a',
        'conversations_info_kick_message_2': 'de este chat',
        'conversations_info_transfer_message_1': 'Clica para dar a ',
        'conversations_info_transfer_message_2': 'la administración del chat',
        'participants': 'Chatear con',
        'chats_load_older': 'Cargar antiguos',
        'conversation_name': 'Nombre del chat',
        'message': 'Mensaje',
        'no_chats': 'No hay chats',
        'no_match_found': 'No hay coincidencias',
        'new_conversation_text': 'Añade participantes y envia el mensaje para iniciar un chat',
        'new_img_post': "Añadir imagen",
        'new_file_post': "Añadir archivo",
        'new_activity_post': "Publica",
        'toggle_comments': "comentarios",
        'new_comment_text': "Comenta algo...",
        'new_comment_post': "Comenta",
        'load_more': "Cargar más",
        'context_published_in': "Publicado en",
        'generator_via': "via",
        'search_text': "Busca en las entradas...",
        'and_more': "i más...",
        'new_message_post': 'Envia el mensaje',
        'post_permission_unauthorized': 'No estas autorizado a publicar en este contexto',
        'post_permission_not_here': "No estas citando a @nadie",
        'post_permission_not_enough_participants': "Tienes que añadir participantes",
        'post_permission_missing_displayName': "Tienes que dar un nombre al chat",
        'delete_activity_confirmation': "Estás seguro?",
        'delete_activity_delete': "Borrar",
        'delete_activity_cancel': "Cancelar",
        'delete_activity_icon': "borrar",
        'flag_activity_icon': "destacada",
        'favorites_filter_hint': 'Filtra por actividad favorita',
        'favorites': 'Favoritos',
        'favorite': 'favorito',
        'unfavorite': 'quitar favorito',
        'like': 'me gusta',
        'unlike': 'ya no me gusta',
        'recent_activity': "Últimas actividades",
        'valued_activity': "Actividades más valoradas",
        'flagged_activity': "Actividades destacadas",
        'recent_favorited_activity': "Últimas favoritas",
        'valued_favorited_activity': "Favoritas más valoradas",
        'open_profile': "Ver el perfil"
    };
    maxui.ca = {
        'cancel': 'Cancelar',
        'delete': 'Elimina',
        'months': ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'],
        'new_activity_text': 'Escriu alguna cosa...',
        'activity': 'activitat',
        'conversations_lower': 'xats',
        'conversations': 'Xats',
        'conversations_list': 'llista de xats',
        'conversations_info_title': 'Informació del xat',
        'conversations_info_participants': 'Participants',
        'conversations_info_owner': 'propietari',
        'conversations_info_add': 'Afegeix participant...',
        'conversations_info_created': 'Creada',
        'conversations_info_leave': 'Marxar del xat',
        'conversations_info_delete': 'Esborra el xat',
        'conversations_info_delete_warning': 'Alerta!',
        'conversations_info_delete_help': 'Si elimines el xat, la resta de participants deixaran de veure els missatges. Per evitar-ho, cancela i traspassa el xat a algú altre.',
        'conversations_info_kick_message_1': 'Clica per fer fora a ',
        'conversations_info_kick_message_2': "d'aquest xat",
        'conversations_info_transfer_message_1': 'Clica per fer a',
        'conversations_info_transfer_message_2': "l'administrador d'aquest xat",
        'participants': 'Xateja amb',
        'chats_load_older': 'Carregar antics',
        'conversation_name': 'Nom del xat',
        'message': 'Missatge',
        'no_chats': 'No hi ha xats',
        'no_match_found': "No s'han trobat coincidències",
        'new_conversation_text': 'Afegeix participants i envia el missatge per iniciar un xat',
        'new_img_post': "Afegir imatge",
        'new_file_post': "Afegir arxiu",
        'new_activity_post': "Publica",
        'toggle_comments': "comentaris",
        'new_comment_text': "Comenta alguna cosa...",
        'new_comment_post': "Comenta",
        'load_more': "Carrega'n més",
        'context_published_in': "Publicat a",
        'generator_via': "via",
        'search_text': "Cerca a les entrades...",
        'and_more': "i més...",
        'new_message_post': 'Envia el missatge',
        'post_permission_unauthorized': 'No estàs autoritzat a publicar en aquest contexte',
        'post_permission_not_here': "No estas citant a @ningú",
        'post_permission_not_enough_participants': "Has d'afegir participants",
        'post_permission_missing_displayName': "Has de posar nom al xat",
        'delete_activity_confirmation': "Estàs segur?",
        'delete_activity_delete': "Esborra",
        'delete_activity_cancel': "No ho toquis!",
        'delete_activity_icon': "esborra",
        'flag_activity_icon': "destacada",
        'favorites_filter_hint': 'Filtra per activitat favorita',
        'favorites': 'Favorits',
        'favorite': 'favorit',
        'unfavorite': 'treure favorit',
        'like': "m'agrada",
        'unlike': "ja no m'agrada",
        'recent_activity': "Darreres activitats",
        'valued_activity': "Activitats més valorades",
        'flagged_activity': "Activitats destacades",
        'recent_favorited_activity': "Darreres favorites",
        'valued_favorited_activity': "Favorites més valorades",
        'open_profile': "Veure el perfil"
    };
    return maxui[language];
};


;

'use strict';
var max = max || {};
max.utils = function() {
    var settings = {};
    return {
        setSettings: function(maxui_settings) {
            settings = maxui_settings;
        },
        /**
         *    Stops propagation of an event, to avoid arrows, esc, enter keys
         *    bubbling to an input, Used in conjunction with the users prediction box
         *
         *    @param {Event} e       The DOM event we want to freeze
         **/
        freezeEvent: function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            return false;
        },
        /**  Strips whitespace at the beggining and end of a string and optionaly between
         *
         *    @param {String} s       A text that may contain whitespaces
         *    @param {Boolean} multi  If true, reduces multiple consecutive whitespaces to one
         **/
        normalizeWhiteSpace: function(s, multi) {
            s = s.replace(/(^\s*)|(\s*$)/gi, "");
            s = s.replace(/\n /, "\n");
            var trimMulti = true;
            if (arguments.length > 1) {
                trimMulti = multi;
            }
            if (trimMulti === true) {
                s = s.replace(/[ ]{2,}/gi, " ");
            }
            return s;
        },
        /**  Searches for urls and hashtags in text and transforms to hyperlinks
         *    @param {String} text     String containing 0 or more valid links embedded with any other text
         **/
        formatText: function(text) {
            if (text) {
                // Format hyperlinks
                text = text.replace(/((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi, function(url) {
                    var full_url = url;
                    if (!full_url.match('^https?:\/\/')) {
                        full_url = 'http://' + full_url;
                    }
                    return '<a href="' + full_url + '">' + url + '</a>';
                });
                // Format hashtags links
                text = text.replace(/(\s|^)#{1}(\w+)/gi, function() {
                    var pre = arguments[1];
                    var tag = arguments[2];
                    return '<a class="maxui-hashtag" href="#" value="' + tag + '">' + pre + '#' + tag + '</a>';
                });
                // Format line breaks
                text = text.replace(/\r?\n/gi, '<br/>');
            }
            return text;
        },
        /**  Identifies cors funcionalities and returns a boolean
         indicating wheter the browser is or isn't CORS capable
    **/
        isCORSCapable: function() {
            var xhrObject = new XMLHttpRequest();
            //check if the XHR tobject has CORS functionalities
            if (xhrObject.withCredentials !== undefined) {
                return true;
            } else {
                return false;
            }
        },
        /**  Removes elements from array by value
         **/
        removeValueFrom: function(arr) {
            var what, a = arguments,
                L = a.length,
                ax;
            while (L > 1 && arr.length) {
                what = a[--L];
                while ((ax = arr.indexOf(what)) !== -1) {
                    arr.splice(ax, 1);
                }
            }
            return arr;
        },
        /**  Returns the numner of milliseconds since epoch
         **/
        timestamp: function() {
            var date = new Date();
            return date / 1;
        },
        /**  Returns current Date & Time in rfc339 format
         **/
        now: function() {
            var now = new Date();
            return now;
        },
        /**  Formats a date in rfc3339 format
         **/
        rfc3339: function(date) {
            function pad(n) {
                return n < 10 ? '0' + n : n;
            }
            return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()) + 'T' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()) + ':' + pad(date.getUTCSeconds()) + 'Z';
        },
        /**  Returns an human readable date from a timestamp in rfc3339 format (cross-browser)
         *    @param {String} timestamp    A date represented as a string in rfc3339 format '2012-02-09T13:06:43Z'
         **/
        formatDate: function(timestamp, lang) {
            var today = new Date();
            var formatted = '';
            var prefix = '';
            var thisdate = new Date();
            var match = timestamp.match("^([-+]?)(\\d{4,})(?:-?(\\d{2})(?:-?(\\d{2})" + "(?:[Tt ](\\d{2})(?::?(\\d{2})(?::?(\\d{2})(?:\\.(\\d{1,3})(?:\\d+)?)?)?)?" + "(?:[Zz]|(?:([-+])(\\d{2})(?::?(\\d{2}))?)?)?)?)?)?$");
            if (match) {
                for (var ints = [2, 3, 4, 5, 6, 7, 8, 10, 11], i = ints.length - 1; i >= 0; --i) {
                    match[ints[i]] = (typeof match[ints[i]] !== "undefined" && match[ints[i]].length > 0) ? parseInt(match[ints[i]], 10) : 0;
                }
                if (match[1] === '-') { // BC/AD
                    match[2] *= -1;
                }
                var ms = Date.UTC(match[2], // Y
                    match[3] - 1, // M
                    match[4], // D
                    match[5], // h
                    match[6], // m
                    match[7], // s
                    match[8] // ms
                );
                if (typeof match[9] !== "undefined" && match[9].length > 0) { // offset
                    ms += (match[9] === '+' ? -1 : 1) * (match[10] * 3600 * 1000 + match[11] * 60 * 1000); // oh om
                }
                if (match[2] >= 0 && match[2] <= 99) { // 1-99 AD
                    ms -= 59958144000000;
                }
                var a_day = 1000 * 60 * 60 * 24; // ms * seconds * minutes * hours
                var three_days = a_day * 3;
                var a_year = a_day * 365;
                thisdate.setTime(ms);
                // Dates in the last three days get a humanized date
                if ((today.getTime() - ms) < three_days) {
                    formatted = jQuery.easydate.format_date(thisdate, lang);
                    // Dates between 3 days and a year, get a 'X of MMMMM', localized
                    // into its language
                } else {
                    if (lang === 'en') {
                        formatted = '{0} {1}'.format(match[4], settings.literals.months[match[3] - 1]);
                    } else if (lang === 'es') {
                        formatted = '{0} de {1}'.format(match[4], settings.literals.months[match[3] - 1]);
                    } else if (lang === 'ca') {
                        prefix = 'de ';
                        if (match[3] === 4 || match[3] === 8 || match[3] === 10) {
                            prefix = "d'";
                        }
                        formatted = '{0} {2}{1}'.format(match[4], settings.literals.months[match[3] - 1], prefix);
                    }
                    // Finally, show dd/mm/yyy if post is more than one year old
                    if ((today.getTime() - ms) > a_year) {
                        formatted = '{0}/{1}/{2}'.format(match[4], match[3], match[2]);
                    }
                }
                return formatted;
            } else {
                return null;
            }
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
            function rotate_left(n, s) {
                var t4 = (n << s) | (n >>> (32 - s));
                return t4;
            }

            function cvt_hex(val) {
                var str = "";
                var i;
                var v;
                for (i = 7; i >= 0; i--) {
                    v = (val >>> (i * 4)) & 0x0f;
                    str += v.toString(16);
                }
                return str;
            }

            function utf8Encode(string) {
                string = string.replace(/\r\n/g, "\n");
                var utftext = "";
                for (var n = 0; n < string.length; n++) {
                    var c = string.charCodeAt(n);
                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    } else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    } else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }
                return utftext;
            }
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
            msg = utf8Encode(msg);
            var msg_len = msg.length;
            var word_array = [];
            for (i = 0; i < msg_len - 3; i += 4) {
                j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 | msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
                word_array.push(j);
            }
            switch (msg_len % 4) {
                case 0:
                    i = 0x080000000;
                    break;
                case 1:
                    i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
                    break;
                case 2:
                    i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
                    break;
                case 3:
                    i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
                    break;
            }
            word_array.push(i);
            while ((word_array.length % 16) !== 14) {
                word_array.push(0);
            }
            word_array.push(msg_len >>> 29);
            word_array.push((msg_len << 3) & 0x0ffffffff);
            for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
                for (i = 0; i < 16; i++) {
                    W[i] = word_array[blockstart + i];
                }
                for (i = 16; i <= 79; i++) {
                    W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
                }
                A = H0;
                B = H1;
                C = H2;
                D = H3;
                E = H4;
                for (i = 0; i <= 19; i++) {
                    temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                for (i = 20; i <= 39; i++) {
                    temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                for (i = 40; i <= 59; i++) {
                    temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                for (i = 60; i <= 79; i++) {
                    temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                    E = D;
                    D = C;
                    C = rotate_left(B, 30);
                    B = A;
                    A = temp;
                }
                H0 = (H0 + A) & 0x0ffffffff;
                H1 = (H1 + B) & 0x0ffffffff;
                H2 = (H2 + C) & 0x0ffffffff;
                H3 = (H3 + D) & 0x0ffffffff;
                H4 = (H4 + E) & 0x0ffffffff;
            }
            temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
            return temp.toLowerCase();
        }
    };
};


;

'use strict';
if (!Object.keys) {
    Object.keys = function(obj) {
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
String.prototype.format = function() {
    var pattern = /\{\d+\}/g;
    var args = arguments;
    return this.replace(pattern, function(capture) {
        return args[capture.match(/\d+/)];
    });
};

function MaxClient() {
    this.ROUTES = {
        users: '/people',
        user: '/people/{0}',
        avatar: '/people/{0}/avatar',
        user_activities: '/people/{0}/activities',
        timeline: '/people/{0}/timeline',
        user_comments: '/people/{0}/comments',
        user_shares: '/people/{0}/shares',
        user_likes: '/people/{0}/likes',
        follows: '/people/{0}/follows',
        follow: '/people/{0}/follows/{1}',
        subscriptions: '/people/{0}/subscriptions',
        activities: '/contexts/{0}/activities',
        activity: '/activities/{0}',
        comments: '/activities/{0}/comments',
        comment: '/activities/{0}/comments/{1}',
        likes: '/activities/{0}/likes',
        like: '/activities/{0}/likes/{1}',
        flag: '/activities/{0}/flag',
        favorites: '/activities/{0}/favorites',
        favorite: '/activities/{0}/favorites/{1}',
        shares: '/activities/{0}/shares',
        share: '/activities/{0}/shares/{1}',
        conversations: '/conversations',
        conversation: '/conversations/{0}',
        conversation_owner: '/conversations/{0}/owner',
        user_conversation: '/people/{0}/conversations/{1}',
        messages: '/conversations/{0}/messages',
        context: '/contexts/{0}'
    };
}
MaxClient.prototype.configure = function(settings) {
    this.url = settings.server;
    this.mode = settings.mode;
    this.token = settings.token;
    this.actor = {
        "objectType": "person",
        "username": settings.username
    };
};
MaxClient.prototype.POST = function(route, query, callback) {
    var self = this;
    var resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 3) {
        triggers = arguments[3];
    }
    jQuery.ajax({
        url: resource_uri,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Oauth-Token", self.token);
            xhr.setRequestHeader("X-Oauth-Username", self.actor.username);
            xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
        },
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(query),
        async: true,
        dataType: 'json'
    }).done(function(result) {
        callback.call(result);
        if (triggers.done) {
            jQuery(window).trigger(triggers.done, result);
        }
    }).fail(function(xhr) {
        jQuery(window).trigger('maxclienterror', xhr);
        if (triggers.fail) {
            jQuery(window).trigger(triggers.fail, xhr);
        }
    });
    return true;
};
MaxClient.prototype.POSTFILE = function(route, query, callback) {
    var self = this;
    var resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 3) {
        triggers = arguments[3];
    }
    jQuery.ajax({
        url: resource_uri,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Oauth-Token", self.token);
            xhr.setRequestHeader("X-Oauth-Username", self.actor.username);
            xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
        },
        type: 'POST',
        processData: false,
        contentType: false,
        data: query,
        async: true,
        dataType: 'json'
    }).done(function(result) {
        callback.call(result);
        if (triggers.done) {
            jQuery(window).trigger(triggers.done, result);
        }
    }).fail(function(xhr) {
        jQuery(window).trigger('maxclienterror', xhr);
        if (triggers.fail) {
            jQuery(window).trigger(triggers.fail, xhr);
        }
    });
    return true;
};
MaxClient.prototype.PUT = function(route, query, callback) {
    var self = this;
    var resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 3) {
        triggers = arguments[3];
    }
    jQuery.ajax({
        url: resource_uri,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Oauth-Token", self.token);
            xhr.setRequestHeader("X-Oauth-Username", self.actor.username);
            xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
            xhr.setRequestHeader("X-HTTP-Method-Override", 'PUT');
        },
        contentType: 'application/json',
        type: 'POST',
        data: JSON.stringify(query),
        async: true,
        dataType: 'json'
    }).done(function(result) {
        callback.call(result);
        if (triggers.done) {
            jQuery(window).trigger(triggers.done, result);
        }
    }).fail(function(xhr) {
        jQuery(window).trigger('maxclienterror', xhr);
        if (triggers.fail) {
            jQuery(window).trigger(triggers.fail, xhr);
        }
    });
    return true;
};
MaxClient.prototype.DELETE = function(route, query, callback) {
    var self = this;
    var resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 2) {
        triggers = arguments[2];
    }
    jQuery.ajax({
        url: resource_uri,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Oauth-Token", self.token);
            xhr.setRequestHeader("X-Oauth-Username", self.actor.username);
            xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
            xhr.setRequestHeader("X-HTTP-Method-Override", 'DELETE');
        },
        type: 'POST',
        data: JSON.stringify(query),
        async: true,
        dataType: 'json'
    }).done(function(result) {
        callback.call(result);
        if (triggers.done) {
            jQuery(window).trigger(triggers.done, result);
        }
    }).fail(function(xhr) {
        jQuery(window).trigger('maxclienterror', xhr);
        if (triggers.fail) {
            jQuery(window).trigger(triggers.fail, xhr);
        }
    });
    return true;
};
MaxClient.prototype.GET = function(route, query, callback) {
    var self = this;
    var resource_uri = '{0}{1}'.format(this.url, route);
    // Get method-defined triggers
    var triggers = {};
    if (arguments.length > 3) {
        triggers = arguments[3];
    }
    if (Object.keys(query).length > 0) {
        resource_uri += '?' + jQuery.param(query, true);
    }
    var ajax_options = {
        url: resource_uri,
        beforeSend: function(xhr) {
            xhr.setRequestHeader("X-Oauth-Token", self.token);
            xhr.setRequestHeader("X-Oauth-Username", self.actor.username);
            xhr.setRequestHeader("X-Oauth-Scope", 'widgetcli');
        },
        processData: true,
        type: 'GET',
        async: true,
        dataType: 'json'
    };
    if (arguments.length > 3) {
        _.extend(ajax_options, arguments[3]);
    }
    jQuery.ajax(ajax_options).done(function(result, status, xhr) {
        if (triggers.done) {
            jQuery(window).trigger(triggers.done);
        }
        callback.apply(xhr, [result]);
    }).fail(function(xhr) {
        jQuery(window).trigger('maxclienterror', xhr);
        if (triggers.fail) {
            jQuery(window).trigger(triggers.fail);
        }
    });
    return true;
};
/*
 * People related endpoints
 */
MaxClient.prototype.getUserData = function(username, callback) {
    var route = this.ROUTES.user.format(username);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.getUsersList = function(userquery, callback) {
    var route = this.ROUTES.users;
    var query = {
        username: userquery
    };
    this.GET(route, query, callback);
};
/*
 * Context related endpoints
 */
MaxClient.prototype.getContext = function(chash, callback) {
    var route = this.ROUTES.context.format(chash);
    var query = {};
    this.GET(route, query, callback);
};
/*
 * Activity related endpoints
 */
MaxClient.prototype.getUserTimeline = function(username, callback) {
    var route = this.ROUTES.timeline.format(username);
    var query = {};
    if (arguments.length > 2) {
        query = arguments[2];
    }
    this.GET(route, query, callback);
};
MaxClient.prototype.getActivities = function(options, callback) {
    var route = this.ROUTES.activities.format(options.context);
    var query = {};
    if (arguments.length > 2) {
        query = arguments[2];
    }
    if (options.tags) {
        if (options.tags.length > 0) {
            query.context_tags = options.tags;
        }
    }
    this.GET(route, query, callback);
};
MaxClient.prototype.getCommentsForActivity = function(activityid, callback) {
    var route = this.ROUTES.comments.format(activityid);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.addComment = function(comment, activity, callback) {
    var query = {
        "actor": {},
        "object": {
            "objectType": "comment",
            "content": ""
        }
    };
    query.actor = this.actor;
    query.object.content = comment;
    var route = this.ROUTES.comments.format(activity);
    this.POST(route, query, callback);
};
MaxClient.prototype.addActivity = function(text, contexts, callback, media) {
    var query = {};
    if (media === undefined) {
        query = {
            "object": {
                "objectType": "note",
                "content": ""
            }
        };
    } else {
        if (media.type.split('/')[0] === 'image') {
            query = {
                "object": {
                    "objectType": "image",
                    "content": "",
                    "mimetype": media.type
                }
            };
        } else {
            query = {
                "object": {
                    "objectType": "file",
                    "content": "",
                    "mimetype": media.type
                }
            };
        }
    }
    if (contexts.length > 0) {
        query.contexts = [];
        for (var ct = 0; ct < contexts.length; ct++) {
            query.contexts.push({
                'objectType': 'context',
                'url': contexts[ct]
            });
        }
    }
    query.object.content = text;
    //We have a generator
    if (arguments.length > 3) {
        query.generator = arguments[3];
    }
    var route = this.ROUTES.user_activities.format(this.actor.username);
    var trigger = {
        'done': 'maxui-posted-activity',
        'fail': 'maxui-failed-activity'
    };
    if (media === undefined) {
        this.POST(route, query, callback, trigger);
    } else {
        let formData = new FormData();
        formData.append("json_data", JSON.stringify(query));
        formData.append("file", new Blob([media], {
            type: media.type
        }), media.name);
        this.POSTFILE(route, formData, callback, trigger);
    }
};
MaxClient.prototype.removeActivity = function(activity_id, callback) {
    var route = this.ROUTES.activity.format(activity_id);
    this.DELETE(route, {}, callback);
};
MaxClient.prototype.removeActivityComment = function(activity_id, comment_id, callback) {
    var route = this.ROUTES.comment.format(activity_id, comment_id);
    this.DELETE(route, {}, callback);
};
/*
 * Conversation related endpoints
 */
MaxClient.prototype.getConversationSubscription = function(chash, username, callback) {
    var route = this.ROUTES.user_conversation.format(username, chash);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.getConversation = function(chash, callback) {
    var route = this.ROUTES.conversation.format(chash);
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.modifyConversation = function(chash, displayName, callback) {
    var query = {
        "displayName": displayName
    };
    var route = this.ROUTES.conversation.format(chash);
    this.PUT(route, query, callback);
};
MaxClient.prototype.addUserToConversation = function(chash, username, callback) {
    var query = {};
    var route = this.ROUTES.user_conversation.format(username, chash);
    this.POST(route, query, callback);
};
MaxClient.prototype.kickUserFromConversation = function(chash, username, callback) {
    var query = {};
    var route = this.ROUTES.user_conversation.format(username, chash);
    this.DELETE(route, query, callback);
};
MaxClient.prototype.deleteConversation = function(chash, callback) {
    var query = {};
    var route = this.ROUTES.conversation.format(chash);
    this.DELETE(route, query, callback);
};
MaxClient.prototype.leaveConversation = function(chash, username, callback) {
    var query = {};
    var route = this.ROUTES.user_conversation.format(username, chash);
    this.DELETE(route, query, callback);
};
MaxClient.prototype.transferConversationOwnership = function(chash, username, callback) {
    var query = {
        "actor": {
            "username": username
        }
    };
    var route = this.ROUTES.conversation_owner.format(chash);
    this.PUT(route, query, callback);
};
MaxClient.prototype.getConversationsForUser = function(username, callback) {
    var route = this.ROUTES.conversations;
    var query = {};
    this.GET(route, query, callback);
};
MaxClient.prototype.getMessageImage = function(route, callback) {
    var query = {};
    var ajax_options = {
        processData: false,
        dataType: undefined,
        contentType: 'application/base64'
    };
    this.GET(route, query, callback, ajax_options);
};
MaxClient.prototype.getMessagesForConversation = function(hash, params, callback) {
    var route = this.ROUTES.messages.format(hash);
    var query = params;
    this.GET(route, query, callback);
};
MaxClient.prototype.addMessageAndConversation = function(params, callback) {
    var query = {
        "object": {
            "objectType": "note",
            "content": params.message
        },
        "contexts": [{
            'objectType': 'conversation',
            'participants': params.participants
        }]
    };
    if (params.displayName) {
        query.contexts[0].displayName = params.displayName;
    }
    var route = this.ROUTES.conversations;
    this.POST(route, query, callback);
};
MaxClient.prototype.addMessage = function(text, chash, callback) {
    var query = {};
    query = {
        "object": {
            "objectType": "note",
            "content": ""
        }
    };
    query.object.content = text;
    var route = this.ROUTES.messages.format(chash);
    this.POST(route, query, callback);
};
/*
 * Social-interactions related endpoints
 */
MaxClient.prototype.follow = function(username, callback) {
    var query = {
        "object": {
            "objectType": "person",
            "username": ""
        }
    };
    query.object.username = username;
    var route = this.ROUTES.follow.format(this.actor.username, username);
    this.POST(route, query, callback);
};
MaxClient.prototype.favoriteActivity = function(activityid, callback) {
    var query = {};
    var route = this.ROUTES.favorites.format(activityid);
    this.POST(route, query, callback);
};
MaxClient.prototype.unfavoriteActivity = function(activityid, callback) {
    var query = {};
    var route = this.ROUTES.favorite.format(activityid, this.actor.username);
    this.DELETE(route, query, callback);
};
MaxClient.prototype.likeActivity = function(activityid, callback) {
    var query = {};
    var route = this.ROUTES.likes.format(activityid);
    this.POST(route, query, callback);
};
MaxClient.prototype.unlikeActivity = function(activityid, callback) {
    var query = {};
    var route = this.ROUTES.like.format(activityid, this.actor.username);
    this.DELETE(route, query, callback);
};
MaxClient.prototype.flagActivity = function(activityid, callback) {
    var query = {};
    var route = this.ROUTES.flag.format(activityid);
    this.POST(route, query, callback);
};
MaxClient.prototype.unflagActivity = function(activityid, callback) {
    var query = {};
    var route = this.ROUTES.flag.format(activityid);
    this.DELETE(route, query, callback);
};


;

/*global MaxClient */
/* @fileoverview Main Activity Stream widget module
 */
'use strict';
(function(jq) {
    /**
     *    MaxUI plugin definition
     *    @param {Object} options    Object containing overrides for default values
     **/
    jq.fn.maxUI = function(options) {
        // Keep a reference of the context object
        var maxui = this;
        maxui.version = '5.1.1';
        maxui.templates = max.templates();
        maxui.utils = max.utils();
        var defaults = {
            'maxRequestsAPI': 'jquery',
            'maxServerURL': 'https://max.upc.edu',
            'readContext': undefined,
            'writeContexts': [],
            'activitySource': 'timeline',
            'enableAlerts': false,
            'UISection': 'timeline',
            'disableTimeline': false,
            'disableConversations': true,
            'conversationsSection': 'conversations',
            'currentConversationSection': 'conversations',
            'activitySortOrder': 'comments',
            'activitySortView': 'recent',
            'maximumConversations': 20,
            'contextTagsFilter': [],
            'scrollbarWidth': 10,
            'widgetWidth': '0',
            'sectionHorizontalPadding': 20,
            'widgetBorder': 2,
            'loglevel': 'info',
            'hidePostboxOnTimeline': false,
            'maxTalkURL': "",
            'generator': "",
            'domain': "",
            'showSubscriptionList': false,
            'showLikes': true
        };
        // extend defaults with user-defined settings
        maxui.settings = jq.extend(defaults, options);
        maxui.logger = new max.MaxLogging(maxui);
        maxui.logger.setLevel(maxui.settings.loglevel);
        // Configure maxui without CORS if CORS not available
        if (!maxui.utils.isCORSCapable()) {
            // IF it has been defined an alias, set as max server url
            if (maxui.settings.maxServerURLAlias) {
                maxui.settings.maxServerURL = maxui.settings.maxServerURLAlias;
            }
        }
        // Normalize maxTalkURL and provide sensible default for stomp server
        // The base url for stomp url construction is based on the max url AFTER
        // checking for CORS avalability
        maxui.settings.maxTalkURL = maxui.utils.normalizeWhiteSpace(maxui.settings.maxTalkURL);
        if (_.isUndefined(maxui.settings.maxTalkURL) || maxui.settings.maxTalkURL === "") {
            var url = maxui.settings.maxServerURL;
            maxui.settings.maxTalkURL = url.replace("http", "ws") + '/ws';
        }
        // Normalize domain if present, to avoid errors with unvalid values and whitespaces
        maxui.settings.domain = maxui.utils.normalizeWhiteSpace(maxui.settings.domain);
        if (maxui.settings.domain.toLowerCase() === 'none') {
            maxui.settings.domain = "";
        }
        // Check timeline/activities consistency
        if (maxui.settings.UISection === 'timeline' && maxui.settings.activitySource === 'timeline' && maxui.settings.readContext) {
            maxui.settings.readContext = undefined;
            maxui.settings.writeContexts = [];
        }
        // Check showSubscriptionList consistency
        if (maxui.settings.showSubscriptionList && maxui.settings.activitySource === 'activities') {
            maxui.settings.showSubscriptionList = false;
        }
        // Get language from options or set default.
        // Set literals in the choosen language and extend from user options
        maxui.language = options.language || 'en';
        var user_literals = options.literals || {};
        maxui.settings.literals = jq.extend(max.literals(maxui.language), user_literals);
        if (maxui.settings.readContext) {
            // Calculate readContextHash
            maxui.settings.readContextHash = maxui.utils.sha1(maxui.settings.readContext);
            // Add read context to write contexts
            maxui.settings.writeContexts.push(maxui.settings.readContext);
            // Store the hashes of the write contexts
            maxui.settings.writeContextsHashes = [];
            for (var wc = 0; wc < maxui.settings.writeContexts.length; wc++) {
                maxui.settings.writeContextsHashes.push(maxui.utils.sha1(maxui.settings.writeContexts[wc]));
            }
        }
        //set default avatar and profile url pattern if user didn't provide it
        if (!maxui.settings.avatarURLpattern) {
            maxui.settings.avatarURLpattern = maxui.settings.maxServerURL + '/people/{0}/avatar';
        }
        if (!maxui.settings.contextAvatarURLpattern) {
            maxui.settings.contextAvatarURLpattern = maxui.settings.maxServerURL + '/contexts/{0}/avatar';
        }
        if (!maxui.settings.conversationAvatarURLpattern) {
            maxui.settings.conversationAvatarURLpattern = maxui.settings.maxServerURL + '/conversations/{0}/avatar';
        }
        // Disable profileURL by now
        // if (!maxui.settings.profileURLpattern)
        //        maxui.settings['profileURLpattern'] = maxui.settings.maxServerURL+'/profiles/{0}'
        // Catch errors triggered by failed max api calls
        if (maxui.settings.enableAlerts) {
            jq(window).bind('maxclienterror', function(event, xhr) {
                var error = JSON.parse(xhr.responseText);
                alert('The server responded with a "{0}" error, with the following message: "{1}". \n\nPlease try again later or contact administrator at admin@max.upc.edu.'.format(error.error, error.error_description));
            });
        }
        // Init MAX Client
        maxui.maxClient = new MaxClient();
        var maxclient_config = {
            server: maxui.settings.maxServerURL,
            mode: maxui.settings.maxRequestsAPI,
            username: maxui.settings.username,
            token: maxui.settings.oAuthToken
        };
        maxui.maxClient.configure(maxclient_config);
        // Create a instance of a max messaging client
        // This needs to be before MaxConversations instance creation
        maxui.messaging = new max.MaxMessaging(maxui);
        // View representing the conversations section
        maxui.conversations = new max.views.MaxConversations(maxui, {});
        // Bind conversation message receiving
        if (!maxui.settings.disableConversations) {
            maxui.messaging.bind({
                action: 'add',
                object: 'message'
            }, function(message) {
                maxui.conversations.ReceiveMessage(message);
            });
            maxui.messaging.bind({
                action: 'add',
                object: 'conversation'
            }, function(message) {
                maxui.conversations.ReceiveConversation(message);
            });
            maxui.messaging.bind({
                action: 'refresh',
                object: 'conversation'
            }, function(message) {
                maxui.conversations.messagesview.load(message.destination);
            });
            maxui.messaging.bind({
                action: 'ack',
                object: 'message'
            }, function(message) {
                maxui.conversations.messagesview.ack(message);
            });
        }
        // Make settings available to utils package
        maxui.utils.setSettings(maxui.settings);
        /**
         *
         *
         **/
        jq.fn.hidePostbox = function() {
            var maxui = this;
            if (maxui.settings.activitySource === 'timeline') {
                if (maxui.settings.subscriptionsWrite.length > 0) {
                    return maxui.settings.hidePostboxOnTimeline;
                }
            }
            for (var i in maxui.settings.subscriptionsWrite) {
                var hash = maxui.settings.subscriptionsWrite[i].hash;
                if (hash === maxui.settings.readContext) {
                    return maxui.settings.hidePostboxOnTimeline;
                }
            }
            return true;
        };
        // Get user data and start ui rendering when completed
        this.maxClient.getUserData(maxui.settings.username, function(data) {
            //Determine if user can write in writeContexts
            maxui.settings.displayName = data.displayName || maxui.settings.username;
            var userSubscriptions = {};
            var subscriptionsWrite = [];
            if (data.subscribedTo) {
                if (data.subscribedTo) {
                    if (data.subscribedTo.length > 0) {
                        for (var sc = 0; sc < data.subscribedTo.length; sc++) {
                            var subscription = data.subscribedTo[sc];
                            userSubscriptions[subscription.hash] = {};
                            userSubscriptions[subscription.hash].permissions = {};
                            for (var pm = 0; pm < subscription.permissions.length; pm++) {
                                var permission = subscription.permissions[pm];
                                userSubscriptions[subscription.hash].permissions[permission] = true;
                                if (permission === 'write') {
                                    subscriptionsWrite.push({
                                        hash: subscription.url,
                                        displayname: subscription.displayName
                                    });
                                }
                            }
                        }
                    }
                }
            }
            maxui.settings.subscriptionsWrite = subscriptionsWrite;
            maxui.settings.subscriptions = userSubscriptions;
            if (maxui.settings.activitySource === 'timeline' && subscriptionsWrite.length > 0) {
                maxui.settings.writeContexts.push(subscriptionsWrite[0].hash);
            }
            // Start messaging only if conversations enabled
            if (!maxui.settings.disableConversations) {
                maxui.messaging.start();
                jq(window).on('beforeunload', function(event) {
                    var x = maxui.messaging.disconnect();
                    return x;
                });
            }
            // render main interface
            var showCT = maxui.settings.UISection === 'conversations';
            var showTL = maxui.settings.UISection === 'timeline';
            var toggleTL = maxui.settings.disableTimeline === false && !showTL;
            var toggleCT = maxui.settings.disableConversations === false && !showCT;
            var containerWidth = (jq("#menusup").length === 1 ? jq("#menusup").width() : maxui.width()) - maxui.settings.scrollbarWidth - 30;
            var showRecentOrder = maxui.settings.activitySortView === 'recent';
            var showLikesOrder = maxui.settings.activitySortView === 'likes';
            var showFlaggedOrder = maxui.settings.activitySortView === 'flagged';
            var params = {
                username: maxui.settings.username,
                literals: maxui.settings.literals,
                showMaxUIClass: showCT ? 'maxui-container-chat' : 'maxui-container-activity',
                showConversations: showCT ? 'display:block;' : 'display:none;',
                showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;',
                showTimeline: showTL ? 'display:block;' : 'display:none;',
                showTimelineToggle: toggleTL ? 'display:block;' : 'display:none;',
                orderViewRecent: showRecentOrder ? 'active' : '',
                orderViewLikes: showLikesOrder ? 'active' : '',
                orderViewFlagged: showFlaggedOrder ? 'active' : '',
                messagesStyle: 'width:{0}px;left:{0}px;'.format(containerWidth),
                hidePostbox: maxui.hidePostbox()
            };
            var mainui = maxui.templates.mainUI.render(params);
            maxui.html(mainui);
            maxui.overlay = new max.views.MaxOverlay(maxui);
            // Define widths
            // XXX TODO :Read from renderer styles, not hardcoded values
            maxui.settings.widgetWidth = jq("#menusup").length === 1 ? jq("#menusup").width() - 30 : maxui.width();
            maxui.settings.sectionsWidth = maxui.settings.widgetWidth - maxui.settings.scrollbarWidth - maxui.settings.widgetBorder;
            // First-rendering of conversations list, even if it's not displayed on start
            if (!maxui.settings.disableConversations) {
                maxui.conversations.render();
                maxui.conversations.listview.load(data.talkingIn);
            }
            if (maxui.settings.UISection === 'conversations') {
                maxui.bindEvents();
                maxui.toggleSection('conversations');
                maxui.renderPostbox();
                var textarea_literal = maxui.settings.literals.new_conversation_text;
                jq('#maxui-newactivity-box textarea').val(textarea_literal).attr('data-literal', textarea_literal);
            } else if (maxui.settings.UISection === 'timeline') {
                var sort_orders_by_view = {
                    recent: maxui.settings.activitySortOrder,
                    likes: 'likes',
                    flagged: 'flagged'
                };
                maxui.printActivities({
                    sortBy: sort_orders_by_view[maxui.settings.activitySortView]
                }, function(event) {
                    maxui.bindEvents();
                });
            }
        });
        // allow jq chaining
        return maxui;
    };
    jq.fn.bindEvents = function() {
        var maxui = this;
        //Assign click to loadmore
        jq('#maxui-more-activities .maxui-button').click(function(event) {
            event.preventDefault();
            maxui.loadMoreActivities();
            /*if (jq('#maxui-search').hasClass('folded')) {
                maxui.loadMoreActivities();
            } else {
                var last_result_id = jq('.maxui-activity:last').attr('id');
                maxui.reloadFilters(last_result_id);
            }*/
        });
        //PG Assign click to load news activities
        jq('#maxui-news-activities .maxui-button').click(function(event) {
            maxui.loadNewsActivities();
        });
        //Assign click to toggle search filters if any search filter defined
        jq('#maxui-search-toggle').click(function(event) {
            event.preventDefault();
            if (!jq(this).hasClass('maxui-disabled')) {
                jq('#maxui-search').toggleClass('folded');
                if (jq('#maxui-search').hasClass('folded')) {
                    maxui.printActivities({});
                } else {
                    maxui.reloadFilters();
                }
            }
        });
        //Assign Commentbox toggling via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-commentaction', function(event) {
            event.preventDefault();
            window.status = '';
            jq(this).closest('.maxui-activity').find('.maxui-comments').toggle(200);
        });
        //Assign Username and avatar clicking via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-filter-actor', function(event) {
            event.preventDefault();
            var actor = jq(this).parent().find('.maxui-username').text();
            maxui.addFilter({
                type: 'actor',
                value: actor
            });
            jq('#maxui-search').toggleClass('folded', false);
        });
        //Assign Username and avatar clicking via delegating the click to the activities container
        jq('#maxui-search').on('click', '#maxui-favorites-filter', function(event) {
            event.preventDefault();
            var favoritesButton = jq(event.currentTarget);
            var filterFavorites = !favoritesButton.hasClass('active');
            var valued_literal = '';
            var recent_literal = '';
            if (filterFavorites) {
                maxui.addFilter({
                    type: 'favorites',
                    value: true,
                    visible: false
                });
                valued_literal = maxui.settings.literals.valued_favorited_activity;
                recent_literal = maxui.settings.literals.recent_favorited_activity;
            } else {
                maxui.delFilter({
                    type: 'favorites',
                    value: true
                });
                valued_literal = maxui.settings.literals.valued_activity;
                recent_literal = maxui.settings.literals.recent_activity;
            }
            favoritesButton.toggleClass('active', filterFavorites);
            jq('#maxui-activity-sort .maxui-most-recent').text(recent_literal);
            jq('#maxui-activity-sort .maxui-most-valued').text(valued_literal);
        });
        //Assign hashtag filtering via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-hashtag', function(event) {
            event.preventDefault();
            maxui.addFilter({
                type: 'hashtag',
                value: jq(this).attr('value')
            });
            jq('#maxui-search').toggleClass('folded', false);
        });
        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-search-filters').on('click', '.maxui-close', function(event) {
            event.preventDefault();
            var filter = jq(this.parentNode.parentNode);
            maxui.delFilter({
                type: filter.attr('type'),
                value: filter.attr('value')
            });
        });
        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-new-participants').on('click', '.maxui-close', function(event) {
            event.preventDefault();
            var filter = jq(this.parentNode.parentNode);
            maxui.delPerson({
                username: filter.attr('username')
            });
        });
        //Assign filter closing via delegating the click to the filters container
        jq('#maxui-new-displayName').on('keyup', 'input', function(event) {
            event.preventDefault();
            maxui.reloadPersons();
        });
        //Assign user mention suggestion to textarea by click
        jq('#maxui-newactivity').on('click', '.maxui-prediction', function(event) {
            event.preventDefault();
            var $selected = jq(this);
            var $area = jq('#maxui-newactivity-box textarea');
            var $predictive = jq('#maxui-newactivity #maxui-predictive');
            var text = $area.val();
            var matchMention = new RegExp('^\\s*@([\\w\\.]+)');
            var replacement = text.replace(matchMention, '@' + $selected.text() + ' ');
            $predictive.hide();
            $area.val(replacement);
            $area.focus();
        });
        // Close predictive window if clicked outside
        jq(document).on('click', function(event) {
            var $predictive = jq('.maxui-predictive');
            $predictive.hide();
        });
        //Assign user mention suggestion to input by click
        jq('#maxui-conversation-predictive').on('click', '.maxui-prediction', function(event) {
            event.preventDefault();
            var $selected = jq(this);
            var $area = jq('#maxui-add-people-box .maxui-text-input');
            var $predictive = jq('#maxui-conversation-predictive');
            var username = $selected.attr('data-username');
            var displayname = $selected.attr('data-displayname');
            maxui.addPerson({
                'username': username,
                'displayName': displayname
            });
            $predictive.hide();
            $area.val('').focus();
        });
        //Assign toggling conversations section
        jq('#maxui-show-conversations').on('click', function(event) {
            event.preventDefault();
            window.status = '';
            maxui.toggleSection('conversations');
            jq('#maxui-newactivity-box > .upload-file').hide();
            jq('#maxui-newactivity-box > .upload-img').hide();
            jq('#maxui-newactivity-box > #preview').hide();
        });
        //Assign activation of timeline section by its button
        jq('#maxui-show-timeline').on('click', function(event) {
            event.preventDefault();
            window.status = '';
            maxui.printActivities({}, function(event) {
                maxui.toggleSection('timeline');
            });
        });
        //Toggle favorite status via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-action.maxui-favorites', function(event) {
            event.preventDefault();
            var $favorites = jq(this);
            var $activity = jq(this).closest('.maxui-activity');
            var activityid = $activity.attr('id');
            var favorited = $favorites.hasClass('maxui-favorited');
            if (favorited) {
                maxui.maxClient.unfavoriteActivity(activityid, function(event) {
                    $favorites.toggleClass('maxui-favorited', false);
                });
            } else {
                maxui.maxClient.favoriteActivity(activityid, function(event) {
                    $favorites.toggleClass('maxui-favorited', true);
                });
            }
        });
        //Toggle like status via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-action.maxui-likes', function(event) {
            event.preventDefault();
            var $likes = jq(this);
            var $activity = jq(this).closest('.maxui-activity');
            var activityid = $activity.attr('id');
            var liked = $likes.hasClass('maxui-liked');
            var $likes_count = $likes.children('strong');
            var likesUsernames = [];
            if ($likes.attr('title') && $likes.attr('title') !== "") {
                likesUsernames = $likes.attr('title').split('\n');
            }
            if (liked) {
                maxui.maxClient.unlikeActivity(activityid, function(event) {
                    $likes.toggleClass('maxui-liked', false);
                });
                $likes_count.text(parseInt($likes_count.text(), 10) - 1);
                likesUsernames = jq.grep(likesUsernames, function(value) {
                    return value !== maxui.settings.username;
                });
                if (maxui.settings.showLikes) {
                    $likes.attr('title', likesUsernames.join('\n'));
                }
            } else {
                maxui.maxClient.likeActivity(activityid, function(event) {
                    $likes.toggleClass('maxui-liked', true);
                });
                $likes_count.text(parseInt($likes_count.text(), 10) + 1);
                likesUsernames.push(maxui.settings.username);
                if (maxui.settings.showLikes) {
                    $likes.attr('title', likesUsernames.join('\n'));
                }
            }
        });
        //Toggle flagged status via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-action.maxui-flag', function(event) {
            event.preventDefault();
            var $flag = jq(this);
            var $activity = jq(this).closest('.maxui-activity');
            var activityid = $activity.attr('id');
            var flagged = $flag.hasClass('maxui-flagged');
            if (flagged) {
                maxui.maxClient.unflagActivity(activityid, function(event) {
                    $flag.toggleClass('maxui-flagged', false);
                    $activity.toggleClass('maxui-flagged', false);
                    maxui.printActivities({});
                });
            } else {
                maxui.maxClient.flagActivity(activityid, function(event) {
                    $flag.toggleClass('maxui-flagged', true);
                    $activity.toggleClass('maxui-flagged', false);
                    maxui.printActivities({});
                });
            }
        });
        //Assign activity removal confirmation dialog toggle via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-action.maxui-delete', function(event) {
            event.preventDefault();
            var $activity = jq(this).closest('.maxui-activity');
            var $dialog = $activity.find('.maxui-actions > .maxui-popover');
            if (!$dialog.is(':visible')) {
                jq('.maxui-popover').css({
                    opacity: 0
                }).hide();
                $dialog.show();
                $dialog.animate({
                    opacity: 1
                }, 300);
            } else {
                $dialog.animate({
                    opacity: 0
                }, 300);
                jq('.maxui-popover').css({
                    opacity: 0
                }).hide();
            }
        });
        //Assign activity removal confirmation dialog via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-actions .maxui-button-cancel', function(event) {
            event.preventDefault();
            // Hide all visible dialogs
            var $popover = jq('.maxui-popover:visible').css({
                opacity: 0
            });
            $popover.hide();
        });
        //Assign activity removal via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-actions .maxui-button-delete', function(event) {
            event.preventDefault();
            var $activity = jq(this).closest('.maxui-activity');
            var activityid = $activity.attr('id');
            maxui.maxClient.removeActivity(activityid, function(event) {
                var $popover = jq('.maxui-popover:visible').animate({
                    opacity: 0
                }, 300);
                $activity.css({
                    height: $activity.height(),
                    'min-height': 'auto'
                });
                $activity.animate({
                    height: 0,
                    opacity: 0
                }, 100, function(event) {
                    $activity.remove();
                    $popover.hide();
                });
            });
        });
        //Assign activity comment removal confirmation dialog toggle via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-delete-comment', function(event) {
            event.preventDefault();
            var $comment = jq(this).closest('.maxui-comment');
            var $dialog = $comment.find('.maxui-popover');
            if (!$dialog.is(':visible')) {
                jq('.maxui-popover').css({
                    opacity: 0
                }).hide();
                $dialog.show();
                $dialog.animate({
                    opacity: 1
                }, 300);
            } else {
                $dialog.animate({
                    opacity: 0
                }, 300);
                jq('.maxui-popover').css({
                    opacity: 0
                }).hide();
            }
        });
        //Assign activity comment removal confirmation dialog via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-comment .maxui-button-cancel', function(event) {
            event.preventDefault();
            var $popover = jq('.maxui-popover').css({
                opacity: 0
            });
            $popover.hide();
        });
        //Assign activity comment removal via delegating the click to the activities container
        jq('#maxui-activities').on('click', '.maxui-comment .maxui-button-delete', function(event) {
            event.preventDefault();
            var $comment = jq(this).closest('.maxui-comment');
            var $activity = $comment.closest('.maxui-activity');
            var activityid = $activity.attr('id');
            var commentid = $comment.attr('id');
            maxui.maxClient.removeActivityComment(activityid, commentid, function() {
                var $popover = jq('.maxui-popover').animate({
                    opacity: 0
                }, 300);
                $comment.css({
                    height: $activity.height(),
                    'min-height': 'auto'
                });
                $comment.animate({
                    height: 0,
                    opacity: 0
                }, 100, function(event) {
                    $comment.remove();
                    $popover.hide();
                });
            });
        });
        jq('#maxui-activity-sort').on('click', 'a.maxui-sort-action.maxui-most-recent', function(event) {
            event.preventDefault();
            var $sortbutton = jq(this);
            if (!$sortbutton.hasClass('active')) {
                jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false);
                $sortbutton.toggleClass('active', true);
                maxui.printActivities({});
            }
        });
        jq('#maxui-activity-sort').on('click', 'a.maxui-sort-action.maxui-most-valued', function(event) {
            event.preventDefault();
            var $sortbutton = jq(this);
            if (!$sortbutton.hasClass('active')) {
                jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false);
                $sortbutton.toggleClass('active', true);
                maxui.printActivities({
                    sortBy: 'likes'
                });
            }
        });
        jq('#maxui-activity-sort').on('click', 'a.maxui-sort-action.maxui-flagged', function(event) {
            event.preventDefault();
            var $sortbutton = jq(this);
            if (!$sortbutton.hasClass('active')) {
                jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false);
                $sortbutton.toggleClass('active', true);
                maxui.printActivities({
                    sortBy: 'flagged'
                });
            }
        });
        // **************************************************************************************
        //                    add people predicting
        // **************************************************************************************
        var selector = '.maxui-text-input';
        jq('#maxui-add-people-box').on('focusin', selector, function(event) {
            event.preventDefault();
            var text = jq(this).val();
            var literal = jq(this).attr('data-literal');
            var normalized = maxui.utils.normalizeWhiteSpace(text, false);
            if (normalized === literal) {
                jq(this).val('');
            }
        }).on('keydown', selector, function(event) {
            if (jq('#maxui-conversation-predictive:visible').length > 0 && (event.which === 40 || event.which === 38 || event.which === 13 || event.which === 9)) {
                maxui.utils.freezeEvent(event);
            }
        }).on('keyup', selector, function(event) {
            event.preventDefault();
            event.stopPropagation();
            var text = jq(this).val();
            var normalized = maxui.utils.normalizeWhiteSpace(text, false);
            if (normalized === '') {
                jq(this).attr('class', 'maxui-empty maxui-text-input');
                jq(this).removeAttr('title');
            } else {
                if (maxui.settings.canwrite) {
                    jq(this).attr('class', 'maxui-text-input');
                }
            }
            var key = event.which;
            var matchMention = new RegExp('^\\s*([\\u00C0-\\u00FC\\w\\. ]+)\\s*');
            var match = text.match(matchMention);
            var matchMentionEOL = new RegExp('^\\s*([\\u00C0-\\u00FC\\w\\. ]+)\\s*$');
            var matchEOL = text.match(matchMentionEOL);
            var $selected = jq('#maxui-conversation-predictive .maxui-prediction.selected');
            var $area = jq(this);
            var $predictive = jq('#maxui-conversation-predictive');
            var num_predictions = $predictive.find('.maxui-prediction').length;
            var is_predicting = jq('#maxui-conversation-predictive:visible').length > 0;
            // Up & down
            if (key === 40 && is_predicting && num_predictions > 1) {
                var $next = $selected.next();
                $selected.removeClass('selected');
                if ($next.length > 0) {
                    $next.addClass('selected');
                } else {
                    $selected.siblings(':first').addClass('selected');
                }
            } else if (key === 38 && is_predicting && num_predictions > 1) {
                var $prev = $selected.prev();
                $selected.removeClass('selected');
                if ($prev.length > 0) {
                    $prev.addClass('selected');
                } else {
                    $selected.siblings(':last').addClass('selected');
                }
            } else if (key === 27) {
                $predictive.hide();
            } else if ((key === 13 || key === 9) && is_predicting) {
                var username = $selected.attr('data-username');
                var displayname = $selected.attr('data-displayname');
                maxui.addPerson({
                    'username': username,
                    'displayName': displayname
                });
                $predictive.hide();
                $area.val('').focus();
            } else //1
            {
                if (maxui.settings.conversationsSection === 'conversations') {
                    if (match) {
                        $area.attr('class', 'maxui-text-input');
                        if (matchEOL) {
                            $predictive.show();
                            $predictive.html('<ul></ul>');
                            maxui.printPredictions(match[1], '#maxui-conversation-predictive');
                        }
                    } else {
                        $predictive.hide();
                        $area.attr('class', 'maxui-empty maxui-text-input');
                        if (!text.match(new RegExp('^\\s*@'))) {
                            $area.attr('class', 'maxui-text-input error');
                            $area.attr('title', maxui.settings.literals.post_permission_not_here);
                        }
                    }
                }
            } //1
        }).on('focusout', selector, function(event) {
            event.preventDefault();
            var text = jq(this).val();
            var literal = jq(this).attr('data-literal');
            var normalized = maxui.utils.normalizeWhiteSpace(text, false);
            if (normalized === '') {
                jq(this).val(literal);
            }
        });
        // **************************************************************************************
        //Assign Activity post action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-newactivity', '#maxui-newactivity-box', {}, function(text, media) {
            if (maxui.settings.UISection === 'timeline') {
                maxui.sendActivity(text, media);
                jq('#maxui-search').toggleClass('folded', true);
            } else if (maxui.settings.UISection === 'conversations') {
                if (maxui.settings.conversationsSection === 'conversations') {
                    var participants_box = jq('#maxui-new-participants')[0];
                    var participants = [];
                    for (var i = 0; i < participants_box.people.length; i++) {
                        participants.push(participants_box.people[i].username);
                    }
                    var message = jq('#maxui-newactivity textarea').val();
                    var options = {
                        participants: participants,
                        message: message
                    };
                    if (participants.length > 1) {
                        var displayName = jq('#maxui-add-people-box #maxui-new-displayName input').val();
                        options.displayName = displayName;
                    }
                    maxui.conversations.create(options);
                } else {
                    maxui.conversations.send(text, media);
                }
            }
        }, function(text, area, button, ev) {
            var key = ev.which;
            var matchMention = new RegExp('^\\s*@([\\w\\.]+)\\s*');
            var match = text.match(matchMention);
            var matchMentionEOL = new RegExp('^\\s*@([\\w\\.]+)\\s*$');
            var matchEOL = text.match(matchMentionEOL);
            var $selected = jq('#maxui-newactivity .maxui-prediction.selected');
            var $area = jq(area);
            var $predictive = jq('#maxui-newactivity #maxui-predictive');
            var num_predictions = $predictive.find('.maxui-prediction').length;
            var is_predicting = jq('#maxui-newactivity #maxui-predictive:visible').length > 0;
            // Up & down
            if (key === 40 && is_predicting && num_predictions > 1) {
                var $next = $selected.next();
                $selected.removeClass('selected');
                if ($next.length > 0) {
                    $next.addClass('selected');
                } else {
                    $selected.siblings(':first').addClass('selected');
                }
            } else if (key === 38 && is_predicting && num_predictions > 1) {
                var $prev = $selected.prev();
                $selected.removeClass('selected');
                if ($prev.length > 0) {
                    $prev.addClass('selected');
                } else {
                    $selected.siblings(':last').addClass('selected');
                }
            } else if (key === 27) {
                $predictive.hide();
            } else if ((key === 13 || key === 9) && is_predicting) {
                var matchMention2 = new RegExp('^\\s*@([\\w\\.]+)');
                var replacement = text.replace(matchMention2, '@' + $selected.text() + ' ');
                $predictive.hide();
                $area.val(replacement).focus();
            } else if (text === '') {
                if (maxui.settings.UISection === 'timeline') {
                    jq(button).val(maxui.settings.literals.new_activity_post);
                }
            } else //1
            {
                if (maxui.settings.UISection === 'timeline') {
                    if (match) {
                        jq(button).val(maxui.settings.literals.new_message_post);
                        if (matchEOL) {
                            $predictive.show();
                            $predictive.html('<ul></ul>');
                            maxui.printPredictions(match[1], '#maxui-newactivity #maxui-predictive');
                        }
                        jq(button).removeAttr('disabled');
                        jq(button).attr('class', 'maxui-button');
                        $area.attr('class', 'maxui-text-input');
                    } else {
                        jq(button).val(maxui.settings.literals.new_activity_post);
                        $predictive.hide();
                        if (!text.match(new RegExp('^\\s*@')) && !maxui.settings.canwrite) {
                            $area.attr('class', 'maxui-text-input error');
                            $area.attr('title', maxui.settings.literals.post_permission_unauthorized);
                        }
                    }
                } else if (maxui.settings.UISection === 'conversations') {
                    if (maxui.settings.conversationsSection === 'conversations') {
                        maxui.reloadPersons();
                    } else if (maxui.settings.conversationsSection === 'messages') {
                        $predictive.hide();
                        jq(button).removeAttr('disabled');
                        jq(button).attr('class', 'maxui-button');
                        $area.attr('class', 'maxui-text-input');
                    }
                } //elseif
            } //1
        }); //function;
        //Assign Commentbox send comment action And textarea behaviour
        maxui.bindActionBehaviour('#maxui-activities', '.maxui-newcommentbox', {}, function(text) {
            var activityid = jq(this).closest('.maxui-activity').attr('id');
            maxui.maxClient.addComment(text, activityid, function() {
                jq('#activityContainer textarea').val('');
                var activity_id = this.object.inReplyTo[0].id;
                maxui.printCommentsForActivity(activity_id);
                jq('#' + activity_id + ' .maxui-newcommentbox textarea').val('');
                jq('#' + activity_id + ' .maxui-newcommentbox .maxui-button').attr('disabled', 'disabled');
            });
        });
        //Assign Search box search action And input behaviour
        maxui.bindActionBehaviour('#maxui-search', '#maxui-search-box', {}, function(text) {
            maxui.textSearch(text);
            jq('#maxui-search').toggleClass('folded', false);
            jq('#maxui-search-text').val('');
        });
        // // Execute search if <enter> pressed
        // jq('#maxui-search .maxui-text-input').keyup(function(e) {
        //           if (e.keyCode === 13) {
        //              maxui.textSearch(jq(this).attr('value'))
        //              jq('#maxui-search').toggleClass('folded',false)
        //           }
        // });
    };
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
        var maxui = this;
        var selector = target + ' .maxui-text-input';
        var extra_bind = null;
        if (arguments.length > 4) {
            extra_bind = arguments[4];
        }
        jq(delegate).on('focusin', selector, function(event) {
            event.preventDefault();
            var text = jq(this).val();
            var literal = jq(this).attr('data-literal');
            var normalized = maxui.utils.normalizeWhiteSpace(text, false);
            if (normalized === literal) {
                jq(this).val('');
            }
        }).on('keydown', selector, function(event) {
            if (jq(delegate + ' #maxui-predictive:visible').length > 0 && (event.which === 40 || event.which === 38 || event.which === 13 || event.which === 9)) {
                maxui.utils.freezeEvent(event);
            } else if (event.which === 13 && event.shiftKey === false && !options.ignore_button && !jq(this).is("textarea")) {
                event.preventDefault();
                var $area = jq(this).parent().find('.maxui-text-input');
                var literal = $area.attr('data-literal');
                var text = $area.val();
                var normalized = maxui.utils.normalizeWhiteSpace(text, false);
                if (normalized !== literal & normalized !== '') {
                    clickFunction.apply(this, [text]);
                }
            }
        }).on('keyup', selector, function(event) {
            event.preventDefault();
            event.stopPropagation();
            var text = jq(this).val();
            var button = jq(this).parent().parent().find('.maxui-button');
            var normalized = maxui.utils.normalizeWhiteSpace(text, false);
            if (normalized === '' && !options.ignore_button) {
                jq(button).attr('disabled', 'disabled');
                jq(button).attr('class', 'maxui-button maxui-disabled');
                jq(this).attr('class', 'maxui-empty maxui-text-input');
                jq(this).removeAttr('title');
            } else {
                if (maxui.settings.canwrite && !options.ignore_button) {
                    jq(button).removeAttr('disabled');
                    jq(button).attr('class', 'maxui-button');
                    jq(this).attr('class', 'maxui-text-input');
                }
            }
            if (extra_bind !== null) {
                extra_bind(text, this, button, event);
            }
        }).on('paste', selector, function(event) {
            var button = jq(this).parent().parent().find('.maxui-button');
            if (maxui.settings.canwrite && !options.ignore_button) {
                jq(button).removeAttr('disabled');
                jq(button).attr('class', 'maxui-button');
                jq(this).attr('class', 'maxui-text-input');
            }
            var text = jq(this).val();
            if (extra_bind !== null) {
                extra_bind(text, this, button, event);
            }
        }).on('focusout', selector, function(event) {
            event.preventDefault();
            var text = jq(this).val();
            var literal = jq(this).attr('data-literal');
            var normalized = maxui.utils.normalizeWhiteSpace(text, false);
            if (normalized === '') {
                jq(this).val(literal);
            }
            /*        }).on('mousedown', selector, function(event) {
                        event.preventDefault();
                        if (event.which == 3) {
                            debugger
                        }*/
        }).on('click', target + ' .maxui-button', function(event) {
            event.preventDefault();
            var media;
            media = undefined;
            var file = document.getElementById('maxui-file').files[0];
            if (file !== undefined) {
                media = file;
            } else {
                var image = document.getElementById('maxui-img').files[0];
                if (image !== undefined) {
                    media = image;
                }
            }
            var $area = jq(this).parent().find('.maxui-text-input');
            var literal = $area.attr('data-literal');
            var text = $area.val();
            var normalized = maxui.utils.normalizeWhiteSpace(text, false);
            if ((normalized !== literal & normalized !== '') || options.empty_click) {
                clickFunction.apply(this, [text, media]);
                jq('#maxui-file').value = "";
                jq('#maxui-img').value = "";
                jq("#maxui-newactivity-box > .upload-img").removeClass('label-disabled');
                jq("#maxui-img").prop("disabled", false);
                jq("#maxui-newactivity-box > .upload-file").removeClass('label-disabled');
                jq("#maxui-file").prop("disabled", false);
            }
        });
    };
    /**
     *    Updates the search filters with a new collection of keywords/hashtags extracted of
     *    a user-entered text, and reloads the search query. Identifies special characters
     *    at the first position of each keyword to identify keyword type
     *
     *    @param {String} text    A string containing whitespace-separated keywords/#hashtags
     **/
    jq.fn.textSearch = function(text) {
        var maxui = this;
        //Normalize spaces
        var normalized = maxui.utils.normalizeWhiteSpace(text);
        var keywords = normalized.split(' ');
        for (var kw = 0; kw < keywords.length; kw++) {
            var kwtype = 'keyword';
            var keyword = keywords[kw];
            switch (keyword[0]) {
                case '#':
                    kwtype = 'hashtag';
                    keyword = keyword.substr(1);
                    break;
                case '@':
                    kwtype = 'actor';
                    keyword = keyword.substr(1);
                    break;
                default:
                    kwtype = 'keyword';
                    break;
            }
            if (keyword.length >= 3) {
                this.addFilter({
                    type: kwtype,
                    value: keyword
                }, false);
            }
        }
        this.reloadFilters();
    };
    /**
     *    Prepares a object with the current active filters
     *
     *    @param {String} (optional)    A string containing the id of the last activity loaded
     **/
    jq.fn.getFilters = function() {
        var maxui = this;
        var params = {
            filters: maxui.filters
        };
        if (params.filters === undefined) {
            params.filters = [];
        }
        var filters = {};
        // group filters
        var enableSearchToggle = false;
        for (var f = 0; f < params.filters.length; f++) {
            var filter = params.filters[f];
            // Enable toggle button only if there's at least one visible filter
            if (filter.visible) {
                enableSearchToggle = true;
            }
            if (!filters[filter.type]) {
                filters[filter.type] = [];
            }
            filters[filter.type].push(filter.value);
        }
        // Accept a optional parameter indicating search start point
        if (arguments.length > 0) {
            filters.before = arguments[0];
        }
        return {
            filters: filters,
            visible: enableSearchToggle
        };
    };
    /**
     *    Reloads the current filters UI and executes the search, optionally starting
     *    at a given point of the timeline
     *
     *    @param {String} (optional)    A string containing the id of the last activity loaded
     **/
    jq.fn.reloadFilters = function() {
        var maxui = this;
        var filters;
        var params = {
            filters: maxui.filters
        };
        var activity_items = maxui.templates.filters.render(params);
        jq('#maxui-search-filters').html(activity_items);
        // Accept a optional parameter indicating search start point
        if (arguments.length > 0) {
            filters = maxui.getFilters(arguments[0]);
        } else {
            filters = maxui.getFilters();
        }
        maxui.printActivities({});
        //Enable or disable filter toogle if there are visible filters defined (or not)
        jq('#maxui-search').toggleClass('folded', !filters.visible);
    };
    /**
     *    Adds a new filter to the search if its not present
     *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
     **/
    jq.fn.delFilter = function(filter) {
        var maxui = this;
        var deleted = false;
        for (var i = 0; i < maxui.filters.length; i++) {
            if (maxui.filters[i].value === filter.value & maxui.filters[i].type === filter.type) {
                deleted = true;
                maxui.filters.splice(i, 1);
            }
        }
        if (deleted) {
            this.reloadFilters();
        }
    };
    /**
     *    Adds a new filter to the search if its not present
     *    @param {Object} filter    An object repesenting a filter, with the keys "type" and "value"
     **/
    jq.fn.addFilter = function(filter) {
        var maxui = this;
        var reload = true;
        //Reload or not by func argument
        if (arguments.length > 1) {
            reload = arguments[1];
        }
        if (!maxui.filters) {
            maxui.filters = [];
        }
        // show filters bu default unless explicitly specified on filter argument
        if (!filter.hasOwnProperty('visible')) {
            filter.visible = true;
        }
        switch (filter.type) {
            case "hashtag":
                filter.prepend = '#';
                break;
            case "actor":
                filter.prepend = '@';
                break;
            default:
                filter.prepend = '';
                break;
        }
        var already_filtered = false;
        for (var i = 0; i < maxui.filters.length; i++) {
            if (maxui.filters[i].value === filter.value & maxui.filters[i].type === filter.type) {
                already_filtered = true;
            }
        }
        if (!already_filtered) {
            maxui.filters.push(filter);
            if (reload === true) {
                this.reloadFilters();
            }
        }
    };
    /**
     *    Reloads the current filters UI and executes the search, optionally starting
     *    at a given point of the timeline
     *
     *    @param {String} (optional)    A string containing the id of the last activity loaded
     **/
    jq.fn.reloadPersons = function() {
        var maxui = this;
        var $participants_box = jq('#maxui-new-participants');
        var participants_box = $participants_box[0];
        if (!participants_box.people) {
            participants_box.people = [];
        }
        var $button = jq('#maxui-newactivity input.maxui-button');
        var $newmessagebox = jq('#maxui-newactivity');
        var message = $newmessagebox.find('textarea').val();
        var placeholder = $newmessagebox.find('textarea').attr('data-literal');
        message = maxui.utils.normalizeWhiteSpace(message);
        var $newdisplaynamebox = jq('#maxui-add-people-box #maxui-new-displayName');
        var displayName = $newdisplaynamebox.find('input').val();
        displayName = maxui.utils.normalizeWhiteSpace(displayName);
        var params = {
            persons: participants_box.people
        };
        var participants_items = maxui.templates.participants.render(params);
        jq('#maxui-new-participants').html(participants_items);
        jq('#maxui-add-people-box .maxui-label .maxui-count').text('({0}/{1})'.format(participants_box.people.length + 1, maxui.settings.maximumConversations));
        if (participants_box.people.length > 0) {
            var has_more_than_one_participant = participants_box.people.length > 1;
            var has_a_displayname = displayName !== '';
            if (has_more_than_one_participant && !has_a_displayname) {
                $button.attr('disabled', 'disabled');
                $button.attr('class', 'maxui-button maxui-disabled');
                if (displayName === '') {
                    $newmessagebox.find('textarea').attr('class', 'maxui-text-input error');
                    $newmessagebox.find('.maxui-error-box').text(maxui.settings.literals.post_permission_missing_displayName);
                    $newmessagebox.find('.maxui-error-box').width($newmessagebox.find('textarea').width() - 4);
                    $newmessagebox.find('.maxui-error-box').animate({
                        'bottom': -25
                    }, 200);
                }
            } else {
                $button.removeAttr('disabled');
                $button.attr('class', 'maxui-button');
                $newmessagebox.find('textarea').attr('class', 'maxui-text-input');
                $newmessagebox.find('.maxui-error-box').width($newmessagebox.find('textarea').width() - 4);
                $newmessagebox.find('.maxui-error-box').animate({
                    'bottom': 0
                }, 200);
            }
            $participants_box.show();
            $newmessagebox.show();
            if (participants_box.people.length > 1) {
                $newdisplaynamebox.show();
            } else {
                $newdisplaynamebox.hide();
                $newdisplaynamebox.find('.maxui-text-input').val('');
            }
        } else if (message !== '' && message !== placeholder) {
            $button.attr('disabled', 'disabled');
            $button.attr('class', 'maxui-button maxui-disabled');
            $participants_box.hide();
            $newmessagebox.find('textarea').attr('class', 'maxui-text-input error');
            $newmessagebox.find('.maxui-error-box').text(maxui.settings.literals.post_permission_not_enough_participants);
            $newmessagebox.find('.maxui-error-box').width($newmessagebox.find('textarea').width() - 4);
            $newmessagebox.find('.maxui-error-box').animate({
                'bottom': -25
            }, 200);
            $newdisplaynamebox.hide();
            $newdisplaynamebox.find('.maxui-text-input').val('');
        }
    };
    /**
     *    Removes a person from the list of new conversation
     *    @param {String} person    A String representing a user's username
     **/
    jq.fn.delPerson = function(person) {
        var deleted = false;
        var participants_box = jq('#maxui-new-participants')[0];
        for (var i = 0; i < participants_box.people.length; i++) {
            if (participants_box.people[i].username === person.username) {
                deleted = true;
                participants_box.people.splice(i, 1);
            }
        }
        if (deleted) {
            this.reloadPersons();
        }
    };
    /**
     *    Adds a new person to the list of new conversation
     *    @param {String} person    A String representing a user's username
     **/
    jq.fn.addPerson = function(person) {
        var maxui = this;
        var participants_box = jq('#maxui-new-participants')[0];
        var reload = true;
        //Reload or not by func argument
        if (arguments.length > 1) {
            reload = arguments[1];
        }
        var already_filtered = false;
        if (!participants_box.people) {
            participants_box.people = [];
        }
        if (person.username !== maxui.settings.username && participants_box.people.length < (maxui.settings.maximumConversations - 1)) {
            for (var i = 0; i < participants_box.people.length; i++) {
                if (participants_box.people[i].username === person.username) {
                    already_filtered = true;
                }
            }
            if (!already_filtered) {
                participants_box.people.push(person);
                if (reload === true) {
                    this.reloadPersons();
                }
            }
        }
    };
    /**
     *    Toggles between main sections
     **/
    jq.fn.toggleSection = function(sectionToEnable) {
        var maxui = this;
        var textarea_literal;
        var $search = jq('#maxui-search');
        var $activitysort = jq('#maxui-activity-sort');
        var $timeline = jq('#maxui-timeline');
        var $timeline_wrapper = jq('#maxui-timeline .maxui-wrapper');
        var $conversations = jq('#maxui-conversations');
        var $common_header = jq('#maxui-common-header');
        var $conversations_user_input = $conversations.find('input#add-user-input');
        var $conversations_list = jq('#maxui-conversations #maxui-conversations-list');
        var $conversations_wrapper = jq('#maxui-conversations .maxui-wrapper');
        var $postbutton = jq('#maxui-newactivity-box .maxui-button');
        var $subscriptionsSelect = jq('#maxui-newactivity-box #maxui-subscriptions');
        var $postbox = jq('#maxui-newactivity');
        var $postbox_text = jq('#maxui-newactivity-box textarea');
        var $conversationsbutton = jq('#maxui-show-conversations');
        var $timelinebutton = jq('#maxui-show-timeline');
        var $addpeople = jq('#maxui-add-people-box');
        // Real width of the widget, without the two 1-pixel borders;
        var widgetWidth = jq("#menusup").length === 1 ? jq("#menusup").width() - 30 : maxui.width();
        var sectionPadding = 10;
        var widgetBorder = 1;
        var sectionsWidth = widgetWidth - maxui.conversations.scrollbar.width - (sectionPadding * 2) - (widgetBorder * 2);
        var height = 320;
        if (sectionToEnable === 'conversations' && maxui.settings.currentConversationSection === 'conversations') {
            $subscriptionsSelect.attr('style', 'display:none;');
            $conversations.show();
            $common_header.removeClass('maxui-showing-messages').addClass('maxui-showing-conversations');
            $addpeople.show();
            $conversations_user_input.focus();
            $conversations.animate({
                'height': height
            }, 400, function(event) {
                $conversations_wrapper.height(height);
            });
            $conversations_list.width(sectionsWidth);
            $timeline.animate({
                'height': 0
            }, 400);
            $search.hide(400);
            $activitysort.hide(400);
            maxui.settings.UISection = 'conversations';
            $postbutton.val(maxui.settings.literals.new_message_post);
            textarea_literal = maxui.settings.literals.new_conversation_text;
            $postbox_text.val(textarea_literal).attr('data-literal', textarea_literal);
            $conversationsbutton.hide();
            if (!maxui.settings.disableTimeline) {
                $timelinebutton.show();
            }
            maxui.conversations.scrollbar.setHeight(height - 75);
            maxui.conversations.scrollbar.setTarget('#maxui-conversations #maxui-conversations-list');
            $postbox.show();
        }
        if (sectionToEnable === 'timeline') {
            if (maxui.settings.showSubscriptionList === true) {
                $subscriptionsSelect.attr('style', 'display:inline;');
            }
            maxui.conversations.listview.toggle();
            $timeline.show();
            var timeline_height = $timeline_wrapper.height();
            $timeline.animate({
                'height': timeline_height
            }, 400, function(event) {
                $timeline.css('height', '');
            });
            $conversations.animate({
                'height': 0
            }, 400, function(event) {
                $conversations.hide();
                $addpeople.hide();
            });
            $search.show(400);
            $activitysort.show(400);
            maxui.settings.UISection = 'timeline';
            $postbutton.val(maxui.settings.literals.new_activity_post);
            textarea_literal = maxui.settings.literals.new_activity_text;
            $postbox_text.val(textarea_literal).attr('data-literal', textarea_literal);
            if (!maxui.settings.disableConversations) {
                $conversationsbutton.show();
            }
            $timelinebutton.hide();
            if (maxui.settings.hidePostboxOnTimeline) {
                $postbox.hide();
            }
            if (maxui.hidePostbox()) {
                $postbox.hide();
            }
        }
    };
    /**
     *    Returns the current settings of the plugin
     **/
    jq.fn.Settings = function() {
        var maxui = this;
        return maxui.settings;
    };
    /**
     *    Sends a post when user clicks `post activity` button with
     *    the current contents of the `maxui-newactivity` textarea
     **/
    jq.fn.sendActivity = function(text, media) {
        var maxui = this;
        text = jq('#maxui-newactivity textarea').val();
        var func_params = [];
        // change to recent view before posting
        jq('#maxui-activity-sort .maxui-sort-action.active').toggleClass('active', false);
        jq('#maxui-activity-sort .maxui-sort-action.maxui-most-recent').toggleClass('active', true);
        func_params.push(text);
        func_params.push(maxui.settings.writeContexts);
        func_params.push(function() {
            jq('#maxui-newactivity textarea').val('');
            jq('#maxui-newactivity .maxui-button').attr('disabled', 'disabled');
            var first = jq('.maxui-activity:first');
            if (first.length > 0) {
                var filter = {
                    after: first.attr('id')
                };
                maxui.printActivities(filter);
            } else {
                maxui.printActivities({});
            }
        });
        //Pass generator to activity post if defined
        if (maxui.settings.generatorName) {
            func_params.push(maxui.settings.generatorName);
        }
        if (media) {
            func_params.push(media);
        }
        var activityAdder = maxui.maxClient.addActivity;
        activityAdder.apply(maxui.maxClient, func_params);
        jq("#preview").empty();
        jq("#maxui-img").val("");
        jq("#maxui-file").val("");
        jq('#maxui-subscriptions option:first-child').attr("selected", "selected");
    };
    /**
     *    Loads more activities from max posted earlier than
     *    the oldest loaded activity
     **/
    jq.fn.loadMoreActivities = function() {
        var maxui = this;
        var lastActivity = jq('.maxui-activity:last').attr('id');
        if (jq('#maxui-activity-sort .maxui-sort-action.maxui-most-recent').hasClass('active')) {
            if (jq("#" + lastActivity + " .maxui-comment").length > 0) {
                lastActivity = jq("#" + lastActivity + " .maxui-comment:last").attr('id');
            }
        }
        var filter = {
            before: lastActivity
        };
        maxui.printActivities(filter);
    };
    /** PG
     *    Loads news activities from max posted earlier than
     *    the oldest loaded activity
     **/
    jq.fn.loadNewsActivities = function() {
        var maxui = this;
        maxui.printActivities();
    };
    /**
     *    Renders the conversations list of the current user, defined in settings.username
     **/
    jq.fn.printPredictions = function(query, predictive_selector) {
        var maxui = this;
        var func_params = [];
        func_params.push(query);
        func_params.push(function(items) {
            maxui.formatPredictions(items, predictive_selector);
        });
        var userListRetriever = this.maxClient.getUsersList;
        userListRetriever.apply(this.maxClient, func_params);
    };
    /**
     *
     *
     **/
    jq.fn.formatPredictions = function(items, predictive_selector) {
        var maxui = this;
        // String to store the generated html pieces of each conversation item
        var predictions = '';
        // Iterate through all the conversations
        for (var i = 0; i < items.length; i++) {
            var prediction = items[i];
            if (prediction.username !== maxui.username) {
                var avatar_url = maxui.settings.avatarURLpattern.format(prediction.username);
                var params = {
                    username: prediction.username,
                    displayName: prediction.displayName,
                    avatarURL: avatar_url,
                    cssclass: 'maxui-prediction' + (i === 0 && ' selected' || '')
                };
                // Render the conversations template and append it at the end of the rendered covnersations
                predictions = predictions + maxui.templates.predictive.render(params);
            }
        }
        if (predictions === '') {
            predictions = '<li>' + maxui.settings.literals.no_match_found + '</li>';
        }
        jq(predictive_selector + ' ul').html(predictions);
        if (arguments.length > 2) {
            var callback = arguments[2];
            callback();
        }
    };
    /**
     *
     *
     **/
    jq.fn.canCommentActivity = function(url) {
        var maxui = this;
        for (var i in maxui.settings.subscriptionsWrite) {
            var hash = maxui.settings.subscriptionsWrite[i].hash;
            if (hash === url) {
                return true;
            }
        }
        return false;
    };
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
        var activities = '';
        // Iterate through all the activities
        var images_to_render = [];
        for (var i = 0; i < items.length; i++) {
            var activity = items[i];
            // Take first context (if exists) to display in the 'published on' field
            // XXX TODO Build a coma-separated list of contexts ??
            var contexts = null;
            if (activity.hasOwnProperty('contexts')) {
                if (activity.contexts.length > 0) {
                    contexts = activity.contexts[0];
                }
            }
            // Take generator property (if exists) and set it only if it's different
            // from the application name defined in settings
            var generator = null;
            if (activity.hasOwnProperty('generator')) {
                if (activity.generator !== maxui.settings.generatorName) {
                    generator = activity.generator;
                }
            }
            // Prepare avatar image url depending on actor type
            var avatar_url = '';
            if (activity.actor.objectType === 'person') {
                avatar_url = maxui.settings.avatarURLpattern.format(activity.actor.username);
            } else if (activity.actor.objectType === 'context') {
                avatar_url = maxui.settings.contextAvatarURLpattern.format(activity.actor.hash);
            }
            // Take replies (if exists) and format to be included as a formatted
            // subobject ready for hogan
            var replies = [];
            var lastComment = '';
            if (activity.replies) {
                if (activity.replies.length > 0) {
                    for (var r = 0; r < activity.replies.length; r++) {
                        var comment = activity.replies[r];
                        var reply = {
                            id: comment.id,
                            actor: comment.actor,
                            date: maxui.utils.formatDate(comment.published, maxui.language),
                            text: maxui.utils.formatText(comment.content),
                            avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username),
                            canDeleteComment: comment.deletable,
                            literals: maxui.settings.literals
                        };
                        replies.push(reply);
                    }
                    lastComment = 'Comentat ' + replies[replies.length - 1].date;
                }
            }
            // Take all the latter properties and join them into an object
            // containing all the needed params to render the template
            _.defaults(activity.object, {
                filename: activity.id
            });
            var canCommentActivity = maxui.settings.canwrite;
            if (activity.contexts) {
                canCommentActivity = maxui.canCommentActivity(activity.contexts[0].url);
            }
            var likesUsernames = [];
            for (var like in activity.likes) {
                likesUsernames.push(activity.likes[like].username);
            }
            var params = {
                id: activity.id,
                actor: activity.actor,
                auth: {
                    'token': maxui.settings.oAuthToken,
                    'username': maxui.settings.username
                },
                literals: maxui.settings.literals,
                date: maxui.utils.formatDate(activity.published, maxui.language),
                dateLastComment: lastComment,
                text: maxui.utils.formatText(activity.object.content),
                replies: replies,
                favorited: activity.favorited,
                likes: activity.likesCount ? activity.likesCount : 0,
                showLikesCount: maxui.currentSortOrder === 'likes',
                showLikes: maxui.settings.showLikes,
                liked: activity.liked,
                likesUsernames: likesUsernames.join('\n'),
                flagged: activity.flagged,
                avatarURL: avatar_url,
                maxServerURL: maxui.settings.maxServerURL,
                publishedIn: contexts,
                canDeleteActivity: activity.deletable,
                canFlagActivity: maxui.settings.canflag,
                via: generator,
                fileDownload: activity.object.objectType === 'file',
                filename: activity.object.filename,
                portalURL: window.PORTAL_URL,
                canViewComments: canCommentActivity || activity.replies.length > 0,
                canWriteComment: canCommentActivity
            };
            // Render the activities template and append it at the end of the rendered activities
            // partials is used to render each comment found in the activities
            var partials = {
                comment: maxui.templates.comment
            };
            activities = activities + maxui.templates.activity.render(params, partials);
            if (activity.object.objectType === 'image') {
                images_to_render.push(activity);
            }
        }
        // Prepare animation and insert activities at the top of activity stream
        if (insertAt === 'beggining') {
            // Load all the activities in a overflow-hidden div to calculate the height
            jq('#maxui-preload .maxui-wrapper').prepend(activities);
            var ritems = jq('#maxui-preload .maxui-wrapper .maxui-activity');
            var heightsum = 0;
            for (i = 0; i < ritems.length; i++) {
                heightsum += jq(ritems[i]).height() + 18;
            }
            // Move the hidden div to be hidden on top of the last activity and behind the main UI
            var currentPreloadHeight = jq('#maxui-preload').height();
            jq('#maxui-preload').height(heightsum - currentPreloadHeight);
            jq('#maxui-preload').css({
                "margin-top": (heightsum - currentPreloadHeight) * -1
            });
            // Animate it to appear sliding on the bottom of the main UI
            jq('#maxui-preload').animate({
                "margin-top": 0
            }, 200, function() {
                // When the animation ends, move the new activites to its native container
                jq('#maxui-preload .maxui-wrapper').html("");
                jq('#maxui-activities').prepend(activities);
                if (items.length === 1) {
                    if (activity.object.objectType === 'image') {
                        maxui.maxClient.getMessageImage('/activities/{0}/image/thumb'.format(activity.id), function(encoded_image_data) {
                            var imagetag = '<img class="maxui-embedded fullImage" alt="" src="data:image/png;base64,{0}" />'.format(encoded_image_data);
                            jq('.maxui-activity#{0} .maxui-activity-message .maxui-body'.format(activity.id)).after(imagetag);
                            jq('.maxui-activity#{0} .maxui-activity-message img.fullImage'.format(activity.id)).on('click', function() {
                                maxui.maxClient.getMessageImage(activity.object.fullURL, function(encoded_image_data) {
                                    var image = new Image();
                                    image.src = "data:image/png;base64," + encoded_image_data;
                                    var w = window.open("");
                                    w.document.write(image.outerHTML);
                                });
                            });
                        });
                    }
                }
                jq('#maxui-preload').height(0);
            });
        }
        // Insert at the end
        else if (insertAt === 'end') {
            jq('#maxui-activities').append(activities);
        }
        // Otherwise, replace everything
        else {
            jq('#maxui-activities').html(activities);
        }
        // if Has a callback, execute it
        if (arguments.length > 2) {
            arguments[2].call();
        }
        _.each(images_to_render, function(activity, index, list) {
            maxui.maxClient.getMessageImage('/activities/{0}/image/thumb'.format(activity.id), function(encoded_image_data) {
                var imagetag = '<img class="maxui-embedded fullImage" alt="" src="data:image/png;base64,{0}" />'.format(encoded_image_data);
                jq('.maxui-activity#{0} .maxui-activity-message .maxui-body'.format(activity.id)).after(imagetag);
                jq('.maxui-activity#{0} .maxui-activity-message img.fullImage'.format(activity.id)).on('click', function() {
                    maxui.maxClient.getMessageImage(activity.object.fullURL, function(encoded_image_data) {
                        var image = new Image();
                        image.src = "data:image/png;base64," + encoded_image_data;
                        var w = window.open("");
                        w.document.write(image.outerHTML);
                    });
                });
            });
        });
    };
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
        var maxui = this;
        var comments = '';
        for (var i = 0; i < items.length; i++) {
            var comment = items[i];
            var params = {
                literals: maxui.settings.literals,
                id: comment.id,
                actor: comment.actor,
                date: maxui.utils.formatDate(comment.published, maxui.language),
                text: maxui.utils.formatText(comment.content),
                avatarURL: maxui.settings.avatarURLpattern.format(comment.actor.username),
                portalURL: window.PORTAL_URL,
                canDeleteComment: comment.deletable
            };
            // Render the comment template and append it at the end of the rendered comments
            comments = comments + maxui.templates.comment.render(params);
        }
        // Insert new comments by replacing previous comments with all comments
        jq('.maxui-activity#' + activity_id + ' .maxui-commentsbox').html(comments);
        // Update comment count
        var comment_count = jq('.maxui-activity#' + activity_id + ' .maxui-commentaction strong');
        jq(comment_count).text(parseInt(jq(comment_count).text(), 10) + 1);
    };
    /**
     *    Renders the postbox
     **/
    jq.fn.renderPostbox = function() {
        var maxui = this;
        // Render the postbox UI if user has permission
        var showCT = maxui.settings.UISection === 'conversations';
        var toggleCT = maxui.settings.disableConversations === false && !showCT;
        var params = {
            avatar: maxui.settings.avatarURLpattern.format(maxui.settings.username),
            allowPosting: maxui.settings.canwrite,
            buttonLiteral: maxui.settings.literals.new_activity_post,
            textLiteral: maxui.settings.literals.new_activity_text,
            imgLiteral: maxui.settings.literals.new_img_post,
            fileLiteral: maxui.settings.literals.new_file_post,
            literals: maxui.settings.literals,
            showConversationsToggle: toggleCT ? 'display:block;' : 'display:none;',
            showSubscriptionList: maxui.settings.showSubscriptionList && maxui.settings.subscriptionsWrite.length > 0,
            subscriptionList: maxui.settings.subscriptionsWrite
        };
        var postbox = maxui.templates.postBox.render(params);
        var $postbox = jq('#maxui-newactivity');
        $postbox.html(postbox);
        jq('#maxui-newactivity-box .maxui-file-image').on('change', function(event) {
            event.preventDefault();
            if (event.target.files.length > 0) {
                if (event.target.files[0].size > 50000000) {
                    alert("El archivo no debe superar los 50MB");
                    jq("#maxui-img").val("");
                    jq("#maxui-file").val("");
                } else {
                    var name = event.target.files[0].name;
                    var size = (event.target.files[0].size / 1000).toFixed(1);
                    var html;
                    if (event.target.id === "maxui-img") {
                        html = "<div class=\"preview-box\"><div class=\"preview-icon-img\"><span class=\"preview-title\">{0}</span><p>{1} KB</p><i class=\"fa fa-times\"></i></div></div>".format(name, size);
                    } else {
                        html = "<div class=\"preview-box\"><div class=\"preview-icon-file\"><span class=\"preview-title\">{0}</span><p>{1} KB</p><i class=\"fa fa-times\"></i></div></div>".format(name, size);
                    }
                    jq("#maxui-newactivity-box > .upload-file").addClass("label-disabled");
                    jq("#maxui-file").prop("disabled", true);
                    jq("#maxui-newactivity-box > .upload-img").addClass("label-disabled");
                    jq("#maxui-img").prop("disabled", true);
                    jq("#preview").prepend(html);
                    jq('#maxui-newactivity-box .fa-times').on('click', function(event) {
                        jq("#preview").empty();
                        jq("#maxui-img").val("");
                        jq("#maxui-file").val("");
                        jq("#maxui-newactivity-box > .upload-img").removeClass("label-disabled");
                        jq("#maxui-img").prop("disabled", false);
                        jq("#maxui-newactivity-box > .upload-file").removeClass("label-disabled");
                        jq("#maxui-file").prop("disabled", false);
                        var input = jq('#maxui-newactivity .maxui-text-input');
                        if (input.val() === "" || input.val() === input.data('literal')) {
                            jq('#maxui-newactivity .maxui-button').attr('disabled', 'disabled');
                        }
                    });
                }
            }
        });
        //Add to writeContexts selected subscription to post in it.
        jq('#maxui-subscriptions').on('change', function() {
            var $urlContext = jq('#maxui-subscriptions :selected').val();
            if ($urlContext !== 'timeline') {
                maxui.settings.writeContexts = [];
                maxui.settings.writeContextsHashes = [];
                // Add read context to write contexts
                maxui.settings.writeContexts.push($urlContext);
                // Store the hashes of the write contexts
                for (var wc = 0; wc < maxui.settings.writeContexts.length; wc++) {
                    maxui.settings.writeContextsHashes.push(maxui.utils.sha1(maxui.settings.writeContexts[wc]));
                }
            } else {
                maxui.settings.writeContexts = [];
                maxui.settings.writeContextsHashes = undefined;
            }
        });
    };
    /**
     *    Renders the timeline of the current user, defined in settings.username
     **/
    jq.fn.printActivities = function(ufilters) {
        // save a reference to the container object to be able to access it
        // from callbacks defined in inner levels
        var maxui = this;
        var func_params = [];
        var insert_at = 'replace';
        // Get current defined filters and update with custom
        var filters = maxui.getFilters().filters;
        jq.extend(filters, ufilters);
        if (filters.before) {
            insert_at = 'end';
        }
        if (filters.after) {
            insert_at = 'beggining';
        }
        if (!filters.sortBy) {
            if (jq('#maxui-activity-sort .maxui-sort-action.maxui-most-valued').hasClass('active')) {
                filters.sortBy = 'likes';
            } else if (jq('#maxui-activity-sort .maxui-sort-action.maxui-flagged').hasClass('active')) {
                filters.sortBy = 'flagged';
            } else {
                filters.sortBy = maxui.settings.activitySortOrder;
            }
        }
        maxui.currentSortOrder = filters.sortBy;
        var activityRetriever = null;
        if (maxui.settings.activitySource === 'timeline') {
            activityRetriever = this.maxClient.getUserTimeline;
            func_params.push(maxui.settings.username);
        } else if (maxui.settings.activitySource === 'activities') {
            activityRetriever = this.maxClient.getActivities;
            var options = {
                context: maxui.settings.readContextHash,
                tags: maxui.settings.contextTagsFilter
            };
            func_params.push(options);
        }
        if (arguments.length > 1) {
            var callback = arguments[1];
            func_params.push(function(items) {
                maxui.settings.showLikes = window._MAXUI.showLikes;
                // Determine write permission, granted by default if we don't find a restriction
                maxui.settings.canwrite = true;
                // If we don't have a context, we're in timeline, so we can write
                if (maxui.settings.activitySource === 'activities') {
                    maxui.maxClient.getContext(maxui.settings.readContextHash, function(context) {
                        // Add read context if user is not subscribed to it
                        var subscriptions = maxui.settings.subscriptions;
                        if (!subscriptions[context.hash]) {
                            subscriptions[context.hash] = {};
                            subscriptions[context.hash].permissions = {};
                            // Check only for public defaults, as any other permission would require
                            // a susbcription, that we already checked that doesn't exists
                            subscriptions[context.hash].permissions.read = context.permissions.read === 'public';
                            subscriptions[context.hash].permissions.write = context.permissions.write === 'public';
                        }
                        // Iterate through all the defined write contexts to check for write permissions on
                        // the current user
                        for (var wc = 0; wc < maxui.settings.writeContexts.length; wc++) {
                            var write_context = maxui.settings.writeContextsHashes[wc];
                            if (subscriptions[write_context].permissions) {
                                if (subscriptions[write_context].permissions.write !== true) {
                                    maxui.settings.canwrite = false;
                                }
                                if (subscriptions[write_context].permissions.flag === true) {
                                    maxui.settings.canflag = true;
                                } else {
                                    maxui.settings.canflag = false;
                                }
                            } else {
                                maxui.settings.canwrite = false;
                                maxui.settings.canflag = false;
                            }
                        }
                        maxui.renderPostbox();
                        // format the result items as activities
                        maxui.formatActivities(items, insert_at, callback);
                    });
                } else {
                    maxui.renderPostbox(items, insert_at, callback);
                    // format the result items as activities
                    maxui.formatActivities(items, insert_at, callback);
                }
            });
        } else {
            func_params.push(function(items) {
                maxui.formatActivities(items, insert_at);
            });
        }
        // if passed as param, assume an object with search filtering params
        // one or all of [limit, before, after, hashtag]
        func_params.push(filters);
        activityRetriever.apply(this.maxClient, func_params);
    };
    /**
     *    Renders the timeline of the current user, defined in settings.username
     **/
    jq.fn.printCommentsForActivity = function(activity_id) {
        var maxui = this;
        var func_params = [];
        func_params.push(activity_id);
        func_params.push(function(data) {
            maxui.formatComment(data, activity_id);
        });
        this.maxClient.getCommentsForActivity.apply(this.maxClient, func_params);
    };
    jq.maxui = function() {};
    jq.maxui.settings = function() {
        return this.settings;
    };
}(jQuery));


;

//
// Loader function for max.ui.js
//
// The timeout is set to assure that the code will be invoked at the end of the file load
// This snippet also assures that maxui will be instantiated only once.
// This snippet assumes that a _MAXUI.onReady function is defined by the api consumer and calls it as a final step
// of async loading of the maxui main file.
// In the example.js file lives the code that the api consumer has to insert in the host application
//
'use strict';
window.setTimeout(function() {
    if (window._MAXUI && window._MAXUI.onReady && !window._MAXUI.hasRun) {
        window._MAXUI.hasRun = true;
        _MAXUI.onReady();
    }
}, 0);
