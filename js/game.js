// Constants
const MAP_SIZE = 40; // Ensure this matches your map size
const CELL_SIZE = 40; // Cell size remains consistentconst
const DUNGEON_SIZE = 10;
const DUNGEON_CELL_SIZE = 30;
const VILLAGE_MAP_SIZE = 40;
const VILLAGE_CELL_SIZE = 40;
const INTERVAL_MS = 160;
const DAY_NIGHT_INTERVAL_MS = 30000;
const RANDOM_EVENT_INTERVAL_MS = 60000;

let mapData = [];
let dungeonData = [];
let playerDungeonPos = { x: 0, y: 0 };
let activeQuests = [];
let isDay = true;
let selectedRecipeIndex = null;
let currentTurnIndex = 0;
let turnTimeLimit = 30; // Time limit for each turn in seconds
let turnTimer;
let combatData = {
    allies: [],
    enemies: [],
    log: []
};

// DOM Elements
const map = document.getElementById('map');
const player = document.getElementById('player');
const characterInfo = document.getElementById('character-info');
const inventoryPanel = document.getElementById('inventory');
const locationInfo = document.getElementById('location-info');
const questInfo = document.getElementById('quest-info');
const combatInfo = document.getElementById('combat-info');
const dungeonOverlay = document.getElementById('dungeon-overlay');
const dungeonMap = document.getElementById('dungeon-map');
const inventoryMenu = document.getElementById('inventory-menu');
const weaponSlot = document.getElementById('weapon-slot');
const bodySlot = document.getElementById('body-slot');
const ringSlot = document.getElementById('ring-slot');
const headSlot = document.getElementById('head-slot');
const offhandSlot = document.getElementById('offhand-slot');
const feetSlot = document.getElementById('feet-slot');
const combatLog = document.getElementById('combat-log');
const combatModal = document.getElementById('combat-modal');

// Player Data
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
    equipped: {
        weapon: null,
        offhand: null,
        head: null,
        body: null,
        feet: null,
        ring: null
    },
    inventoryLimit: 10,
    weapon: null,
    offhand: null,
    armor: null,
    killedEnemies: [],
    exploredAreas: [],
    x: 1,
    y: 1,
    class: null,
    skills: [],
    learnedSkills: [] // Add this line to track learned skills
};

// Items Data
const items = [
    { name: "Health Potion", effect: () => { character.health = Math.min(character.maxHealth, character.health + 50); }, type: 'potion', emoji: '🧪', price: 10 },
    { name: "Strength Potion", effect: () => { character.strength += 5; }, type: 'potion', emoji: '💪', price: 15 },
    { name: "Sword", damage: 10, type: 'equipment', slot: 'weapon', emoji: '⚔️', price: 50 },
    { name: "Shield", defense: 5, type: 'equipment', slot: 'offhand', emoji: '🛡️', price: 40 },
    { name: "Golden Crown", effect: () => { character.gold += 100; }, type: 'unique', emoji: '👑', price: 200 },
    { name: "Ancient Artifact", effect: () => { character.experience += 200; }, type: 'unique', emoji: '🏺', price: 300 },
    { name: "Mystic Staff", effect: () => { character.intelligence += 10; }, type: 'equipment', slot: 'weapon', emoji: '🔮', price: 300 },
    { name: "Healing Herb", effect: () => { character.health = Math.min(character.maxHealth, character.health + 50); }, type: 'potion', emoji: '🌿', price: 20 },
    { name: "Dragon Scale Armor", defense: 20, type: 'equipment', slot: 'armor', emoji: '🛡️', price: 500 },
    { name: "Fire Gem", type: 'ingredient', emoji: '🔥', price: 300 },
    { name: "Bottle", type: 'ingredient', emoji: '🍾', price: 10 }
];

const craftingRecipes = [
    {
        result: { name: 'Health Potion', emoji: '🍷', type: 'potion' },
        ingredients: [
            { name: 'Herb', emoji: '🌿', type: 'ingredient' },
            { name: 'Bottle', emoji: '🍾', type: 'container' }
        ]
    },
    {
        result: { name: 'Fire Sword', emoji: '🔥🗡️', type: 'weapon' },
        ingredients: [
            { name: 'Sword', emoji: '🗡️', type: 'weapon' },
            { name: 'Fire Gem', emoji: '🔥', type: 'ingredient' }
        ]
    }
];

window.onload = function() {
    document.getElementById('character-creation-menu').style.display = 'block';
};

function updateCharacterInfo() {
    characterInfo.innerHTML = `
        <h3>${character.name}</h3>
        <p>Class: ${character.class}</p>
        <p>Level: ${character.level}</p>
        <p>Health: ${character.health}/${character.maxHealth}</p>
        <p>Strength: ${character.strength}</p>
        <p>Dexterity: ${character.dexterity}</p>
        <p>Intelligence: ${character.intelligence}</p>
        <p>Experience: ${character.experience}</p>
        <p>Gold: ${character.gold}</p>
    `;
}

// =============================================================
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
// |||                INVENTORY MANAGEMENT SYSTEM             |||
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
// =============================================================
function updateInventory() {
    return;
    inventoryPanel.innerHTML = "<h3>Inventory</h3>";
    const itemHtml = character.inventory.map((item, index) => {
        return `
            <div class="inventory-item" onmouseover="showTooltip(${index})" onmouseout="hideTooltip()">
                <p>${item.emoji} ${item.name} 
                    <button onclick="useItem(${index})">Use</button>
                    <button onclick="equipItem(${index})" ${item.type !== 'equipment' ? 'disabled' : ''}>Equip</button>
                    <button onclick="sellItem(${index})">Sell</button>
                </p>
                <div id="tooltip-${index}" class="tooltip" style="display: none;">
                    ${item.name}: ${item.type === 'potion' ? 'Restores health or boosts stats.' : item.type === 'equipment' ? 'Used to enhance combat abilities.' : 'Special item.'}
                </div>
            </div>`;
    }).join('');
    inventoryPanel.innerHTML += itemHtml;
}

function tradeItem(traderName, itemName) {
    const trader = traders.find(t => t.name === traderName);
    if (trader && trader.items.includes(itemName)) {
        const item = items.find(i => i.name === itemName);
        if (item && character.gold >= item.price) {
            character.gold -= item.price;
            addItem(item);
            updateInventory();
            updateCharacterInfo();
            alert(`You bought a ${item.name} from ${trader.name}!`);
        } else {
            alert('Not enough gold or item not found!');
        }
    }
}

// ----- End of Inventory Data -----

// Function to open the crafting modal
function openCrafting() {
    renderCraftingRecipes();
    document.getElementById('crafting-modal').style.display = 'block';
}

// Function to render crafting recipes
function renderCraftingRecipes() {
    const craftingRecipesContainer = document.getElementById('crafting-recipes');
    craftingRecipesContainer.innerHTML = '';
    craftingRecipes.forEach((recipe, index) => {
        const recipeDiv = document.createElement('div');
        recipeDiv.classList.add('recipe-item');
        const ingredients = recipe.ingredients.map(ing => `${ing.emoji}`).join(' + ');
        recipeDiv.innerHTML = `${ingredients} = ${recipe.result.emoji} <br> ${recipe.result.name}`;
        recipeDiv.onclick = () => selectRecipe(index);
        craftingRecipesContainer.appendChild(recipeDiv);
    });
}

