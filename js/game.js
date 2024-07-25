const map = document.getElementById('map');
const player = document.getElementById('player');
const characterInfo = document.getElementById('character-info');
const inventoryPanel = document.getElementById('inventory');
const locationInfo = document.getElementById('location-info');
const questInfo = document.getElementById('quest-info');
const combatInfo = document.getElementById('combat-info');
const dungeonOverlay = document.getElementById('dungeon-overlay');
const dungeonMap = document.getElementById('dungeon-map');

const dungeonSize = 10; // Update this if needed
const dungeonCellSize = 30; // Adjust accordingly

const mapSize = 25;
const cellSize = 500 / mapSize;
const mapData = [];
player.textContent = '🧙‍♂️'; // Player emoji

const character = {
    name: "Hero",
    level: 1,
    health: 100,
    maxHealth: 100,
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    experience: 0,
    gold: 0,
    inventory: [],
    inventoryLimit: 10,
    weapon: null,
    offhand: null,
    armor: null,
    killedEnemies: [],
    exploredAreas: [],
    x: 1,
    y: 1
};

const items = [
    { name: "Health Potion", effect: () => { character.health = Math.min(character.maxHealth, character.health + 50); }, type: 'potion', emoji: '🧪' },
    { name: "Strength Potion", effect: () => { character.strength += 5; }, type: 'potion', emoji: '💪' },
    { name: "Sword", damage: 10, type: 'equipment', slot: 'weapon', emoji: '⚔️' },
    { name: "Shield", defense: 5, type: 'equipment', slot: 'offhand', emoji: '🛡️' }
];

const merchantItems = [
    { name: "Health Potion", price: 10, effect: () => { character.health = Math.min(character.maxHealth, character.health + 50); }, type: 'potion' },
    { name: "Strength Potion", price: 15, effect: () => { character.strength += 5; }, type: 'potion' },
    { name: "Sword", price: 50, damage: 10, type: 'equipment', slot: 'weapon' },
    { name: "Shield", price: 40, defense: 5, type: 'equipment', slot: 'offhand' }
];

let dungeonData = [];
let playerDungeonPos = { x: 0, y: 0 };

function updateCharacterInfo() {
    characterInfo.innerHTML = `
        <h3>${character.name}</h3>
        <p>Level: ${character.level}</p>
        <p>Health: ${character.health}/${character.maxHealth}</p>
        <p>Strength: ${character.strength}</p>
        <p>Dexterity: ${character.dexterity}</p>
        <p>Intelligence: ${character.intelligence}</p>
        <p>Experience: ${character.experience}</p>
        <p>Gold: ${character.gold}</p>
    `;
}

function updateInventory() {
    inventoryPanel.innerHTML = "<h3>Inventory</h3>";
    character.inventory.forEach((item, index) => {
        inventoryPanel.innerHTML += `<p>${item.emoji} ${item.name} <button onclick="useItem(${index})">Use</button></p>`;
    });
}

function buyItem(index) {
    const item = merchantItems[index];
    if (character.gold >= item.price) {
        character.gold -= item.price;
        addItem(item);
        updateCharacterInfo();
        updateInventory();
        alert(`You bought a ${item.name}!`);
    } else {
        alert('Not enough gold!');
    }
}
function sellItem(index) {
    const item = character.inventory[index];
    const sellPrice = item.price ? item.price / 2 : 5; // Selling for half the buying price or default to 5 gold
    character.gold += sellPrice;
    removeItem(index);
    updateCharacterInfo();
    updateInventory();
    alert(`You sold a ${item.name} for ${sellPrice} gold!`);
}
// During initialization
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

function assignQuest(type) {
    const questType = questTypes.find(qt => qt.type === type);
    if (questType) {
        const quest = {
            type: questType.type,
            description: questType.description.replace('{target}', questType.target).replace('{reward}', questType.reward()),
            target: questType.target,
            reward: questType.reward(),
            completed: false,
            onComplete: questType.onComplete,
            checkCompletion: questType.checkCompletion
        };

        activeQuests.push(quest);
        renderQuestInfo();
    } else {
        console.error('Quest type not found:', type);
    }
}

