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
    }
})();