(function () {
    window.Viz2Tuition = {
        // Data variables
        table2: null,
        
        // UI Control variables
        measureSelect: null,
        categorySelect: null,
        institutionSelect: null,

        // State variables to track changes
        lastMeasure: '',
        lastCategory: '',
        lastInstitution: '',
        currentDataset: [],

        controlsCreated: false,
        
        draw: function (p, manager, ai, progress) {
            p.push();

            // --- SAFETY CHECK: Check if data is loaded ---
            if (!manager.table2) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Loading Tuition Data...", manager.width/2, manager.height/2);
                p.pop();
                return;
            }
            
            // --- 1. SETUP UI CONTROLS (Once) ---
            if (!this.controlsCreated) {
                this.createControls(p, manager);
                this.controlsCreated = true;
            }

            // --- 2. TOGGLE VISIBILITY (Every Frame) ---
            // let controlsDiv = document.getElementById('viz2-controls');
            // if (controlsDiv) {
            //     // --- DEBUG: Log the active index to confirm in console ---
            //     console.log("Active Index:", manager.state.activeIndex);                
                
            //     // --- FIX: Only show if activeIndex is 4 ---
            //     if (manager.state.activeIndex === 4) {
            //         controlsDiv.style.display = 'block';
            //     } else {
            //         controlsDiv.style.display = 'none';
            //     }
            // }
            document.dispatchEvent(new CustomEvent('sectionChange', { detail: { activeIndex: manager.state.activeIndex } }));

            // --- 3. HANDLE UPDATING VIS STATE (Filtering) ---
            this.handleResetVisState(manager);

            // --- 4. RENDER THE CHART ---
            if (this.currentDataset.length > 0) {
                this.renderChart(p, manager);
            } else {
                p.fill(100);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("No data found for selection.", manager.width / 2, manager.height / 2);
            }
            
            p.pop();
        },
        
        // Helper to create HTML controls in the 'vis' div
        createControls: function(p, manager) {
            // 1. Ensure the container exists
            let container = p.select('#vis');
            if (!container) {
                console.error("Error: Could not find #vis container!");
                return;
            }
            
            // 2. Create the panel
            let controls = p.createDiv('').id('viz2-controls');
            controls.parent(container); 
            controls.style('position', 'absolute');
            controls.style('top', '10px');
            controls.style('left', '10px');
            controls.style('background', 'rgba(255,255,255,0.9)');
            controls.style('padding', '15px');
            controls.style('border-radius', '8px');
            controls.style('z-index', '1000'); 
            controls.style('border', '1px solid #ccc');

            // 1. Measure Select Box
            controls.child(p.createSpan('View: '));
            this.measureSelect = p.createSelect();
            // --- FIX: Documentation says .option(label, value) ---
            this.measureSelect.option('Raw Cost', 'raw'); 
            this.measureSelect.option('Inflation Adjusted', 'inf');
            this.measureSelect.selected('inf');
            controls.child(this.measureSelect);
            controls.child(p.createElement('br'));

            // 2. Category Dropdown
            controls.child(p.createSpan('Type: '));
            this.categorySelect = p.createSelect();
            this.categorySelect.option('Total', 'total');
            this.categorySelect.option('Tuition', 'tuition');
            this.categorySelect.option('Dorm', 'dorm');
            this.categorySelect.option('Board', 'board');
            this.categorySelect.selected('total');
            controls.child(this.categorySelect);
            controls.child(p.createElement('br'));

            // 3. Institution Dropdown
            controls.child(p.createSpan('Institution: '));
            this.institutionSelect = p.createSelect();
            this.institutionSelect.option('All Institutions', 'all_institutions');
            this.institutionSelect.option('Public Institutions', 'public_institutions');
            this.institutionSelect.option('Private Non-Profit', 'private_non_profit');
            this.institutionSelect.option('Private For-Profit', 'private_for_profit');
            this.institutionSelect.selected('all_institutions');
            controls.child(this.institutionSelect);

            document.addEventListener('sectionChange', function(e) {
                let controlsDiv = document.getElementById('viz2-controls');
                if (controlsDiv) {
                    controlsDiv.style.display = (e.detail.activeIndex === 4) ? 'block' : 'none';
                }
            });
        },

        // Logic to filter data when controls change
        handleResetVisState: function(manager) {
            if (!manager.table2) return;

            // --- DEBUG: Print Table Headers ---
            console.log("CSV Columns:", manager.table2.columns);                
            // ---------------------------------

            const newMeasure = this.measureSelect.selected();
            const newCategory = this.categorySelect.selected();
            const newInstitution = this.institutionSelect.selected();

            // Check if any filter has changed OR if it's the first time
            if (newMeasure !== this.lastMeasure || 
                newCategory !== this.lastCategory || 
                newInstitution !== this.lastInstitution ||
                this.currentDataset.length === 0) { 

                console.log(`Filtering by: ${newMeasure}, ${newCategory}, ${newInstitution}`);
                this.lastMeasure = newMeasure;
                this.lastCategory = newCategory;
                this.lastInstitution = newInstitution;

                // --- DEBUG: Print an example row to compare ---
                if (manager.table2.getRowCount() > 0) {
                    console.log("CSV Example Row:", manager.table2.getRow(0).obj);
                }

                // --- FIX: Add .toLowerCase() to match CSV exactly ---
                this.currentDataset = manager.table2.getRows().filter(row => {
                    return row.getString("measure").trim().toLowerCase() === newMeasure.toLowerCase() &&
                        row.getString("category").trim().toLowerCase() === newCategory.toLowerCase() &&
                        row.getString("institution").trim().toLowerCase() === newInstitution.toLowerCase();
                });
                
                console.log(`Dataset filtered. Count: ${this.currentDataset.length}`);
            }
        },

        renderChart: function(p, manager) {
            const margin = { top: 60, right: 120, bottom: 60, left: 80 };
            const chartW = manager.width - margin.left - margin.right;
            const chartH = manager.height - margin.top - margin.bottom;
            const startX = margin.left;
            const startY = margin.top;

            // Organize data by level ('total', '4yr', '2yr') for lines
            let lines = { 'total': [], '4yr': [], '2yr': [] };
            let maxCost = 0;
            let minYear = 2030; // High default
            let maxYear = 0;

            this.currentDataset.forEach(row => {
                let year = row.getNum("year");
                let cost = row.getNum("cost_value");
                let level = row.getString("level");

                // Check if values are valid numbers
                if (!isNaN(cost) && cost !== 0 && !isNaN(year)) {                
                    lines[level].push({x: year, y: cost});
                    if (cost > maxCost) maxCost = cost;
                    if (year < minYear) minYear = year;
                    if (year > maxYear) maxYear = year;
                }
            });

            // Sorting required for line chart
            Object.keys(lines).forEach(level => lines[level].sort((a,b) => a.x - b.x));

            // Mapping functions
            const mapX = (year) => p.map(year, minYear, maxYear, startX, startX + chartW);
            const mapY = (val) => p.map(val, 0, maxCost * 1.05, startY + chartH, startY);

            // --- Draw Axes ---
            p.stroke(50);
            p.strokeWeight(1);
            p.line(startX, startY + chartH, startX + chartW, startY + chartH); // X
            p.line(startX, startY, startX, startY + chartH); // Y

            // --- Draw Lines ---
            p.noFill();
            p.strokeWeight(2);
            
            // Define colors for each level
            const colors = { 'total': p.color(211, 211, 211), '4yr': p.color(250, 139, 70), '2yr': p.color(58,125,68) };

            Object.keys(lines).forEach(level => {
                let data = lines[level];
                if (data.length > 0) {
                    p.stroke(colors[level]);
                    p.beginShape();
                    data.forEach(d => p.vertex(mapX(d.x), mapY(d.y)));
                    p.endShape();
                }
            });

            // --- Labels & Legend ---
            p.noStroke();
            p.fill(0);
            p.textAlign(p.CENTER);
            
            // === ADDED: Main Chart Title ===
            p.textSize(16);
            p.textStyle(p.BOLD);
            p.text("Tuition Trends Over Time", startX + chartW / 2, startY - 30);
            p.textStyle(p.NORMAL);
            p.textSize(12);
            
            // X-Axis Title
            p.text("Year", startX + chartW / 2, startY + chartH + 40);

            // === ADDED: Y-Axis Title ===
            p.push();
            p.translate(startX - 50, startY + chartH / 2);
            p.rotate(-p.HALF_PI);
            p.text("Cost ($)", 0, 0);
            p.pop();

            // Y-Axis Labels & Ticks
            p.textAlign(p.RIGHT);
            for (let v = 0; v <= maxCost; v += (maxCost / 5)) {
                let yPos = mapY(v);
                p.text("$" + Math.round(v/1000) + "k", startX - 10, yPos + 4);
                // Optional: Add small tick lines
                p.stroke(50);
                p.line(startX - 5, yPos, startX, yPos);
                p.noStroke();
            }

            // === ADDED: X-Axis Ticks (Years) ===
            p.textAlign(p.CENTER);
            for (let year = minYear; year <= maxYear; year += 5) {
                let xPos = mapX(year);
                p.text(year, xPos, startY + chartH + 15);
                // Optional: Add small tick lines
                p.stroke(50);
                p.line(xPos, startY + chartH, xPos, startY + chartH + 5);
                p.noStroke();
            }

            // Legend
            let legendY = startY;
            Object.keys(colors).forEach(level => {
                p.stroke(colors[level]);
                p.line(startX + chartW + 10, legendY, startX + chartW + 30, legendY);
                p.noStroke();
                p.fill(0);
                p.textAlign(p.LEFT);
                p.text(level.toUpperCase(), startX + chartW + 35, legendY + 4);
                legendY += 20;
            });
        }
    }
})();