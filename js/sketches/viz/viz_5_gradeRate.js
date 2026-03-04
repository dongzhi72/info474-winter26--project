(function () {
    window.Viz5Grad = {
        // Data variable (must match the key used in your data manager)
        // Ensure your data loader assigns the CSV to manager.table5
        
        // UI Control variables
        sexSelect: null,
        controlSelect: null,

        // State variables to track changes
        lastSex: '',
        lastControl: '',
        currentDataset: [],
        controlsCreated: false,
        
        draw: function (p, manager) {
            p.push();

            // --- 1. SAFETY CHECK: Check if data is loaded ---
            if (!manager.table5) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Loading Graduation Data...", manager.width/2, manager.height/2);
                p.pop();
                return;
            }
            
            // --- 2. SETUP UI CONTROLS (Once) ---
            if (!this.controlsCreated) {
                this.createControls(p, manager);
                this.controlsCreated = true;
            }

            // --- 3. HANDLE UPDATING VIS STATE (Filtering) ---
            this.handleResetVisState(manager);

            // --- 4. RENDER THE CHART ---
            if (this.currentDataset.length > 0) {
                this.renderChart(p, manager);
            } else {
                p.fill(100);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("No data found for this selection.", manager.width / 2, manager.height / 2);
            }
            
            p.pop();
        },
        
        createControls: function(p, manager) {
            let container = p.select('#vis');
            if (!container) return;
            
            let controls = p.createDiv('').id('grad-controls');
            controls.parent(container); 
            controls.style('position', 'absolute');
            controls.style('top', '10px');
            controls.style('left', '10px');
            //controls.style('left', 'auto'); 
            controls.style('background', 'rgba(255,255,255,0.9)');
            controls.style('padding', '15px');
            controls.style('border-radius', '8px');
            controls.style('z-index', '1000'); 
            controls.style('border', '1px solid #ccc');

            // hide initially
            controls.style('display', 'none');

            // 1. Sex Dropdown
            controls.child(p.createSpan('Gender: '));
            this.sexSelect = p.createSelect();
            this.sexSelect.option('Total');
            this.sexSelect.option('Male');
            this.sexSelect.option('Female');
            this.sexSelect.selected('Total');
            controls.child(this.sexSelect);
            controls.child(p.createElement('br'));

            // 2. Institution Control Dropdown
            controls.child(p.createSpan('Institution: '));
            this.controlSelect = p.createSelect();
            this.controlSelect.option('All');
            this.controlSelect.option('Public');
            this.controlSelect.option('Private Nonprofit');
            this.controlSelect.option('Private For-profit');
            this.controlSelect.selected('All');
            controls.child(this.controlSelect);

            document.addEventListener('sectionChange', function(e) {
                let controlsDiv = document.getElementById('grad-controls');
                if (controlsDiv) {
                    controlsDiv.style.display = (e.detail.activeIndex === 6) ? 'block' : 'none';
                }
            });
        },

        handleResetVisState: function(manager) {
            const newSex = this.sexSelect.selected();
            const newControl = this.controlSelect.selected();

            // Only filter if selection changed
            if (newSex !== this.lastSex || newControl !== this.lastControl || this.currentDataset.length === 0) { 
                this.lastSex = newSex;
                this.lastControl = newControl;

                this.currentDataset = manager.table5.getRows().filter(row => {
                    return row.getString("Sex") === newSex &&
                           row.getString("Control") === newControl;
                });
            }
        },

        renderChart: function(p, manager) {
            const margin = { top: 90, right: 100, bottom: 80, left: 90 };
            const chartW = manager.width - margin.left - margin.right;
            const chartH = manager.height - margin.top - margin.bottom;
            const startX = margin.left;
            const startY = margin.top;

            // Organize data by race for separate lines
            let groups = {};
            let maxVal = 0;
            //let minYear = 2000;
            //let maxYear = 2019;

            this.currentDataset.forEach(row => {
                let r = row.getString("race");
                let year = row.getNum("Year");
                let rate = row.getNum("rate");

                if (!groups[r]) groups[r] = [];
                groups[r].push({x: year, y: rate});
                if (rate > maxVal) maxVal = rate;
            });

            let minYear = Infinity;
            let maxYear = -Infinity;

            this.currentDataset.forEach(row => {
                let year = row.getNum("Year");
                if (!isNaN(year)) {
                    if (year < minYear) minYear = year;
                    if (year > maxYear) maxYear = year;
                }
            });

            // Fallback safety (prevents crash if dataset empty)
            if (minYear === Infinity || maxYear === -Infinity) {
                minYear = 2000;
                maxYear = 2019;
            }
            const mapX = (year) => p.map(year, minYear, maxYear, startX, startX + chartW);
            const mapY = (val) => p.map(val, 0, 100, startY + chartH, startY);

            // --- Draw Axes ---
            p.stroke(180);
            p.line(startX, startY + chartH, startX + chartW, startY + chartH); // X
            p.line(startX, startY, startX, startY + chartH); // Y

            // --- Draw Lines ---
            const colors = { 
                'Total': p.color(0), 
                'White': p.color(44, 160, 44), 
                'Black': p.color(214, 39, 40), 
                'Hispanic': p.color(255, 127, 14), 
                'Asian': p.color(31, 119, 180) 
            };

            Object.keys(groups).forEach(race => {
                let data = groups[race].sort((a,b) => a.x - b.x);
                p.noFill();
                p.stroke(colors[race] || 150);
                p.strokeWeight(race === 'Total' ? 3 : 1.5);
                
                p.beginShape();
                data.forEach(d => p.vertex(mapX(d.x), mapY(d.y)));
                p.endShape();

                // Line Labeling
                if (data.length > 0) {
                    let last = data[data.length - 1];
                    p.noStroke();
                    p.fill(colors[race] || 150);
                    p.textSize(11);
                    p.textAlign(p.LEFT, p.CENTER);
                    p.text(race, mapX(last.x) + 8, mapY(last.y));
                }
            });

            // --- Titles & Axes ---
            p.fill(0);
            p.noStroke();
            p.textAlign(p.CENTER);

            p.textSize(18);
            p.textStyle(p.BOLD);
            p.text(
                "2-Year Graduation Rates",
                startX + chartW / 2,
                startY - 60
            );

            p.textSize(13);
            p.textStyle(p.NORMAL);
            p.fill(80);
            // Subtitle line 1
            p.text(
                `Gender: ${this.lastSex}`,
                startX + chartW / 2,
                startY - 40
            );

            // Subtitle line 2
            p.text(
                `Institution Type: ${this.lastControl}`,
                startX + chartW / 2,
                startY - 20
            );

            // --- Axes ---
            p.stroke(0);
            p.strokeWeight(1.5);
            p.line(startX, startY + chartH, startX + chartW, startY + chartH); // X axis
            p.line(startX, startY, startX, startY + chartH); // Y axis

            // --- X Axis Label ---
            p.noStroke();
            p.fill(0);
            p.textSize(12);
            p.textAlign(p.CENTER);
            p.text("Cohort Entry Year", startX + chartW / 2, startY + chartH + 50);

            // --- Y Axis Label ---
            p.push();
            p.translate(startX - 60, startY + chartH / 2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER);
            p.text("Graduation Rate (%)", 0, 0);
            p.pop();

            // --- Y Axis Ticks ---
            p.textAlign(p.RIGHT);
            for (let i = 0; i <= 100; i += 20) {
                let y = mapY(i);

                // Grid line
                p.stroke(230);
                p.line(startX, y, startX + chartW, y);

                // Label
                p.noStroke();
                p.fill(0);
                p.text(i + "%", startX - 15, y + 4);
            }

            // --- X Axis: 2000–2019 (Clean Layout) ---
            p.textAlign(p.CENTER);
            p.textSize(10);

            for (let yr = 2000; yr <= 2019; yr++) {

                let x = mapX(yr);

                // Tick mark (every year)
                p.stroke(0);
                p.line(x, startY + chartH, x, startY + chartH + 5);

                // Label only every 2 years (prevents overlap)
                if (yr % 2 === 0) {
                    p.noStroke();
                    p.fill(0);
                    p.text(yr, x, startY + chartH + 18);
                }
            }
        }
    }
})();