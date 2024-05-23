//global variables
var lastX, lastY, startPosX, startPosY, circleX, circleY, lastTool;
let drawing = false, erasing = false, drawingShapes = false, currentTool = 'brush', oldTextBox=null;
let color = '#794c1b', sideColor = 'rgb(255,0,0)';
const canvas = document.getElementById("jyCanvas"), ctx = canvas.getContext('2d');
const colorCanvas = document.getElementById("colorPicker"), colorCtx = colorCanvas.getContext('2d');
let startX, startY, endX, endY;
let isDragging = false;
const circles = [], rectangles=[], triangles=[];

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
//init canvas size
function setWindowSize(e){
    canvas.width = window.innerWidth * 0.75 * 0.95, canvas.height = window.innerHeight * 0.93;
    colorCanvas.width = window.innerWidth * 0.25 * 0.80, colorCanvas.height = window.innerHeight * 0.25;
}

window.addEventListener('resize', function() {
    const tempImage = ctx.getImageData(0, 0, canvas.width, canvas.height); //暫存畫布那些筆跡
    setWindowSize();
    fillColorCanvas();
    ctx.putImageData(tempImage, 0, 0); //還原回去
});

//if selected, change button class to active (different style in css) and change currentTool
function changeButtonClass(button) {
    const buttons = document.querySelectorAll('.button');
    buttons.forEach((button) => {
        button.classList.remove('active');
    });
    button.classList.add('active');
    currentTool = button.id;
    changeCanvasCursor();
}

function changeCanvasCursor(){
    if(currentTool === 'brush'){
        canvas.style.cursor = 'url("./assets/img/pen.png") 0 32, auto';
    }else if (currentTool === 'eraser'){
        canvas.style.cursor = 'url("./assets/img/eraser.png") 0 27, auto';
    }else if (currentTool === 'text'){
        canvas.style.cursor = 'text';
    }else if (currentTool === 'line'){
        canvas.style.cursor = 'url("./assets/img/line.png") 0 16, auto';
    }else if (currentTool === 'circle'){
        canvas.style.cursor = 'url("./assets/img/circle.png") 0 0, auto';
    }else if (currentTool === 'rectangle'){
        canvas.style.cursor = 'url("./assets/img/square.png") 0 16, auto';
    }else if (currentTool === 'triangle'){
        canvas.style.cursor = 'url("./assets/img/triangle.png") 0 16, auto';
    }
}

//color picker
function fillColorCanvas(){
    const gradient = colorCtx.createLinearGradient(0, 0, colorCanvas.width, colorCanvas.height);
    gradient.addColorStop(0, 'rgb(255,255,255)'); // 左上角
    gradient.addColorStop(0.5, sideColor);       // 右下角
    gradient.addColorStop(1, 'rgb(0, 0, 0)');       // 右下角

    // 绘制渐变
    colorCtx.fillStyle = gradient;
    colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
}

document.getElementById('colorRange').addEventListener("input", function() {
    var sideColorRawValue = document.getElementById('colorRange').value;
    if(0 <= sideColorRawValue && sideColorRawValue <= 255){
        sideColor = `rgb(255,0,${sideColorRawValue})`;
    } else if(255 < sideColorRawValue && sideColorRawValue <= 510){
        sideColor = `rgb(${255-(sideColorRawValue-255)},0,255)`;
    } else if(510 < sideColorRawValue && sideColorRawValue <= 765){
        sideColor = `rgb(0,${sideColorRawValue-510},255)`;
    } else if(765 < sideColorRawValue && sideColorRawValue <= 1020){
        sideColor = `rgb(0,255,${255-(sideColorRawValue-765)})`;
    } else if(1020 < sideColorRawValue && sideColorRawValue <= 1275){
        sideColor = `rgb(${sideColorRawValue-1020},255,0)`;
    } else if(1275 < sideColorRawValue && sideColorRawValue <= 1530){
        sideColor = `rgb(255,${255-(sideColorRawValue-1275)},0)`;
    }
    fillColorCanvas();
});

