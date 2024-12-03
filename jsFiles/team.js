import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let mixer;
const clock = new THREE.Clock();

const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingPercentage = document.getElementById('loading-percentage');

const MINIMUM_LOADING_TIME = 250; // 1 second minimum loading time
let loadStartTime = Date.now();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);
renderer.setClearColor(0x000000, 0);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

camera.position.z = 3;

// Mouse movement variables (adjust these values to make movement more subtle)
let baseRotationX = Math.PI * 0.1;
let baseRotationY = Math.PI * -0.20;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
const sensitivity = 0.0015; // Reduce this number for more subtle movement
const smoothing = 0.01;    // Adjust smoothing factor
const maxRotation = 0.1;   // Limit maximum rotation (in radians)

// Update mouse position
document.addEventListener('mousemove', (event) => {
    // Calculate mouse position relative to center of screen
    mouseX = (event.clientX - window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2);
});

// Load your 3D model
const loader = new GLTFLoader();
let model;

// Modify your loader section
loader.load(
    '/3Dmodels/plane.glb',
    function (gltf) {
        // Calculate how long the loading has taken
        const loadTime = Date.now() - loadStartTime;
        const remainingTime = Math.max(MINIMUM_LOADING_TIME - loadTime, 0);

        // Wait for minimum time before hiding loading screen
        setTimeout(() => {
            model = gltf.scene;
            
            // Your existing model setup code...
            model.position.set(0, 0, 0);
            model.scale.set(2.3, 2.3, 2.3);
            model.rotation.x = baseRotationX;
            model.rotation.y = baseRotationY;
            
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
        // Progress callback - ensure smooth progress even if loading is quick
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

// Modify your animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update animations
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }

    if (model) {
        targetRotationY = baseRotationY + (mouseX * sensitivity);
        targetRotationX = baseRotationX + (mouseY * sensitivity);

        let maxOffset = maxRotation;
        targetRotationY = Math.max(baseRotationY - maxOffset, Math.min(targetRotationY, baseRotationY + maxOffset));
        targetRotationX = Math.max(baseRotationX - maxOffset, Math.min(targetRotationX, baseRotationX + maxOffset));

        model.rotation.y += (targetRotationY - model.rotation.y) * smoothing;
        model.rotation.x += (targetRotationX - model.rotation.x) * smoothing;
    }

    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});