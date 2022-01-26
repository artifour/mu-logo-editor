const MLE = (function () {
    class Color {
        /**
         * @param {number} code
         * @param {string} hex
         * @param {string} name
         */
        constructor(code, hex, name) {
            this.code = code;
            this.hex = hex;
            this.name = name;
        }

        /**
         * @returns {boolean}
         */
        isNone() {
            return this.code === 0;
        }

        /**
         * @param {Color} color
         * @returns {boolean}
         */
        isEqual(color) {
            return this.code === color.code;
        }
    }

    const Colors = Object.freeze({
        None: new Color(0, '#fff', 'none'),
        Black: new Color(1, '#000', 'black'),
        Grey: new Color(2, '#808080', 'grey'),
        White: new Color(3, '#fff', 'white'),
        Red: new Color(4, '#f00', 'red'),
        Orange: new Color(5, '#ff8000', 'orange'),
        Yellow: new Color(6, '#ff0', 'yellow'),
        Chartreuse: new Color(7, '#80ff00', 'chartreuse'),
        Green: new Color(8, '#0f0', 'green'),
        SpringGreen: new Color(9, '#00ff80', 'spring-green'),
        Aqua: new Color(0xA, '#00ffff', 'aqua'),
        DodgerBlue: new Color(0xB, '#0080ff', 'dodger-blue'),
        Blue: new Color(0xC, '#00f', 'blue'),
        Indigo: new Color(0xD, '#8000ff', 'indigo'),
        Fuchsia: new Color(0xE, '#f0f', 'fuchsia'),
        DarkPink: new Color(0xF, '#ff0080', 'dark-pink'),

        /**
         * @param {string} code
         * @returns Colors
         */
        getByCode: function (code) {
            code = parseInt(`0x${code}`);
            for (let key of this.getKeys()) {
                if (Colors[key].code === code) {
                    return Colors[key];
                }
            }

            return Colors.None;
        },

        /**
         * @param {string} name
         * @returns {Color}
         */
        getByName: function (name) {
            for (let key of this.getKeys()) {
                if (Colors[key].name === name) {
                    return Colors[key];
                }
            }

            return Colors.None;
        },

        /**
         * @returns {string[]}
         */
        getKeys: function () {
            return ['None', 'Black', 'Grey', 'White', 'Red', 'Orange', 'Yellow', 'Chartreuse', 'Green', 'SpringGreen',
                'Aqua', 'DodgerBlue', 'Blue', 'Indigo', 'Fuchsia', 'DarkPink'];
        }
    });

    const Base64 = Object.freeze({
        /**
         * @param {string} data
         * @returns {string}
         */
        encode: function (data) {
            const chars = data.match(/\w{2}/g).map(function(a) {
                return String.fromCharCode(parseInt(a, 16));
            }).join('');

            return btoa(chars);
        },

        /**
         * @param {string} base64
         * @returns {string}
         */
        decode: function (base64) {
            const chars = atob(base64);

            return chars.split('').map((c) => c.charCodeAt(0).toString(16).padStart(2, 0)).join('');
        },
    });

    class LogoCanvasPalette {
        /**
         * @param {HTMLElement} svgContainer
         * @param callback
         */
        constructor(svgContainer, lClickCallback, rClickCallback) {
            this.container = svgContainer;

            let i = 0;
            for (let key of Colors.getKeys()) {
                const x = i % 8;
                const y = ~~(i++ / 8);

                this._createPixel(x, y, Colors[key], lClickCallback, rClickCallback);
            }
        }

        /**
         * @param {number} x
         * @param {number} y
         * @param {Color} color
         * @param callback
         * @private
         */
        _createPixel(x, y, color, lClickCallback, rClickCallback) {
            const pixel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            pixel.setAttribute('x', x);
            pixel.setAttribute('y', y);
            pixel.setAttribute('height', '1');
            pixel.setAttribute('width', '1');
            pixel.classList.add(color.name);
            pixel.dataset.color = color.name;
            pixel.addEventListener('click', lClickCallback);
            pixel.addEventListener('contextmenu', rClickCallback);

            this.container.appendChild(pixel);
        }
    }

    class LogoCanvas {
        /**
         * @param {HTMLElement} svgContainer
         * @param {string|null} data
         * @param callback
         */
        constructor(svgContainer, data, callback) {
            this.container = svgContainer;
            this.hoverColor = Colors.Black;
            this.pixels = Array.from(Array(8), () => new Array(8));

            if (data && (data.length > 0)) {
                this._loadFromData(data, callback);
                return;
            }

            this._createBlank(callback);
        }

        /**
         * @param {number} x
         * @param {number} y
         * @returns {Color}
         */
        getPixelColor(x, y) {
            return this.pixels[x][y];
        }

        /**
         * @param {number} x
         * @param {number} y
         * @param {Color} color
         */
        setPixelColor(x, y, color) {
            const pixel = document.getElementById(`p${x}-${y}`);
            if (this.pixels[x][y]) {
                pixel.classList.remove(this.pixels[x][y].name);
            }

            this.pixels[x][y] = color;

            pixel.setAttribute('fill', color.hex);
            pixel.setAttribute('fill-opacity', color.isNone() ? 0 : 1);
            pixel.classList.add(color.name);
        }

        /**
         * @param {Color} color
         */
        setHoverColor(color) {
            this.container.classList.remove(this.hoverColor.name);
            this.hoverColor = color;
            this.container.classList.add(color.name);
        }

        /**
         * @returns {Color}
         */
        getMostFreqColor() {
            let colorsFreq = {};
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const color = this.pixels[x][y];

                    if (colorsFreq[color.name]) {
                        colorsFreq[color.name]++;
                    } else {
                        colorsFreq[color.name] = 1;
                    }
                }
            }

            let freqColorName = Colors.None.name;
            let colorFreq = 0;
            for (let colorName in colorsFreq) {
                if (colorsFreq[colorName] > colorFreq) {
                    freqColorName = colorName;
                    colorFreq = colorsFreq[colorName];

                    if (colorFreq >= 32) {
                        break;
                    }
                }
            }

            return Colors.getByName(freqColorName);
        }

        /**
         * @param {Color} colorFrom
         * @param {Color} colorTo
         */
        changeColor(colorFrom, colorTo) {
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    if (this.pixels[x][y].isEqual(colorFrom)) {
                        this.setPixelColor(x, y, colorTo);
                    }
                }
            }
        }

        /**
         * @returns {string}
         */
        getData() {
            let data = '';
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    data += this.pixels[x][y].code.toString(16);
                }
            }

            return data;
        }

        /**
         * @param {string} data
         * @param callback
         * @private
         */
        _loadFromData(data, callback) {
            if (!Array.isArray(data)) {
                data = data.split('');
            }

            if (data.length === 0) {
                this._createBlank(callback);
                return;
            }

            for (let i = 0; i < data.length; i++) {
                const x = i % 8;
                const y = ~~(i / 8);
                const color = Colors.getByCode(data[i]);

                this._createPixel(x, y, callback);
                this.setPixelColor(x, y, color);
            }
        }

        /**
         * @param callback
         * @private
         */
        _createBlank(callback) {
            for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    const color = Colors.None;
                    this._createPixel(x, y, callback);
                    this.setPixelColor(x, y, color);
                }
            }
        }

        /**
         * @param {number} x
         * @param {number} y
         * @param callback
         * @private
         */
        _createPixel(x, y, callback) {
            const pixel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            pixel.setAttribute('id', `p${x}-${y}`);
            pixel.setAttribute('x', x);
            pixel.setAttribute('y', y);
            pixel.setAttribute('height', '1');
            pixel.setAttribute('width', '1');
            pixel.addEventListener('click', callback);

            this.container.appendChild(pixel);
        }
    }

    const MuLogoEditor = {
        logoPaletteCanvas: null,
        logoCanvas: null,
        penColor: Colors.Black,

		/**
		 * @param {string} hash
		 */
        init: function (hash) {
            const canvas = document.getElementById('logo-canvas');
            const data = hash ? Base64.decode(hash) : null;
            this.logoCanvas = new LogoCanvas(canvas, data, function (event) {
                const x = event.target.getAttribute('x');
                const y = event.target.getAttribute('y');

                MuLogoEditor.drawPixel(x, y);
            });

            const canvasPalette = document.getElementById('logo-canvas-palette');
            new LogoCanvasPalette(canvasPalette, function (event) {
                const colorName = event.target.dataset.color;
                const color = Colors.getByName(colorName);

                MuLogoEditor.selectPenColor(color);
            }, function (event) {
                event.preventDefault();
                const colorName = event.target.dataset.color;
                const color = Colors.getByName(colorName);

                MuLogoEditor.fillColor(color);
            });
        },

        /**
         * @param {number} x
         * @param {number} y
         * @param {Color} color
         */
        drawPixel: function (x, y) {
        	this.logoCanvas.setPixelColor(x, y, this.penColor);
            this._updateHash();
        },

        /**
         * @param {Color} color
         */
        selectPenColor: function (color) {
            this.penColor = color;
            this.logoCanvas.setHoverColor(color);
        },

        /**
         * @param {Color} color
         */
        fillColor: function (color) {
            const bgColor = this.logoCanvas.getMostFreqColor();

            this.logoCanvas.changeColor(bgColor, color);

            this._updateHash();
        },

        /**
         * @private
         */
        _updateHash: function () {
            const data = this.logoCanvas.getData();

            location.hash = '#' + Base64.encode(data);
        }
    }

    const hash = location.hash.slice(1);
	MuLogoEditor.init(hash);

    return MuLogoEditor;
})();
