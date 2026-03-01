// viz_title.js
// Draw title-style screens for early active indexes (0 and 1)
(function () {
    window.VizTitle = {
        draw: function (p, manager, ai, progress) {
            // Only draw this title screen for the first two sections
            if (ai > 1) return;

            var cx = (manager.width || 850) / 2;
            var cy = (manager.height || 650) / 2;
            
            p.push();
            p.noStroke();
            
            // --- Background Card ---
            p.fill(255, 240); // Slightly transparent white
            var w = 650;      // Widened to fit the subtitle
            var h = 180;      // Heightened to fit both lines
            p.rectMode(p.CENTER);
            p.rect(cx, cy, w, h, 10);

            // --- Text Settings ---
            p.textAlign(p.CENTER, p.CENTER);
            
            if (ai === 0) {
                // MAIN TITLE
                p.fill(0);
                p.textStyle(p.BOLD);
                p.textSize(42);
                p.text('Is College Still Worth It?', cx, cy - 30);

                // SUBTITLE (The "Return")
                p.fill(80); // Gray color for contrast
                p.textStyle(p.NORMAL);
                p.textSize(22);
                p.text('Cost, Access, Risk, and Return Since 1960', cx, cy + 35);
            } else {
                // Content for ai === 1 (Transition state)
                p.fill(0);
                p.textStyle(p.BOLD);
                p.textSize(32);
                p.text('Let\'s look at the data...', cx, cy);
            }
            p.pop();
        }
    };
})();
