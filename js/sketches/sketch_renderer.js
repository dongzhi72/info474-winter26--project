// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) { }

            // 0: Title Screen
            if (ai === 0) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            // 1: Visualization 1 (Enrollment Hook)
            if (ai === 1) {
                window.Viz1Enrollment.draw(p, manager, ai, progress);
                return;
            }

            // 2: Visualization 3 (State Map)
            if (ai === 2) {
                window.Viz3State.draw(p, manager, ai, progress);
                return;
            }

            // 3: Visualization 4 (Race/Ethnicity)
            if (ai === 3) {
                window.Viz4Race.draw(p, manager, ai, progress);
                return;
            }

            // 4: Visualization 2 (Tuition Growth)
            if (ai === 4) {
                window.Viz2Tuition.draw(p, manager, ai, progress);
                return;
            }

            // 5: Visualization 6 (Financial Aid)
            if (ai === 5) {
                window.Viz6Aid.draw(p, manager, ai, progress);
                return;
            }

            // 6: Visualization 5 (Graduation Rates)
            if (ai === 6) {
                window.Viz5Grad.draw(p, manager, ai, progress);
                return;
            }

            // 7: Visualization 7 (ROI / Earnings)
            if (ai === 7) {
                window.Viz7Income.draw(p, manager, ai, progress);
                return;
            }
        }
    };
})();
