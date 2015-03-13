/* MIT license */
var convert = require("color-convert"),
    string = require("color-string");

var spaces = {
   "rgb": ["red", "green", "blue"],
   "hsl": ["hue", "saturation", "lightness"],
   "hsv": ["hue", "saturation", "value"],
   "hwb": ["hue", "whiteness", "blackness"],
   "cmyk": ["cyan", "magenta", "yellow", "black"]
};

var maxes = {
   "rgb": [255, 255, 255],
   "hsl": [360, 100, 100],
   "hsv": [360, 100, 100],
   "hwb": [360, 100, 100],
   "cmyk": [100, 100, 100, 100]
};

var freezeColor = function(mutableColor) {
   ['rgb', 'hsl', 'hsv', 'hwb', 'cmyk'].forEach(function(valName) {
      var x = mutableColor._values[valName];
      if (x) {
         Object.freeze(x);
      }
   }.bind(mutableColor));
   Object.freeze(mutableColor._values);
   return Object.freeze(mutableColor);
}

var cloneValues = function(s) {
   return {
      rgb: s.rgb.slice(),
      hsl: s.hsl.slice(),
      hsv: s.hsv.slice(),
      hwb: s.hwb.slice(),
      cmyk: s.cmyk.slice(),
      alpha: s.alpha
   }
}

var rotateDegrees = function(deg, angle) {
   deg = (deg + angle) % 360;
   return deg < 0 ? 360 + deg : deg;
}

var Color = function(obj, mod) {
   if (obj instanceof Color && !mod) return obj;
   if (! (this instanceof Color)) return new Color(obj, mod);

   if (obj instanceof Color) {
      this._values = cloneValues(obj._values);
      mod.bind(this)(this);
      return freezeColor(this);
   }

   this._values = {
      rgb: [0, 0, 0],
      hsl: [0, 0, 0],
      hsv: [0, 0, 0],
      hwb: [0, 0, 0],
      cmyk: [0, 0, 0, 0],
      alpha: 1
   }

   // parse Color() argument
   if (typeof obj == "string") {
      var vals = string.getRgba(obj);
      if (vals) {
         setColorValues(this, "rgb", vals);
      }
      else if(vals = string.getHsla(obj)) {
         setColorValues(this, "hsl", vals);
      }
      else if(vals = string.getHwb(obj)) {
         setColorValues(this, "hwb", vals);
      }
      else {
        throw new Error("Unable to parse color from string \"" + obj + "\"");
      }
   }
   else if (typeof obj == "object") {
      var vals = obj;
      if(vals["r"] !== undefined || vals["red"] !== undefined) {
         setColorValues(this, "rgb", vals)
      }
      else if(vals["l"] !== undefined || vals["lightness"] !== undefined) {
         setColorValues(this, "hsl", vals)
      }
      else if(vals["v"] !== undefined || vals["value"] !== undefined) {
         setColorValues(this, "hsv", vals)
      }
      else if(vals["w"] !== undefined || vals["whiteness"] !== undefined) {
         setColorValues(this, "hwb", vals)
      }
      else if(vals["c"] !== undefined || vals["cyan"] !== undefined) {
         setColorValues(this, "cmyk", vals)
      }
      else {
        throw new Error("Unable to parse color from object " + JSON.stringify(obj));
      }
   }

   if (mod) {
      mod.bind(this)(this);
   }
   return freezeColor(this);
}

