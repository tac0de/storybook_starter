// 📁 /game.js
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-game',
    backgroundColor: '#e6e6e6',
    scene: [FactionSelectScene, MainGameScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

function FactionSelectScene() {
    Phaser.Scene.call(this, { key: 'FactionSelectScene' });
}
FactionSelectScene.prototype = Object.create(Phaser.Scene.prototype);
FactionSelectScene.prototype.constructor = FactionSelectScene;
FactionSelectScene.prototype.create = function () {
    this.add.text(this.scale.width / 2, 100, 'Choose Your Faction', { font: '28px Georgia', fill: '#333' }).setOrigin(0.5);
    const factions = ['EverGrow', 'Ashbrute', 'Brassborn', 'Cryptus'];

    factions.forEach((name, i) => {
        const y = 180 + i * 70;
        const button = this.add.rectangle(this.scale.width / 2, y, 200, 50, 0xeeeeee)
            .setStrokeStyle(2, 0x444444)
            .setInteractive({ useHandCursor: true });
        this.add.text(this.scale.width / 2, y, name, { font: '20px Arial', fill: '#000' }).setOrigin(0.5);

        button.on('pointerdown', () => {
            this.scene.start('MainGameScene', { chosenFaction: name });
        });
    });
};

function MainGameScene() {
    Phaser.Scene.call(this, { key: 'MainGameScene' });
}

function getResourceString() {
    return `Wood: ${resources.Wood} | Stone: ${resources.Stone} | Iron: ${resources.Iron}`;
}
MainGameScene.prototype = Object.create(Phaser.Scene.prototype);
MainGameScene.prototype.constructor = MainGameScene;

let tiles = [];
let currentPlayer = 0;
let day = 1;
const maxDays = 6;
let resourceCount = 0;
let resources = { Wood: 0, Stone: 0, Iron: 0 };

const regionTypes = [
    { name: 'Forest', resource: 'Wood', amount: 1, image: 'forestCard' },
    { name: 'Quarry', resource: 'Stone', amount: 1, image: 'quarryCard' },
    { name: 'Mine', resource: 'Iron', amount: 1, image: 'mineCard' },
    { name: 'Forest', resource: 'Wood', amount: 1, image: 'forestCard' },
    { name: 'Quarry', resource: 'Stone', amount: 1, image: 'quarryCard' },
    { name: 'Mine', resource: 'Iron', amount: 1, image: 'mineCard' },
    { name: 'Forest', resource: 'Wood', amount: 1, image: 'forestCard' },
    { name: 'Quarry', resource: 'Stone', amount: 1, image: 'quarryCard' },
    { name: 'Mine', resource: 'Iron', amount: 1, image: 'mineCard' },
];

MainGameScene.prototype.preload = function () {
    this.load.image('forestCard', 'assets/card-forest.png');
    this.load.image('quarryCard', 'assets/card-quarry.png');
    this.load.image('mineCard', 'assets/card-mine.png');
    this.load.image('tileBack', 'assets/tile-back.png');
};

function aiTurn(scene) {
    const candidates = tiles.filter(t => !t.getData('revealed') && !t.getData('blocked'));
    if (candidates.length === 0) return;
    const blocked = Phaser.Utils.Array.GetRandom(candidates);
    blocked.setData('blocked', true);
    blocked.disableInteractive();
    blocked.setAlpha(0.4);
    log(scene, `AI blocks a region`);
}

MainGameScene.prototype.create = function (data) {
    const centerX = this.scale.width / 2;
    this.add.rectangle(centerX, window.innerHeight / 2, window.innerWidth, window.innerHeight, 0xffffff).setStrokeStyle(2, 0xcccccc).setOrigin(0.5);
    this.add.text(centerX, 50, 'Six Days of Craft', { font: '28px Georgia', fill: '#333' }).setOrigin(0.5);
    this.add.text(centerX, 80, `Faction: ${data.chosenFaction}`, { font: '20px Georgia', fill: '#666' }).setOrigin(0.5);

    const gridOriginX = centerX - 88;
    const gridOriginY = 140; // moved slightly upward
    const spacing = 90;
    const gridSize = 3;
    Phaser.Utils.Array.Shuffle(regionTypes);

    for (let i = 0; i < 9; i++) {
        const x = gridOriginX + (i % gridSize) * spacing;
        const y = gridOriginY + Math.floor(i / gridSize) * spacing;
        const tileData = regionTypes[i];
        const tile = this.add.image(x, y, 'tileBack')
            .setDisplaySize(80, 80)
            .setScale(1)
            .setInteractive()
            .setAlpha(0.95)
            .setDepth(1);

        tile.setData('revealed', false);
        tile.setData('region', tileData);

        tile.on('pointerdown', () => {
            if (!tile.getData('revealed')) {
                tile.setData('revealed', true);
                tile.flipX = false;
                tile.setTexture(tileData.image);
                tile.setDisplaySize(80, 80);
                tile.setScale(1);
                resources[tileData.resource]++;
                log(this, `You gained 1 ${tileData.resource} from ${tileData.name}.`);
                this.resourceText.setText(getResourceString());
                aiTurn(this);
            }
        });

        tiles.push(tile);
    }
    this.resourceText = this.add.text(centerX, 400, getResourceString(), { font: '18px Arial', fill: '#000' }).setOrigin(0.5);
    this.logText = this.add.text(centerX, 470, '', { font: '14px Courier', fill: '#555', wordWrap: { width: 720 } }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ENTER', () => {
        currentPlayer = (currentPlayer + 1) % 2;
        if (currentPlayer === 0) {
            day++;
            if (day > maxDays) {
                log(this, 'Game Over');
                return;
            }
            const flash = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.25)
                .setDepth(10)
                .setAlpha(0);
            this.tweens.add({ targets: flash, alpha: 1, duration: 200, yoyo: true, onComplete: () => flash.destroy() });
            log(this, `--- Day ${day} ---`);
        }
        this.resourceText.setText(getResourceString());
    });

    log(this, `--- Day 1 ---`);
};

MainGameScene.prototype.update = function () { };

function log(scene, message) {
    if (!scene.logLines) scene.logLines = [];
    scene.logLines.push(message);
    if (scene.logLines.length > 5) scene.logLines.shift();
    scene.logText.setText(scene.logLines.join('\n'));
}