// Function to select a crafting recipe
function selectRecipe(index) {
    selectedRecipeIndex = index;
    const selectedRecipe = craftingRecipes[index];
    alert(`Selected recipe: ${selectedRecipe.result.name}`);
}

// Function to craft the selected item
function craftItem() {
    if (selectedRecipeIndex === null) {
        alert('Please select a recipe first.');
        return;
    }
    
    const recipe = craftingRecipes[selectedRecipeIndex];
    const ingredientsNeeded = recipe.ingredients;
    const hasAllIngredients = ingredientsNeeded.every(ingredient => 
        character.inventory.some(item => item.name === ingredient.name)
    );

    if (!hasAllIngredients) {
        alert('You do not have all the necessary ingredients.');
        return;
    }

    // Remove ingredients from inventory
    ingredientsNeeded.forEach(ingredient => {
        const itemIndex = character.inventory.findIndex(item => item.name === ingredient.name);
        character.inventory.splice(itemIndex, 1);
    });

    // Add crafted item to inventory
    character.inventory.push(recipe.result);
    renderInventory();
    alert(`You crafted: ${recipe.result.name}`);
}

const merchantItems = [...items];
const inventoryCategories = {
    all: items,
    equipment: items.filter(item => item.type === 'equipment'),
    consumables: items.filter(item => item.type === 'potion'),
    other: items.filter(item => item.type !== 'equipment' && item.type !== 'potion')
};

// Example of integrating crafting with inventory
document.getElementById('crafting-modal').addEventListener('show', renderCraftingRecipes);

const traders = [
    {
        name: "Merchant",
        items: ["Health Potion", "Strength Potion", "Mystic Staff"]
    }
];

const skills = {
    warrior: [
        { name: "Power Strike", levelRequired: 1, effect: () => { character.strength += 5; }, description: "Increases strength by 5." },
        { name: "Shield Block", levelRequired: 2, effect: () => { character.dexterity += 3; }, description: "Increases dexterity by 3." }
    ],
    mage: [
        { name: "Fireball", levelRequired: 1, effect: () => { character.intelligence += 5; }, description: "Increases intelligence by 5." },
        { name: "Mana Shield", levelRequired: 2, effect: () => { character.maxHealth += 10; }, description: "Increases max health by 10." }
    ],
    rogue: [
        { name: "Stealth", levelRequired: 1, effect: () => { character.dexterity += 5; }, description: "Increases dexterity by 5." },
        { name: "Backstab", levelRequired: 2, effect: () => { character.strength += 3; }, description: "Increases strength by 3." }
    ]
};

function levelUpSkill(skillName) {
    // Ensure character.class is set before accessing skills
    if (!character.class) {
        alert('Please choose a class first!');
        return;
    }

    const classSkills = classes[character.class].skills;
    const skill = classSkills.find(s => s.name === skillName);

    // Check if the skill has already been learned
    if (character.learnedSkills.includes(skillName)) {
        alert(`You have already learned ${skillName}.`);
        return;
    }

    // Check if the character's level is sufficient to learn the skill
    if (skill && character.level >= skill.levelRequired) {
        skill.effect();
        character.learnedSkills.push(skillName); // Mark the skill as learned
        alert(`You have learned ${skill.name}!`);
        updateCharacterInfo();
    } else {
        alert('Skill not available or level too low!');
    }
}
function updateSkillProgress() {
    const progressBars = document.querySelectorAll('.skill-progress-bar');
    progressBars.forEach(bar => {
        const skillLevel = character.level;
        const skillRequiredLevel = parseInt(bar.dataset.levelRequired, 10);
        const progress = Math.min((skillLevel / skillRequiredLevel) * 100, 100);
        bar.style.width = `${progress}%`;
    });
}
function openSkillsMenu() {
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';

    // Ensure character.class is set before accessing skills
    if (!character.class) {
        alert('Please choose a class first!');
        return;
    }

    const classSkills = classes[character.class].skills;

    classSkills.forEach(skill => {
        const skillItem = document.createElement('div');
        skillItem.classList.add('skill-item');
        const learned = character.learnedSkills.includes(skill.name) ? ' (Learned)' : '';
        skillItem.innerHTML = `
            <p>${skill.name} (Level ${skill.levelRequired})${learned}</p>
            <button onclick="levelUpSkill('${skill.name}')" ${learned ? 'disabled' : ''}>Learn</button>
            <div class="skill-progress">
                <div class="skill-progress-bar" data-level-required="${skill.levelRequired}"></div>
            </div>
        `;
        skillsList.appendChild(skillItem);
    });

    updateSkillProgress();
    document.getElementById('skills-menu').style.display = 'block';
}

function closeSkillsMenu() {
    document.getElementById('skills-menu').style.display = 'none';
}

// Event listener to open skills menu (for example, pressing 'k' opens the skills menu)
document.body.addEventListener('keydown', (e) => {
    if (e.key === 'k') {
        openSkillsMenu();
    }
    if (e.key === 'C' || e.key === 'c') {
        openCrafting();
    }
});

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

    const villageX = Math.floor(MAP_SIZE / 2) + 2;
    const villageY = Math.floor(MAP_SIZE / 2) + 2;
    const arenaX = Math.floor(MAP_SIZE / 2) - 2;
    const arenaY = Math.floor(MAP_SIZE / 2) - 2;

    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell', 'hidden'); // Initially, all cells are hidden
            cell.style.left = `${x * CELL_SIZE}px`;
            cell.style.top = `${y * CELL_SIZE}px`;

            let cellType = 'empty';
            let emoji = ''; // Default to empty ground

            if (x === villageX && y === villageY) {
                cellType = 'village';
                emoji = '🏡'; // Village emoji
            } else if (x === arenaX && y === arenaY) {
                cellType = 'arena';
                emoji = '🏟️'; // Arena emoji
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
            } else if (Math.random() < 0.1) {
                cellType = 'enemy';
                emoji = '👹'; // Enemy emoji
            }

            cell.classList.add(cellType);
            cell.textContent = emoji;
            map.appendChild(cell);
            mapData.push({ x, y, type: cellType, explored: false });
        }
    }

    // Place the player initially
    character.x = Math.floor(MAP_SIZE / 2); // Center player in the map initially
    character.y = Math.floor(MAP_SIZE / 2); // Center player in the map initially
    player.style.left = `${character.x * CELL_SIZE}px`;
    player.style.top = `${character.y * CELL_SIZE}px`;
    player.textContent = '🧙‍♂️'; // Player emoji
    map.appendChild(player);

    revealArea(character.x, character.y); // Reveal the initial area where the player starts
    updateVisibility(); // Update visibility for the initial state
}