colorCanvas.addEventListener('mousedown', function(e) {
    circleX = e.clientX - colorCanvas.getBoundingClientRect().left;
    circleY = e.clientY - colorCanvas.getBoundingClientRect().top;
    imageData = colorCtx.getImageData(circleX, circleY, 5, 5);
    color = `rgba(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]}, ${imageData.data[3] / 255})`;
    document.querySelector('.fa-paint-brush').style.color = color;
    document.querySelector('.fa-font').style.color = color;
});

//draw and erase function
function draw(e) {
    if(!drawing && !erasing) return;
    let x = e.clientX - canvas.getBoundingClientRect().left, y = e.clientY - canvas.getBoundingClientRect().top;
    
    //init ctx style
    ctx.strokeStyle = color;
    lineWidth = document.getElementById("brushSize").value
    ctx.lineWidth = lineWidth; 
    ctx.lineCap = 'round', ctx.lineJoin = 'round'; //讓線條變得平滑不會一格一格的

    if(drawing){
        ctx.globalCompositeOperation = 'source-over'; //預設
    }else if (erasing){
        ctx.globalCompositeOperation = 'destination-out'; //掃過的軌跡會被去除
    }

    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(x,y);
    ctx.stroke();
    lastX = x, lastY = y;
}

//textbox function
function addText(e) {
    let x = e.clientX - canvas.getBoundingClientRect().left, y = e.clientY - canvas.getBoundingClientRect().top;
    const input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'absolute';
    input.style.left = `${x}px`;
    input.style.top = `${y}px`;
    
    if(oldTextBox != input && oldTextBox != null){
        document.body.removeChild(oldTextBox);
    }
        document.body.appendChild(input);
        oldTextBox = input;
    

    input.addEventListener('keyup', function(e) {
        if(e.key === 'Escape') {
            document.body.removeChild(input);
            oldTextBox = null;
        }
        if (e.key === 'Enter') {
            const text = input.value;
            ctx.font = `${document.getElementById('fontSize').value}px ${document.getElementById('font').value}`; 
            ctx.fillStyle = color;
            ctx.globalCompositeOperation = 'source-over'
            ctx.fillText(text, x, y);
            saveCanvasState();
            document.body.removeChild(input); // 移除文本输入框
            oldTextBox = null;
        }
    });
    canvas.removeEventListener('click', addText);
}

// function drawFakeLine(e) {
//     let x = e.clientX - canvas.getBoundingClientRect().left, y = e.clientY - canvas.getBoundingClientRect().top;
//     ctx.lineTo(x, y);
// }

canvas.addEventListener('mousedown', function(e) {
    if(currentTool === 'brush' || currentTool === 'eraser'){
        currentTool === 'brush' ? (drawing = true, erasing = false) : (drawing = false, erasing = true);
        lastX = e.clientX - canvas.getBoundingClientRect().left, lastY = e.clientY - canvas.getBoundingClientRect().top;
        draw(e);
    }else if (currentTool === 'text'){
        addText(e);
    }
    // else if (currentTool === 'line'){
    //     drawingShapes = true;
    //     startPosX = e.clientX - canvas.getBoundingClientRect().left, startPosY = e.clientY - canvas.getBoundingClientRect().top;
    //     ctx.strokeStyle = color;
    //     ctx.lineWidth = document.getElementById("brushSize").value; 
    //     ctx.lineCap = 'butt'; 
    //     ctx.globalCompositeOperation = 'source-over';
    //     ctx.beginPath();
    //     ctx.moveTo(startPosX,startPosY);
    // }
    else if (currentTool === 'circle'){
        const startX = e.clientX - canvas.getBoundingClientRect().left;
        const startY = e.clientY - canvas.getBoundingClientRect().top;
        isDragging = true;
        circles.push({ startX, startY, endX: startX, endY: startY });
    }else if (currentTool === 'rectangle'){
        startX = e.clientX - canvas.getBoundingClientRect().left;
        startY = e.clientY - canvas.getBoundingClientRect().top;
        isDragging = true;
        rectangles.push({ startX, startY, endX: startX, endY: startY }); // 
    }else if (currentTool === 'triangle'){
        startX = e.clientX - canvas.getBoundingClientRect().left;
        startY = e.clientY - canvas.getBoundingClientRect().top;
        isDragging = true;
        triangles.push({ startX, startY, endX: startX, endY: startY }); //
    }
});

