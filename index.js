const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

let cellsHorizontal = 3;
let cellsVertical = 3;
const width = window.innerWidth - 4;
const height = window.innerHeight - 5;

let unitLengthX = width / cellsHorizontal;
let unitLengthY = height / cellsVertical;


const createMaze = (cellsVertical, cellsHorizontal, unitLengthX, unitLengthY) => {
    const engine = Engine.create();
    engine.world.gravity.y = 0;
    const { world } = engine;
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            wireframes: false,
            width: width,
            height: height
        }
    });

    Render.run(render);
    Runner.run(Runner.create(), engine);

    // Border Walls
    const walls = [
        Bodies.rectangle(width / 2, 0, width, 2, {isStatic: true}),
        Bodies.rectangle(width / 2, height, width, 2, {isStatic: true}),
        Bodies.rectangle(0, height / 2, 2, height, {isStatic: true}),
        Bodies.rectangle(width, height / 2, 2, height, {isStatic: true})
    ];
    World.add(world, walls);


    // Create Maze
    const shuffle = (arr) => {
        let counter = arr.length;

        while (counter > 0) {
            const index = Math.floor(Math.random() * counter);

            counter--;

            const temp = arr[counter];
            arr[counter] = arr[index];
            arr[index] = temp;
        }
        return arr;
    };

    let grid = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false));

    let verticals = Array(cellsVertical)
        .fill(null)
        .map(() => Array(cellsHorizontal - 1).fill(false));

    let horizontals = Array(cellsVertical - 1)
        .fill(null)
        .map(() => Array(cellsHorizontal).fill(false))

    startRow = Math.floor(Math.random() * cellsVertical);
    startColumn = Math.floor(Math.random() * cellsHorizontal);

    const stepThroughCell = (row, column) => {
        //Visited Cell at [row, column] then return
        if (grid[row][column]) {
            return;
        }

        //Mark cell as visited
        grid[row][column] = true;

        //Assemble randomly-order of list of neighbors
        const neighbors = shuffle([
            [row - 1, column, 'up'],
            [row, column + 1, 'right'],
            [row + 1, column, 'down'],
            [row, column - 1, 'left']
        ]);

        //For Each Neighbor
        for (let  neighbor of neighbors) {
            const [nextRow, nextColumn, direction]  = neighbor;

            //See if neighbor is out of bounds
            if (
                nextRow < 0 || 
                nextRow >= cellsVertical || 
                nextColumn < 0 || 
                nextColumn >= cellsHorizontal
            ) {
                continue;
            }

            //If neighbor visited then continue to next neighbor
            if (grid[nextRow][nextColumn]) {
                continue;
            }
            // Remove wall from either horizontals or verticals
            if (direction === 'left'){
                verticals[row][column - 1] = true;
            } else if (direction === 'right') {
                verticals[row][column] = true;
            } else if (direction === 'up'){
                horizontals[row - 1][column] = true;
            } else if (direction === 'down') {
                horizontals[row][column] = true;
            }
            
            stepThroughCell(nextRow, nextColumn);
        };
    };
    //Visit next cell
    stepThroughCell(startRow, startColumn);

    //Create Horizontal Walls
    horizontals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if (open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX, 
                5,
                {
                    label: 'wall',
                    isStatic: true,
                    render: {
                        fillStyle: 'yellow'
                    }
                }
            );
            World.add(world, wall);
        });
    });
    //Create Vertical Walls
    verticals.forEach((column, rowIndex) => {
        column.forEach((open, columnIndex) => {
            if (open) {
                return;
            }

            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2, 
                5,
                unitLengthY,
                {
                    label: 'wall',
                    isStatic: true,
                    render: {
                        fillStyle: 'yellow'
                    }
                }
            );
            World.add(world, wall);
        });
    });

    // Goal
    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        unitLengthX * .7,
        unitLengthY * .7,
        {
            isStatic: true,
            label: 'goal',
            render: {
                fillStyle: 'green'
            }
        }
    );
    World.add(world, goal);

    //Ball
    const ballRadius = Math.min(unitLengthX, unitLengthY)
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius * .25,
        {
        label: 'ball',
        render: {
            fillStyle: 'teal'
        }
        }
    );
    World.add(world, ball);

    //Ball Movement
    document.addEventListener('keydown', event => {
        const { x, y } = ball.velocity;
        //up
        if (event.key === 'w' || event.key === 'ArrowUp') {
            Body.setVelocity(ball, { x, y: y - 5});
        }
        //left
        if (event.key === 'a' || event.key === "ArrowLeft") {
            Body.setVelocity(ball, { x: x - 5, y});
        }
        //right
        if (event.key === 'd' || event.key === "ArrowRight") {
            Body.setVelocity(ball, { x: x + 5, y});
        }
        //down
        if (event.key === 's' || event.key === "ArrowDown") {
            Body.setVelocity(ball, { x, y: y + 5});
        }
    });

    // Win Condition
    Events.on(engine, 'collisionStart', event => {
        event.pairs.forEach(collision => {
            const labels = ['ball', 'goal'];

            if (labels.includes(collision.bodyA.label) && 
                labels.includes(collision.bodyB.label)){
                    document.querySelector('.winner').classList.remove('hidden');
                    world.gravity.y = 1;
                    world.bodies.forEach(body => {
                        if (body.label === 'wall'){
                            Body.setStatic(body, false);
                        }
                    })
                    document.querySelector('.winner').classList.remove('hidden');
                    clearMaze = setTimeout(() => {
                        engine.world.bodies.forEach((body)=>{Matter.Composite.remove(engine.world, body)})
                        World.clear(world);
                        Engine.clear(engine);
                        Render.stop(render);
                        render.canvas.remove();
                        render.canvas = null;
                        render.context = null;
                        render.textures = {};
                    }, 2500);
            }
        });
    });
}