function closeDialogue() {
    dialogueBox.style.display = 'none';
}

map.addEventListener('click', (e) => {
    const rect = map.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    const targetCell = mapData.find(cell => cell.x === x && cell.y === y);
    if (targetCell && targetCell.type !== 'obstacle') {
        player.style.left = `${x * cellSize}px`;
        player.style.top = `${y * cellSize}px`;
        player.textContent = '🧙‍♂️'; // Ensure the player emoji is visible
        checkLocation(x, y);
    }
});


function enterVillage() {
    map.innerHTML = ''; // Clear the existing map for the village

    const villageMapSize = 10;
    const villageCellSize = 50;

    // Generate village layout
    for (let y = 0; y < villageMapSize; y++) {
        for (let x = 0; x < villageMapSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.style.width = `${villageCellSize}px`;
            cell.style.height = `${villageCellSize}px`;
            cell.style.left = `${x * villageCellSize}px`;
            cell.style.top = `${y * villageCellSize}px`;

            let cellType = 'empty';
            let emoji = '';

            if (Math.random() < 0.1) {
                cellType = 'building';
                emoji = '🏠'; // Building emoji
            } else if (Math.random() < 0.05) {
                cellType = 'shop';
                emoji = '🏪'; // Shop emoji
            } else if (Math.random() < 0.05) {
                // Add nature elements with a rare chance
                const natureElements = ['🌸', '🌼', '🌳', '🌴', '🌷', '🌻', '🌺', '💧'];
                emoji = natureElements[Math.floor(Math.random() * natureElements.length)];
            }

            cell.classList.add(cellType);
            cell.textContent = emoji;
            map.appendChild(cell);
        }
    }

    // Add village NPCs
    const villageNpcs = [
        {
            name: "Villager",
            x: 3,
            y: 3,
            dialogue: "Welcome to our village!",
            emoji: '👩‍🌾'
        },
        {
            name: "Shopkeeper",
            x: 6,
            y: 6,
            dialogue: "Take a look at my wares.",
            emoji: '👨‍🌾'
        }
    ];

    villageNpcs.forEach(npc => {
        const npcElement = document.createElement('div');
        npcElement.classList.add('map-cell');
        npcElement.style.width = `${villageCellSize}px`;
        npcElement.style.height = `${villageCellSize}px`;
        npcElement.style.left = `${npc.x * villageCellSize}px`;
        npcElement.style.top = `${npc.y * villageCellSize}px`;
        npcElement.textContent = npc.emoji; // NPC emoji
        npcElement.onclick = () => interactWithNPC(npc);
        map.appendChild(npcElement);

        // Add walking animation
        setInterval(() => {
            npcElement.style.left = `${Math.floor(Math.random() * villageMapSize) * villageCellSize}px`;
            npcElement.style.top = `${Math.floor(Math.random() * villageMapSize) * villageCellSize}px`;
        }, 5000); // Change position every 5 seconds
    });

    // Place the player in the center of the village
    player.style.width = `${villageCellSize}px`;
    player.style.height = `${villageCellSize}px`;
    player.style.left = `${Math.floor(villageMapSize / 2) * villageCellSize}px`;
    player.style.top = `${Math.floor(villageMapSize / 2) * villageCellSize}px`;
    player.textContent = '🧙‍♂️'; // Player emoji
    map.appendChild(player);

    locationInfo.innerHTML = `<p>Welcome to the village!</p>`;
}
function checkLocation(x, y) {
    const location = mapData.find(loc => loc.x === x && loc.y === y);
    if (location) {
        if (location.type === 'dungeon') {
            locationInfo.innerHTML = `<p>You've entered a dungeon!</p>`;
            enterDungeon();
        } else if (location.type === 'quest') {
            locationInfo.innerHTML = `<p>You've found a quest!</p>`;
            generateQuest();
        } else if (location.type === 'village') {
            locationInfo.innerHTML = `<p>You've entered the village!</p>`;
            enterVillage();
        } else {
            locationInfo.innerHTML = `<p>Nothing interesting here.</p>`;
        }
    }

    // Check if player is at the edge of the map
    if (x === 0 || y === 0 || x === mapSize - 1 || y === mapSize - 1) {
        const moveToNewMap = confirm("You have reached the edge of the map. Do you want to move to a new location?");
        if (moveToNewMap) {
            generateNewMap();
        }
    }
}

