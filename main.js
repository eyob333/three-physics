import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import * as CANNON from 'cannon-es'



const audio = new Audio('/sounds/hit.mp3')

function playSound(collistion){
    const impactStrength = collistion.contact.getImpactVelocityAlongNormal()
    if ( impactStrength > 1.5){
        audio.volume = Math.random()
        audio.currentTime = 0
        audio.play()
    }
}


/**
 * Debug
 */
const gui = new GUI()
const debugObject = {}


debugObject.createSphere = () => createSphere(Math.random() * 0.5, { x: (Math.random()- 0.5) * 3 , y:3, z: (Math.random()- 0.5) * 3 })
debugObject.createBox = () => createBox(
    Math.random(),
    Math.random(), 
    Math.random(), 
    { x: (Math.random()- 0.5) * 3 , y: 3 , z: (Math.random()- 0.5) * 3 }
)
debugObject.reset = () => {
    for(const object of objectsUpdate){
        // remove world body
        object.body.removeEventListener('collide', playSound)
        world.removeBody(object.body)

        // remove mesh
        scene.remove(object.mesh)
    }
}

gui.add(debugObject, 'createSphere')
gui.add(debugObject, 'createBox')
gui.add(debugObject, 'reset')
// * Base
// */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])


/**
 * physics
 */

const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set( 0, -9.82, 0)

const defaultMaterial = new CANNON.Material('default')

const defaultContactMaterail = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)
world.addContactMaterial(defaultContactMaterail)

const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.material = defaultMaterial
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5) 
world.addBody(floorBody)


/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * utils
 */

const objectsUpdate = []
const MeshMaterail = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
})
const sphereMeshGeometry = new THREE.SphereGeometry( 1, 20, 20)

function createSphere(radius, position){

    const mesh = new THREE.Mesh(
        sphereMeshGeometry,
        MeshMaterail
    )
    // mesh.scale.set(radius)
    mesh.scale.set(radius, radius, radius)
    mesh.castShadow = true
    mesh.position.copy( position )
    scene.add( mesh)

    const spherebody = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Sphere(radius),
        position: new CANNON.Vec3( 0, 3, 0),
        material: defaultMaterial

    })
    spherebody.position.copy(position)
    spherebody.addEventListener( 'collide', playSound)
    world.addBody( spherebody )
    objectsUpdate.push({
            mesh: mesh,
            body: spherebody
        })
}     


createSphere(0.5, { x:0, y: 3, z:0 })
// createSphere(0.5, { x:2, y: 6, z:0 })

const boxMeshGeometry = new THREE.BoxGeometry( 1, 1, 1)

function createBox(width, height, depth, position){

    const boxMesh = new THREE.Mesh(
        boxMeshGeometry,
        MeshMaterail
    )
    boxMesh.scale.set( width, height, depth)
    boxMesh.position.copy( position )
    boxMesh.castShadow = true
    scene.add(boxMesh)

    const boxBody = new CANNON.Body({
        mass: 1, 
        shape: new CANNON.Box( new CANNON.Vec3(height * 0.5, width * 0.5, depth * 0.5)),
        position: new CANNON.Vec3(0, 3, 0),
        material: defaultMaterial,
    })
    boxBody.position.copy(position)
    boxBody.addEventListener('collide', playSound)
    world.addBody( boxBody )
    objectsUpdate.push({
            mesh: boxMesh,
            body: boxBody
        })
}

// createBox(1, 1, 1, {x: 0, y: 3, z:0 })

/**
 * Animate
 */
const clock = new THREE.Clock()
let currentTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - currentTime
    currentTime = elapsedTime

    // update physics world
    world.step( 1/60, deltaTime, 3 )

    for(const object of objectsUpdate){
        object.mesh.position.copy( object.body.position )
        object.mesh.quaternion.copy( object.body.quaternion)
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()