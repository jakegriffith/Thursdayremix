// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'menu'; // menu, playing, paused, gameOver, levelComplete
let score = 0;
let level = 1;
let lives = 3;
let gameRunning = false;

// Level names
const levelNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Player object
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 30,
    speed: 5,
    color: '#333333'
};

// Arrays for game objects
let bullets = [];
let todoItems = [];
let particles = [];

// Input handling
const keys = {};

// To-do item templates for different levels
const todoTemplates = [
    // Level 1 - Easy (Monday)
    ['Buy groceries', 'Call mom', 'Walk the dog', 'Check emails', 'Water plants', 'Make lunch', 'Do laundry'],
    // Level 2 - Medium (Tuesday)
    ['Finish project', 'Schedule meeting', 'Pay bills', 'Clean house', 'Exercise daily', 'Read book', 'Call dentist', 'Buy birthday gift', 'Update calendar'],
    // Level 3 - Medium-Hard (Wednesday)
    ['Prepare presentation', 'Update resume', 'Fix car issue', 'Plan vacation', 'Learn new skill', 'Organize files', 'Cook dinner', 'Review budget', 'Send invoices', 'Book appointment', 'Research topic'],
    // Level 4 - Hard (Thursday)
    ['Complete tax return', 'Renovate kitchen', 'Write novel chapter', 'Start business plan', 'Learn new language', 'Build website', 'Plan wedding details', 'Study for exam', 'Create portfolio', 'Network with contacts', 'Develop app idea', 'Write blog post', 'Organize garage'],
    // Level 5 - Very Hard (Friday)
    ['Climb Mount Everest', 'Write dissertation', 'Launch startup', 'Run marathon', 'Learn quantum physics', 'Master chess strategy', 'Become fluent in French', 'Build rocket ship', 'Solve world hunger', 'Achieve enlightenment', 'Invent time machine', 'Discover new planet', 'Write bestselling novel', 'Create AI system', 'End world poverty']
];

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
            shoot();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);

// Game functions
function startGame() {
    gameState = 'playing';
    gameRunning = true;
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-block';
    initLevel();
    gameLoop();
}

function initLevel() {
    bullets = [];
    todoItems = [];
    particles = [];
    
    // Create to-do items for current level
    const templates = todoTemplates[level - 1] || todoTemplates[4];
    const itemCount = Math.min(5 + level * 2, 15); // Increase items per level
    
    for (let i = 0; i < itemCount; i++) {
        const template = templates[i % templates.length];
        // Randomize starting positions more
        const x = Math.random() * (canvas.width - 100) + 20;
        const y = Math.random() * 200 + 30;
        
        todoItems.push({
            x: x,
            y: y,
            width: Math.max(120, template.length * 8), // Dynamic width based on text length
            height: 22,
            text: template,
            speed: (0.3 + Math.random() * 0.4) + level * 0.15, // Randomize speed
            direction: Math.random() > 0.5 ? 1 : -1, // Random initial direction
            moveCounter: Math.random() * 120, // Random starting phase
            verticalSpeed: 0.1 + Math.random() * 0.3, // Individual vertical movement
            floatOffset: Math.random() * Math.PI * 2, // For floating motion
            color: getRandomColor()
        });
    }
}

function getRandomColor() {
    const colors = ['#e8e8e8', '#d5d5d5', '#c2c2c2', '#b8b8b8', '#a5a5a5', '#999999', '#8c8c8c'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function shoot() {
    bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 8,
        color: '#666666'
    });
}

function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        
        // Remove bullets that go off screen
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateTodoItems() {
    for (let item of todoItems) {
        item.moveCounter++;
        item.floatOffset += 0.05;
        
        // Individual randomized movement patterns
        // Each item changes direction at different intervals
        const changeInterval = 40 + Math.floor(item.speed * 30);
        if (item.moveCounter % changeInterval === 0) {
            item.direction *= -1;
            // Sometimes add a random direction change
            if (Math.random() < 0.3) {
                item.direction = Math.random() > 0.5 ? 1 : -1;
            }
        }
        
        // Horizontal movement with floating effect
        item.x += item.direction * item.speed + Math.sin(item.floatOffset) * 0.5;
        
        // Individual vertical movement - some float down slowly, others stay higher
        item.y += item.verticalSpeed + Math.cos(item.floatOffset * 0.7) * 0.3;
        
        // Wrap around screen edges
        if (item.x < -10) {
            item.x = canvas.width + 10;
        } else if (item.x > canvas.width + 10) {
            item.x = -10;
        }
        
        // Reset position if too far down, but at random intervals
        if (item.y > canvas.height - 50 && Math.random() < 0.02) {
            item.y = -item.height;
            item.x = Math.random() * (canvas.width - item.width);
        }
    }
}

