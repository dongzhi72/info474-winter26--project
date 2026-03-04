(function () {
    window.Viz6Aid = {
        draw: function (p, manager, ai, progress) {
            p.push();

            // --- SAFETY CHECK: Data must be loaded ---
            if (!manager.table6) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Loading data...", manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            // --- 1. DATA PROCESSING (Runs only once) ---
            if (!manager.dataProcessed) {
                // Convert table6 to array
                let rows = Array.isArray(manager.table6) ? manager.table6 : Object.values(manager.table6);

                manager.dataBySectorLength = {}; // {sector: {length: [dataPoints]}}

                rows.forEach(row => {
                    let sector = row.sector;
                    let length = row.length;
                    let year = Number(row.year);
                    let percent = Number(row["Percent awarded aid"]);
                    let numAwarded = Number(row["Number awarded financial aid"]);

                    if (isNaN(percent) || isNaN(numAwarded)) return;

                    if (!manager.dataBySectorLength[sector]) manager.dataBySectorLength[sector] = {};
                    if (!manager.dataBySectorLength[sector][length]) manager.dataBySectorLength[sector][length] = [];

                    manager.dataBySectorLength[sector][length].push({
                        year: year,
                        percent: percent,
                        numAwarded: numAwarded
                    });
                });

                // Sort each array by year
                for (let sec in manager.dataBySectorLength) {
                    for (let len in manager.dataBySectorLength[sec]) {
                        manager.dataBySectorLength[sec][len].sort((a, b) => a.year - b.year);
                    }
                }

                manager.dataProcessed = true;
                console.log("Aid data processed.");
            }

            // --- 2. RENDER THE CHART ---
            const margin = 80;
            const chartW = manager.width - margin * 2;
            const chartH = manager.height - margin * 2;

            const selectedSector = manager.selectedSector || "All institutions";
            const selectedLength = manager.selectedLength || "Overall";

            const filtered = (manager.dataBySectorLength[selectedSector] || {})[selectedLength] || [];

            if (filtered.length === 0) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("No data for selected sector/length", manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            // --- Determine ranges ---
            const years = filtered.map(d => d.year);
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);

            const percents = filtered.map(d => d.percent);
            const maxPercent = Math.max(...percents) * 1.1;

            const nums = filtered.map(d => d.numAwarded);
            const maxNum = Math.max(...nums) * 1.1;

            // --- Draw axes ---
            p.stroke(0);
            p.strokeWeight(1);
            // X axis
            p.line(margin, p.height - margin, p.width - margin, p.height - margin);
            // Y left (numAwarded)
            p.line(margin, margin, margin, p.height - margin);
            // Y right (percent)
            p.line(p.width - margin, margin, p.width - margin, p.height - margin);

            // --- Y-axis labels ---
            p.textSize(12);
            p.fill(0);
            p.textAlign(p.RIGHT);
            for (let i = 0; i <= 5; i++) {
                let y = p.map(i, 0, 5, p.height - margin, margin);
                let val = Math.round(maxNum / 5 * i);
                p.text("$" + val, margin - 10, y + 5);
                p.stroke(200);
                p.line(margin, y, p.width - margin, y);
            }

            p.textAlign(p.LEFT);
            for (let i = 0; i <= 5; i++) {
                let y = p.map(i, 0, 5, p.height - margin, margin);
                let val = (maxPercent / 5 * i).toFixed(1);
                p.text(val + "%", p.width - margin + 10, y + 5);
            }

            // --- X-axis years ---
            p.textAlign(p.CENTER);
            filtered.forEach(d => {
                let x = p.map(d.year, minYear, maxYear, margin, p.width - margin);
                p.text(d.year, x, p.height - margin + 20);
            });

            // --- Draw bars (numAwarded) ---
            p.noStroke();
            p.fill(100, 150, 255, 180);
            const barWidth = chartW / filtered.length * 0.5;
            filtered.forEach(d => {
                let x = p.map(d.year, minYear, maxYear, margin, p.width - margin);
                let y = p.map(d.numAwarded, 0, maxNum, p.height - margin, margin);
                p.rect(x - barWidth / 2, y, barWidth, p.height - margin - y);
            });

            // --- Draw line (percent) ---
            p.noFill();
            p.stroke(255, 100, 100);
            p.strokeWeight(2);
            p.beginShape();
            filtered.forEach(d => {
                let x = p.map(d.year, minYear, maxYear, margin, p.width - margin);
                let y = p.map(d.percent, 0, maxPercent, p.height - margin, margin);
                p.vertex(x, y);
            });
            p.endShape();

            // --- Title ---
            p.noStroke();
            p.fill(0);
            p.textAlign(p.CENTER);
            p.textSize(15);
            p.text("Percentage of First-Time Students Receiving Financial Aid and Average Amount Awarded (2000-2022)", p.width / 2, 30);

            p.pop();
        }
    };
})();