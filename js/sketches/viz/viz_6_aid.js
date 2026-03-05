(function () {
    window.Viz6Aid = {
        // Data & UI
        table6: null,

        // controls
        instSelect: null,
        lengthSelect: null,
        aidSelect: null,
        dollarSelect: null,

        // state
        controlsCreated: false,
        lastFilters: null,
        currentDataset: [],

        draw: function (p, manager, ai, progress) {
            p.push();

            // SAFETY: check dataset loaded on manager
            if (!manager.table6 || manager.table6.getRowCount() === 0) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Loading Financial Aid Data...", manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            // create controls once
            if (!this.controlsCreated) {
                this.createControls(p, manager);
                this.controlsCreated = true;
            }

            // dispatch section change event for visibility like other modules
            document.dispatchEvent(new CustomEvent('sectionChange', { detail: { activeIndex: manager.state ? manager.state.activeIndex : -1 } }));

            // update filtered data if needed
            this.handleResetVisState(manager);

            // draw chart or "no data"
            if (this.currentDataset.length > 0) {
                this.renderChart(p, manager);
            } else {
                p.fill(100);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("No data found for selection.", manager.width / 2, manager.height / 2);
            }

            p.pop();
        },

        // -------------------------
        // Controls
        // -------------------------
        createControls: function (p, manager) {
            let container = p.select('#vis');
            if (!container) {
                console.error("Viz6Aid: could not find #vis");
                return;
            }

            let controls = p.createDiv('').id('viz6-controls');
            controls.parent(container);
            controls.style('position', 'absolute');
            controls.style('top', '10px');
            controls.style('left', '10px');
            controls.style('background', 'rgba(255,255,255,0.95)');
            controls.style('padding', '12px');
            controls.style('border-radius', '8px');
            controls.style('z-index', '1000');
            controls.style('border', '1px solid #ccc');
            controls.style('font-family', 'Arial, sans-serif');
            controls.style('font-size', '13px');

            // Institution Type
            controls.child(p.createSpan('Institution: '));
            this.instSelect = p.createSelect();
            this.instSelect.option('All institutions', 'All institutions');
            this.instSelect.option('Public', 'Public');
            this.instSelect.option('Private nonprofit', 'Private nonprofit');
            this.instSelect.option('Private for-profit', 'Private for-profit');
            this.instSelect.selected('All institutions');
            controls.child(this.instSelect);
            controls.child(p.createElement('br'));

            // Length (Overall/4-year/2-year)
            controls.child(p.createSpan('Length: '));
            this.lengthSelect = p.createSelect();
            this.lengthSelect.option('Overall', 'Overall');
            this.lengthSelect.option('4-year', '4-year');
            this.lengthSelect.option('2-year', '2-year');
            this.lengthSelect.selected('Overall');
            controls.child(this.lengthSelect);
            controls.child(p.createElement('br'));

            // Aid Type
            controls.child(p.createSpan('Aid Type: '));
            this.aidSelect = p.createSelect();
            this.aidSelect.option('Federal grants', 'Federal grants');
            this.aidSelect.option('State/local grants and scholarships', 'State/local grants and scholarships');
            this.aidSelect.option('Institutional grants and scholarships', 'Institutional grants and scholarships');
            this.aidSelect.option('Student loans\\2\\', 'Student loans\\2\\'); // match the odd label if exists
            this.aidSelect.selected('Federal grants');
            controls.child(this.aidSelect);
            controls.child(p.createElement('br'));

            // Dollar Type
            controls.child(p.createSpan('Dollar type: '));
            this.dollarSelect = p.createSelect();
            this.dollarSelect.option('Raw dollar amount', 'Raw dollar amount');
            this.dollarSelect.option('Inflation Adjusted', 'Inflation Adjusted');
            this.dollarSelect.selected('Inflation Adjusted');
            controls.child(this.dollarSelect);
            controls.child(p.createElement('br'));

            // hide/show based on sectionChange (same pattern in repo)
            document.addEventListener('sectionChange', function (e) {
                let controlsDiv = document.getElementById('viz6-controls');
                if (controlsDiv) {
                    controlsDiv.style.display = (e.detail.activeIndex === 5) ? 'block' : 'none';
                    // NOTE: default index. If your section index is different, change 5 to the right index.
                }
            });

            // change handlers simply trigger re-render next draw
            const that = this;
            this.instSelect.changed(() => { that.lastFilters = null; });
            this.lengthSelect.changed(() => { that.lastFilters = null; });
            this.aidSelect.changed(() => { that.lastFilters = null; });
            this.dollarSelect.changed(() => { that.lastFilters = null; });
        },

        // -------------------------
        // Data filtering
        // -------------------------
        handleResetVisState: function (manager) {
            if (!manager.table6) return;

            // collect current filter values
            const institution = this.instSelect ? this.instSelect.selected() : 'All institutions';
            const length = this.lengthSelect ? this.lengthSelect.selected() : 'Overall';
            const aid = this.aidSelect ? this.aidSelect.selected() : 'Federal grants';
            const dollar = this.dollarSelect ? this.dollarSelect.selected() : 'Inflation Adjusted';

            const filtersKey = JSON.stringify({ institution, length, aid, dollar });

            // only refilter if changed
            if (this.lastFilters === filtersKey && this.currentDataset.length > 0) return;

            this.lastFilters = filtersKey;
            this.currentDataset = [];

            // Normalize column name mapping using first row's keys
            const rows = manager.table6.getRows();
            if (!rows || rows.length === 0) return;

            // Create a mapping from normalized name -> actual key present in row.obj
            const sampleObj = rows[0].obj;
            const keyMap = {};
            Object.keys(sampleObj).forEach(k => {
                const norm = k.toString().trim().toLowerCase().replace(/[\s\-_\\\/]+/g, '');
                keyMap[norm] = k;
            });

            // Helper to get value from row by logical names
            const getRowVal = (row, logical) => {
                const norm = logical.trim().toLowerCase().replace(/[\s\-_\\\/]+/g, '');
                const realKey = keyMap[norm];
                if (realKey === undefined) {
                    // try contains
                    const found = Object.keys(keyMap).find(k => k.includes(norm) || norm.includes(k));
                    if (found) return row.obj[keyMap[found]];
                    return undefined;
                }
                return row.obj[realKey];
            };

            // Filter rows using fuzzy matching on values (case-insensitive, trim)
            this.currentDataset = rows.filter(row => {
                const rInst = (getRowVal(row, 'Institution Type') || '').toString().trim();
                const rLength = (getRowVal(row, 'Length') || '').toString().trim();
                const rAid = (getRowVal(row, 'Aid Type') || '').toString().trim();
                const rDollar = (getRowVal(row, 'Dollar type') || '').toString().trim();

                const okInst = rInst.toLowerCase() === institution.toLowerCase();
                const okLen = rLength.toLowerCase() === length.toLowerCase();
                // aid type may have slight formatting differences; check contains
                const okAid = rAid.toLowerCase().indexOf(aid.toLowerCase()) !== -1 || aid.toLowerCase().indexOf(rAid.toLowerCase()) !== -1;
                const okDollar = rDollar.toLowerCase().indexOf(dollar.toLowerCase()) !== -1 || dollar.toLowerCase().indexOf(rDollar.toLowerCase()) !== -1;

                return okInst && okLen && okAid && okDollar;
            }).map(row => {
                // Map each row to a normalized JS object for convenience when drawing
                return {
                    year: +getRowVal(row, 'year'),
                    number_enrolled: Number(getRowVal(row, 'Number enrolled')) || null,
                    number_awarded: Number(getRowVal(row, 'Number awarded financial aid')) || null,
                    percent_awarded: Number(getRowVal(row, 'Percent awarded aid')) || null,
                    avg_award: Number(getRowVal(row, 'Average award for students in aid programs')) || null
                };
            }).filter(r => r.year && (r.avg_award !== null && !isNaN(r.avg_award)));

            // sort by year
            this.currentDataset.sort((a, b) => a.year - b.year);

            // debugging
            console.log('Viz6Aid: filtered rows', this.currentDataset.length);
        },

        // -------------------------
        // Chart rendering
        // -------------------------
        renderChart: function (p, manager) {
            // layout
            const margin = { top: 150, right: 120, bottom: 70, left: 90 };
            const width = manager.width || p.width;
            const height = manager.height || p.height;
            const chartW = width - margin.left - margin.right;
            const chartH = height - margin.top - margin.bottom;
            const startX = margin.left;
            const startY = margin.top;

            // extract arrays
            const years = [...new Set(this.currentDataset.map(d => d.year))].sort((a, b) => a - b);
            const avgValues = years.map(y => {
                const row = this.currentDataset.find(r => r.year === y);
                return row ? row.avg_award : null;
            });
            const pctValues = years.map(y => {
                const row = this.currentDataset.find(r => r.year === y);
                return row ? row.percent_awarded : null;
            });

            // compute left (dollars) nice scale
            const maxAvg = Math.max(...avgValues.filter(v => v !== null && !isNaN(v)));
            const leftTicks = this._niceTicks(maxAvg, 5); // array of tick values
            const leftMax = leftTicks[leftTicks.length - 1];

            // compute right (percent) nice scale (0..100-ish)
            const maxPct = Math.max(...pctValues.filter(v => v !== null && !isNaN(v)));
            const rightTicks = this._niceTicks(Math.max(maxPct, 10), 5, true); // allow small
            const rightMax = rightTicks[rightTicks.length - 1];

            // mapping functions
            const mapX = (year) => {
                const minYear = years[0];
                const maxYear = years[years.length - 1];
                return p.map(year, minYear, maxYear, startX + 10, startX + chartW - 10);
            };
            const mapYLeft = (val) => p.map(val, 0, leftMax, startY + chartH, startY);
            const mapYRight = (val) => p.map(val, 0, rightMax, startY + chartH, startY);

            // background
            p.push();
            p.fill(255);
            p.noStroke();
            p.rect(0, 0, width, height);
            p.pop();

            // title
            p.fill(0);
            p.textAlign(p.CENTER);
            p.textSize(16);
            p.textStyle(p.BOLD);
            p.text("First-time students receiving financial aid and average amount awarded: 2000-2022",
                startX + chartW / 2,
                startY - 15);
            p.textStyle(p.NORMAL);
            p.textSize(12);

            // axes
            p.stroke(80);
            p.strokeWeight(1);
            // x axis line
            p.line(startX, startY + chartH, startX + chartW, startY + chartH);

            // left axis line
            p.line(startX, startY, startX, startY + chartH);

            // right axis line
            p.line(startX + chartW, startY, startX + chartW, startY + chartH);

            // left ticks & labels
            p.noStroke();
            p.fill(0);
            p.textAlign(p.RIGHT);
            p.textSize(11);
            for (let i = 0; i < leftTicks.length; i++) {
                const v = leftTicks[i];
                const y = mapYLeft(v);
                // tick line
                p.stroke(200);
                p.line(startX - 6, y, startX + chartW, y);
                p.noStroke();
                p.text(this._formatDollar(v), startX - 10, y + 4);
            }

            // right ticks & labels (percent)
            p.textAlign(p.LEFT);
            for (let i = 0; i < rightTicks.length; i++) {
                const v = rightTicks[i];
                const y = mapYRight(v);
                p.fill(0);
                p.text(v + '%', startX + chartW + 35, y + 4);
                // optional small tick
                p.stroke(200);
                p.line(startX + chartW, y, startX + chartW + 6, y);
                p.noStroke();
            }

            // x axis ticks (years) every 2 or 5 depending on range
            p.textAlign(p.CENTER);
            const yrStep = years.length > 20 ? 4 : (years.length > 10 ? 2 : 1);
            for (let i = 0; i < years.length; i++) {
                const yv = years[i];
                if (i % yrStep === 0 || i === years.length - 1 || i === 0) {
                    const x = mapX(yv);
                    p.noStroke();
                    p.fill(0);
                    p.text(yv, x, startY + chartH + 20);
                    p.stroke(160);
                    p.line(x, startY + chartH, x, startY + chartH + 5);
                }
            }

            // draw bars (avg award) - grey-blue
            const barColor = p.color(120, 150, 170); // grey-blue
            const barWidth = Math.max(6, (chartW / Math.max(1, years.length)) * 0.6);

            p.noStroke();
            years.forEach((yr, idx) => {
                const val = avgValues[idx];
                if (val === null || isNaN(val)) return;
                const x = mapX(yr);
                const y = mapYLeft(val);
                p.fill(barColor);
                p.rectMode(p.CENTER);
                // draw from baseline
                p.rect(x, (startY + chartH + y) / 2, barWidth, Math.abs(startY + chartH - y));
            });

            // draw line (percent awarded) - red
            p.noFill();
            p.stroke(220, 60, 60);
            p.strokeWeight(2.5);
            p.beginShape();
            years.forEach((yr, idx) => {
                const v = pctValues[idx];
                if (v === null || isNaN(v)) return;
                p.vertex(mapX(yr), mapYRight(v));
            });
            p.endShape();

            // draw line points
            p.fill(220, 60, 60);
            p.noStroke();
            years.forEach((yr, idx) => {
                const v = pctValues[idx];
                if (v === null || isNaN(v)) return;
                p.circle(mapX(yr), mapYRight(v), 5);
            });

            // small legend inside chart (top-right)
            p.noStroke();
            p.fill(0);
            p.textAlign(p.LEFT);
            const legendX = startX + chartW - 160;
            let ly = startY + 6;
            // bar legend
            p.fill(barColor);
            p.rect(legendX, ly + 6, 24, 10);
            p.fill(0);
            p.textSize(12);
            p.text('Average award (dollars)', legendX + 30, ly + 12);
            ly += 20;
            // line legend
            p.fill(220, 60, 60);
            p.rect(legendX, ly + 6, 24, 3);
            p.fill(0);
            p.text('Percent awarded aid', legendX + 30, ly + 12);

            // bottom label for x axis
            p.textAlign(p.CENTER);
            p.textSize(12);
            p.text('Year', startX + chartW / 2, startY + chartH + 45);

            // left axis label (rotated)
            p.push();
            p.translate(startX - 60, startY + chartH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER);
            p.text('Average award for students in aid programs (USD)', 0, 0);
            p.pop();

            // right axis label
            p.push();
            p.translate(startX + chartW + 75, startY + chartH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER);
            p.text('Percent awarded aid (%)', 0, 0);
            p.pop();
        },

        // -------------------------
        // Utilities
        // -------------------------
        _formatDollar: function (val) {
            // Format with commas and $ rounded to integer
            if (val >= 1000) {
                return '$' + (Math.round(val)).toLocaleString();
            } else {
                return '$' + (Math.round(val)).toLocaleString();
            }
        },

        // returns an array of "nice" tick values from 0 -> niceMax (inclusive)
        // if percentMode true then ticks are integers (for percent)
        _niceTicks: function (maxVal, targetTicks = 5, percentMode = false) {
            // handle small
            if (!isFinite(maxVal) || maxVal <= 0) return [0, 1];

            const exponent = Math.floor(Math.log10(maxVal));
            const base = Math.pow(10, exponent);

            // possible nice multipliers
            const multiples = [1, 2, 5, 10];
            let niceMax = base;
            let step = base;

            for (let m of multiples) {
                step = base * m;
                const ticks = Math.ceil(maxVal / step) + 1;
                if (ticks <= targetTicks + 1) {
                    niceMax = step * Math.ceil(maxVal / step);
                    break;
                }
            }
            // if still too small, expand
            if (niceMax < maxVal) {
                niceMax = base * multiples[multiples.length - 1] * Math.ceil(maxVal / (base * multiples[multiples.length - 1]));
            }

            // determine reasonable tick step using division into ~targetTicks
            let rawStep = niceMax / targetTicks;
            // choose nice step 1,2,5 * 10^k
            const exp2 = Math.floor(Math.log10(rawStep));
            const b2 = Math.pow(10, exp2);
            const candidates = [1, 2, 5, 10].map(m => m * b2);
            let finalStep = candidates.find(c => c >= rawStep) || candidates[candidates.length - 1];

            // if percentMode, prefer integer steps
            if (percentMode) {
                finalStep = Math.max(1, Math.round(finalStep));
            }

            // build ticks array: 0, step, 2*step, ... up to >= maxVal
            const ticks = [];
            for (let v = 0; v <= finalStep * (targetTicks + 1); v += finalStep) {
                ticks.push(percentMode ? Math.round(v) : Math.round(v));
                if (v >= maxVal && ticks.length >= 2) break;
            }

            // ensure last tick >= maxVal
            const last = ticks[ticks.length - 1];
            if (last < maxVal) {
                ticks.push(percentMode ? Math.ceil(maxVal) : Math.ceil(maxVal));
            }
            // dedupe & return sorted
            return Array.from(new Set(ticks)).sort((a, b) => a - b);
        }
    };
})();