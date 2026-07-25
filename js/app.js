jQuery(function($){

    var player = $(".js-player");
    var friend = $(".js-friend");
    var rabbithole = $("#game");

    // Get the player parent list index
    var currentIndex = player.parent().index();

    // Random num generation 1-10 for random list amounts
    var randomNum = Math.floor(Math.random() * 9) + 2;

    $("#startBtn").on("click", function(){
        for (var i = 0; i <= randomNum; i++){
            // Create new path and save the list to a var
            var newLi = $("<li></li>");

            // Append the path to the game area
            $(rabbithole).append(newLi);
        }
        // Find all paths in the rabbithole
        var allLis = $(rabbithole).find("li");

        // Pick a random index based on the num of paths
        var randomIndex = Math.floor(Math.random() * allLis.length);

        // Append the friend to the random path
        allLis.eq(randomIndex).append(friend).addClass("checkpoint");

        $(this).hide();
    });

    $(document).on("keydown", function(e){
        switch (e.key){
            case "ArrowUp":
                e.preventDefault();
                moveStep(-1); // Backward
                checkOverlap();
                break;
            case "ArrowDown":
                e.preventDefault();
                moveStep(1); // Forward
                checkOverlap();
                break;
        }
    });

    $(document).on("swipeleft", function(){
        moveStep(-1);
    });

    $(document).on("swiperight", function(){
        moveStep(1);
    });

    function moveStep(direction){
        // Grab all moveable areas
        var allTiles = $(rabbithole).find("li");

        // Locate where player stands
        var currentTile = player.parent();
        var currentIndex = allTiles.index(currentTile);

        // Calculate the target index destination
        var targetIndex = currentIndex + direction;

        // Move if within the map boundaries
        if (targetIndex >= 0 && targetIndex < allTiles.length){
            currentTile.removeClass("checkpoint");
            var targetTile = allTiles.eq(targetIndex);
            player.appendTo(targetTile);
        }
    }

    function checkOverlap(){
        $(".checkpoint").each(function(){
            // Check if an li has the player and friend
            if (this.contains(player[0]) && this.contains(friend[0])){
                console.log("overlap");
                spawnPaths($(this));
            }
        })
    }

    function spawnPaths(activeTile){
        activeTile.removeClass("checkpoint");
        var freshRandomNum = Math.floor(Math.random() * 9) + 2;
        var newUl = $("<ul></ul>");
        for (var i = 0; i <= freshRandomNum; i++){
            newUl.append("<li></li>");
        }
        activeTile.append(newUl);
        // Isolate the choices to the new paths
        var newLis = newUl.find("li");

        // Pick a random index based on the num of paths for the friend again
        var randomIndex = Math.floor(Math.random() * newLis.length);

        newLis.eq(randomIndex).append(friend).addClass("checkpoint");
    }

});