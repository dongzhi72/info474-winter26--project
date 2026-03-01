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
            const margin = { top: 80, right: 60, bottom: 70, left: 80 };
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
            
            
            p.pop();
        }
    };
})();