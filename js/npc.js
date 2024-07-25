// Define NPCs
const npcs = [
    {
        name: "Old Man",
        x: 5,
        y: 5,
        dialogue: "Hello, traveler! Can you help me find my lost book?",
        givesQuest: true,
        questType: 'Fetch',
        emoji: '👴'
    },
    {
        name: "Merchant",
        x: 10,
        y: 10,
        dialogue: "I have some rare items for sale.",
        givesQuest: false,
        emoji: '🧙‍♂️'
    },
    // Add more NPCs as needed
];

// Function to interact with NPCs
function interactWithNPC(npc) {
    if (npc.givesQuest && !npc.questGiven) {
        assignQuest(npc.questType);
        npc.questGiven = true; // Ensure the NPC only gives the quest once
        dialogueContent.innerHTML = `<p>${npc.name}: ${npc.dialogue} I've assigned you a quest!</p>`;
    } else if (npc.name === 'Merchant') {
        openMerchantMenu();
        dialogueContent.innerHTML = `<p>${npc.name}: ${npc.dialogue}</p>`;
    } else {
        dialogueContent.innerHTML = `<p>${npc.name}: ${npc.dialogue}</p>`;
    }
    dialogueBox.style.display = 'block';
}

// Function to add NPCs to the map
function addNPCsToMap(map, cellSize) {
    npcs.forEach(npc => {
        const npcElement = document.createElement('div');
        npcElement.classList.add('map-cell');
        npcElement.style.left = `${npc.x * cellSize}px`;
        npcElement.style.top = `${npc.y * cellSize}px`;
        npcElement.textContent = npc.emoji; // NPC emoji
        npcElement.onclick = () => interactWithNPC(npc);
        map.appendChild(npcElement);

        // Add walking animation
        setInterval(() => {
            npcElement.style.left = `${Math.floor(Math.random() * mapSize) * cellSize}px`;
            npcElement.style.top = `${Math.floor(Math.random() * mapSize) * cellSize}px`;
        }, 5000); // Change position every 5 seconds
    });
}

// Dialogue box elements
const dialogueBox = document.getElementById('dialogue-box');
const dialogueContent = document.getElementById('dialogue-content');

function closeDialogue() {
    dialogueBox.style.display = 'none';
}

// Ensure this function is called in your main game initialization script
function initializeNPCLogic() {
    addNPCsToMap(document.getElementById('map'), 500 / mapSize);
}

const merchantMenu = document.getElementById('merchant-menu');
const merchantItemsDiv = document.getElementById('merchant-items');
function openMerchantMenu() {
    merchantMenu.style.display = 'block';
    renderMerchantItems();
}

function closeMerchantMenu() {
    merchantMenu.style.display = 'none';
}
function renderMerchantItems() {
    merchantItemsDiv.innerHTML = '';
    merchantItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
            <p>${item.name} - ${item.price} gold</p>
            <button onclick="buyItem(${index})">Buy</button>
        `;
        merchantItemsDiv.appendChild(itemDiv);
    });
}