function revealArea(x, y) {
    const revealRadius = 3; // Define the radius around the player that should be visible

    for (let i = -revealRadius; i <= revealRadius; i++) {
        for (let j = -revealRadius; j <= revealRadius; j++) {
            const cellX = x + i;
            const cellY = y + j;
            const cell = mapData.find(cell => cell.x === cellX && cell.y === cellY);
            if (cell) {
                cell.explored = true;
                const cellElement = document.querySelector(`.map-cell[style*="left: ${cellX * CELL_SIZE}px;"][style*="top: ${cellY * CELL_SIZE}px;"]`);
                if (cellElement) {
                    cellElement.classList.remove('hidden');
                    cellElement.classList.add('visible');
                }
            }
        }
    }
}

function generateVillageMap() {
    map.innerHTML = ''; // Clear the existing map
    mapData.length = 0; // Reset the map data

    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.style.left = `${x * CELL_SIZE}px`;
            cell.style.top = `${y * CELL_SIZE}px`;

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
        npcElement.style.left = `${npc.x * CELL_SIZE}px`;
        npcElement.style.top = `${npc.y * CELL_SIZE}px`;
        npcElement.textContent = '👤'; // NPC emoji
        npcElement.onclick = () => interactWithNPC(npc);
        map.appendChild(npcElement);
    });

    // Place the player in the center of the village
    player.style.left = `${Math.floor(MAP_SIZE / 2) * CELL_SIZE}px`;
    player.style.top = `${Math.floor(MAP_SIZE / 2) * CELL_SIZE}px`;
    player.textContent = '🧙‍♂️'; // Player emoji
    map.appendChild(player);

    locationInfo.innerHTML = `<p>Welcome to the village!</p>`;
}
function generateNewMap() {
    generateMap();
    player.style.left = `${Math.floor(MAP_SIZE / 2) * CELL_SIZE}px`;
    player.style.top = `${Math.floor(MAP_SIZE / 2) * CELL_SIZE}px`;
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
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    const playerX = character.x;
    const playerY = character.y;

    if (Math.abs(playerX - x) + Math.abs(playerY - y) === 1) {
        const targetCell = mapData.find(cell => cell.x === x && cell.y === y);
        if (targetCell && targetCell.type !== 'obstacle') {
            player.style.left = `${x * CELL_SIZE}px`;
            player.style.top = `${y * CELL_SIZE}px`;
            character.x = x;
            character.y = y;
            checkLocation(x, y);
            revealArea(x, y);
            updateVisibility();
        }
    }
});

// Function to update the visibility of the map
function updateVisibility() {
    const visibilityRadius = 2; // Radius to cover a 5x5 area (2 cells in each direction from the player)

    mapData.forEach(cell => {
        const cellElement = document.querySelector(`.map-cell[style*="left: ${cell.x * CELL_SIZE}px"][style*="top: ${cell.y * CELL_SIZE}px"]`);
        if (cellElement) {
            const distanceX = Math.abs(cell.x - character.x);
            const distanceY = Math.abs(cell.y - character.y);

            if (distanceX <= visibilityRadius && distanceY <= visibilityRadius) {
                cellElement.classList.remove('hidden', 'fog');
                cellElement.classList.add('visible');
            } else {
                cellElement.classList.remove('visible', 'fog');
                cellElement.classList.add('hidden');
            }
        }
    });

    // Center the fog overlay on the player
    const fogOverlay = document.getElementById('fog-overlay');
    if (fogOverlay) {
        fogOverlay.style.left = `${(character.x * CELL_SIZE) - (fogOverlay.clientWidth / 2) + (CELL_SIZE / 2)}px`;
        fogOverlay.style.top = `${(character.y * CELL_SIZE) - (fogOverlay.clientHeight / 2) + (CELL_SIZE / 2)}px`;
    }
    centerMapOnPlayer();
}

function centerMapOnPlayer() {
    const mapContainer = document.getElementById('map-container');
    const map = document.getElementById('map');
    const playerX = character.x * CELL_SIZE;
    const playerY = character.y * CELL_SIZE;
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;

    const offsetX = containerWidth / 2 - playerX - CELL_SIZE / 2;
    const offsetY = containerHeight / 2 - playerY - CELL_SIZE / 2;

    map.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    updatePlayerPosition();
}

function updatePlayerPosition() {
    const player = document.getElementById('player');
    player.style.left = `${character.x * CELL_SIZE}px`;
    player.style.top = `${character.y * CELL_SIZE}px`;
}

