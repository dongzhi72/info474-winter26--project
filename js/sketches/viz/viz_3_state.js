(function () {
    window.Viz3State = {
        yearSlider: null,
        sliderLabel: null,
        controlsCreated: false,
        stateAverages: {},
        maxEnrollment: 0,
        availableYears: [1970, 1980, 1990, 2000, 2010, 2012, 2017, 2018, 2019, 2020, 2021, 2022],

        draw: function (p, manager, ai, progress) {
            // Match the index you specified
            if (ai !== 2) {
                let controlsDiv = document.getElementById('viz3-controls');
                if (controlsDiv) controlsDiv.style.display = 'none';
                return; 
            }

            if (!manager.table3 || !manager.geoData) return;

            if (!this.controlsCreated) {
                this.setupMapData(manager);
                this.createControls(p, manager);
                this.controlsCreated = true;
            }

            let controlsDiv = document.getElementById('viz3-controls');
            if (controlsDiv) controlsDiv.style.display = 'block';

            this.renderMap(p, manager);
        },

        setupMapData: function(manager) {
            let rows = manager.table3.getRows();
            this.maxEnrollment = Math.max(...rows.map(r => r.getNum("Enrollment")));
            let sums = {}, counts = {};
            rows.forEach(r => {
                let s = r.getString("State or jurisdiction");
                let v = r.getNum("Enrollment");
                if(s) {
                    sums[s] = (sums[s] || 0) + v;
                    counts[s] = (counts[s] || 0) + 1;
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
            this.sliderLabel = p.createSpan(' View: Average');
            controls.child(this.yearSlider);
            controls.child(this.sliderLabel);
        },

        renderMap: function(p, manager) {
            let sliderVal = this.yearSlider.value();
            let currentYear = sliderVal === 0 ? "Average" : this.availableYears[sliderVal - 1];
            this.sliderLabel.html(` View: ${currentYear}`);

            p.push();
            manager.geoData.features.forEach(feature => {
                let stateName = feature.properties.NAME || feature.properties.name;
                let enrollment = 0;

                if (currentYear === "Average") {
                    enrollment = this.stateAverages[stateName] || 0;
                } else {
                    let rows = manager.table3.getRows().filter(r => 
                        r.getString("State or jurisdiction") === stateName && r.getNum("Year") == currentYear
                    );
                    enrollment = rows.length > 0 ? rows[0].getNum("Enrollment") : 0;
                }

                let intensity = p.map(enrollment, 0, this.maxEnrollment, 0, 1);
                p.fill(p.lerpColor(p.color("#f7fbff"), p.color("#08306b"), intensity));
                p.stroke(255);
                p.strokeWeight(0.5);

                let coords = feature.geometry.coordinates;
                let type = feature.geometry.type;

                // --- ADJUSTED INSET PARAMETERS ---
                if (stateName === "Alaska") {
                    // Alaska: Scale 4, x-center 100, y-center 420
                    this.drawShape(p, coords, type, 4, 100, 420, -155, 65); 
                } else if (stateName === "Hawaii") {
                    // Hawaii: Scale 10, x-center 180, y-center 460
                    this.drawShape(p, coords, type, 10, 180, 460, -157, 20);
                } else {
                    // Mainland: Scale 12, x-center 320, y-center 240
                    this.drawShape(p, coords, type, 12, 320, 240, -98, 38);
                }
            });
            p.pop();
        },

        drawShape: function(p, coords, type, s, ox, oy, centralLon, centralLat) {
            const renderPolygon = (ring) => {
                p.beginShape();
                ring.forEach(c => {
                    let lon = c[0];
                    if (lon > 0) lon -= 360; // Handle Alaska crossing date line
                    
                    // Simple projection: (Coord - Center) * Scale + Offset
                    let x = (lon - centralLon) * s + ox;
                    let y = (c[1] - centralLat) * -s * 1.3 + oy;
                    p.vertex(x, y);
                });
                p.endShape(p.CLOSE);
            };

            if (type === "Polygon") {
                coords.forEach(ring => renderPolygon(ring));
            } else {
                coords.forEach(poly => poly.forEach(ring => renderPolygon(ring)));
            }
        }
    };
})();