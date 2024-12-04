import * as THREE from 'https://unpkg.com/three@latest/build/three.module.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let mixer;
const clock = new THREE.Clock();

const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingPercentage = document.getElementById('loading-percentage');

const MINIMUM_LOADING_TIME = 250;
let loadStartTime = Date.now();

// Get container dimensions
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

// Function to update renderer size based on container
function updateRendererSize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Initial renderer setup
updateRendererSize();
container.appendChild(renderer.domElement);
renderer.setClearColor(0x000000, 0);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Set camera position
camera.position.z = 3;

// Mouse movement variables
let baseRotationX = Math.PI * 0.1;
let baseRotationY = Math.PI * 0.22;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
const sensitivity = 0.0015;
const smoothing = 0.01;   
const maxRotation = 0.1;  

// Update mouse position relative to container
document.addEventListener('mousemove', (event) => {
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;
    
    mouseX = event.clientX - containerCenterX;
    mouseY = event.clientY - containerCenterY;
});

// Load 3D model
const loader = new GLTFLoader();
let model;

loader.load(
    '/3Dmodels/cat.glb',
    function (gltf) {
        const loadTime = Date.now() - loadStartTime;
        const remainingTime = Math.max(MINIMUM_LOADING_TIME - loadTime, 0);

        setTimeout(() => {
            model = gltf.scene;
            
            // Scale and position model relative to container size
            const containerScale = container.clientWidth / window.innerWidth;
            model.scale.set(0.02 * containerScale, 0.02 * containerScale, 0.02 * containerScale);
            model.rotation.x = baseRotationX;
            model.rotation.y = baseRotationY;
            
            // Center the model in the container
            model.position.set(0, -0.9, 0);
            
            mixer = new THREE.AnimationMixer(model);
            
            if (gltf.animations && gltf.animations.length) {
                gltf.animations.forEach((clip) => {
                    const action = mixer.clipAction(clip);
                    action.play();
                });
            }
            
            scene.add(model);
            
            // Hide loading screen
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, remainingTime);
    },
    function (xhr) {
        const timeProgress = Math.min((Date.now() - loadStartTime) / MINIMUM_LOADING_TIME, 1);
        const loadProgress = xhr.loaded / xhr.total;
        const totalProgress = Math.max(timeProgress, loadProgress);
        
        const percentComplete = Math.round(totalProgress * 100);
        loadingBar.style.width = percentComplete + '%';
        loadingPercentage.textContent = percentComplete + '%';
    },
    function (error) {
        console.error('An error happened:', error);
        loadingPercentage.textContent = 'Error loading model';
        loadingPercentage.style.color = 'red';
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }

    if (model) {
        // Scale rotation based on container size
        const containerScale = container.clientWidth / window.innerWidth;
        const adjustedSensitivity = sensitivity * containerScale;

        targetRotationY = baseRotationY + (mouseX * adjustedSensitivity);
        targetRotationX = baseRotationX + (mouseY * adjustedSensitivity);

        targetRotationY = Math.max(baseRotationY - maxRotation, Math.min(targetRotationY, baseRotationY + maxRotation));
        targetRotationX = Math.max(baseRotationX - maxRotation, Math.min(targetRotationX, baseRotationX + maxRotation));

        model.rotation.y += (targetRotationY - model.rotation.y) * smoothing;
        model.rotation.x += (targetRotationX - model.rotation.x) * smoothing;
    }

    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', updateRendererSize);