function updateFogOverlay() {
    const fogOverlay = document.getElementById('fog-overlay');
    if (fogOverlay) {
        const offsetX = (character.x * CELL_SIZE) - (fogOverlay.clientWidth / 2) + (CELL_SIZE / 2);
        const offsetY = (character.y * CELL_SIZE) - (fogOverlay.clientHeight / 2) + (CELL_SIZE / 2);
        fogOverlay.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
}

function enterVillage() {
    const map = document.getElementById('map');
    if (!map) {
        console.error('Map element not found');
        return;
    }
    map.innerHTML = ''; // Clear the existing map for the village

    const villageMAP_SIZE = 10;
    const villageCELL_SIZE = 50;

    // Set the new size for the map container to fit the village
    map.style.width = `${villageMAP_SIZE * villageCELL_SIZE}px`;
    map.style.height = `${villageMAP_SIZE * villageCELL_SIZE}px`;

    // Generate village layout
    for (let y = 0; y < villageMAP_SIZE; y++) {
        for (let x = 0; x < villageMAP_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.style.width = `${villageCELL_SIZE}px`;
            cell.style.height = `${villageCELL_SIZE}px`;
            cell.style.left = `${x * villageCELL_SIZE}px`;
            cell.style.top = `${y * villageCELL_SIZE}px`;

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
        npcElement.style.width = `${villageCELL_SIZE}px`;
        npcElement.style.height = `${villageCELL_SIZE}px`;
        npcElement.style.left = `${npc.x * villageCELL_SIZE}px`;
        npcElement.style.top = `${npc.y * villageCELL_SIZE}px`;
        npcElement.textContent = npc.emoji; // NPC emoji
        npcElement.onclick = () => interactWithNPC(npc);
        map.appendChild(npcElement);
    });

    const player = document.createElement('div'); // or 'span', 'p', etc.
    player.id = 'player';

    if (player) {
        player.style.width = `${villageCELL_SIZE}px`;
        player.style.height = `${villageCELL_SIZE}px`;
        player.style.left = `${Math.floor(villageMAP_SIZE / 2) * villageCELL_SIZE}px`;
        player.style.top = `${Math.floor(villageMAP_SIZE / 2) * villageCELL_SIZE}px`;
        player.textContent = '🧙‍♂️'; // Player emoji
        map.appendChild(player);
    } else {
        console.error('Player element not found');
    }
    character.x = Math.floor(villageMAP_SIZE / 2); // Center player in the map initially
    character.y = Math.floor(villageMAP_SIZE / 2); // Center player in the map initially

    const locationInfo = document.getElementById('location-info');
    if (locationInfo) {
        locationInfo.innerHTML = `<p>Welcome to the village!</p>`;
    } else {
        console.error('Location info element not found');
    }
}

// Arena functionalities
function enterArena() {
    const map = document.getElementById('map');
    if (!map) {
        console.error('Map element not found');
        return;
    }

    map.innerHTML = ''; // Clear the existing map but retain the player element
    mapData = []; // Clear and refill mapData

    const arenaMAP_SIZE = 10;
    const arenaCELL_SIZE = 40;

    // Set the new size for the map container to fit the arena
    map.style.width = `${arenaMAP_SIZE * arenaCELL_SIZE}px`;
    map.style.height = `${arenaMAP_SIZE * arenaCELL_SIZE}px`;

    // Generate arena layout with predefined points
    for (let y = 0; y < arenaMAP_SIZE; y++) {
        for (let x = 0; x < arenaMAP_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('map-cell');
            cell.style.width = `${arenaCELL_SIZE}px`;
            cell.style.height = `${arenaCELL_SIZE}px`;
            cell.style.left = `${x * arenaCELL_SIZE}px`;
            cell.style.top = `${y * arenaCELL_SIZE}px`;

            let cellType = 'arena-floor';
            let emoji = '';

            if (x === 3 && y === 3) {
                cellType = 'arena-fight';
                emoji = '⚔️'; // Fight start point
                cell.title = 'Fight';
            } else if (x === 3 && y === 6) {
                cellType = 'arena-shop';
                emoji = '🏪'; // Shop emoji
                cell.title = 'Shop';
            } else if (x === 6 && y === 3) {
                cellType = 'arena-exit';
                emoji = '🚪'; // Exit emoji
                cell.title = 'Exit';
            } else if (Math.random() < 0.1) {
                cellType = 'barrier';
                emoji = '🧱'; // Barrier emoji
            } else if (Math.random() < 0.1) {
                cellType = 'npc';
                emoji = '🧝‍♂️'; // NPC emoji
            }

            cell.classList.add(cellType);
            cell.textContent = emoji;
            map.appendChild(cell);
            mapData.push({ x, y, type: cellType, explored: true });
        }
    }

    // Place the player in the center of the arena
    character.x = Math.floor(arenaMAP_SIZE / 2);
    character.y = Math.floor(arenaMAP_SIZE / 2);
    player.style.width = `${arenaCELL_SIZE}px`;
    player.style.height = `${arenaCELL_SIZE}px`;
    player.style.left = `${character.x * arenaCELL_SIZE}px`;
    player.style.top = `${character.y * arenaCELL_SIZE}px`;
    player.textContent = '🧙‍♂️'; // Player emoji
    map.appendChild(player);

    const locationInfo = document.getElementById('location-info');
    if (locationInfo) {
        locationInfo.innerHTML = `<p>Welcome to the arena!</p>`;
    } else {
        console.error('Location info element not found');
    }
}


function startCombat(allies, enemies) {
    // Initialize combat turn system for multiple entities
    let turnIndex = 0;
    const combatants = [...allies, ...enemies];

    function nextTurn() {
        const currentCombatant = combatants[turnIndex];
        // Handle combat logic for the current combatant
        // ...
        turnIndex = (turnIndex + 1) % combatants.length;
    }

    // Start the combat loop
    nextTurn();
}

function enterArenaShop() {
    closeModal('arena-modal');
    const shopItems = [
        { name: "Gladiator's Sword", damage: 15, type: 'equipment', slot: 'weapon', emoji: '⚔️', price: 100 },
        { name: "Gladiator's Shield", defense: 10, type: 'equipment', slot: 'offhand', emoji: '🛡️', price: 80 },
        { name: "Arena Health Potion", effect: () => { character.health = Math.min(character.maxHealth, character.health + 75); }, type: 'potion', emoji: '🧪', price: 30 }
    ];
    displayMerchantMenu(shopItems);
}
function updateCombatDisplay() {
    const alliesList = document.getElementById('allies-list');
    const enemiesList = document.getElementById('enemies-list');
    alliesList.innerHTML = '';
    enemiesList.innerHTML = '';

    allies.forEach(ally => {
        const allyDiv = document.createElement('div');
        allyDiv.innerHTML = `${ally.emoji} ${ally.name} (HP: ${ally.health}/${ally.maxHealth})`;
        alliesList.appendChild(allyDiv);
    });

    enemies.forEach(enemy => {
        const enemyDiv = document.createElement('div');
        enemyDiv.innerHTML = `${enemy.emoji} ${enemy.name} (HP: ${enemy.health}/${enemy.maxHealth})`;
        enemiesList.appendChild(enemyDiv);
    });
}
let allies = [];
let enemies = [];

function joinGladiators() {
    allies = [character]; // Add the player character to the allies
    enemies = generateEnemies(3); // Generate 3 enemies for the example

    openArenaCombatModal();
    updateArenaCombatLog("You joined the gladiators!");
    updateArenaCombatLists();
}

function generateEnemies(number) {
    const enemyList = [];
    for (let i = 0; i < number; i++) {
        enemyList.push({
            name: `Enemy ${i + 1}`,
            health: 50,
            maxHealth: 50,
            strength: 8,
            dexterity: 5,
            intelligence: 3,
            emoji: '👹'
        });
    }
    return enemyList;
}

function openArenaCombatModal() {
    document.getElementById('arena-combat-modal').style.display = 'block';
}

function updateArenaCombatLog(message) {
    const log = document.getElementById('arena-combat-log');
    log.innerHTML += `<p>${message}</p>`;
}

function updateArenaCombatLists() {
    const alliesList = document.getElementById('allies-list');
    const enemiesList = document.getElementById('enemies-list');

    alliesList.innerHTML = '';
    enemiesList.innerHTML = '';

    allies.forEach(ally => {
        const allyItem = document.createElement('div');
        allyItem.textContent = `${ally.emoji} ${ally.name} - ${ally.health}/${ally.maxHealth}`;
        alliesList.appendChild(allyItem);
    });

    enemies.forEach(enemy => {
        const enemyItem = document.createElement('div');
        enemyItem.textContent = `${enemy.emoji} ${enemy.name} - ${enemy.health}/${enemy.maxHealth}`;
        enemiesList.appendChild(enemyItem);
    });
}

function attack(target) {
    const damage = character.strength;
    target.health -= damage;
    updateArenaCombatLog(`You attacked ${target.name} for ${damage} damage!`);
    if (target.health <= 0) {
        updateArenaCombatLog(`${target.name} is defeated!`);
        enemies = enemies.filter(enemy => enemy.health > 0); // Remove defeated enemies
    }
    updateArenaCombatLists();
    enemyTurn();
}

function defend() {
    // Implement defense logic
    updateArenaCombatLog(`You defend yourself.`);
    enemyTurn();
}

function usePotion() {
    // Implement potion use logic
    updateArenaCombatLog(`You used a potion.`);
    enemyTurn();
}

function enemyTurn() {
    enemies.forEach(enemy => {
        const damage = enemy.strength;
        character.health -= damage;
        updateArenaCombatLog(`${enemy.name} attacked you for ${damage} damage!`);
    });
    updateArenaCombatLists();
    checkCombatEnd();
}

function checkCombatEnd() {
    if (character.health <= 0) {
        updateArenaCombatLog(`You are defeated!`);
        endArenaCombat();
    } else if (enemies.length === 0) {
        updateArenaCombatLog(`You have defeated all enemies!`);
        endArenaCombat();
    }
}

function endArenaCombat() {
    document.getElementById('arena-combat-modal').style.display = 'none';
    updateCharacterInfo();
}


function displayMerchantMenu(items) {
    const merchantMenu = document.getElementById('merchant-menu');
    const merchantItemsDiv = document.getElementById('merchant-items');
    merchantItemsDiv.innerHTML = '';

    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');
        itemDiv.innerHTML = `<span>${item.emoji} ${item.name}</span> <button onclick="buyArenaItem(${index})">Buy (${item.price} Gold)</button>`;
        merchantItemsDiv.appendChild(itemDiv);
    });

    merchantMenu.style.display = 'block';
}

