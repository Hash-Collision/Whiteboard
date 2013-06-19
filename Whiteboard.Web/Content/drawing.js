/// <reference path="inheritance.js" />
/// <reference path="http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js" />
/// <reference path="http://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js" />

/*
    Ólafur Jóhannsson
    Háskólinn í Reykjavík
    Vefforritun II
*/

$(document).ready(function () {

    /**********
    Variable init and DOM setters
    **********/

    // array of canvasses and contexts
    var canvasses = [document.getElementById('drawing1'), document.getElementById('drawing2'), document.getElementById('drawing3'), document.getElementById('drawing4')];
    var contexts = [canvasses[0].getContext('2d'), canvasses[1].getContext('2d'), canvasses[2].getContext('2d'), canvasses[3].getContext('2d')];

    // currently selected for drawing shapes
    var currentFont = "Facebook Letter Faces";
    var currentColor = "Black";
    var currentWidth = 12;
    var currentFontSize = "24px";
    var currentFontStyle = "normal";
    var toolSelected = "Pencil";
    var selectedElement;
    var lastPosition = {}; // last position when moving pencil object

    // array of arrays that hold our 4 available drawings, undoed drawings and images
    var shapeArrays = [[], [], [], []];
    var undoedShapeArrays = [[], [], [], []];
    var images = [[], [], [], []];
    var undoedImages = [[], [], [], []];

    var ctrlDown = false;
    var isMouseDown = false;
    var currentShape = null;
    var currDrawing = 1;

    var container = $("#container").notify();


    // jQuery UI setters
    $("#radioBtns").buttonset();
    $("#dialog").css('display', 'none');
    $("input[type=button]").button();
    $("input[type=submit]").button();
    $(document).tooltip();

    // load all templates in temp dir
    loadTemplates();
    if ($("#imgData").val().length > 0) {
        create("default", { title: 'Success', text: 'Loading image on canvas' });
        contexts[currDrawing - 1].clearRect(0, 0, canvasses[0].width, canvasses[0].height);
        var image = new Image();
        image.onload = function () {
            contexts[currDrawing - 1].drawImage(image, 0, 0);
        }
        image.src = $("#imgData").val();
        images[currDrawing - 1].push(image);
    }

    /**********
    DOM event handlers
    **********/
    $.each(canvasses, function (i, element) {

        // mousemove on any canvas element
        $(element).mousemove(function (e) {
            // Get current coordinates
            var coords = getCurrentCoords(e, this);

            // If mouse is down, construct the appropriate object
            if (isMouseDown) {
                if (toolSelected == "Circle") {
                    currentShape.setEnd(coords.x, coords.y);
                    currentShape.radius = getRadius(e, this, currentShape).radius;
                }
                else if (toolSelected == "Rectangle") {
                    currentShape.setEnd(coords.x, coords.y);
                }
                else if (toolSelected == "Line") {
                    currentShape.setEnd(coords.x, coords.y);
                }
                else if (toolSelected == "Pencil") {
                    currentShape.setEnd(coords.x, coords.y);
                }
                else if (toolSelected == "Eraser") {
                    currentShape.setEnd(coords.x, coords.y);
                }
                else if (toolSelected == "Select") {
                    var shapeArr = shapeArrays[currDrawing - 1];
                    var shape = shapeArr[selectedElement];
                    if (shape != undefined) {
                        oldCol = shape.color;
                        shape.color = "yellow";
                        var xb = shape.beginX;
                        var xy = shape.beginY;
                        if (shape.type == "Rectangle" || shape.type == "Circle" || shape.type == "Line") {
                            shape.beginX = coords.x;
                            shape.beginY = coords.y;

                            if (coords.x < xb) {
                                var newXend = xb - coords.x;
                                shape.endX = shape.endX - newXend;
                            }
                            else if (coords.x > xb) {
                                var newXend = coords.x - xb;
                                shape.endX = newXend + shape.endX;
                            }

                            if (coords.y < xy) {
                                var newYend = xy - coords.y;
                                shape.endY = shape.endY - newYend;
                            }
                            else if (coords.y > xy) {
                                var newYend = coords.y - xy;
                                shape.endY = newYend + shape.endY;
                            }
                        }
                        else if (shape.type == "Pencil") {
                            if (typeof (lastPosition.x) != 'undefined') {

                                //get the change from last position to this position
                                var dX = lastPosition.x - e.clientX,
                                    dY = lastPosition.y - e.clientY;

                                if (Math.abs(dX) > Math.abs(dY) && dX > 0) {
                                    //left
                                    for (var i = 0; i < shape.xLines.length; i++) {
                                        shape.xLines[i] -= 10;
                                    }
                                }
                                else if (Math.abs(dX) > Math.abs(dY) && dX < 0) {
                                    //right
                                    for (var i = 0; i < shape.xLines.length; i++) {
                                        shape.xLines[i] += 10;
                                    }
                                }
                                else if (Math.abs(dY) > Math.abs(dX) && dY > 0) {
                                    //up
                                    for (var i = 0; i < shape.xLines.length; i++) {
                                        shape.yLines[i] -= 10;
                                    }
                                }
                                else if (Math.abs(dY) > Math.abs(dX) && dY < 0) {
                                    //down
                                    for (var i = 0; i < shape.xLines.length; i++) {
                                        shape.yLines[i] += 10;
                                    }
                                }
                                shape.beginX = shape.xLines[0];
                                shape.beginY = shape.yLines[0];
                                shape.endX = shape.xLines[shape.xLines.length];
                                shape.endY = shape.yLines[shape.yLines.length];

                            }

                            lastPosition = {
                                x: e.clientX,
                                y: e.clientY
                            };
                        }
                        else if (shape.type == "Text") {
                            shape.beginX = coords.x;
                            shape.beginY = coords.y;
                        }
                        
                        shape.draw(contexts[currDrawing - 1]);
                    }
                }
                currentShape.draw(contexts[currDrawing - 1]);

                // Óþarfi að teikna ef við erum að nota text
                if (toolSelected !== "Text") {
                    reDraw(contexts[currDrawing - 1]);
                }
            }
            else {
                var arr = shapeArrays[currDrawing - 1];
                $.each(arr, function (i, ele) {
                    if (ele.isBetweenXandY(coords.x, coords.y)) {
                        ele.color = "yellow";
                        ele.draw(contexts[currDrawing - 1]);
                    }
                    else {
                        ele.color = ele.oldColor;
                        ele.draw(contexts[currDrawing - 1]);
                    }

                    if (ele.lineIsBetweenXandY(coords.x, coords.y)) {
                        ele.color = "yellow";
                        ele.draw(contexts[currDrawing - 1]);
                    }
                    else {
                        ele.color = ele.oldColor;
                        ele.draw(contexts[currDrawing - 1]);
                    }
                });
            } 
        });

        // mousedown on any canvas element
        $(element).mousedown(function (e) {
            // get current coordinates and mousedown equals true
            isMouseDown = true;
            var coords = getCurrentCoords(e, this);
            if (toolSelected == "Circle") {
                currentShape = new Circle(coords.x, coords.y, 15, currentColor, currentWidth);
            }
            else if (toolSelected == "Select") {
                currentShape = new Select(coords.x, coords.y);
                selectedElement = move(coords.x, coords.y);
            }
            else if (toolSelected == "Rectangle") {
                currentShape = new Rectangle(coords.x, coords.y, currentColor, currentWidth);
            }
            else if (toolSelected == "Line") {
                currentShape = new Line(coords.x, coords.y, currentColor, currentWidth);
            }
            else if (toolSelected == "Pencil") {
                currentShape = new Pencil(coords.x, coords.y, currentColor, currentWidth);
            }
            else if (toolSelected == "Eraser") {
                currentShape = new Eraser(coords.x, coords.y, currentWidth);
            }
            else if (toolSelected == "Text") {
                if ($("#canvasText").length == 0) {
                    // if there are no textarea elements, we construct one and append it on the canvas
                    var textArea = "<div style='position:absolute;top:" + (coords.y + 180) + "px;left:" + (coords.x + 450) + "px;'><textarea id='canvasText' cols='16' rows='4''></textarea>";
                    $("#canvasText").focus();
                    $("#whiteboard").append(textArea);
                    currentShape = new Text(coords.x, coords.y + 100, currentColor, currentWidth);
                    currentShape.text = "";
                }
                else {
                    // else we get the text from the textarea, remove it and draw the text on the canvas
                    var textArea = document.getElementById("canvasText");
                    currentShape.text = textArea.value;
                    remove("canvasText");
                    if (currentShape != null && currentShape.text != null) {
                        currentShape.draw(contexts[currDrawing - 1]);
                    }
                    
                }
            }
            if (currentShape !== undefined) {
                shapeArrays[currDrawing - 1].push(currentShape);
            }
        });

        $(element).droppable({
            drop: function (e, ui) {
                var data = ui.draggable[0].src;
                var image = new Image();
                contexts[currDrawing - 1].clearRect(0, 0, canvasses[0].width, canvasses[0].height);
                image.src = data;
                image.onload = function () {
                    contexts[currDrawing - 1].drawImage(image, 0, 0);
                }

                $("#templates").append($(image).css('width', '80px').css('height', '40px').addClass('ui-widget-content').css('background-color', 'white').css('border-radius', 15));
                $("img").draggable();
                ui.draggable.hide();
                clear();
                images[currDrawing - 1].push(image);
            },
            out: function (e) {
                reDraw(contexts[currDrawing - 1]);
            }
        });
    });

    
    // if user pressed enter , we insert our text shape
    $(document).keyup(function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            
            if (currentShape != undefined) {
                var textArea = document.getElementById("canvasText");
                currentShape.text = textArea.value;
                remove("canvasText");
                currentShape.draw(contexts[currDrawing - 1]);
            }
        }
    });

    // check if user is undoing
    $(document).keydown(function (e) {
        var ctrl = 17;
        var z = 90;
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 17) {
            ctrlDown = true;
        }
        // if user presses ctrl + z
        if (ctrlDown && code == z) {
            undo();
        }
    });

    // go back to org color if mouse up
    $(document).mouseup(function (e) {
        isMouseDown = false;
        var shapeArr = shapeArrays[currDrawing - 1];
        var shape = shapeArr[selectedElement];
        if (shape != undefined) {
            shape.color = shape.oldColor;
            shape.draw(contexts[currDrawing - 1]);
        }
    });

    // Handler that goes through the radio button list and find out which radiobtn is selected
    // when it finds a element that is checked, a global var named toolSelected is given the appropriate value
    $("#radioBtns").change(function (e) {
        $.each($("input[type='radio']"), function (i, element) {
            toolSelected = element.checked ? element.value : toolSelected;
        });
        if (toolSelected != "Text") {
            $("#extraMenus").css('visibility', 'hidden');
        }
    });

    // for math, not working correctly
    $("#radioMath").click(function () {
        $("#dialog").css('display', 'inline').dialog({
            height: 400,
            width: 650,
            modal: true,
        });
    });

    // current font for text
    $("#fonts").change(function () {
        currentFont = this.value;
    });

    // color of shapes
    $("#color").change(function () {
        currentColor = this.value;
    });

    // input range element for width
    $("#widthElements").change(function () {
        currentWidth = this.value;
        $("#currLineWidth").text(currentWidth + "px");
    });

    // clear elements in current context/canvas
    $("#clear").click(function () {
        clear();
    });

    // change font size of pencil
    $("#fontSize").change(function (e) {
        currentFontSize = this.value + "px";
        $("#currfontSize").text(currentFontSize);
    });

    // font style of text
    $("#fontStyle").change(function (e) {
        currentFontStyle = this.value;
    });

    // Undo image 
    $("#undo").click(function () {
        undo();
    });

    // Repaint image or drawing
    $("#redo").click(function () {
        // arrays for current canvas
        var currShapeArr = shapeArrays[currDrawing - 1];
        var currShapeUndoArr = undoedShapeArrays[currDrawing - 1];

        var len = currShapeUndoArr.length;
        if (currShapeUndoArr[len - 1] !== undefined) {
            currShapeArr.push(currShapeUndoArr[len - 1]);
            currShapeUndoArr.splice(len - 1, 1);
        }
        else {
            var currUndoImageArr = undoedImages[currDrawing - 1];
            var len = currUndoImageArr.length;
            if (currUndoImageArr[len - 1] !== undefined) {
                images[currDrawing - 1].push(currUndoImageArr[len - 1]);
                currUndoImageArr.splice(len - 1, 1);
            }
        }
        reDraw(contexts[currDrawing - 1]);
    });

    // save template and display them
    $("#saveTemplate").click(function () {
        var image = canvasses[currDrawing - 1].toDataURL('image/png');
        image = image.replace('data:image/png;base64,', '');
        $.ajax({
            'type': 'POST',
            'url': '/Home/UploadTemplate',
            'dataType': 'json',
            data: '{ "imageData" : "' + image + '" }',
            'contentType': 'application/json; charset=utf-8',
            success: function (e) {
                create("default", { title: 'Saving image template success', text: 'Funkyzeit' });
                displayImages(e);
            },
            error: function (e) {
                create("default", { title: 'Error', text: e });
            }
        });
    });

    // handler fo input[file]
    $("#load").click(function (e) {
        $("#image").trigger('click');
    });

    // when triggered, a post form is submitted with a file
    $("#image").change(function (e) {
        $("#imageForm").submit();
    });

    // save image, and notify
    $("#save").click(function (e) {
        if ($("#defaultSave").is(':checked')) {
            var image = canvasses[currDrawing - 1].toDataURL('image/png');
            image = image.replace('data:image/png;base64,', '');
            $.ajax({
                'type': 'POST',
                'url': '/Home/UploadImage',
                'dataType': 'json',
                data: '{ "imageData" : "' + image + '" }',
                'contentType': 'application/json; charset=utf-8',
                success: function (e) {
                    create("default", { title: 'Saving image success', text: e });
                },
                error: function (e) {
                    create("default", { title: 'Error', text: e });
                }
            });
        }
        else {
            var image = canvasses[currDrawing - 1].toDataURL();
            window.open(image);
        }
    });

    // show extra menubar when text radiobutton is clicked
    $("#radioText").click(function () {
        $("#extraMenus").css('visibility', 'visible');
    });

    // cycling through drawings, it modifies the global var currDrawing which is used to access current contexts/canvases
    $("#next").click(function (e) {
        if (currDrawing > 0 && 4 > currDrawing) {
            currDrawing += 1;

            $("#" + String('drawing' + (currDrawing - 1))).css('display', 'none');
            $("#" + String('drawing' + currDrawing)).css('display', 'inline');

            create("default", { title: "Whiteboard", text: "Drawing template: " + currDrawing });
        }
    });

    // cycling through drawings, it modifies the global var currDrawing which is used to access current contexts/canvases
    $("#prev").click(function (e) {
        if (currDrawing > 1 && 4 >= currDrawing) {
            currDrawing -= 1;

            $("#" + String('drawing' + currDrawing)).css('display', 'inline');
            $("#" + String('drawing' + (currDrawing + 1))).css('display', 'none');

            create("default", { title: "Whiteboard", text: "Drawing template: " + currDrawing });
        }
    });

    /**********
    Helper functions
    **********/

    // undo last operation
    function undo() {
        // get currently selected array
        var currShapeArr = shapeArrays[currDrawing - 1];
        var currUndoShapeArr = undoedShapeArrays[currDrawing - 1];
        var currImageArr = images[currDrawing - 1];

        var len = currShapeArr.length;
        if (currShapeArr[len - 1] != undefined) {
            currUndoShapeArr.push(currShapeArr[len - 1]);
            currShapeArr.splice(len - 1, 1);
        }
        else {
            var currImageArr = images[currDrawing - 1];
            var len = currImageArr.length;
            if (currImageArr[len - 1] != undefined) {
                undoedImages[currDrawing - 1].push(currImageArr[len - 1]);
                currImageArr.splice(len - 1, 1);
            }
        }

        reDraw(contexts[currDrawing - 1]);
    }

    // load templates saved on filesystem
    function loadTemplates() {
        $.getJSON('/Home/LoadTemplates', function (data) {
            $.each(data, function (index, element) {
                displayImages(element);
            });
        });
    }

    // calc radius for circle
    function getRadius(event, source, shape) {
        var diffrX = Math.abs(shape.beginX - (event.pageX - source.offsetLeft));
        var diffrY = Math.abs(shape.beginY - (event.pageY - source.offsetTop));
        return { radius: Math.min(diffrX, diffrY) };
    }

    // return current coordinates for a given method
    function getCurrentCoords(event, source) {
        var x = event.pageX - source.offsetLeft;
        var y = event.pageY - source.offsetTop;
        return { x: x, y: y };
    }

    // remove a html dom element
    function remove(id) {
        return (elem = document.getElementById(id)).parentNode.removeChild(elem);
    }

    // clear all elements in a given context/canvas
    function clear() {
        contexts[currDrawing - 1].clearRect(0, 0, canvasses[0].width, canvasses[0].height);
        var currShapeArr = shapeArrays[currDrawing - 1];
        var currUndoedShapeArr = undoedShapeArrays[currDrawing - 1];
        var currImageArr = images[currDrawing - 1];

        currUndoedShapeArr.splice(0, currUndoedShapeArr.length);
        currShapeArr.splice(0, currShapeArr.length);
        currImageArr.splice(0, currImageArr.length);
    }

    // redraw everything
    function reDraw(ctx) {
        ctx.clearRect(0, 0, canvasses[0].width, canvasses[0].height);
        var currShapeArr = shapeArrays[currDrawing - 1];
        var currImageArr = images[currDrawing - 1];

        $.each(currShapeArr, function (index, element) {
            element.draw(ctx);
        });
        $.each(currImageArr, function (i, e) {
            ctx.drawImage(e, 0, 0);
        });

    }

    // returns an index of the currently moving/selected element
    function move(x, y) {
        var shapeArr = shapeArrays[currDrawing - 1];
        for (var i = 0; i < shapeArr.length; i++) {
            var shape = shapeArr[i];
            if (shape.type == "Rectangle" || shape.type == "Circle" || shape.type == "Line") {
                if (shape.isBetweenXandY(x, y)) {
                    return i;
                }
            }
            else if (shape.type == "Pencil") {
                if (shape.lineIsBetweenXandY(x, y)) {
                    return i;
                }
            }
            else if (shape.type == "Text") {
                if (Math.abs(shape.beginX - x) >= 0 && 30 >= Math.abs(shape.beginX - x)) {
                    return i;
                }
            }
        }
        return null;
    }

    // create a notification
    function create(template, vars, opts) {
        return container.notify("create", template, vars, opts);
    }

    // display images when a template is saved
    function displayImages(base64) {
        var img = "<img value='" + base64 + "' width='80px' height='60px' class='ui-widget-content' style='background-color:white;border-radius: 15px;' src='" + "data:image/png;base64," + base64 + "'/><br />";
        $("#templates").css('display', 'inline').append(img);
        $("img").draggable();
    }



    /**********
      Objects
    **********/
    var Shape = Class.extend({
        init: function (beginX, beginY, color, type, lineWidth) {
            this.oldColor = color;
            this.beginX = beginX;
            this.beginY = beginY;
            this.color = color;
            this.type = type;
            this.lineWidth = lineWidth;
            this.selected = false;
            this.width = 0;
            this.height = 0;
            this.endX = 0;
            this.endY = 0;
            this.radius = 0;
            this.xLines = [];
            this.yLines = [];
        },
        calcBounds: function () {
            var minX = Math.min(this.beginX, this.endX);
            var minY = Math.min(this.beginY, this.endY);
            var width = Math.abs(this.endX - this.beginX);
            var height = Math.abs(this.endY - this.beginY);
            return { minX: minX, minY: minY, width: width, height: height };
        },
        setEnd: function (endX, endY) {
            this.endX = endX;
            this.endY = endY;
        },
        draw: function (ctx) {

        }, // for rectangle, works for circle but needs enhancement for latter shape
        isBetweenXandY: function (mouseX, mouseY) {
            var isBetweenX = mouseX >= this.beginX && mouseX <= this.endX;
            var isBetweenY = mouseY >= this.beginY && mouseY <= this.endY;

            if (isBetweenX && isBetweenY) {
                return true;
            }
            return false;
        }, // used for pencil, needs enhancements
        lineIsBetweenXandY: function (mouseX, mouseY) {
            var isBetweenX = mouseX >= this.beginX && mouseX <= this.endX;
            var isBetweenY = mouseY >= this.beginY && mouseY <= this.endY;

            if (isBetweenX && isBetweenY) {
                return true;
            }

            $.each(this.xLines, function (i, e) {
                isBetweenX = mouseX >= e && mouseX <= e;
                if (isBetweenX) {
                    isBetweenX = true;
                }
            });
            $.each(this.yLines, function (i, e) {
                isBetweenY = mouseY >= e && mouseY <= e;
                if (isBetweenY) {
                    isBetweenY = true;
                }
            });
            if (isBetweenX && isBetweenY) {
                return true;
            }
        }
    });

    var Pencil = Shape.extend({
        init: function (x, y, color, lineWidth) {
            this._super(x, y, color, "Pencil", lineWidth);
        },
        draw: function (ctx) {
            this.xLines.push(this.endX);
            this.yLines.push(this.endY);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.moveTo(this.beginX, this.beginY);
            for (var i = 0; i < this.xLines.length; i++) {
                ctx.lineTo(this.xLines[i], this.yLines[i]);
            }
            ctx.stroke();
        }
    });

    var Select = Shape.extend({
        init: function (x, y) {
            this._super(x, y, null, "Select", null);
        },
        draw: function (ctx) {

        }
    });

    var Eraser = Shape.extend({
        init: function (x, y, lineWidth) {
            this._super(x, y, "rgba(0,0,0,1)", "Eraser", lineWidth);
            contexts[currDrawing - 1].beginPath();
            contexts[currDrawing - 1].moveTo(x, y);
        },
        draw: function (ctx) {
            this.xLines.push(this.endX);
            this.yLines.push(this.endY);
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.moveTo(this.beginX, this.beginY);
            ctx.globalCompositeOperation = "destination-out"; 
            ctx.strokeStyle = this.color;
            for (var i = 0; i < this.xLines.length; i++) {
                ctx.lineTo(this.xLines[i], this.yLines[i]);
            }
            ctx.stroke();
            ctx.globalCompositeOperation = "source-over";
        }
    });

    var Circle = Shape.extend({
        init: function (x, y, r, color, lineWidth) {
            this._super(x, y, color, "Circle", lineWidth);
            this.endX = x + (r * 2);
            this.endY = y + (r * 2);
            this.radius = r;
        },
        draw: function (ctx) {
            var bounds = this.calcBounds();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.arc(this.beginX, this.beginY, this.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.stroke();
        }
    });

    var Text = Shape.extend({
        init: function (x, y, color, lineWidth) {
            this._super(x, y, color, "Text", lineWidth);
            this.text = null;
            this.font = currentFontStyle + " " + currentFontSize + " " + currentFont;
        },
        draw: function (ctx) {
            ctx.fillStyle = this.color;
            ctx.font = this.font;
            ctx.fillText(this.text, this.beginX, this.beginY - 100);
        }
    });

    var Line = Shape.extend({
        init: function (x, y, color, lineWidth) {
            this._super(x, y, color, "Line", lineWidth);
        },
        draw: function (ctx) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.moveTo(this.beginX, this.beginY);
            ctx.lineTo(this.endX, this.endY);
            ctx.stroke();
        }
    });

    var Rectangle = Shape.extend({
        init: function (x, y, color, lineWidth) {
            this._super(x, y, color, "Rectangle", lineWidth);
        },
        draw: function (ctx) {
            var bounds = this.calcBounds();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.beginPath();
            ctx.rect(bounds.minX, bounds.minY, bounds.width, bounds.height);
            ctx.stroke();
        }
    });
});