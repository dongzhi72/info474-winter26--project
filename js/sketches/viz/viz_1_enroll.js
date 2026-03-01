(function () {
    window.VizBar = {
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


            p.pop();
        }
    };
})();