function buyArenaItem(index) {
    const shopItems = [
        { name: "Gladiator's Sword", damage: 15, type: 'equipment', slot: 'weapon', emoji: '⚔️', price: 100 },
        { name: "Gladiator's Shield", defense: 10, type: 'equipment', slot: 'offhand', emoji: '🛡️', price: 80 },
        { name: "Arena Health Potion", effect: () => { character.health = Math.min(character.maxHealth, character.health + 75); }, type: 'potion', emoji: '🧪', price: 30 }
    ];

    const item = shopItems[index];
    if (character.gold >= item.price) {
        character.gold -= item.price;
        character.inventory.push(item);
        updateCharacterInfo();
        updateInventory();
        alert(`You bought a ${item.name}!`);
    } else {
        alert('Not enough gold!');
    }
}

function removeObjectFromMap(x, y, type) {
    const cell = mapData.find(cell => cell.x === x && cell.y === y);
    if (cell && cell.type === type) {
        cell.type = 'empty';
        const cellElement = document.querySelector(`.map-cell[style*="left: ${x * CELL_SIZE}px;"][style*="top: ${y * CELL_SIZE}px;"]`);
        if (cellElement) {
            cellElement.textContent = ''; // Remove the icon
            cellElement.classList.remove(type); // Remove the specific class
        }
    }
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
        } else if (location.type === 'arena') {
            enterArena();
        } else if (location.type === 'arena-exit') {
            generateNewMap();
        } else if (location.type === 'arena-shop') {
            enterArenaShop();
        } else if (location.type === 'arena-fight') {
            const exampleEnemies = [
                { name: 'Goblin', health: 50, maxHealth: 50, strength: 5, defense: 2 },
                { name: 'Orc', health: 80, maxHealth: 80, strength: 10, defense: 5 }
            ];
            const exampleAllies = [
                { name: 'Hero', health: 120, maxHealth: 120, strength: 15, defense: 10 }
            ];
            
            // Testing the combat system
            initiateCombat(exampleEnemies, exampleAllies);
        } else if (location.type === 'enemy') {
            locationInfo.innerHTML = `<p>You've encountered an enemy!</p>`;
            initiateCombat(); // Implement initiateCombat to handle enemy encounters
        } else if (location.type === 'treasure') {
            locationInfo.innerHTML = `<p>You've found a treasure!</p>`;
            document.getElementById('treasure-message').innerText = "You found a treasure! Dig to see what's inside.";
            openTreasureModal();
        } else {
            locationInfo.innerHTML = `<p>Nothing interesting here.</p>`;
        }
    }

    if (x === 0 || y === 0 || x === MAP_SIZE - 1 || y === MAP_SIZE - 1) {
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
        onComplete: questType.onComplete,
        checkCompletion: questType.checkCompletion
    };

    activeQuests.push(quest);
    renderQuestInfo();
}
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
function renderQuestInfo() {
    const questList = document.getElementById('quest-list');
    questList.innerHTML = '';
    activeQuests.forEach((quest, index) => {
        const questItem = document.createElement('div');
        questItem.classList.add('quest-item');
        questItem.classList.add(quest.completed ? 'quest-completed' : 'quest-in-progress');
        questItem.innerHTML = `
            <p>${quest.description}</p>
            <p class="quest-progress">${quest.completed ? 'Completed' : 'In Progress'}</p>
            <button onclick="checkQuestCompletion(${index})" ${quest.completed ? 'disabled' : ''}>Check Quest</button>
        `;
        questItem.onclick = () => showQuestDetails(index);
        questList.appendChild(questItem);
    });
}

