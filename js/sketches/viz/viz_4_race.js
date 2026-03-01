(function () {
    window.Viz4Race = {
        draw: function (p, manager, ai, progress) {
            p.push();
            
            if (!manager.table4) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Loading race data...", manager.width/2, manager.height/2);
                p.pop();
                return;
            }

            // ---- PROCESS DATA ONCE ----
            if (!manager.raceProcessed) {
                let rows = manager.table4.getRows();
                manager.raceGroups = {};

                rows.forEach(r => {
                    let year = r.getNum("Year");
                    let race = r.getString("Race_Ethnicity");
                    let rate = parseFloat(r.getString("Enrollment_Rate"));

                    if (!isNaN(year) && !isNaN(rate)) {
                        if (!manager.raceGroups[race]) {
                            manager.raceGroups[race] = [];
                        }
                        manager.raceGroups[race].push({x: year, y: rate});
                    }
                });
                // Sort each race by year
                for (let race in manager.raceGroups) {
                    manager.raceGroups[race].sort((a,b)=>a.x-b.x);
                }

                manager.raceProcessed = true;
            }

            // ---- Layout ----
            const margin = { top: 120, right: 80, bottom: 140, left: 110 };
            const chartW = manager.width - margin.left - margin.right;
            const chartH = manager.height - margin.top - margin.bottom;
            const startX = margin.left;
            const startY = margin.top;

            const minYear = 1960;
            const maxYear = 2022;
            const minY = 30;
            const maxY = 80;

            const mapX = (year) => p.map(year, minYear, maxYear, startX, startX + chartW);
            const mapY = (val) => p.map(val, minY, maxY, startY + chartH, startY);

            // ---- Axes ----
            p.stroke(200);
            p.line(startX, startY + chartH, startX + chartW, startY + chartH);
            p.line(startX, startY, startX, startY + chartH);

            // ---- Colors (match R) ----
            const colors = {
                "Total": [0,0,0],
                "White": [44,160,44],
                "Black": [214,39,40],
                "Hispanic": [255,127,14],
                "Asian": [31,119,180]
            };
            
            // ---- Draw Points + Regression ----
            for (let race in manager.raceGroups) {
                let data = manager.raceGroups[race];
                if (!colors[race]) continue;

                let c = colors[race];
                p.stroke(c[0],c[1],c[2]);
                p.fill(c[0],c[1],c[2],80);

                // Draw points (like geom_point alpha=0.3)
                data.forEach(d=>{
                p.circle(mapX(d.x), mapY(d.y), 4);
                });

                // ---- Compute Linear Regression ----
                let n = data.length;
                let sumX=0, sumY=0, sumXY=0, sumXX=0;

                data.forEach(d=>{
                sumX += d.x;
                sumY += d.y;
                sumXY += d.x*d.y;
                sumXX += d.x*d.x;
                });

                let denominator = (n*sumXX - sumX*sumX);

                if (denominator === 0) {
                    continue; // skip this race safely
                }

                let slope = (n*sumXY - sumX*sumY) / denominator;
                let intercept = (sumY - slope*sumX)/n;

                if (!isFinite(slope) || !isFinite(intercept)) {
                    continue; // prevent crash
                }

                // ---- Draw Regression Line ----
                p.strokeWeight(2);
                p.noFill();

                let y1 = slope*minYear + intercept;
                let y2 = slope*maxYear + intercept;

                p.line(
                mapX(minYear), mapY(y1),
                mapX(maxYear), mapY(y2)
                );

                p.strokeWeight(1);
            }

            // ---- Labels ----
            p.noStroke();
            p.fill(50);

            // ----- Title -----
            p.textAlign(p.CENTER);
            p.textSize(16);
            p.textStyle(p.BOLD);
            p.text("Higher Education Enrollment Trends (1960–2022)", 
                startX + chartW/2, startY - 55);

            p.textStyle(p.NORMAL);
            p.textSize(12);
            p.text("Points show annual data; lines show linear best-fit trends",
                startX + chartW/2, startY - 35);

            // ----- Axis Labels -----
            p.textSize(12);

            // X Label
            p.textAlign(p.CENTER);
            p.text("Year", startX + chartW/2, startY + chartH + 45);

            // Y Label (rotated)
            p.push();
            p.translate(startX - 55, startY + chartH/2);
            p.rotate(-p.HALF_PI);
            p.textAlign(p.CENTER);
            p.text("Immediate College Enrollment Rate (%)", 0, 0);
            p.pop();

            // ----- X-axis ticks -----
            p.textAlign(p.CENTER);
            for (let yr = 1960; yr <= 2020; yr += 10) {
                p.text(yr, mapX(yr), startY + chartH + 20);
            }

            // ----- Y-axis ticks -----
            p.textAlign(p.RIGHT);
            for (let v = minY; v <= maxY; v += 10) {
                p.text(v + "%", startX - 10, mapY(v)+4);
            }

            // ----- Legend (bottom centered) -----
            let legendY = startY + chartH + 70;
            let legendX = startX + chartW/2 - 200;
            let spacing = 100;

            const legendOrder = ["Total", "White", "Black", "Hispanic", "Asian"];

            legendOrder.forEach((race, i) => {
                if (!colors[race]) return;

                let x = legendX + i * spacing;
                let c = colors[race];

                p.fill(c[0], c[1], c[2]);
                p.rect(x, legendY, 18, 18);

                p.fill(50);
                p.textAlign(p.LEFT);
                p.text(race, x + 25, legendY + 14);
            });

            p.pop();
        }
    };
})();