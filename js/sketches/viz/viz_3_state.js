(function () {
    window.Viz3State = {
        yearSlider: null,
        sliderLabel: null,
        controlsCreated: false,
        stateAverages: {},
        maxEnrollment: 0,
        availableYears: [1970, 1980, 1990, 2000, 2010, 2012, 2017, 2018, 2019, 2020, 2021, 2022],

        draw: function (p, manager, ai, progress) {
            
        },

        setupMapData: function(manager) {
            // Calculate global max for color scale
            let rows = manager.table3.getRows();
            this.maxEnrollment = Math.max(...rows.map(r => r.getNum("Enrollment")));

            // Calculate averages per state
            let sums = {};
            let counts = {};
            rows.forEach(r => {
                let state = r.getString("State or jurisdiction");
                let val = r.getNum("Enrollment");
                sums[state] = (sums[state] || 0) + val;
                counts[state] = (counts[state] || 0) + 1;
            });
            for (let s in sums) {
                this.stateAverages[s] = sums[s] / counts[s];
            }
        },
    };
})();