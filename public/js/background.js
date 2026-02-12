
// Interactive Neural Grid & Particle Field
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002); // Deep black fog to blend edges

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 10;
    camera.rotation.x = -0.3;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // NEURAL GRID
    const gridSize = 100;
    const gridDivisions = 60;
    const geometry = new THREE.PlaneGeometry(gridSize, gridSize, gridDivisions, gridDivisions);

    // Create base position attribute for restoring
    const basePosition = geometry.attributes.position.clone();
    geometry.userData.basePosition = basePosition;

    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff41,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });

    const grid = new THREE.Mesh(geometry, material);
    grid.rotation.x = -Math.PI / 2; // Flat on ground
    scene.add(grid);

    // PARTICLES (Floating Dust)
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 100; // x
        particlePositions[i + 1] = Math.random() * 20;      // y (height)
        particlePositions[i + 2] = (Math.random() - 0.5) * 60;  // z
    }

    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0x00ff41,
        size: 0.15,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(9999, 9999); // Off-screen initially
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Ground plane for raycast
    const intersectionPoint = new THREE.Vector3();

    document.addEventListener('mousemove', (event) => {
        // Normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ANIMATION LOOP
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // 1. Raycast to find mouse position on the imaginary ground plane
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, intersectionPoint);

        // 2. Warp Grid Vertices
        const positionAttribute = geometry.attributes.position;
        const basePositionAttribute = geometry.userData.basePosition;

        for (let i = 0; i < positionAttribute.count; i++) {
            const x = basePositionAttribute.getX(i);
            const y = basePositionAttribute.getY(i);
            const z = basePositionAttribute.getZ(i);

            // Convert vertex local coordinates (Plane is simpler before rotation) to world
            // Since Plane is rotated -90 deg X, local (x, y, z) -> world (x, -z, y) approximately
            // But we work in local space for the plane geometry modification

            // Calculate distance to mouse intersection in Local Space
            // Intersection Point is in World Space (X, 0, Z)
            // Plane is rotated, so Local X = World X, Local Y = -World Z

            const localMouseX = intersectionPoint.x;
            const localMouseY = -intersectionPoint.z;

            const dist = Math.sqrt(Math.pow(x - localMouseX, 2) + Math.pow(y - localMouseY, 2));

            // Perlin-ish noise wave
            let targetZ = Math.sin(x * 0.1 + time) * 0.5 + Math.cos(y * 0.1 + time * 0.8) * 0.5;

            // Mouse Gravity Well (Dip Effect)
            const influenceRadius = 15;
            if (dist < influenceRadius) {
                const force = (1 - dist / influenceRadius);
                targetZ -= force * 5; // Dip down 5 units
            }

            // Smooth interpolation
            const currentZ = positionAttribute.getZ(i);
            positionAttribute.setZ(i, currentZ + (targetZ - currentZ) * 0.1);
        }

        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();

        // 3. Animate Particles
        particleSystem.rotation.y = time * 0.05;

        renderer.render(scene, camera);
    }

    animate();
});