function showQuestDetails(index) {
    const quest = activeQuests[index];
    const questDetailsContent = document.getElementById('quest-details-content');
    questDetailsContent.innerHTML = `
        <h4>${quest.description}</h4>
        <p>Target: ${quest.target}</p>
        <p>Reward: ${quest.reward()}</p>
        <p>Status: ${quest.completed ? 'Completed' : 'In Progress'}</p>
        <button onclick="checkQuestCompletion(${index})" ${quest.completed ? 'disabled' : ''}>Check Quest</button>
    `;
    openModal('quest-details-modal');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.innerText = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function pickUpItem(item) {
    character.inventory.push(item);
    addVisualFeedback(document.body, `Picked up ${item.name}`);
    updateInventory();
}

function completeQuest(index) {
    const quest = activeQuests[index];
    if (!quest.completed) {
        quest.onComplete(quest);
        activeQuests.splice(index, 1); // Remove the completed quest from the list
        renderQuestInfo();
        updateCharacterInfo();
        checkLevelUp(); // Check for level up after gaining experience
        showNotification('Quest Completed!');
    }
}

function addVisualFeedback(element, message, timeout = 2000) {
    const feedback = document.createElement('div');
    feedback.classList.add('visual-feedback');
    feedback.innerText = message;
    element.appendChild(feedback);
    setTimeout(() => {
        feedback.remove();
    }, timeout);
}

function checkQuestCompletion(index) {
    const quest = activeQuests[index];
    if (quest.checkCompletion()) {
        quest.completed = true;
        quest.onComplete(quest);
        activeQuests.splice(index, 1); // Remove the completed quest from the list
    } else {
        alert('Quest is not yet completed!');
    }
    renderQuestInfo();
    updateCharacterInfo();
    checkLevelUp();
}

function checkQuestsCompletion() {
    activeQuests.forEach((quest, index) => {
        if (quest.checkCompletion()) {
            quest.completed = true;
            quest.onComplete(quest);
            activeQuests.splice(index, 1);
        }
    });
    renderQuestInfo();
}

function generateDungeon() {
    let validDungeon = false;

    while (!validDungeon) {
        dungeonData = [];

        for (let y = 0; y < DUNGEON_SIZE; y++) {
            dungeonData[y] = [];
            for (let x = 0; x < DUNGEON_SIZE; x++) {
                const cellType = Math.random() < 0.3 ? 'wall' : 'floor';
                dungeonData[y][x] = cellType;
            }
        }

        // Ensure the entrance and exit are set
        dungeonData[0][0] = 'entrance';
        dungeonData[DUNGEON_SIZE - 1][DUNGEON_SIZE - 1] = 'exit';

        // Validate the generated dungeon for playability
        const start = { x: 0, y: 0 };
        const end = { x: DUNGEON_SIZE - 1, y: DUNGEON_SIZE - 1 };
        validDungeon = bfs(start, end, dungeonData);
    }

    playerDungeonPos = { x: 0, y: 0 };
    renderDungeon();
    dungeonOverlay.style.display = 'flex';
}

// Breadth-first search to validate dungeon paths
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

function renderDungeon() {
    dungeonMap.innerHTML = '';
    dungeonMap.style.gridTemplateColumns = `repeat(${dungeonData[0].length}, ${DUNGEON_CELL_SIZE}px)`;

    for (let y = 0; y < dungeonData.length; y++) {
        for (let x = 0; x < dungeonData[y].length; x++) {
            const cell = document.createElement('div');
            cell.classList.add('dungeon-cell', dungeonData[y][x]);
            cell.style.width = `${DUNGEON_CELL_SIZE}px`;
            cell.style.height = `${DUNGEON_CELL_SIZE}px`;
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

// Handling player movement within the dungeon
function moveToDungeonCell(x, y) {
    if (Math.abs(x - playerDungeonPos.x) + Math.abs(y - playerDungeonPos.y) === 1 &&
        dungeonData[y][x] !== 'wall') {
        playerDungeonPos = { x, y };
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
        checkQuestsCompletion();
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

function initiateCombat() {
    const enemies = [
        { name: "Goblin", health: 30, armorClass: 12, attack: 5, damageDie: 6 },
        { name: "Orc", health: 45, armorClass: 13, attack: 7, damageDie: 8 }
    ];
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    character.currentEnemy = enemy;

    openModal('combat-modal');

    addVisualFeedback(document.getElementById('combat-modal'), 'Entering combat...');

    combatLog.innerHTML = `
        <h3>Combat: ${character.name} vs ${enemy.name}</h3>
        <p>${enemy.name} Health: ${enemy.health}</p>
    `;

    document.getElementById('attack-button').onclick = () => attack(enemy);
    document.getElementById('defend-button').onclick = () => defend(enemy);
    document.getElementById('use-potion-button').onclick = () => usePotion(enemy);
}

function initiateCombat(enemies, allies = [character]) {
    const arenaCombatModal = document.getElementById('arena-combat-modal');
    const arenaCombatLog = document.getElementById('arena-combat-log');
    const alliesList = document.getElementById('allies-list');
    const enemiesList = document.getElementById('enemies-list');

    // Clear previous combat data
    arenaCombatLog.innerHTML = '';
    alliesList.innerHTML = '';
    enemiesList.innerHTML = '';

    // Display allies
    allies.forEach(ally => {
        const allyElement = document.createElement('div');
        allyElement.classList.add('combat-ally');
        allyElement.textContent = `${ally.name} (${ally.health}/${ally.maxHealth})`;
        alliesList.appendChild(allyElement);
    });

    // Display enemies
    enemies.forEach(enemy => {
        const enemyElement = document.createElement('div');
        enemyElement.classList.add('combat-enemy');
        enemyElement.textContent = `${enemy.name} (${enemy.health}/${enemy.maxHealth})`;
        enemiesList.appendChild(enemyElement);
    });

    // Show combat modal
    arenaCombatModal.style.display = 'block';
}

function startTurnTimer() {
    turnTimer = setTimeout(() => {
        endTurn();
    }, turnTimeLimit * 1000);
}

function endTurn() {
    clearTimeout(turnTimer);
    currentTurnIndex = (currentTurnIndex + 1) % combatData.allies.length;
    updateCombatUI();
    startTurnTimer();
}

function performCombatAction(action, target = null) {
    const currentCombatant = combatData.allies[currentTurnIndex];

    if (action === 'attack' && target) {
        const damage = currentCombatant.strength;
        target.health -= damage;
        combatData.log.push(`${currentCombatant.name} attacked ${target.name} for ${damage} damage.`);
    } else if (action === 'defend') {
        combatData.log.push(`${currentCombatant.name} is defending.`);
    } else if (action === 'use-item' && target) {
        // Use specific item logic
        const item = character.inventory.find(i => i.name === target);
        if (item) {
            item.effect();
            combatData.log.push(`${currentCombatant.name} used ${item.name}.`);
        } else {
            combatData.log.push(`${currentCombatant.name} tried to use ${target}, but it wasn't found.`);
        }
    }

    // Check if any enemies are defeated
    combatData.enemies = combatData.enemies.filter(enemy => enemy.health > 0);
    if (combatData.enemies.length === 0) {
        combatData.log.push(`You defeated all enemies!`);
        // Close combat modal or give rewards
    }

    updateCombatUI();
    endTurn();
}


function showEnemySelection() {
    document.getElementById('combat-actions').style.display = 'none';
    document.getElementById('enemy-selection').style.display = 'block';

    const enemySelectionList = document.getElementById('enemy-selection-list');
    enemySelectionList.innerHTML = '';

    combatData.enemies.forEach(enemy => {
        const enemyDiv = document.createElement('div');
        enemyDiv.textContent = `${enemy.emoji} ${enemy.name} HP: ${enemy.health}`;
        enemyDiv.onclick = () => performCombatAction('attack', enemy);
        enemySelectionList.appendChild(enemyDiv);
    });
}


function showInventory() {
    document.getElementById('combat-actions').style.display = 'none';
    document.getElementById('inventory-selection').style.display = 'block';

    const inventorySelectionList = document.getElementById('inventory-selection-list');
    inventorySelectionList.innerHTML = '';

    character.inventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.textContent = item.name;
        itemDiv.onclick = () => performCombatAction('use-item', item.name);
        inventorySelectionList.appendChild(itemDiv);
    });
}

function cancelSelection() {
    document.getElementById('enemy-selection').style.display = 'none';
    document.getElementById('inventory-selection').style.display = 'none';
    document.getElementById('combat-actions').style.display = 'block';
}


function updateCombatUI() {
    const alliesList = document.getElementById('allies-list');
    const enemiesList = document.getElementById('enemies-list');
    const combatLog = document.getElementById('arena-combat-log');

    alliesList.innerHTML = '';
    enemiesList.innerHTML = '';
    combatLog.innerHTML = '';

    combatData.allies.forEach(ally => {
        const allyDiv = document.createElement('div');
        allyDiv.textContent = `${ally.emoji} ${ally.name} HP: ${ally.health}`;
        alliesList.appendChild(allyDiv);
    });

    combatData.enemies.forEach(enemy => {
        const enemyDiv = document.createElement('div');
        enemyDiv.textContent = `${enemy.emoji} ${enemy.name} HP: ${enemy.health}`;
        enemiesList.appendChild(enemyDiv);
    });

    combatData.log.forEach(entry => {
        const logEntry = document.createElement('p');
        logEntry.textContent = entry;
        combatLog.appendChild(logEntry);
    });

    document.getElementById('combat-actions').style.display = 'block';
    document.getElementById('enemy-selection').style.display = 'none';
    document.getElementById('inventory-selection').style.display = 'none';

    startTurnTimer();
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
        checkQuestsCompletion();

        if (Math.random() < 0.3) {
            const itemIndex = Math.floor(Math.random() * items.length);
            const item = items[itemIndex];
            addItem(item);
            combatLog.innerHTML += `<p>You found a ${item.name}! 🎁</p>`;
        }
        updateCharacterInfo();
        updateInventory();
        checkLevelUp();
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

function useItem(index) {
    const item = character.inventory[index];
    if (item.effect) {
        item.effect();
        removeItem(index);
    } else if (item.type === 'equipment') {
        equipItem(index);
        removeItem(index);
    }
    updateCharacterInfo();
    updateInventory();
}

function equipItem(index) {
    const item = character.inventory[index];
    if (character.equipped[item.type]) {
        character.inventory.push(character.equipped[item.type]);
    }
    character.equipped[item.type] = item;
    character.inventory = character.inventory.filter(i => i !== item);
    renderInventory();
    renderEquippedItems();
}

function unequipItem(slot) {
    if (character.equipped[slot]) {
        character.inventory.push(character.equipped[slot]);
        character.equipped[slot] = null;
        renderInventory();
        renderEquippedItems();
    }
}

function updateCharacterStats() {
    character.strength = 10 + (character.weapon ? character.weapon.damage : 0);
    character.dexterity = 10 + (character.offhand ? character.offhand.defense : 0);
    // Adjust other stats if needed
    updateCharacterInfo();
}

function renderEquippedItems() {
    for (const slot in character.equipped) {
        const slotElement = document.getElementById(`${slot}-slot`);
        if (character.equipped[slot]) {
            slotElement.innerHTML = `${character.equipped[slot].emoji} <br> ${character.equipped[slot].name}`;
        } else {
            slotElement.innerHTML = '';
        }
    }
}

function openInventory() {
    renderInventory();
    renderEquippedItems();
    document.getElementById('inventory-modal').style.display = 'block';
}

function closeInventoryMenu() {
    inventoryMenu.style.display = 'none';
}

function renderInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    inventoryGrid.innerHTML = '';
    character.inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('inventory-item');
        itemDiv.innerHTML = `${item.emoji} <br> ${item.name}`;
        itemDiv.onclick = () => equipItem(index);
        inventoryGrid.appendChild(itemDiv);
    });
}

// Example function to sort inventory (by name, for example)
function sortInventory() {
    inventoryItems.sort((a, b) => a.name.localeCompare(b.name));
    renderInventory();
}

// Example function to filter inventory (show only weapons, for example)
function filterInventory() {
    const filteredItems = inventoryItems.filter(item => item.name.includes('Sword') || item.name.includes('Shield'));
    renderFilteredInventory(filteredItems);
}

// Function to render the filtered inventory
function renderFilteredInventory(filteredItems) {
    const inventoryGrid = document.getElementById('inventory-grid');
    inventoryGrid.innerHTML = '';
    filteredItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('inventory-item');
        itemDiv.innerHTML = `${item.emoji} <br> ${item.name}`;
        inventoryGrid.appendChild(itemDiv);
    });
}

