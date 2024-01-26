import * as BABYLON from "@babylonjs/core";
import earcut from "earcut";

const createScene = function () {
  const scene = new BABYLON.Scene(engine);
  new BABYLON.AxesViewer(scene, 3);

  var light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(3, 1.5, 0),
    scene
  );
  light.intensity = 1.5;

  scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
      case BABYLON.PointerEventTypes.POINTERDOWN:
        if (isUserInputMode == true) {
          if (pointerInfo.event.button === 2) {
            completeLoop();
          } else {
            CreatePoint();
          }
        }
        if (editVertex) {
          EditVertex();

          moveVertex();
        }
        if (!isUserInputMode && !editVertex && !moveMode) {
          selectMesh();
        }
        if (moveMode) {
          pickMeshesToMove();
        }

        break;
      case BABYLON.PointerEventTypes.POINTERUP:
        console.log("POINTER UP");
        if (currentMesh && moveMode) {
          releaseMesh();
        } else if (editVertex) {
          completeVertexEditing();
        }
        break;
      case BABYLON.PointerEventTypes.POINTERMOVE:
        console.log("POINTER MOVE");
        if (currentMesh && moveMode) {
          moveMesh();
        } else if (editVertex) {
          pullVertex();
        }
        break;
      case BABYLON.PointerEventTypes.POINTERWHEEL:
        console.log("POINTER WHEEL");
        break;
      case BABYLON.PointerEventTypes.POINTERPICK:
        console.log("POINTER PICK");
        break;
      case BABYLON.PointerEventTypes.POINTERTAP:
        console.log("POINTER TAP");
        break;
      case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
        console.log("POINTER DOUBLE-TAP");
        break;
    }
  });

  return scene;
};
///Variables:- primanry elements for the appliction:
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas);
const scene = createScene();
const camera = new BABYLON.ArcRotateCamera(
  "camera",
  0,
  0,
  0,
  new BABYLON.Vector3(0, 0, 0),
  scene
);
camera.setPosition(new BABYLON.Vector3(25, 25, 25));
camera.attachControl(canvas, true);
camera.upperBetaLimit = Math.PI / 2;
const floor = createFloor(scene);
const floorMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
floorMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
const sphereMaterial = new BABYLON.StandardMaterial("sphere material", scene);
sphereMaterial.diffuseColor = new BABYLON.Color3(1, 0, 1);
floor.material = floorMaterial;

///Variables:- Bool type variables help in identifying the type of operation to execute during user interactions.
let isUserInputMode = false;
let isLoopComplete = false;
let moveMode = false;
let editVertex = false;

///Variables:- other variables
const availableMeshes = [];
let xIndexes = [];
let zIndexes = [];
let dragBox = null;
let fidx = null;
let dragBoxMat = null;
var userInputPoints = [];
var lines = [];
var ExtrusionLoopGeometries = [];
let currentMesh = null;
let startingPoint = null;

///Events- Using DOM manipultion by adding event handlers to initiate respective operations.
document.getElementById("btn1").addEventListener("click", initializeExtrution);
document.getElementById("finishbttn").addEventListener("click", finishOperations);
document.getElementById("btn2").addEventListener("click", initiateEditVertex);
document.getElementById("btn3").addEventListener("click", initiateMove);

///Keeping finish button hidden, toggle its visibility as per requirement
finishbttn.style.display = "none";

///Function:- Used to Cretae Ground
function createFloor(scene, width, height, subdivisions, color) {
  // Default values
  width = width || 75;
  height = height || 75;
  subdivisions = subdivisions || 1;

  // Create ground mesh
  var ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: width, height: height, subdivisions: subdivisions },
    scene
  );

  return ground;
}

///Function:- Completes the ongoing Operation
function finishOperations() {
  ///Create Extrusion
  if (isUserInputMode) {
    if (userInputPoints.length > 0) {
      completeExtrusion();
    }

    floorMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    isUserInputMode = false;
    isLoopComplete = false;
  }
  ///Move Mode
  else if (moveMode) {
    moveMode = false;
  }
  ///Vertex Edit
  else if (editVertex) {
    editVertex = false;
  }
  ///Show the Buttons
  showButton();
}

