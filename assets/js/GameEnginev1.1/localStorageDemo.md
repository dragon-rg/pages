---
layout: opencs
title: Local Storage Demo
permalink: /gamify/localStorage
---

<div id="gameContainer">
    <div id="promptDropDown" class="promptDropDown" style="z-index: 9999"></div>
    <canvas id='gameCanvas'></canvas>
</div>

<script type="module">

    // Adnventure Game assets locations
    import Game from "{{site.baseurl}}/assets/js/GameEnginev1.1/essentials/Game.js";
    import LocalStorageDemo from "{{site.baseurl}}/assets/js/GameEnginev1.1/localStorageDemo.js";
    import { pythonURI, javaURI, fetchOptions } from '{{site.baseurl}}/assets/js/api/config.js';

    const gameLevelClasses = [ LocalStorageDemo ];

    // Web Server Environment data
    const environment = {
        path:"{{site.baseurl}}",
        pythonURI: pythonURI,
        javaURI: javaURI,
        fetchOptions: fetchOptions,
        gameContainer: document.getElementById("gameContainer"),
        gameCanvas: document.getElementById("gameCanvas"),
        gameLevelClasses: gameLevelClasses

    }
    // Launch Adventure Game and keep the returned Game instance
    const game = Game.main(environment);

</script>