// Example of integrating sorting and filtering

function updateEquipSlots() {
    weaponSlot.innerHTML = character.weapon ? character.weapon.name : '';
    offhandSlot.innerHTML = character.offhand ? character.offhand.name : '';
    armorSlot.innerHTML = character.armor ? character.armor.name : '';
}

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

function openTreasureModal() {
    document.getElementById('treasure-modal').style.display = 'block';
}

function closeTreasureModal() {
    document.getElementById('treasure-modal').style.display = 'none';
}

function digForTreasure() {
    const chance = Math.random();
    let message = "You found nothing.";
    if (chance < 0.5) {
        const goldFound = Math.floor(Math.random() * 50) + 10;
        character.gold += goldFound;
        message = `You found ${goldFound} gold!`;
    } else if (chance < 0.8) {
        const item = items[Math.floor(Math.random() * items.length)];
        addItem(item);
        message = `You found a unique item: ${item.name}!`;
    }
    document.getElementById('treasure-message').innerText = message;
    updateCharacterInfo();
    updateInventory();
    closeTreasureModal();
    removeObjectFromMap(character.x, character.y, 'treasure');
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
        openInventory();
    }
});

const classes = {
    warrior: {
        name: "Warrior",
        baseStats: { strength: 15, dexterity: 10, intelligence: 5, health: 120 },
        skills: [
            { name: "Power Strike", levelRequired: 1, effect: () => { character.strength += 5; }, description: "Increases strength by 5." },
            { name: "Shield Block", levelRequired: 2, effect: () => { character.dexterity += 3; }, description: "Increases dexterity by 3." }
        ]
    },
    mage: {
        name: "Mage",
        baseStats: { strength: 5, dexterity: 10, intelligence: 15, health: 80 },
        skills: [
            { name: "Fireball", levelRequired: 1, effect: () => { character.intelligence += 5; }, description: "Increases intelligence by 5." },
            { name: "Mana Shield", levelRequired: 2, effect: () => { character.maxHealth += 10; }, description: "Increases max health by 10." }
        ]
    },
    rogue: {
        name: "Rogue",
        baseStats: { strength: 10, dexterity: 15, intelligence: 10, health: 100 },
        skills: [
            { name: "Stealth", levelRequired: 1, effect: () => { character.dexterity += 5; }, description: "Increases dexterity by 5." },
            { name: "Backstab", levelRequired: 2, effect: () => { character.strength += 3; }, description: "Increases strength by 3." }
        ]
    }
};

function chooseClass(className) {
    const chosenClass = classes[className];
    Object.assign(character, chosenClass.baseStats);
    character.class = className;
    character.skills = chosenClass.skills;
    updateCharacterInfo();
    document.getElementById('character-creation-menu').style.display = 'none';
}

function toggleDayNight() {
    isDay = !isDay;
    map.style.backgroundColor = isDay ? '#3a3' : '#111';
}

setInterval(toggleDayNight, 30000); // Change every 30 seconds

function randomEvent() {
    const events = ['ambush', 'treasureHunt', 'none'];
    const event = events[Math.floor(Math.random() * events.length)];

    if (event === 'ambush') {
        addVisualFeedback(document.body, "AMBUSH!", 5000);
        initiateCombat();
    } else if (event === 'treasureHunt') {
        addVisualFeedback(document.body, "You've found a treasure map!", 5000);
        generateTreasureHunt();
    }
}

function generateTreasureHunt() {
    const treasureX = Math.floor(Math.random() * MAP_SIZE);
    const treasureY = Math.floor(Math.random() * MAP_SIZE);
    const treasureCell = mapData.find(cell => cell.x === treasureX && cell.y === treasureY);
    if (treasureCell) {
        treasureCell.type = 'treasure';
        treasureCell.emoji = '💰';
        map.querySelector(`[style*="left: ${treasureX * CELL_SIZE}px;"][style*="top: ${treasureY * CELL_SIZE}px;"]`).textContent = '💰';
    }
}

// quests.js