canvas.addEventListener('mousemove', function(e){
    if( (currentTool === 'brush' && drawing) || (currentTool === 'eraser' && erasing) ){
        draw(e);
    }
    // else if (currentTool === 'line' && drawingShapes){
    //     drawFakeLine(e);
    // }
    else if (currentTool === 'circle'){
        if (isDragging) {
            const currentCircle = circles[circles.length - 1];
            currentCircle.endX = e.clientX - canvas.getBoundingClientRect().left;
            currentCircle.endY = e.clientY - canvas.getBoundingClientRect().top;
            redrawCanvas();
        }
    } else if (currentTool === 'rectangle'){
        if (isDragging) {
            const currentRect = rectangles[rectangles.length - 1];
            currentRect.endX = e.clientX - canvas.getBoundingClientRect().left;
            currentRect.endY = e.clientY - canvas.getBoundingClientRect().top;
            redrawRectCanvas();
        }
    } else if (currentTool === 'triangle'){
        if (isDragging) {
            const currentTri = triangles[triangles.length - 1];
            currentTri.endX = e.clientX - canvas.getBoundingClientRect().left;
            currentTri.endY = e.clientY - canvas.getBoundingClientRect().top;
            redrawTriCanvas();
        }
    }
}); 

canvas.addEventListener('mouseup', function() {
    if(currentTool === 'brush' || currentTool === 'eraser'){
        saveCanvasState();
        drawing = false, erasing = false;
    }
    // else if (currentTool === 'line'){
    //     ctx.stroke();
    //     drawingShapes = false;
    // }
    else if (currentTool === 'circle'){
        if (isDragging) {
            saveCanvasState();
            isDragging = false;
        }
    }else if (currentTool === 'rectangle'){
        if (isDragging) {
            saveCanvasState();
            isDragging = false;
            // storeRectangle();
        }
    }else if (currentTool === 'triangle'){
        if (isDragging) {
            saveCanvasState();
            isDragging = false;
            // drawTriangle();
        }
    }
});

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    canvasHistory.forEach(canvaEach => {
        ctx.putImageData(canvaEach, 0, 0);});
    circles.forEach(circle => {
        const radius = calculateDistance(circle.startX, circle.startY, circle.endX, circle.endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.ellipse(circle.startX, circle.startY, radius, radius, 0, 0, 2 * Math.PI);
        ctx.stroke();
    });
    rectangles.forEach(rect => {
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(rect.startX, rect.startY);
        ctx.lineTo(rect.endX, rect.startY);
        ctx.lineTo(rect.endX, rect.endY);
        ctx.lineTo(rect.startX, rect.endY);
        ctx.closePath();
        ctx.stroke();
    });
    triangles.forEach(tri => {
        const thirdX = tri.startX + (tri.endX - tri.startX) * Math.cos(Math.PI / 3) - (tri.endY - tri.startY) * Math.sin(Math.PI / 3);
        const thirdY = tri.startY + (tri.endX - tri.startX) * Math.sin(Math.PI / 3) + (tri.endY - tri.startY) * Math.cos(Math.PI / 3);
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(tri.startX, tri.startY);
        ctx.lineTo(tri.endX, tri.endY);
        ctx.lineTo(thirdX, thirdY);
        ctx.closePath(); // Connect last point with first point
        ctx.stroke();
    });
}

function redrawRectCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    canvasHistory.forEach(canvaEach => {
        ctx.putImageData(canvaEach, 0, 0);});
    rectangles.forEach(rect => {
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(rect.startX, rect.startY);
        ctx.lineTo(rect.endX, rect.startY);
        ctx.lineTo(rect.endX, rect.endY);
        ctx.lineTo(rect.startX, rect.endY);
        ctx.closePath();
        ctx.stroke();
    });
    circles.forEach(circle => {
        const radius = calculateDistance(circle.startX, circle.startY, circle.endX, circle.endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.ellipse(circle.startX, circle.startY, radius, radius, 0, 0, 2 * Math.PI);
        ctx.stroke();
    });
    triangles.forEach(tri => {
        const thirdX = tri.startX + (tri.endX - tri.startX) * Math.cos(Math.PI / 3) - (tri.endY - tri.startY) * Math.sin(Math.PI / 3);
        const thirdY = tri.startY + (tri.endX - tri.startX) * Math.sin(Math.PI / 3) + (tri.endY - tri.startY) * Math.cos(Math.PI / 3);
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(tri.startX, tri.startY);
        ctx.lineTo(tri.endX, tri.endY);
        ctx.lineTo(thirdX, thirdY);
        ctx.closePath(); // Connect last point with first point
        ctx.stroke();
    });
    if (isDragging) {
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX, endY);
        ctx.closePath();
        ctx.stroke();
    }
}