function generateQuest() {
    const questType = questTypes[Math.floor(Math.random() * questTypes.length)];
    const quest = {
        type: questType.type,
        description: questType.description.replace('{target}', questType.target).replace('{reward}', questType.reward()),
        target: questType.target,
        reward: questType.reward(),
        completed: false,
        onComplete: questType.onComplete
    };

    activeQuests.push(quest);
    renderQuestInfo();
}

function renderQuestInfo() {
    questInfo.innerHTML = '<h3>Active Quests</h3>';
    activeQuests.forEach((quest, index) => {
        questInfo.innerHTML += `
            <div>
                <p>${quest.description}</p>
                <button onclick="completeQuest(${index})" ${quest.completed ? 'disabled' : ''}>Complete Quest</button>
            </div>
        `;
    });
}

function completeQuest(index) {
    const quest = activeQuests[index];
    if (!quest.completed) {
        quest.onComplete(quest);
        activeQuests.splice(index, 1); // Remove the completed quest from the list
        renderQuestInfo();
        updateCharacterInfo();
        checkLevelUp();
    }
}

function checkLevelUp() {
    if (character.experience >= character.level * 100) {
        character.level++;
        character.maxHealth += 10;
        character.health = character.maxHealth;
        character.strength += 2;
        character.dexterity += 2;
        character.intelligence += 2;
        character.experience = 0;
        updateCharacterInfo();
        alert(`Congratulations! You've reached level ${character.level}!`);
    }
}
function bfs(start, end, dungeon) {
    const directions = [
        { x: 0, y: -1 }, // up
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }, // left
        { x: 1, y: 0 }   // right
    ];

    const queue = [start];
    const visited = Array.from({ length: dungeon.length }, () => Array(dungeon[0].length).fill(false));
    visited[start.y][start.x] = true;

    while (queue.length > 0) {
        const { x, y } = queue.shift();

        if (x === end.x && y === end.y) {
            return true;
        }

        for (const { x: dx, y: dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && ny >= 0 && nx < dungeon[0].length && ny < dungeon.length && !visited[ny][nx] && dungeon[ny][nx] !== 'wall') {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny });
            }
        }
    }

    return false;
}
function generateDungeon() {
    const dungeonSize = 10;
    let validDungeon = false;

    while (!validDungeon) {
        dungeonData = [];

        for (let y = 0; y < dungeonSize; y++) {
            dungeonData[y] = [];
            for (let x = 0; x < dungeonSize; x++) {
                const cellType = Math.random() < 0.3 ? 'wall' : 'floor';
                dungeonData[y][x] = cellType;
            }
        }

        dungeonData[0][0] = 'entrance';
        dungeonData[dungeonSize - 1][dungeonSize - 1] = 'exit';

        const start = { x: 0, y: 0 };
        const end = { x: dungeonSize - 1, y: dungeonSize - 1 };

        validDungeon = bfs(start, end, dungeonData);
    }

    playerDungeonPos = { x: 0, y: 0 };
    renderDungeon();
    dungeonOverlay.style.display = 'flex';
}
function renderDungeon() {
    dungeonMap.innerHTML = '';
    dungeonMap.style.gridTemplateColumns = `repeat(${dungeonData[0].length}, ${dungeonCellSize}px)`;

    for (let y = 0; y < dungeonData.length; y++) {
        for (let x = 0; x < dungeonData[y].length; x++) {
            const cell = document.createElement('div');
            cell.classList.add('dungeon-cell', dungeonData[y][x]);
            cell.style.width = `${dungeonCellSize}px`;
            cell.style.height = `${dungeonCellSize}px`;
            cell.textContent = dungeonData[y][x] === 'wall' ? '⬛' : '⬜';

            if (x === playerDungeonPos.x && y === playerDungeonPos.y) {
                cell.textContent = '🧙‍♂️'; // Player emoji
            }

            cell.onclick = (e) => {
                e.stopPropagation(); // Stop the event from bubbling up
                moveToDungeonCell(x, y);
            };
            dungeonMap.appendChild(cell);
        }
    }
}