///Function:-Called when user clicks on Create Extrusion Button.
function initializeExtrution() {
  userInputPoints = [];
  isUserInputMode = true;
  ExtrusionLoopGeometries = [];
  hideButtons();

  let floorcolor = new BABYLON.Color3(1, 1, 1);
  floorMaterial.diffuseColor = floorcolor;
  finishbttn.style.display = "";
}

///Function:-Called when user clicks on Move Button.
function initiateMove() {
  moveMode = true;
  hideButtons();
}

///Function:-Called when user clicks on Vertex Edit Button.
function initiateEditVertex() {
  editVertex = true;
  hideButtons();
}

///Function:-Called when an operation starts to hide the buttons.
function hideButtons() {
  btn1.style.display = "none";
  btn2.style.display = "none";
  btn3.style.display = "none";
  finishbttn.style.display = "";
}

///Function:-Called when an operation completes to show the buttons.
function showButton() {
  btn1.style.display = "";
  btn2.style.display = "";
  btn3.style.display = "";
  finishbttn.style.display = "none";
}

///Function:- Used to highlight the selected element in the Scene.
function selectMesh() {
  const pickMaterial = new BABYLON.StandardMaterial("moveMaterial", scene);

  var ray = scene.createPickingRay(
    scene.pointerX,
    scene.pointerY,
    BABYLON.Matrix.Identity(),
    camera
  );
  var hit = scene.pickWithRay(ray);

  if (currentMesh && hit.pickedMesh != floor && currentMesh != floor) {
    var unselectedMat = new BABYLON.StandardMaterial("unselectMat", scene);
    unselectedMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    currentMesh.material = unselectedMat;
    currentMesh = null;
  }
  if (hit && hit.pickedMesh && hit.pickedMesh != floor && !currentMesh) {
    currentMesh = hit.pickedMesh;

    pickMaterial.diffuseColor = new BABYLON.Color3(0.58, 0.75, 1);

    currentMesh.material = pickMaterial;
  } else if (!isUserInputMode && !editVertex && hit.pickedMesh == floor) {
    if (currentMesh && currentMesh != floor) {
      pickMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
      currentMesh.material = pickMaterial;
      currentMesh = null;
    }
  }
}

///Function:- Used Create Points and Line as User enters Draw Mode.
function CreatePoint() {
  if (isUserInputMode && !isLoopComplete) {
    var pickInfo = scene.pick(scene.pointerX, scene.pointerY);

    if (pickInfo.hit) {
      var point = pickInfo.pickedPoint;
      userInputPoints.push(new BABYLON.Vector3(point.x, 0, point.z));
      // Visualize the picked point
      var sphere = BABYLON.MeshBuilder.CreateSphere(
        "pointSphere",
        { diameter: 0.1 },
        scene
      );
      sphere.material = sphereMaterial;
      sphere.position = new BABYLON.Vector3(point.x, 0, point.z);
      ExtrusionLoopGeometries.push(sphere);

      // Connect consecutive points with lines
      if (userInputPoints.length > 1) {
        var line = BABYLON.MeshBuilder.CreateLines(
          "line",
          {
            points: [
              userInputPoints[userInputPoints.length - 2],
              userInputPoints[userInputPoints.length - 1],
            ],
            updatable: true,
          },
          scene
        );
        line.color = new BABYLON.Color3(0.5, 0, 0.5);
        lines.push(line);
      }
    }
  }
}

