import Player from './player/Player.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Load the player spritesheet
        this.load.spritesheet('player', 'assets/Entities/Characters/Body_A/Animations/Idle_Base/Idle_Down-Sheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // Load the dungeon tileset
        this.load.image('dungeon_tiles', 'assets/Environment/Tilesets/Dungeon_Tiles.png');
    }

    create() {
        // Create the tilemap
        const map = this.make.tilemap({ tileWidth: 16, tileHeight: 16, width: 100, height: 100 });
        const tiles = map.addTilesetImage('dungeon_tiles');

        const layer = map.createBlankLayer('ground', tiles);

        // Create a simple room
        const floorTile = 6;
        const wallTile = 21;

        // Fill the floor
        layer.fill(floorTile);

        // Create walls around the perimeter
        for (let x = 0; x < map.width; x++) {
            layer.putTileAt(wallTile, x, 0);
            layer.putTileAt(wallTile, x, map.height - 1);
        }
        for (let y = 0; y < map.height; y++) {
            layer.putTileAt(wallTile, 0, y);
            layer.putTileAt(wallTile, map.width - 1, y);
        }

        // Set collision with walls
        map.setCollision(wallTile);


        // Create the player
        this.player = new Player(this, 100, 100, 'player', 0);
        this.physics.add.collider(this.player, layer);


        // Create the player's idle animation
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        // Play the idle animation
        this.player.anims.play('idle', true);

        // Setup camera
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(2);


        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,H');

        // Render UI
        this.renderUI();

        // Listen for health changes
        this.events.on('player-health-changed', this.renderUI, this);
    }

    update() {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown || this.keys.A.isDown) {
            this.player.setVelocityX(-100);
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            this.player.setVelocityX(100);
        }

        if (this.cursors.up.isDown || this.keys.W.isDown) {
            this.player.setVelocityY(-100);
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            this.player.setVelocityY(100);
        }

        // Debug key to test damage
        if (Phaser.Input.Keyboard.JustDown(this.keys.H)) {
            this.player.takeDamage(10);
        }
    }

    renderUI() {
        const uiContainer = document.getElementById('ui-container');
        uiContainer.innerHTML = `
            <div>Name: ${this.player.character.name}</div>
            <div>Level: ${this.player.character.level}</div>
            <div>Health: ${this.player.character.health}/${this.player.character.maxHealth}</div>
            <div>Gold: ${this.player.character.gold}</div>
        `;
    }
}