function moveToDungeonCell(x, y) {
    if (Math.abs(x - playerDungeonPos.x) + Math.abs(y - playerDungeonPos.y) === 1 &&
        dungeonData[y][x] !== 'wall') {
        playerDungeonPos = { x, y };
        player.style.left = `${x * dungeonCellSize}px`;
        player.style.top = `${y * dungeonCellSize}px`;
        renderDungeon();

        if (dungeonData[y][x] === 'exit') {
            exitDungeon();
        } else if (dungeonData[y][x] === 'trap') {
            character.health -= 10;
            alert('You triggered a trap! Lost 10 health.');
            updateCharacterInfo();
        } else if (dungeonData[y][x] === 'treasure') {
            const gold = Math.floor(Math.random() * 100) + 20;
            character.gold += gold;
            alert(`You found a treasure! Gained ${gold} gold.`);
            updateCharacterInfo();
        } else if (Math.random() < 0.2) {
            initiateCombat();
        }

        // Track explored area
        character.exploredAreas.push('ancient ruins'); // Modify as needed for actual areas

        // Check if the exploration was a quest target
        //checkQuestsCompletion();
    }
}

function enterDungeon() {
    generateDungeon();
    dungeonOverlay.style.display = 'flex';
}

function exitDungeon() {
    dungeonOverlay.style.display = 'none';
    locationInfo.innerHTML = `<p>You've exited the dungeon.</p>`;
}
const combatLog = document.getElementById('combat-log');
function initiateCombat() {
    const enemies = [
        { name: "Goblin", health: 30, armorClass: 12, attack: 5, damageDie: 6 },
        { name: "Orc", health: 45, armorClass: 13, attack: 7, damageDie: 8 },
        // { name: "Skeleton", health: 35, armorClass: 11, attack: 4, damageDie: 6 },
        // { name: "Dark Elf", health: 50, armorClass: 15, attack: 8, damageDie: 10 }
    ];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    character.currentEnemy = enemy;

    combatInfo.style.display = 'block';
    combatLog.innerHTML = `
        <h3>Combat: ${character.name} vs ${enemy.name}</h3>
        <p>${enemy.name} Health: ${enemy.health}</p>
    `;

    document.getElementById('attack-button').onclick = () => attack(enemy);
    document.getElementById('defend-button').onclick = () => defend(enemy);
    document.getElementById('use-potion-button').onclick = () => usePotion(enemy);
}
function attack(enemy) {
    const attackRoll = rollD20() + character.strength;
    let message = `<p>Attack Roll: ${attackRoll}</p>`;

    const weaponDamage = character.weapon ? character.weapon.damage : 4;  // Default damage die is 4 if no weapon equipped

    if (attackRoll >= enemy.armorClass) {
        const damage = rollDamage(weaponDamage);
        enemy.health -= damage;
        message += `<p>You hit the ${enemy.name} for ${damage} damage!</p>`;
    } else {
        message += `<p>You missed the ${enemy.name}!</p>`;
    }

    const enemyAttackRoll = rollD20() + enemy.attack;
    if (enemyAttackRoll >= character.dexterity) {
        const enemyDamage = rollDamage(enemy.damageDie);
        character.health -= enemyDamage;
        message += `<p>The ${enemy.name} hit you for ${enemyDamage} damage!</p>`;
    } else {
        message += `<p>The ${enemy.name} missed you!</p>`;
    }

    updateCombatStatus(message, enemy);
}

function defend(enemy) {
    const enemyAttackRoll = rollD20() + enemy.attack - character.dexterity;
    let message = `<p>You brace for an attack!</p>`;

    if (enemyAttackRoll >= character.armorClass) {
        const enemyDamage = rollDamage(enemy.damageDie);
        character.health -= enemyDamage;
        message += `<p>The ${enemy.name} hit you for ${enemyDamage} damage!</p>`;
    } else {
        message += `<p>The ${enemy.name} missed you!</p>`;
    }

    updateCombatStatus(message, enemy);
}