///Function:- This Methos completes the 2D-Loop Drawn by the user when user clicks Right Mouse Button.
function completeLoop() {
  if (userInputPoints.length < 3) {
    alert("Please provide atleast 3 points to complete the loop");
    return;
  }
  isLoopComplete = true;
  if (isUserInputMode && userInputPoints.length > 2 && isLoopComplete) {
    userInputPoints.push(userInputPoints[0]);
    var line = BABYLON.MeshBuilder.CreateLines(
      "line",
      {
        points: [
          userInputPoints[userInputPoints.length - 2],
          userInputPoints[userInputPoints.length - 1],
        ],
        updatable: true,
      },
      scene
    );
    line.color = new BABYLON.Color3(0.5, 0, 0.5);
    lines.push(line);
  }
}

///Function:- When user clicks on FINISH Button after compeleting the 2Dshape, it converts it into a 3D-Mesh.
function completeExtrusion() {
  //Disposng Visual Cues(spheres)
  ExtrusionLoopGeometries.forEach((element) => {
    element.dispose();
  });

  //Disposng Visual Cues(lines)
  lines.forEach((element) => {
    element.dispose();
  });

  //Creating Extrusion
  var extrudedMesh = new BABYLON.MeshBuilder.ExtrudePolygon(
    "polygon",
    {
      shape: userInputPoints,
      depth: 1.5,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
      updatable: true,
      wrap: true,
    },
    scene,
    earcut.default
  );
  availableMeshes.push(extrudedMesh);
  extrudedMesh.position.y = 1.5;
  extrudedMesh.convertToFlatShadedMesh();
}

///Function:- It helps in Picking the Mesh.
function pickMeshesToMove() {
  //Casting picking ray
  var ray = scene.createPickingRay(
    scene.pointerX,
    scene.pointerY,
    BABYLON.Matrix.Identity(),
    camera
  );
  var hit = scene.pickWithRay(ray);

  currentMesh = hit.pickedMesh;
  if (currentMesh && currentMesh != floor && moveMode) {
    //Adding new material to the picked Mesh, to create a Visual Cue for the user.
    const moveMaterial = new BABYLON.StandardMaterial("moveMaterial", scene);
    moveMaterial.diffuseColor = new BABYLON.Color3(0.58, 0.75, 1);

    currentMesh.material = moveMaterial;
    startingPoint = getPosition();
    //Detatching Camera from Canvas in order to Move the picked Mesh.
    camera.detachControl(canvas);
  }
}

///Function:- It helps in Moving the Picked Mesh.
function moveMesh() {
  if (!startingPoint || !currentMesh) {
    return;
  }
  var current = getPosition();
  if (!current) {
    return;
  }

  var diff = current.subtract(startingPoint);
  currentMesh.position.addInPlace(diff);

  startingPoint = current;
}

///Function:- It helps in releasing the picked mesh on its final position.
function releaseMesh() {
  if (!isUserInputMode) {
    if (!startingPoint || !currentMesh) {
      return;
    }
    var current = getPosition();
    if (!current) {
      return;
    }

    currentMesh.position.addInPlace(BABYLON.Vector3.Zero());
    currentMesh.material = "";
    camera.attachControl(canvas, true);
    startingPoint = null;
    currentMesh = null;
  }
}

///Function:- It helps in pulling the selected vertex.
function pullVertex() {
  if (!startingPoint || !dragBox) {
    return;
  }

  var current = getPosition(false);
  if (!current || !currentMesh || (!fidx && fidx != 0)) {
    return;
  }

  var diff = current.subtract(startingPoint);
  dragBox.position.addInPlace(diff);

  startingPoint = current;

  var positions = currentMesh.getVerticesData(
    BABYLON.VertexBuffer.PositionKind
  );
  var indices = currentMesh.getIndices();

  if (!positions || !indices) {
    return;
  }

  for (var i = 0; i < xIndexes.length; i++) {
    positions[xIndexes[i]] = current.x;
  }

  for (var i = 0; i < zIndexes.length; i++) {
    positions[zIndexes[i]] = current.z;
  }

  currentMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
}

///Function:- It helps in releasing the edited Vertex.
function completeVertexEditing() {
  if (editVertex) {
    if (startingPoint) {
      camera.attachControl(canvas, true);
      if (dragBox) {
        dragBox.dispose();
      }
      startingPoint = null;
    }
  }
}