// function storeRectangle() {
//     rectangles.push({ startX, startY, endX, endY });
//     redrawRectCanvas();
// }

// function drawRectangle() {
    
// }

function redrawTriCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    canvasHistory.forEach(canvaEach => {
        ctx.putImageData(canvaEach, 0, 0);});
    triangles.forEach(tri => {
        const thirdX = tri.startX + (tri.endX - tri.startX) * Math.cos(Math.PI / 3) - (tri.endY - tri.startY) * Math.sin(Math.PI / 3);
        const thirdY = tri.startY + (tri.endX - tri.startX) * Math.sin(Math.PI / 3) + (tri.endY - tri.startY) * Math.cos(Math.PI / 3);
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(tri.startX, tri.startY);
        ctx.lineTo(tri.endX, tri.endY);
        ctx.lineTo(thirdX, thirdY);
        ctx.closePath(); // Connect last point with first point
        ctx.stroke();
    });
    rectangles.forEach(rect => {
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(rect.startX, rect.startY);
        ctx.lineTo(rect.endX, rect.startY);
        ctx.lineTo(rect.endX, rect.endY);
        ctx.lineTo(rect.startX, rect.endY);
        ctx.closePath();
        ctx.stroke();
    });
    circles.forEach(circle => {
        const radius = calculateDistance(circle.startX, circle.startY, circle.endX, circle.endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.ellipse(circle.startX, circle.startY, radius, radius, 0, 0, 2 * Math.PI);
        ctx.stroke();
    });
    if (isDragging) {
        const thirdX = startX + (endX - startX) * Math.cos(Math.PI / 3) - (endY - startY) * Math.sin(Math.PI / 3);
        const thirdY = startY + (endX - startX) * Math.sin(Math.PI / 3) + (endY - startY) * Math.cos(Math.PI / 3);
        ctx.strokeStyle = color;
        ctx.lineWidth = document.getElementById("brushSize").value; 
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(thirdX, thirdY);
        ctx.closePath(); // Connect last point with first point
        ctx.stroke();
    }
}

// function drawTriangle() {
//     // Calculate the third point of the triangle
    
// }
document.getElementById('clear').addEventListener('click', function() {
    canvasHistory.length = 0, currentStateIndex = -1;
    circles.length = 0, rectangles.length = 0, triangles.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('save').addEventListener('click', function() {
    var tempData = document.createElement('a');
    tempData.href = canvas.toDataURL();
    tempData.download = "jyCanvas.png";
    tempData.click();
});

document.getElementById('imageInput').addEventListener('change', handleImageUpload);

function handleImageUpload(event) {
    const file = event.target.files[0];

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();

            // Set the image source to the uploaded file
            img.src = e.target.result;
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
        };
        reader.readAsDataURL(file);
    } else {
        alert('This is not a image file. Please upload an image file.');
    }
}

// Define an array to store canvas states
let canvasHistory = [];
let currentStateIndex = -1;

// Function to save the current canvas state
function saveCanvasState() {
    currentStateIndex++;
    canvasHistory[currentStateIndex] = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvasHistory.length = currentStateIndex + 1; // Trim the history after the current state
}

// Function to undo the last drawing operation
function undo() {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        ctx.putImageData(canvasHistory[currentStateIndex], 0, 0);
    }
}

// Function to redo the last undone drawing operation
function redo() {
    if (currentStateIndex < canvasHistory.length - 1) {
        currentStateIndex++;
        ctx.putImageData(canvasHistory[currentStateIndex], 0, 0);
    }
}

// Example usage:
// Call saveCanvasState() after each drawing operation to save the canvas state

// Add event listeners for undo and redo actions (e.g., button clicks)
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);


window.onload = function() {
    setWindowSize();
    fillColorCanvas();
}