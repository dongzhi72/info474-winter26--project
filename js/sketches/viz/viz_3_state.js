(function () {
    window.Viz3State = {
        yearSlider: null,
        sliderLabel: null,
        controlsCreated: false,
        stateAverages: {},
        maxEnrollment: 0,
        availableYears: [1970, 1980, 1990, 2000, 2010, 2012, 2017, 2018, 2019, 2020, 2021, 2022],

        draw: function (p, manager, ai, progress) {
            
        },

        setupMapData: function(manager) {
            // Calculate global max for color scale
            let rows = manager.table3.getRows();
            this.maxEnrollment = Math.max(...rows.map(r => r.getNum("Enrollment")));

            // Calculate averages per state
            let sums = {};
            let counts = {};
            rows.forEach(r => {
                let state = r.getString("State or jurisdiction");
                let val = r.getNum("Enrollment");
                sums[state] = (sums[state] || 0) + val;
                counts[state] = (counts[state] || 0) + 1;
            });
            for (let s in sums) {
                this.stateAverages[s] = sums[s] / counts[s];
            }
        },

        createControls: function(p, manager) {
            let container = p.select('#vis');
            let controls = p.createDiv('').id('viz3-controls');
            controls.parent(container);
            controls.style('position', 'absolute');
            controls.style('bottom', '20px');
            controls.style('left', '50%');
            controls.style('transform', 'translateX(-50%)');
            controls.style('background', 'white');
            controls.style('padding', '10px');
            controls.style('border-radius', '5px');
            controls.style('border', '1px solid #ccc');

            // Slider: 0 to length of years, plus one for "Average"
            this.yearSlider = p.createSlider(0, this.availableYears.length, 0, 1);
            this.yearSlider.style('width', '300px');
            controls.child(this.yearSlider);
            
            this.sliderLabel = p.createSpan(' View: Average (1970-2022)');
            controls.child(this.sliderLabel);
        },

        renderMap: function(p, manager) {
            let sliderVal = this.yearSlider.value();
            let currentYear = sliderVal === 0 ? "Average" : this.availableYears[sliderVal - 1];
            this.sliderLabel.html(` View: ${currentYear}`);

            p.push();
            p.translate(50, 50); // Adjust to fit your canvas

            manager.geoData.features.forEach(feature => {
                let stateName = feature.properties.name;
                let enrollment = 0;

                if (currentYear === "Average") {
                    enrollment = this.stateAverages[stateName] || 0;
                } else {
                    let row = manager.table3.findRow(stateName, "State or jurisdiction");
                    // Filter table for state AND year
                    let rows = manager.table3.getRows().filter(r => 
                        r.getString("State or jurisdiction") === stateName && 
                        r.getNum("Year") === currentYear
                    );
                    enrollment = rows.length > 0 ? rows[0].getNum("Enrollment") : 0;
                }

                // Color Intensity (Choropleth logic)
                let intensity = p.map(enrollment, 0, this.maxEnrollment, 0, 1);
                let stateColor = p.lerpColor(p.color('#f7fbff'), p.color('#08306b'), intensity);
                
                p.fill(stateColor);
                p.stroke(255);
                p.strokeWeight(0.5);

                // Draw the state shape
                feature.geometry.coordinates.forEach(polygon => {
                    p.beginShape();
                    // Handle MultiPolygon if necessary
                    let coords = feature.geometry.type === "MultiPolygon" ? polygon[0] : polygon;
                    coords.forEach(coord => {
                        // Simple projection: (lon - centerLon) * scale, (lat - centerLat) * -scale
                        let x = (coord[0] + 95) * 10 + 250; 
                        let y = (coord[1] - 37) * -12 + 200;
                        p.vertex(x, y);
                    });
                    p.endShape(p.CLOSE);
                });
            });
            p.pop();
        }
    };
})();