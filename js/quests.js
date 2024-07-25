// quests.js

// Global Variables for Quests
let activeQuests = [];
const questTypes = [
    {
        type: 'Fetch',
        description: 'Collect {target} for {reward} gold',
        target: 'ancient artifacts',
        reward: () => Math.floor(Math.random() * 50) + 10,
        onComplete: (quest) => {
            character.gold += quest.reward;
            character.experience += quest.reward;
            alert(`Quest completed! You collected ${quest.target} and earned ${quest.reward} gold and experience.`);
        },
        checkCompletion: () => {
            // Check inventory for target item
            const targetItem = character.inventory.find(item => item.name === 'ancient artifact');
            return !!targetItem;
        }
    },
    {
        type: 'Kill',
        description: 'Defeat {target} for {reward} gold',
        target: 'goblins',
        reward: () => Math.floor(Math.random() * 50) + 10,
        onComplete: (quest) => {
            character.gold += quest.reward;
            character.experience += quest.reward;
            alert(`Quest completed! You defeated ${quest.target} and earned ${quest.reward} gold and experience.`);
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
            character.gold += quest.reward;
            character.experience += quest.reward;
            alert(`Quest completed! You escorted ${quest.target} and earned ${quest.reward} gold and experience.`);
        },
        checkCompletion: () => {
            // Add logic for escort completion
            return false; // Placeholder
        }
    },
    {
        type: 'Explore',
        description: 'Explore the {target} for {reward} gold',
        target: 'ancient ruins',
        reward: () => Math.floor(Math.random() * 50) + 10,
        onComplete: (quest) => {
            character.gold += quest.reward;
            character.experience += quest.reward;
            alert(`Quest completed! You explored the ${quest.target} and earned ${quest.reward} gold and experience.`);
        },
        checkCompletion: () => {
            return character.exploredAreas.includes('ancient ruins');
        }
    }
];

// Function to generate a new quest
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

// Function to render quest information
function renderQuestInfo() {
    questInfo.innerHTML = '<h3>Active Quests</h3>';
    activeQuests.forEach((quest, index) => {
        questInfo.innerHTML += `
            <div>
                <p>${quest.description}</p>
                <button onclick="checkQuestCompletion(${index})" ${quest.completed ? 'disabled' : ''}>Check Quest</button>
            </div>
        `;
    });
}

// Function to check quest completion manually (does not complete quest directly)
function checkQuestCompletion(index) {
    const quest = activeQuests[index];
    if (quest.checkCompletion()) {
        quest.onComplete(quest);
        activeQuests.splice(index, 1); // Remove the completed quest from the list
    } else {
        alert('Quest is not yet completed!');
    }
    renderQuestInfo();
    updateCharacterInfo();
    checkLevelUp();
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

// Call this function periodically or at specific events to check quests completion
setInterval(checkQuestsCompletion, 1000); // Adjust the interval as needed