Color.prototype = {
   rgb: function (vals) {
      return this.space("rgb", arguments);
   },
   hsl: function(vals) {
      return this.space("hsl", arguments);
   },
   hsv: function(vals) {
      return this.space("hsv", arguments);
   },
   hwb: function(vals) {
      return this.space("hwb", arguments);
   },
   cmyk: function(vals) {
      return this.space("cmyk", arguments);
   },

   rgbArray: function() {
      return this._values.rgb;
   },
   hslArray: function() {
      return this._values.hsl;
   },
   hsvArray: function() {
      return this._values.hsv;
   },
   hwbArray: function() {
      if (this._values.alpha !== 1) {
        return this._values.hwb.concat([this._values.alpha])
      }
      return this._values.hwb;
   },
   cmykArray: function() {
      return this._values.cmyk;
   },
   rgbaArray: function() {
      var rgb = this._values.rgb;
      return rgb.concat([this._values.alpha]);
   },
   hslaArray: function() {
      var hsl = this._values.hsl;
      return hsl.concat([this._values.alpha]);
   },
   alpha: function(val) {
      if (val === undefined) {
         return this._values.alpha;
      }
      return this.values("alpha", val);
   },

   red: function(val) {
      return this.channel("rgb", 0, val);
   },
   green: function(val) {
      return this.channel("rgb", 1, val);
   },
   blue: function(val) {
      return this.channel("rgb", 2, val);
   },
   hue: function(val) {
      return this.channel("hsl", 0, val);
   },
   saturation: function(val) {
      return this.channel("hsl", 1, val);
   },
   lightness: function(val) {
      return this.channel("hsl", 2, val);
   },
   saturationv: function(val) {
      return this.channel("hsv", 1, val);
   },
   whiteness: function(val) {
      return this.channel("hwb", 1, val);
   },
   blackness: function(val) {
      return this.channel("hwb", 2, val);
   },
   value: function(val) {
      return this.channel("hsv", 2, val);
   },
   cyan: function(val) {
      return this.channel("cmyk", 0, val);
   },
   magenta: function(val) {
      return this.channel("cmyk", 1, val);
   },
   yellow: function(val) {
      return this.channel("cmyk", 2, val);
   },
   black: function(val) {
      return this.channel("cmyk", 3, val);
   },

   hexString: function() {
      return string.hexString(this._values.rgb);
   },
   rgbString: function() {
      return string.rgbString(this._values.rgb, this._values.alpha);
   },
   rgbaString: function() {
      return string.rgbaString(this._values.rgb, this._values.alpha);
   },
   percentString: function() {
      return string.percentString(this._values.rgb, this._values.alpha);
   },
   hslString: function() {
      return string.hslString(this._values.hsl, this._values.alpha);
   },
   hslaString: function() {
      return string.hslaString(this._values.hsl, this._values.alpha);
   },
   hwbString: function() {
      return string.hwbString(this._values.hwb, this._values.alpha);
   },
   keyword: function() {
      return string.keyword(this._values.rgb, this._values.alpha);
   },

   rgbNumber: function() {
      return (this._values.rgb[0] << 16) | (this._values.rgb[1] << 8) | this._values.rgb[2];
   },

   luminosity: function() {
      // http://www.w3.org/TR/WCAG20/#relativeluminancedef
      var rgb = this._values.rgb;
      var lum = [];
      for (var i = 0; i < rgb.length; i++) {
         var chan = rgb[i] / 255;
         lum[i] = (chan <= 0.03928) ? chan / 12.92
                  : Math.pow(((chan + 0.055) / 1.055), 2.4)
      }
      return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
   },

   contrast: function(color2) {
      // http://www.w3.org/TR/WCAG20/#contrast-ratiodef
      var lum1 = this.luminosity();
      var lum2 = color2.luminosity();
      if (lum1 > lum2) {
         return (lum1 + 0.05) / (lum2 + 0.05)
      };
      return (lum2 + 0.05) / (lum1 + 0.05);
   },

   level: function(color2) {
     var contrastRatio = this.contrast(color2);
     return (contrastRatio >= 7.1)
       ? 'AAA'
       : (contrastRatio >= 4.5)
        ? 'AA'
        : '';
   },

   dark: function() {
      // YIQ equation from http://24ways.org/2010/calculating-color-contrast
      var rgb = this._values.rgb,
          yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      return yiq < 128;
   },

   light: function() {
      return !this.dark();
   },

   negate: function() {
      var rgb = []
      for (var i = 0; i < 3; i++) {
         rgb[i] = 255 - this._values.rgb[i];
      }
      return this.values("rgb", rgb);
   },

   lighten: function(ratio) {
      if (ratio === 0)
         return this;
      return this.modSpace("hsl", function(hsl) { return [hsl[0], hsl[1], hsl[2] * (1 + ratio)]; });
   },

   darken: function(ratio) {
      if (ratio === 0)
         return this;
      return this.modSpace("hsl", function(hsl) { return [hsl[0], hsl[1], hsl[2] * (1 - ratio)]; });
   },

   saturate: function(ratio) {
      if (ratio === 0)
         return this;
      return this.modSpace("hsl", function(hsl) { return [hsl[0], hsl[1] * (1 + ratio), hsl[2]]; });
   },

   desaturate: function(ratio) {
      if (ratio === 0)
         return this;
      return this.modSpace("hsl", function(hsl) { return [hsl[0], hsl[1] * (1 - ratio), hsl[2]]; });
   },

   whiten: function(ratio) {
      if (ratio === 0)
         return this;
      return this.modSpace("hwb", function(hwb) { return [hwb[0], hwb[1] * (1 + ratio), hwb[2]]; });
   },

   blacken: function(ratio) {
      if (ratio === 0)
         return this;
      return Color(this, function() {
         this._values.hwb[2] += this._values.hwb[2] * ratio;
         // TODO: is there a better way to cap and reify other spaces than this?
         setColorValues(this, "hwb", this._values.hwb);
      })
   },

   greyscale: function() {
      var rgb = this._values.rgb;
      // http://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale
      var val = rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11;
      return this.values("rgb", [val, val, val]);
   },

   clearer: function(ratio) {
      return this.values("alpha", this._values.alpha - (this._values.alpha * ratio));
   },

   opaquer: function(ratio) {
      return this.values("alpha", this._values.alpha + (this._values.alpha * ratio));
   },

   rotate: function(degrees) {
      if ((degrees % 360) === 0)
         return this;
      return this.modSpace("hsl", function(hsl) { return [rotateDegrees(hsl[0], degrees), hsl[1], hsl[2]]; });
   },

   mix: function(color2, weight) {
      weight = 1 - (weight == null ? 0.5 : weight);

      // algorithm from Sass's mix(). Ratio of first color in mix is
      // determined by the alphas of both colors and the weight
      var t1 = weight * 2 - 1,
          d = this.alpha() - color2.alpha();

      var weight1 = (((t1 * d == -1) ? t1 : (t1 + d) / (1 + t1 * d)) + 1) / 2;
      var weight2 = 1 - weight1;

      var rgb2 = color2.rgbArray();

      return Color(this, function() {
         var rgb = this.rgbArray();
         for (var i = 0; i < rgb.length; i++) {
            rgb[i] = rgb[i] * weight1 + rgb2[i] * weight2;
         }
         setColorValues(this, "rgb", rgb);
         var alpha = this.alpha() * weight + color2.alpha() * (1 - weight);
         setColorValues(this, "alpha", alpha);
      });
   },

   toJSON: function() {
     return this.rgb();
   },

   values: function(space, vals) {
      if (vals === undefined) {
         return this.getValues(space);
      }
      return Color(this, function() {
         setColorValues(this, space, vals);
      });
   },

   channel: function(space, index, val) {
      if (val === undefined) {
         // color.red()
         return this._values[space][index];
      }

      var m = Color(this, function() {
         setColorChannel(this, space, index, val);
      });
      return m;
   },

   space: function(space, args) {
      if (args === undefined || args[0] === undefined) {
         // color.rgb()
         return this.getValues(space);
      }
      return this.modSpace(space, function() { return args; });
   },

   // advanced functions
   modSpace: function(space, modfunc) {
      return Color(this, function() {
         setColorSpace(this, space, modfunc(this._values[space], this._values));
      })
   }

}


