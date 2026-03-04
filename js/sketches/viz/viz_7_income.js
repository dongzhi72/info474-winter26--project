(function () {
    window.Viz7Income = {
        draw: function (p, manager, ai, progress) {
            p.push();

            // --- SAFETY CHECK ---
            if (!manager.table7) {
                p.fill(150);
                p.textAlign(p.CENTER, p.CENTER);
                p.text("Loading data...", manager.width / 2, manager.height / 2);
                p.pop();
                return;
            }

            // --- 1. DATA PROCESSING (run once) ---
            if (!manager.incomeProcessed) {

                let rows = manager.table7.getRows();
                let categoryMap = {};

                for (let i = 0; i < rows.length; i++) {
                    let category = rows[i].getString("Major_category");
                    let median = rows[i].getNum("Median");

                    if (!isNaN(median)) {
                        if (!categoryMap[category]) {
                            categoryMap[category] = {
                                total: 0,
                                count: 0
                            };
                        }

                        categoryMap[category].total += median;
                        categoryMap[category].count += 1;
                    }
                }

                // Convert to array with averages
                manager.categoryData = [];

                for (let cat in categoryMap) {
                    let avg = categoryMap[cat].total / categoryMap[cat].count;
                    manager.categoryData.push({
                        category: cat,
                        median: avg
                    });
                }

                // Sort descending
                manager.categoryData.sort((a, b) => b.median - a.median);

                manager.incomeProcessed = true;
                console.log("Income data processed:", manager.categoryData.length);
            }

            // --- 2. RENDER ---
            if (manager.incomeProcessed) {

                const margin = { top: 80, right: 80, bottom: 60, left: 220 };
                const chartW = manager.width - margin.left - margin.right;
                const chartH = manager.height - margin.top - margin.bottom;

                const startX = margin.left;
                const startY = margin.top;

                let data = manager.categoryData;

                let maxMedian = 0;
                data.forEach(d => {
                    if (d.median > maxMedian) maxMedian = d.median;
                });

                const barHeight = chartH / data.length * 0.7;
                const gap = chartH / data.length;

                // --- Axes ---
                p.stroke(200);
                p.line(startX, startY + chartH, startX + chartW, startY + chartH);
                p.line(startX, startY, startX, startY + chartH);

                // --- Bars ---
                for (let i = 0; i < data.length; i++) {

                    let y = startY + i * gap;
                    let barWidth = p.map(data[i].median, 0, maxMedian, 0, chartW);

                    // Color gradient by value
                    let col = p.map(data[i].median, 0, maxMedian, 100, 200);
                    p.fill(50, 100, col);
                    p.noStroke();
                    p.rect(startX, y, barWidth, barHeight);

                    // Category Labels (Y-axis)
                    p.fill(50);
                    p.textAlign(p.RIGHT, p.CENTER);
                    p.textSize(12);
                    p.text(data[i].category, startX - 10, y + barHeight / 2);

                    // Value Labels
                    p.textAlign(p.LEFT, p.CENTER);
                    p.text(
                        "$" + Math.round(data[i].median),
                        startX + barWidth + 8,
                        y + barHeight / 2
                    );
                }

                // --- X Axis Ticks ---
                p.fill(50);
                p.textAlign(p.CENTER);
                p.textSize(12);

                let step = Math.round(maxMedian / 5 / 10000) * 10000;
                if (step === 0) step = 10000;

                for (let v = 0; v <= maxMedian; v += step) {
                    let x = p.map(v, 0, maxMedian, startX, startX + chartW);
                    p.text("$" + (v / 1000) + "k", x, startY + chartH + 20);
                }

                // --- Title ---
                p.textAlign(p.CENTER);
                p.textSize(18);
                p.textStyle(p.BOLD);
                p.text(
                    "Median Salary After Graduation by Major Category",
                    startX + chartW / 2,
                    startY - 40
                );
                p.textStyle(p.NORMAL);

                // X-axis label
                p.textSize(14);
                p.text(
                    "Median Salary (USD)",
                    startX + chartW / 2,
                    startY + chartH + 45
                );
            }

            p.pop();
        }
    };
})();