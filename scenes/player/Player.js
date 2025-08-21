export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        // Baldur's Gate 3 style means top down view, so we need to make sure the player is rendered on top of the map.
        this.setDepth(1);

        this.character = {
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
        };

        // Add the player to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
    }

    takeDamage(damage) {
        this.character.health -= damage;
        if (this.character.health < 0) {
            this.character.health = 0;
        }
        // Emit an event to update the UI
        this.scene.events.emit('player-health-changed');
    }
}