Color.prototype.getValues = function(space) {
   var vals = {};
   for (var i = 0; i < space.length; i++) {
      vals[space.charAt(i)] = this._values[space][i];
   }
   if (this._values.alpha != 1) {
      vals["a"] = this._values.alpha;
   }
   // {r: 255, g: 255, b: 255, a: 0.4}
   return vals;
}

var setColorValues = function(color, space, vals) {
   var alpha = 1;
   if (space == "alpha") {
      alpha = vals;
   }
   else if (vals.length) {
      // [10, 10, 10]
      color._values[space] = vals.slice(0, space.length);
      alpha = vals[space.length];
   }
   else if (vals[space.charAt(0)] !== undefined) {
      // {r: 10, g: 10, b: 10}
      for (var i = 0; i < space.length; i++) {
        color._values[space][i] = vals[space.charAt(i)];
      }
      alpha = vals.a;
   }
   else if (vals[spaces[space][0]] !== undefined) {
      // {red: 10, green: 10, blue: 10}
      var chans = spaces[space];
      for (var i = 0; i < space.length; i++) {
        color._values[space][i] = vals[chans[i]];
      }
      alpha = vals.alpha;
   }
   color._values.alpha = Math.max(0, Math.min(1, (alpha !== undefined ? alpha : color._values.alpha) ));
   if (space == "alpha") {
      return;
   }

   // cap values of the space prior converting all values
   for (var i = 0; i < space.length; i++) {
      var capped = Math.max(0, Math.min(maxes[space][i], color._values[space][i]));
      color._values[space][i] = Math.round(capped);
   }

   // convert to all the other color spaces
   for (var sname in spaces) {
      if (sname != space) {
         color._values[sname] = convert[space][sname](color._values[space])
      }

      // cap values
      for (var i = 0; i < sname.length; i++) {
         var capped = Math.max(0, Math.min(maxes[sname][i], color._values[sname][i]));
         color._values[sname][i] = Math.round(capped);
      }
   }
   return true;
}

var setColorSpace = function(color, space, args) {
   // color.rgb(10, 10, 10)
   var vals = args[0];
   if (typeof vals == "number") {
      vals = Array.prototype.slice.call(args);
   }
   setColorValues(color, space, vals);
   return color;
}

var setColorChannel = function(color, space, index, val) {
   // color.red(100)
   color._values[space][index] = val;
   setColorValues(color, space, color._values[space]);
   return color;
}

module.exports = Color;
