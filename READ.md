# BabylonAssignment_Afzal

## Getting Started

To begin, make sure you have Node Package Manager (NPM) installed on your command line or terminal.

1. Run `npm install` to install all the NPM dependencies.
2. Execute the command `npm run dev` to launch the assignment.

## Usage

The application operates in three distinct modes. Extrusion is initiated by clicking the "Finish" button after drawing shapes. The extrusion height is fixed at 1.5 units. Also added functionality to select the available meshes by clicking on them, click on floor in oreder to unselect the selected mesh.

### 1. Draw Mode:

Activate draw mode by clicking the "Draw" button. In draw mode, left-click to add points to the shape, and right-click to conclude the shape. Upon completing the drawing, click the "Finish" button to execute the extrusion.

### 2. Move Mode:

Switch to move mode by clicking the "Move" button. In move mode, left-click and drag to relocate the selected shape. Press the "Finish" button to exit move mode.

### 3. Vertex Edit Mode:

Enter vertex edit mode by clicking the "Vertex Edit" button. While in vertex edit mode, left-click and drag to adjust the position of a selected vertex. A box will appear around the chosen vertex. Click the "Finish" button to exit vertex edit mode.

## Implementation

### 1. Draw Mode:

The polygon is formed by adding points to an array, and this array is subsequently passed to the `BABYLON.MeshBuilder.ExtrudePolygon` function. The polygon, initially created with a height of 1.5, undergoes extrusion when the "Finish" button is clicked.

### 2. Move Mode:

Move mode is implemented by capturing the `onPointerDownObservable` event, determining the clicked point, and identifying the corresponding shape. The selected shape is then relocated by adjusting its position based on mouse movement.

### 3. Vertex Edit Mode:

Vertex edit mode is realized by pinpointing the clicked vertex using the `pickWithRay` function. The chosen vertex is then repositioned by adjusting its coordinates according to the surrounding box's position.
