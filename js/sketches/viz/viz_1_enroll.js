(function () {
    window.Viz1Enrollment = {
        draw: function (p, manager, ai, progress) {
            p.push();
            
            // --- SAFETY CHECK: Data must be loaded ---
            if (!manager.table1) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Loading data...", manager.width/2, manager.height/2);
                p.pop();
                return; // Stop here if data isn't ready
            }

            // --- 1. DATA PROCESSING (Runs only once) ---
            if (!manager.dataProcessed) {
                let rows = manager.table1.getRows();
                manager.maleData = [];
                manager.femaleData = [];

                for (let i = 0; i < rows.length; i++) {
                    let inst = rows[i].getString("institution_level");
                    let sex = rows[i].getString("sex");
                    let metric = rows[i].getString("metric");
                    let year = rows[i].getNum("year");
                    
                    // --- FIX: Check if "value" is a valid number ---
                    let valStr = rows[i].getString("value"); 
                    let val = parseFloat(valStr); // Try parsing it first
                    
                    // Only process if it is a number
                    if (inst === "Total" && metric === "num" && !isNaN(val)) {
                        let pt = { x: year, y: val };
                        if (sex === "Male") manager.maleData.push(pt);
                        else if (sex === "Female") manager.femaleData.push(pt);
                    }
                }
                
                manager.maleData.sort((a, b) => a.x - b.x);
                manager.femaleData.sort((a, b) => a.x - b.x);
                manager.dataProcessed = true;
                console.log("Data processed. Male points:", manager.maleData.length);
            }

            // --- 2. RENDER THE CHART ---
            if (manager.dataProcessed) {
                // Layout settings
                const margin = { top: 60, right: 40, bottom: 60, left: 120 };
                const chartW = manager.width - margin.left - margin.right;
                const chartH = manager.height - margin.top - margin.bottom;
                const startX = margin.left;
                const startY = margin.top;

                // Data Scaling Constants
                const minYear = 1960;
                const maxYear = 2022;
                const minY = 30; // Data ranges from ~37 to ~74
                const maxY = 80;

                // Helper function to map data to screen coordinates
                const mapX = (year) => p.map(year, minYear, maxYear, startX, startX + chartW);
                const mapY = (val) => p.map(val, minY, maxY, startY + chartH, startY);

                // --- Draw Axes ---
                p.stroke(200);
                p.strokeWeight(1);
                p.line(startX, startY + chartH, startX + chartW, startY + chartH); // X Axis
                p.line(startX, startY, startX, startY + chartH); // Y Axis

                // --- Draw Lines ---
                p.noFill();
                p.strokeWeight(3);

                // Female Line (Pinkish)
                p.stroke(230, 80, 150);
                p.beginShape();
                manager.femaleData.forEach(d => p.vertex(mapX(d.x), mapY(d.y)));
                p.endShape();

                // Male Line (Blue)
                p.stroke(80, 150, 230);
                p.beginShape();
                manager.maleData.forEach(d => p.vertex(mapX(d.x), mapY(d.y)));
                p.endShape();

                // --- Labels & Legend ---
                p.noStroke();
                p.fill(50);
                p.textAlign(p.CENTER);
                p.textSize(12);
                
                // Title
                p.textStyle(p.BOLD);
                p.textSize(18);
                p.text("College Enrollment Rates by Sex (1960-2022)", startX + chartW/2, startY - 30);
                p.textStyle(p.NORMAL);
                p.textSize(12);

                // X-Axis Labels (Every 10 years)
                for (let yr = 1960; yr <= 2020; yr += 10) {
                    p.text(yr, mapX(yr), startY + chartH + 20);
                }

                // X-Axis Label
                p.textAlign(p.CENTER);
                p.fill(50);
                p.textSize(13);
                p.textStyle(p.BOLD);
                p.text("Year", startX + chartW / 2, startY + chartH + 45);
                p.textStyle(p.NORMAL);

                // Y-Axis Labels
                p.textAlign(p.RIGHT);
                for (let v = minY; v <= maxY; v += 10) {
                    p.text(v + "%", startX - 10, mapY(v) + 4);
                }

                // Y-Axis Label (rotated)
                p.push();
                p.translate(startX - 70, startY + chartH / 2);
                p.rotate(-p.HALF_PI);
                p.textAlign(p.CENTER);
                p.textSize(13);
                p.textStyle(p.BOLD);
                p.fill(50);
                p.text("Enrollment Rate (%)", 0, 0);
                p.textStyle(p.NORMAL);
                p.pop();

                // Legend
                p.textAlign(p.LEFT);
                p.fill(230, 80, 150);
                p.rect(startX + 20, startY + 10, 15, 15);
                p.text("Female", startX + 40, startY + 22);

                p.fill(80, 150, 230);
                p.rect(startX + 120, startY + 10, 15, 15);
                p.text("Male", startX + 140, startY + 22);
            }
            
            p.pop();
        }
    };
})();