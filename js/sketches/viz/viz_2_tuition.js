(function () {
    window.Viz2Tuition = {
        // Data variables
        table2: null,
        
        // UI Control variables
        measureSelect: null,
        categorySelect: null,
        institutionSelect: null,

        // State variables to track changes
        lastMeasure: '',
        lastCategory: '',
        lastInstitution: '',
        currentDataset: [],

        controlsCreated: false,
        
        draw: function (p, manager, ai, progress) {
            p.push();
            
            
            
            p.pop();
        }
    };
})();