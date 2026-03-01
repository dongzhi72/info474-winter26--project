(function () {
    window.Viz1Enrollment = {
        draw: function (p, manager, ai, progress) {
            p.push();
            
            // --- 1. DATA PROCESSING ---
            if (!manager.dataProcessed && manager.table1) {
                let rows = manager.table1.getRows();
                manager.maleData = [];
                manager.femaleData = [];

                for (let i = 0; i < rows.length; i++) {
                    let inst = rows[i].getString("institution_level");
                    let sex = rows[i].getString("sex");
                    let metric = rows[i].getString("metric");
                    let year = rows[i].getNum("year");
                    let val = rows[i].getNum("value");

                    if (inst === "Total" && metric === "num" && !isNaN(val)) {
                        let pt = { x: year, y: val };
                        if (sex === "Male") manager.maleData.push(pt);
                        else if (sex === "Female") manager.femaleData.push(pt);
                    }
                }
                manager.maleData.sort((a, b) => a.x - b.x);
                manager.femaleData.sort((a, b) => a.x - b.x);
                manager.dataProcessed = true;
            }

            // --- 2. RENDER THE CHART ---
            if (manager.dataProcessed) {
                // Layout settings
                const margin = { top: 60, right: 40, bottom: 60, left: 70 };
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
                // X Axis
                p.line(startX, startY + chartH, startX + chartW, startY + chartH);
                // Y Axis
                p.line(startX, startY, startX, startY + chartH);

                
            }


            p.pop();
        }
    };
})();