function usePotion(enemy) {
    const potion = character.inventory.find(item => item.name === 'Health Potion');
    if (potion) {
        potion.effect();
        character.inventory = character.inventory.filter(item => item !== potion);
        updateInventory();
        const message = `<p>You used a Health Potion and restored your health.</p>`;
        updateCombatStatus(message, enemy);
    } else {
        combatLog.innerHTML += '<p>No potions available!</p>';
    }
}

function updateCombatStatus(message, enemy) {
    combatLog.innerHTML += message;
    if (enemy.health <= 0) {
        combatLog.innerHTML += `<p>You defeated the ${enemy.name}! ⚔️</p>`;
        character.experience += 50;
        const goldReward = Math.floor(Math.random() * 50) + 10;
        character.gold += goldReward;
        combatLog.innerHTML += `<p>You gained 50 experience and ${goldReward} gold. 🪙</p>`;

        // Track killed enemy
        character.killedEnemies.push(enemy.name.toLowerCase());

        // Check if the enemy was a quest target
        //checkQuestsCompletion();

        if (Math.random() < 0.3) {
            const item = items[Math.floor(Math.random() * items.length)];
            addItem(item);
            combatLog.innerHTML += `<p>You found a ${item.name}! 🎁</p>`;
        }
        updateCharacterInfo();
        updateInventory();
        checkLevelUp();
        combatInfo.style.display = 'none';
    } else if (character.health <= 0) {
        combatLog.innerHTML += `<p>You were defeated. Game Over! 💀</p>`;
        exitDungeon();
    } else {
        combatLog.scrollTop = combatLog.scrollHeight;
    }
}

function addItem(item) {
    if (character.inventory.length < character.inventoryLimit) {
        character.inventory.push(item);
        updateInventory();
    } else {
        alert('Inventory is full!');
    }
}
function removeItem(index) {
    character.inventory.splice(index, 1);
    updateInventory();
}

function updateInventory() {
    inventoryPanel.innerHTML = "<h3>Inventory</h3>";
    character.inventory.forEach((item, index) => {
        inventoryPanel.innerHTML += `
            <div>
                <p>${item.name}</p>
                <button onclick="useItem(${index})">Use</button>
                <button onclick="removeItem(${index})">Remove</button>
            </div>
        `;
    });
}
function useItem(index) {
    const item = character.inventory[index];
    if (item.effect) {
        item.effect();
        removeItem(index);
    } else if (item.type === 'equipment') {
        equipItem(item);
        removeItem(index);
    }
    updateCharacterInfo();
    updateInventory();
}
function equipItem(index) {
    const item = character.inventory[index];
    if (item.type === 'equipment') {
        if (item.slot === 'weapon') {
            character.weapon = item;
        } else if (item.slot === 'offhand') {
            character.offhand = item;
        } else if (item.slot === 'armor') {
            character.armor = item;
        }
        removeItem(index);
        renderInventoryMenu();
        updateCharacterStats();
    }
}

function unequipItem(slot) {
    if (slot === 'weapon' && character.weapon) {
        addItem(character.weapon);
        character.weapon = null;
    } else if (slot === 'offhand' && character.offhand) {
        addItem(character.offhand);
        character.offhand = null;
    } else if (slot === 'armor' && character.armor) {
        addItem(character.armor);
        character.armor = null;
    }
    updateEquipSlots();
    updateCharacterStats();
}

function updateCharacterStats() {
    character.strength = 10 + (character.weapon ? character.weapon.damage : 0);
    character.dexterity = 10 + (character.offhand ? character.offhand.defense : 0);
    // Adjust other stats if needed
    updateCharacterInfo();
}

const inventoryMenu = document.getElementById('inventory-menu');
const inventoryItems = document.getElementById('inventory-items');
const weaponSlot = document.getElementById('weapon-slot');
const offhandSlot = document.getElementById('offhand-slot');
const armorSlot = document.getElementById('armor-slot');

