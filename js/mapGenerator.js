function generateMap() {
    map.innerHTML = ''; // Clear the existing map
    mapData.length = 0; // Reset the map data

    const villageX = Math.floor(Math.random() * mapSize);
    const villageY = Math.floor(Math.random() * mapSize);

    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.style.left = `${x * cellSize}px`;
            cell.style.top = `${y * cellSize}px`;

            let cellType = 'empty';
            let emoji = ''; // Default to empty ground

            if (x === villageX && y === villageY) {
                cellType = 'village';
                emoji = '🏡'; // Village emoji
            } else if (Math.random() < 0.1) {
                cellType = 'obstacle';
                emoji = '🌲'; // Obstacle emoji
            } else if (Math.random() < 0.05) {
                cellType = Math.random() < 0.5 ? 'dungeon' : 'quest';
                emoji = cellType === 'dungeon' ? '🏰' : '📜'; // Dungeon or quest emoji
            } else if (Math.random() < 0.05) {
                // Add nature elements with a rare chance
                const natureElements = ['🌸', '🌼', '🌳', '🌴', '🌷', '🌻', '🌺', '💧'];
                emoji = natureElements[Math.floor(Math.random() * natureElements.length)];
            }

            cell.classList.add(cellType);
            cell.textContent = emoji;
            map.appendChild(cell);
            mapData.push({ x, y, type: cellType });
        }
    }

    // Add NPCs to the map
    npcs.forEach(npc => {
        const npcElement = document.createElement('div');
        npcElement.classList.add('map-cell');
        npcElement.style.left = `${npc.x * cellSize}px`;
        npcElement.style.top = `${npc.y * cellSize}px`;
        npcElement.textContent = '👤'; // NPC emoji
        npcElement.onclick = () => interactWithNPC(npc);
        map.appendChild(npcElement);
    });

    // Place the player initially
    player.style.left = '0px';
    player.style.top = '0px';
    player.textContent = '🧙‍♂️'; // Player emoji
    map.appendChild(player);
}

function generateVillageMap() {
    map.innerHTML = ''; // Clear the existing map
    mapData.length = 0; // Reset the map data

    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.style.left = `${x * cellSize}px`;
            cell.style.top = `${y * cellSize}px`;

            let cellType = 'empty';
            let emoji = '🌾'; // Default ground emoji for village

            if (Math.random() < 0.1) {
                cellType = 'building';
                emoji = '🏠'; // Building emoji
            } else if (Math.random() < 0.05) {
                cellType = 'shop';
                emoji = '🏪'; // Shop emoji
            }

            cell.classList.add(cellType);
            cell.textContent = emoji;
            map.appendChild(cell);
            mapData.push({ x, y, type: cellType });
        }
    }

    // Add NPCs to the village map
    const villageNpcs = [
        {
            name: "Villager",
            x: 5,
            y: 5,
            dialogue: "Welcome to our village!"
        },
        {
            name: "Shopkeeper",
            x: 10,
            y: 10,
            dialogue: "Take a look at my wares."
        }
    ];
    villageNpcs.forEach(npc => {
        const npcElement = document.createElement('div');
        npcElement.classList.add('map-cell');
        npcElement.style.left = `${npc.x * cellSize}px`;
        npcElement.style.top = `${npc.y * cellSize}px`;
        npcElement.textContent = '👤'; // NPC emoji
        npcElement.onclick = () => interactWithNPC(npc);
        map.appendChild(npcElement);
    });

    // Place the player in the center of the village
    player.style.left = `${Math.floor(mapSize / 2) * cellSize}px`;
    player.style.top = `${Math.floor(mapSize / 2) * cellSize}px`;
    player.textContent = '🧙‍♂️'; // Player emoji
    map.appendChild(player);

    locationInfo.innerHTML = `<p>Welcome to the village!</p>`;
}
function generateNewMap() {
    generateMap();
    player.style.left = `${Math.floor(mapSize / 2) * cellSize}px`;
    player.style.top = `${Math.floor(mapSize / 2) * cellSize}px`;
    updateCharacterInfo();
}