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
            
            // --- 1. SETUP UI CONTROLS (Once) ---
            if (!this.controlsCreated) {
                this.createControls(p, manager);
                this.controlsCreated = true;
            }

            // --- 2. HANDLE UPDATING VIS STATE (Filtering) ---
            this.handleResetVisState(manager);

            // --- 3. RENDER THE CHART ---
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
            // Get the container provided by the manager
            let container = p.select('#vis');
            
            // Create a panel for controls
            let controls = p.createDiv('').id('viz2-controls');
            controls.style('position', 'absolute');
            // Position based on the parent container
            controls.style('top', '10px');
            controls.style('left', '10px');
            controls.style('background', 'rgba(255,255,255,0.8)');
            controls.style('padding', '10px');
            controls.style('border-radius', '5px');

            // 1. Measure Select Box (Raw vs Inflation Adjusted)
            controls.child(p.createSpan('View: '));
            this.measureSelect = p.createSelect();
            this.measureSelect.option('raw', 'Raw Cost');
            this.measureSelect.option('inf', 'Inflation Adjusted');
            this.measureSelect.selected('inf'); // Default
            controls.child(this.measureSelect);
            controls.child(p.createElement('br'));

            // 2. Category Dropdown
            controls.child(p.createSpan('Type: '));
            this.categorySelect = p.createSelect();
            ['total', 'tuition', 'dorm', 'board'].forEach(c => this.categorySelect.option(c));
            this.categorySelect.selected('total'); // Default
            controls.child(this.categorySelect);
            controls.child(p.createElement('br'));

            // 3. Institution Dropdown
            controls.child(p.createSpan('Institution: '));
            this.institutionSelect = p.createSelect();
            ['all_institutions', 'Public_institutions', 'private_non_profit', 'private_for_profit'].forEach(i => this.institutionSelect.option(i));
            this.institutionSelect.selected('all_institutions'); // Default
            controls.child(this.institutionSelect);
        },

        // Logic to filter data when controls change
        handleResetVisState: function(manager) {
            if (!manager.table2) return;

            const newMeasure = this.measureSelect.selected();
            const newCategory = this.categorySelect.selected();
            const newInstitution = this.institutionSelect.selected();

            // Check if any filter has changed
            if (newMeasure !== this.lastMeasure || 
                newCategory !== this.lastCategory || 
                newInstitution !== this.lastInstitution) {

                console.log("Filters changed. Updating data...");
                this.lastMeasure = newMeasure;
                this.lastCategory = newCategory;
                this.lastInstitution = newInstitution;

                // Apply filters
                this.currentDataset = manager.table2.getRows().filter(row => {
                    return row.getString("measure") === newMeasure &&
                           row.getString("category") === newCategory &&
                           row.getString("institution") === newInstitution;
                });
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

                if (!isNaN(cost)) {
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
            const colors = { 'total': p.color(0), '4yr': p.color(230, 80, 150), '2yr': p.color(80, 150, 230) };

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
            
            // X-Axis Title
            p.text("Year", startX + chartW / 2, startY + chartH + 40);

            // Y-Axis Labels
            p.textAlign(p.RIGHT);
            for (let v = 0; v <= maxCost; v += (maxCost / 5)) {
                p.text("$" + Math.round(v/1000) + "k", startX - 10, mapY(v) + 4);
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