function checkCollisions() {
    // Bullet vs Todo items
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = todoItems.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], todoItems[j])) {
                // Create explosion particles
                createExplosion(todoItems[j].x + todoItems[j].width / 2, todoItems[j].y + todoItems[j].height / 2);
                
                // Update score
                score += 10 * level;
                updateUI();
                
                // Remove bullet and todo item
                bullets.splice(i, 1);
                todoItems.splice(j, 1);
                break;
            }
        }
    }
    
    // Check if level is complete
    if (todoItems.length === 0) {
        if (level < 5) {
            gameState = 'levelComplete';
            document.getElementById('nextLevel').textContent = levelNames[level] || (level + 1);
            document.getElementById('levelCompleteScreen').style.display = 'block';
        } else {
            // Game won!
            gameState = 'gameOver';
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOverScreen').querySelector('h2').textContent = 'Congratulations! You Won!';
            document.getElementById('gameOverScreen').style.display = 'block';
        }
        gameRunning = false;
    }
    
    // Todo items vs Player (game over condition)
    for (let item of todoItems) {
        if (item.y > canvas.height - 100) {
            lives--;
            updateUI();
            
            if (lives <= 0) {
                gameState = 'gameOver';
                document.getElementById('finalScore').textContent = score;
                document.getElementById('gameOverScreen').style.display = 'block';
                gameRunning = false;
            } else {
                // Reset todo items position
                item.y = Math.random() * 200 + 50;
            }
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function createExplosion(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: '#888888'
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function render() {
    // Clear canvas with paper-like background
    ctx.fillStyle = '#fefefe';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle paper texture
    drawPaperTexture();
    
    if (gameState === 'playing') {
        // Draw player as a simple minimalist shape
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // Draw player details - more minimalist
        ctx.fillStyle = '#555555';
        ctx.fillRect(player.x + 15, player.y - 3, 10, 3);
        
        // Draw bullets
        ctx.fillStyle = '#666666';
        for (let bullet of bullets) {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
        
        // Draw todo items with Kindle-style appearance
        ctx.font = '11px Georgia, serif';
        for (let item of todoItems) {
            // Draw todo item background with border
            ctx.fillStyle = item.color;
            ctx.fillRect(item.x, item.y, item.width, item.height);
            
            // Draw border
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 1;
            ctx.strokeRect(item.x, item.y, item.width, item.height);
            
            // Draw todo item text - show full text
            ctx.fillStyle = '#333';
            ctx.fillText(item.text, item.x + 4, item.y + 15);
        }
        
        // Draw particles
        for (let particle of particles) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 30;
            ctx.fillRect(particle.x, particle.y, 2, 2);
            ctx.globalAlpha = 1;
        }
    }
}

function drawPaperTexture() {
    // Add subtle paper-like texture with very light dots
    ctx.fillStyle = '#f5f5f5';
    for (let i = 0; i < 30; i++) {
        const x = (i * 127) % canvas.width;
        const y = (i * 173) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = levelNames[level - 1] || 'Level ' + level;
    document.getElementById('lives').textContent = lives;
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        gameRunning = false;
        document.getElementById('pauseBtn').textContent = 'Resume';
    } else if (gameState === 'paused') {
        gameState = 'playing';
        gameRunning = true;
        document.getElementById('pauseBtn').textContent = 'Pause';
        gameLoop();
    }
}

function nextLevel() {
    level++;
    document.getElementById('levelCompleteScreen').style.display = 'none';
    gameState = 'playing';
    gameRunning = true;
    initLevel();
    updateUI();
    gameLoop();
}

function restartGame() {
    score = 0;
    level = 1;
    lives = 3;
    player.x = canvas.width / 2 - 20;
    player.y = canvas.height - 60;
    
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('levelCompleteScreen').style.display = 'none';
    document.getElementById('startBtn').style.display = 'inline-block';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('pauseBtn').textContent = 'Pause';
    
    gameState = 'menu';
    gameRunning = false;
    updateUI();
}

function gameLoop() {
    if (!gameRunning) return;
    
    updatePlayer();
    updateBullets();
    updateTodoItems();
    updateParticles();
    checkCollisions();
    render();
    
    requestAnimationFrame(gameLoop);
}

// Initialize UI
updateUI();