function openInventoryMenu() {
    inventoryMenu.style.display = 'block';
    renderInventoryMenu();
}

function closeInventoryMenu() {
    inventoryMenu.style.display = 'none';
}

function renderInventoryMenu() {
    inventoryItems.innerHTML = '';
    character.inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.innerHTML = `
            <p>${item.name}</p>
            <button onclick="useItem(${index})">Use</button>
            <button onclick="equipItem(${index})">Equip</button>
            <button onclick="removeItem(${index})">Remove</button>
            <button onclick="sellItem(${index})">Sell</button>
        `;
        inventoryItems.appendChild(itemDiv);
    });

    updateEquipSlots();
}

function updateEquipSlots() {
    weaponSlot.innerHTML = character.weapon ? character.weapon.name : '';
    offhandSlot.innerHTML = character.offhand ? character.offhand.name : '';
    armorSlot.innerHTML = character.armor ? character.armor.name : '';
}

function equipItem(index) {
    const item = character.inventory[index];
    if (item.type === 'equipment') {
        if (item.slot === 'weapon') {
            character.weapon = item;
        } else if (item.slot === 'offhand') {
            character.offhand = item;
        } else if (item.slot === 'armor') {
            character.armor = item;
        }
        removeItem(index);
        renderInventoryMenu();
    }
}

function unequipItem(slot) {
    if (slot === 'weapon' && character.weapon) {
        addItem(character.weapon);
        character.weapon = null;
    } else if (slot === 'offhand' && character.offhand) {
        addItem(character.offhand);
        character.offhand = null;
    } else if (slot === 'armor' && character.armor) {
        addItem(character.armor);
        character.armor = null;
    }
    updateEquipSlots();
}

weaponSlot.addEventListener('click', () => unequipItem('weapon'));
offhandSlot.addEventListener('click', () => unequipItem('offhand'));
armorSlot.addEventListener('click', () => unequipItem('armor'));

function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function rollD20() {
    return rollDice(20);
}

function rollDamage(damageDie, count = 1) {
    let damage = 0;
    for (let i = 0; i < count; i++) {
        damage += rollDice(damageDie);
    }
    return damage;
}
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 10;
        this.attackPattern = ["normal", "aggressive"];
        this.speed = 2;
    }

    update() {
        if (Math.random() < 0.1) { // 10% chance of moving
            const dx = Math.floor(Math.random() * 3) - 1; // random movement
            const dy = Math.floor(Math.random() * 3) - 1;
            this.x += dx;
            this.y += dy;
        }

        if (player.x === this.x && player.y === this.y) { // enemy sees the player
            if (Math.random() < 0.5) { // 50% chance of attacking
                attackPlayer();
            }
        }
    }
}

// Define the player object and attackPlayer function

function attackPlayer() {
    console.log("Enemy attacked!");
    const playerHealth = 10;
    let damageDealt;

    if (character.weapon) {
        damageDealt = rollDamage(6, 2); // assume a damage die of 6 for simplicity
        character.health -= damageDealt;
        console.log(`You hit the enemy for ${damageDealt} damage!`);
    } else {
        console.log("You're not equipped to attack!");
    }

    if (character.health <= 0) {
        console.log("You died!");
        // TO DO: implement game over logic
    }
}

// Create some enemies on the map
const enemy1 = new Enemy(5, 5);
const enemy2 = new Enemy(8, 3);

// Update the enemies every frame (e.g., every 16ms)
function updateEnemies() {
    enemy1.update();
    enemy2.update();
}
setInterval(updateEnemies, 160); // Change every 30 seconds

// Example of opening inventory menu (add to some event or button)
document.body.addEventListener('keydown', (e) => {
    if (e.key === 'i') {
        openInventoryMenu();
    }
});
let isDay = true;

function toggleDayNight() {
    isDay = !isDay;
    map.style.backgroundColor = isDay ? '#3a3' : '#111';
}

setInterval(toggleDayNight, 30000); // Change every 30 seconds

// Initialize game
generateMap();
updateCharacterInfo();