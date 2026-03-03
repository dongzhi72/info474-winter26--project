(function () {
    window.Viz3State = {
        yearSlider: null,
        sliderLabel: null,
        controlsCreated: false,
        stateAverages: {},
        maxEnrollment: 0,
        availableYears: [1970, 1980, 1990, 2000, 2010, 2012, 2017, 2018, 2019, 2020, 2021, 2022],

        draw: function (p, manager, ai, progress) {
            // --- 1. SCRIPT VISIBILITY CHECK ---
            // If we aren't on section 5, stop immediately
            if (ai !== 2) return; 

            // --- 2. DATA CHECK (Visual Debug) ---
            if (!manager.table3 || !manager.geoData) {
                p.background(255, 200, 200); // Light red background if data fails
                p.fill(255, 0, 0);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("DATA ERROR:\nTable3: " + (manager.table3 ? "OK" : "MISSING") + 
                       "\nGeoJSON: " + (manager.geoData ? "OK" : "MISSING"), 
                       manager.width/2, manager.height/2);
                return;
            }

            if (!this.controlsCreated) {
                this.setupMapData(manager);
                this.createControls(p, manager);
                // Log the first feature to see what the state name property is called
                console.log("GeoJSON Sample Feature:", manager.geoData.features[0].properties);
                this.controlsCreated = true;
            }

            // Ensure controls are visible
            let controlsDiv = document.getElementById('viz3-controls');
            if (controlsDiv) controlsDiv.style.display = 'block';

            this.renderMap(p, manager);
        },

        setupMapData: function(manager) {
            let rows = manager.table3.getRows();
            this.maxEnrollment = Math.max(...rows.map(r => r.getNum("Enrollment")));
            
            let sums = {};
            let counts = {};
            rows.forEach(r => {
                let state = r.getString("State or jurisdiction");
                let val = r.getNum("Enrollment");
                if(state) {
                    sums[state] = (sums[state] || 0) + val;
                    counts[state] = (counts[state] || 0) + 1;
                }
            });
            for (let s in sums) this.stateAverages[s] = sums[s] / counts[s];
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
            controls.style('border', '1px solid #000');
            controls.style('z-index', '9999');

            this.yearSlider = p.createSlider(0, this.availableYears.length, 0, 1);
            controls.child(this.yearSlider);
            this.sliderLabel = p.createSpan(' View: Average');
            controls.child(this.sliderLabel);
        },

        renderMap: function(p, manager) {
            let sliderVal = this.yearSlider.value();
            let currentYear = sliderVal === 0 ? "Average" : this.availableYears[sliderVal - 1];
            this.sliderLabel.html(` View: ${currentYear}`);

            p.push();
            // Scaling constants to fit US map in 600x520
            let scaleVal = 12;
            let offX = 330;
            let offY = 250;

            manager.geoData.features.forEach(feature => {
                // IMPORTANT: Check console to see if your file uses 'name' or 'NAME'
                let stateName = feature.properties.name || feature.properties.NAME || feature.properties.STATE;
                let enrollment = 0;

                if (currentYear === "Average") {
                    enrollment = this.stateAverages[stateName] || 0;
                } else {
                    let rows = manager.table3.getRows().filter(r => 
                        r.getString("State or jurisdiction") === stateName && 
                        r.getNum("Year") == currentYear
                    );
                    enrollment = rows.length > 0 ? rows[0].getNum("Enrollment") : 0;
                }

                let intensity = p.map(enrollment, 0, this.maxEnrollment, 0, 1);
                p.fill(p.lerpColor(p.color(240, 248, 255), p.color(8, 48, 107), intensity));
                p.stroke(255);
                p.strokeWeight(0.5);

                let coords = feature.geometry.coordinates;
                let type = feature.geometry.type;

                if (type === "Polygon") {
                    this.drawShape(p, coords, scaleVal, offX, offY);
                } else if (type === "MultiPolygon") {
                    coords.forEach(poly => this.drawShape(p, poly, scaleVal, offX, offY));
                }
            });
            p.pop();
        },

        drawShape: function(p, rings, s, ox, oy) {
            rings.forEach(ring => {
                p.beginShape();
                ring.forEach(c => {
                    let x = (c[0] + 97) * s + ox;
                    let y = (c[1] - 38) * -s * 1.3 + oy;
                    p.vertex(x, y);
                });
                p.endShape(p.CLOSE);
            });
        }
    };
})();