(function () {
    window.VizBar = {
        draw: function (p, manager, ai, progress) {
            p.push();
            
            // --- STEP 1: LOAD & PROCESS DATA ---
            // Check if data is already loaded to avoid re-parsing every frame
            if (!manager.dataLoaded) {
                // In p5.js, you'd usually use loadTable() in preload(). 
                // For this scaffold, we assume manager.table contains the loaded CSV.
                if (manager.table) {
                    let rows = manager.table.getRows();
                    
                    // Arrays to hold our filtered data
                    manager.maleData = [];
                    manager.femaleData = [];

                    for (let i = 0; i < rows.length; i++) {
                        let inst = rows[i].getString("institution_level");
                        let sex = rows[i].getString("sex");
                        let metric = rows[i].getString("metric");
                        let year = rows[i].getNum("year");
                        let val = rows[i].getNum("value");

                        // Apply your filters: Total level, 'num' metric, and split by sex
                        if (inst === "Total" && metric === "num") {
                            let dataPoint = { x: year, y: val };
                            
                            if (sex === "Male") {
                                manager.maleData.push(dataPoint);
                            } else if (sex === "Female") {
                                manager.femaleData.push(dataPoint);
                            }
                        }
                    }

                    // Sort data by year just in case the CSV is unsorted
                    manager.maleData.sort((a, b) => a.x - b.x);
                    manager.femaleData.sort((a, b) => a.x - b.x);
                    
                    manager.dataLoaded = true;
                    console.log("Data Filtered:", manager.maleData.length, "Male records found.");
                }
            }

            
            p.pop();
        }
    };
})();