// Global Variables for Quests
const questTypes = [
    {
        type: 'Fetch',
        description: 'Collect {target} for {reward} gold',
        target: 'ancient artifacts',
        reward: () => Math.floor(Math.random() * 50) + 10,
        onComplete: (quest) => {
            const rewardValue = quest.reward();
            character.gold += rewardValue;
            character.experience += rewardValue;
            alert(`Quest completed! You collected ${quest.target} and earned ${rewardValue} gold and experience.`);
        },
        checkCompletion: () => {
            const targetItem = character.inventory.find(item => item.name === 'Ancient Artifact');
            return !!targetItem;
        }
    },
    {
        type: 'Kill',
        description: 'Defeat {target} for {reward} gold',
        target: 'goblins',
        reward: () => Math.floor(Math.random() * 50) + 10,
        onComplete: (quest) => {
            const rewardValue = quest.reward();
            character.gold += rewardValue;
            character.experience += rewardValue;
            alert(`Quest completed! You defeated ${quest.target} and earned ${rewardValue} gold and experience.`);
        },
        checkCompletion: () => {
            return character.killedEnemies.includes('goblin');
        }
    },
    {
        type: 'Escort',
        description: 'Escort {target} to safety for {reward} gold',
        target: 'lost travelers',
        reward: () => Math.floor(Math.random() * 50) + 10,
        onComplete: (quest) => {
            const rewardValue = quest.reward();
            character.gold += rewardValue;
            character.experience += rewardValue;
            alert(`Quest completed! You escorted ${quest.target} and earned ${rewardValue} gold and experience.`);
        },
        checkCompletion: () => {
            return false; // Placeholder logic
        }
    },
    {
        type: 'Explore',
        description: 'Explore the {target} for {reward} gold',
        target: 'ancient ruins',
        reward: () => Math.floor(Math.random() * 50) + 10,
        onComplete: (quest) => {
            const rewardValue = quest.reward();
            character.gold += rewardValue;
            character.experience += rewardValue;
            alert(`Quest completed! You explored the ${quest.target} and earned ${rewardValue} gold and experience.`);
        },
        checkCompletion: () => {
            return character.exploredAreas.includes('ancient ruins');
        }
    },
    {
        type: "Find the Lost Relic",
        description: "Locate and retrieve the ancient relic from the forgotten temple.",
        target: "Relic",
        reward: () => "Mystic Staff",
        onComplete: (quest) => {
            const rewardValue = items.find(item => item.name === quest.reward());
            addItem(rewardValue);
            alert(`Quest completed! You retrieved the ${quest.target} and earned a ${rewardValue.name}.`);
        },
        checkCompletion: () => {
            return character.inventory.some(item => item.name === "Mystic Staff");
        }
    },
    {
        type: "Defeat the Dragon",
        description: "Slay the dragon terrorizing the village.",
        target: "Dragon",
        reward: () => 200,
        onComplete: (quest) => {
            const rewardValue = quest.reward();
            character.gold += rewardValue;
            character.experience += rewardValue;
            alert(`Quest completed! You defeated the ${quest.target} and earned ${rewardValue} gold.`);
        },
        checkCompletion: () => {
            return character.killedEnemies.includes('dragon');
        }
    },
    {
        type: "Gather Herbs",
        description: "Collect 10 Healing Herbs for the village healer.",
        target: "Healing Herb",
        reward: () => 50,
        onComplete: (quest) => {
            const rewardValue = quest.reward();
            character.gold += rewardValue;
            character.experience += rewardValue;
            alert(`Quest completed! You collected ${quest.target} and earned ${rewardValue} gold.`);
        },
        checkCompletion: () => {
            const herbCount = character.inventory.filter(item => item.name === "Healing Herb").length;
            return herbCount >= 10;
        }
    }
];

// Function to generate a new quest
function generateQuest() {
    const questType = questTypes[Math.floor(Math.random() * questTypes.length)];
    const quest = {
        type: questType.type,
        description: questType.description.replace('{target}', questType.target).replace('{reward}', questType.reward),
        target: questType.target,
        reward: questType.reward,
        completed: false,
        onComplete: questType.onComplete,
        checkCompletion: questType.checkCompletion
    };

    activeQuests.push(quest);
    renderQuestInfo();
}

// Function to render quest information
function renderQuestInfo() {
    const questList = document.getElementById('quest-list');
    questList.innerHTML = '';
    activeQuests.forEach((quest, index) => {
        const questItem = document.createElement('div');
        questItem.classList.add('quest-item');
        questItem.innerHTML = `
            <p>${quest.description}</p>
            <p class="quest-progress">${quest.completed ? 'Completed' : 'In Progress'}</p>
            <button onclick="checkQuestCompletion(${index})" ${quest.completed ? 'disabled' : ''}>Check Quest</button>
        `;
        questList.appendChild(questItem);
    });
}

// Function to check quest completion manually (does not complete quest directly)
function checkQuestCompletion(index) {
    const quest = activeQuests[index];
    if (quest.checkCompletion()) {
        quest.completed = true;
        quest.onComplete(quest);
        activeQuests.splice(index, 1); // Remove the completed quest from the list
    } else {
        alert('Quest is not yet completed!');
    }
    renderQuestInfo();
    updateCharacterInfo();
    checkLevelUp();
}

function checkQuestsCompletion() {
    activeQuests.forEach((quest, index) => {
        if (quest.checkCompletion()) {
            quest.completed = true;
            quest.onComplete(quest);
            activeQuests.splice(index, 1);
        }
    });
    renderQuestInfo();
}

function checkLevelUp() {
    // Check if the experience points are enough to level up
    if (character.experience >= character.level * 100) {
        character.level++;
        character.maxHealth += 10;
        character.health = character.maxHealth;
        character.strength += 2;
        character.dexterity += 2;
        character.intelligence += 2;
        character.experience = 0; // Reset experience points
        updateCharacterInfo();
        addVisualFeedback(document.body, `Congratulations! You've reached level ${character.level}!`, 10000);
    }
}

// Function to check all quests' completion status
function checkQuestsCompletion() {
    activeQuests.forEach((quest, index) => {
        if (quest.checkCompletion()) {
            quest.completed = true;
            quest.onComplete(quest);
            activeQuests.splice(index, 1);
        }
    });
    renderQuestInfo();
}

document.getElementById('inventory-modal').addEventListener('show', renderInventory);


weaponSlot.addEventListener('click', () => unequipItem('weapon'));
offhandSlot.addEventListener('click', () => unequipItem('offhand'));
headSlot.addEventListener('click', () => unequipItem('head'));
bodySlot.addEventListener('click', () => unequipItem('body'));
feetSlot.addEventListener('click', () => unequipItem('feet'));
ringSlot.addEventListener('click', () => unequipItem('ring'));


// Call this function periodically or at specific events to check quests completion
setInterval(checkQuestsCompletion, 1000); // Adjust the interval as needed

setInterval(randomEvent, 60000); // Check for events every 60 seconds

// Initialize game
generateMap();
updateCharacterInfo();

addNPCsToMap(document.getElementById('map'), CELL_SIZE);

function showTooltip(index) {
    document.getElementById(`tooltip-${index}`).style.display = 'block';
}

function hideTooltip() {
    const tooltips = document.getElementsByClassName('tooltip');
    for (let tooltip of tooltips) {
        tooltip.style.display = 'none';
    }
}