function setDifficulty() {
    let cellsVertical = parseInt(document.querySelector('.vertical').value);
    let cellsHorizontal = parseInt(document.querySelector('.horizontal').value);
    if (isNaN(cellsVertical) || cellsVertical <= 2 || isNaN(cellsHorizontal || cellsHorizontal <= 2)){
        alert("Please Enter a Number Between 3 and 99.")
    }else {
        document.querySelector('.winner').classList.add('hidden');
        let unitLengthX = width / cellsHorizontal;
        let unitLengthY = height / cellsVertical;
        createMaze(cellsVertical, cellsHorizontal, unitLengthX, unitLengthY);
    }
}

function easy() {
    document.querySelector('.start').classList.add('hidden');
    document.querySelector('.winner').classList.add('hidden');
    let cellsVertical = 5
    let cellsHorizontal = 5
    let unitLengthX = width / cellsHorizontal;
    let unitLengthY = height / cellsVertical;
    createMaze(cellsVertical, cellsHorizontal, unitLengthX, unitLengthY);
}

function medium() {
    document.querySelector('.start').classList.add('hidden');
    document.querySelector('.winner').classList.add('hidden');
    let cellsVertical = 10
    let cellsHorizontal = 10
    let unitLengthX = width / cellsHorizontal;
    let unitLengthY = height / cellsVertical;
    createMaze(cellsVertical, cellsHorizontal, unitLengthX, unitLengthY);
}

function hard() {
    document.querySelector('.start').classList.add('hidden');
    document.querySelector('.winner').classList.add('hidden');
    let cellsVertical = 17
    let cellsHorizontal = 17
    let unitLengthX = width / cellsHorizontal;
    let unitLengthY = height / cellsVertical;
    createMaze(cellsVertical, cellsHorizontal, unitLengthX, unitLengthY);
}

function insane() {
    document.querySelector('.start').classList.add('hidden');
    document.querySelector('.winner').classList.add('hidden');
    let cellsVertical = 30
    let cellsHorizontal = 30
    let unitLengthX = width / cellsHorizontal;
    let unitLengthY = height / cellsVertical;
    createMaze(cellsVertical, cellsHorizontal, unitLengthX, unitLengthY);
}