///Function:- It helps in moving the picked Vertex.
function moveVertex() {
  if (editVertex && dragBox) {
    const moveMaterial = new BABYLON.StandardMaterial("moveMaterial", scene);
    moveMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
    dragBox.material = moveMaterial;
    startingPoint = getPosition(false);
    if (startingPoint) {
      setTimeout(() => {
        camera.detachControl(canvas);
      }, 0);
    }
  }
}

///Function:- Function to fetch the vertices from the mesh and create a drag box on the vertex.
function EditVertex() {
  if (isUserInputMode) {
    return;
  }

  if (dragBox) {
    dragBox.dispose();
    dragBox = null;
  }

  let ray = scene.createPickingRay(
    scene.pointerX,
    scene.pointerY,
    BABYLON.Matrix.Identity(),
    camera
  );
  let pickingInfo = scene.pickWithRay(ray);
  if (
    pickingInfo &&
    pickingInfo.pickedMesh &&
    pickingInfo.pickedMesh != floor
  ) {
    xIndexes = [];
    zIndexes = [];
    currentMesh = pickingInfo.pickedMesh;
    var wMatrix = pickingInfo.pickedMesh.computeWorldMatrix(true);
    pickingInfo.pickedMesh.isPickable = true;
    //getting Mesh Vertices
    var positions = pickingInfo.pickedMesh.getVerticesData(
      BABYLON.VertexBuffer.PositionKind
    );
    var indices = pickingInfo.pickedMesh.getIndices();
    dragBox = BABYLON.Mesh.CreateBox("dragBox", 0.15, scene);
    var vertexPoint = BABYLON.Vector3.Zero();
    fidx = pickingInfo.faceId;
    var minDist = Infinity;
    var dist = 0;
    var hitPoint = pickingInfo.pickedPoint;
    var idx = 0;
    var boxPosition = BABYLON.Vector3.Zero();
    if (!indices || !positions || !hitPoint) return;
    for (var i = 0; i < 3; i++) {
      idx = indices[3 * fidx + i];
      vertexPoint.x = positions[3 * idx];
      var initX = positions[3 * idx];
      vertexPoint.y = positions[3 * idx + 1];
      var initY = positions[3 * idx + 1];
      vertexPoint.z = positions[3 * idx + 2];
      var initZ = positions[3 * idx + 2];
      BABYLON.Vector3.TransformCoordinatesToRef(
        vertexPoint,
        wMatrix,
        vertexPoint
      );
      dist = vertexPoint.subtract(hitPoint).length();
      if (dist < minDist) {
        boxPosition = vertexPoint.clone();
        vertexPoint.x = initX;
        vertexPoint.z = initZ;
        minDist = dist;
      }
    }
    dragBox.position = boxPosition;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] == vertexPoint.x) {
        xIndexes.push(i);
      }
      if (positions[i] == vertexPoint.z) {
        zIndexes.push(i);
      }
    }

    dragBoxMat = new BABYLON.StandardMaterial("dragBoxMat", scene);
    dragBoxMat.diffuseColor = new BABYLON.Color3(1.4, 3, 0.2);
    dragBox.material = dragBoxMat;
  }
}

///Function:- Returns a value of the Coordinates of the pointer in the scene.
function getPosition(ground = true) {
  if (scene) {
    var pickinfo = scene.pick(scene.pointerX, scene.pointerY, (mesh) => {
      return ground ? mesh == floor : true;
    });
    if (pickinfo && pickinfo.hit && pickinfo.pickedPoint) {
      if (pickinfo.pickedPoint.y < 0) {
        pickinfo.pickedPoint.y = 0;
      }
      return pickinfo.pickedPoint;
    }
  }

  return null;
}

///Function:- In order to render the changes in the scene.
engine.runRenderLoop(function () {
  scene.render();
});

///Function:- Making the scene responsive.
window.addEventListener("resize", function () {
  engine.resize();
});
