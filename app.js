const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
menuToggle.addEventListener("click", () => nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
document.getElementById("year").textContent = new Date().getFullYear();

const checkin = document.querySelector('[name="checkin"]');
const checkout = document.querySelector('[name="checkout"]');
const today = new Date().toISOString().slice(0,10);
checkin.min = today; checkout.min = today;
checkin.addEventListener("change", () => { checkout.min = checkin.value; if (checkout.value && checkout.value <= checkin.value) checkout.value = ""; });

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const status = document.getElementById("formStatus");
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.checkout <= data.checkin) { status.textContent = "Check-out date must be after check-in."; return; }
  status.textContent = "Sending your enquiry…";
  try {
    const response = await fetch("/api/bookings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Please try again.");
    status.textContent = "Thank you! Your enquiry has been received. The hotel will contact you.";
    form.reset();
  } catch (err) { status.textContent = err.message || "Could not send. Please try again."; }
});

function create3DHotel() {
  const mount = document.getElementById("hotel3d");
  if (!window.THREE) {
    mount.innerHTML = '<div class="fallback-building">HOTEL<br><b>SAHAYOG</b></div>';
    return;
  }
  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, .1, 100);
  camera.position.set(8, 6, 11);
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff, 1.65));
  const key = new THREE.DirectionalLight(0xffdfb0, 2.4); key.position.set(6,10,7); scene.add(key);
  const fill = new THREE.PointLight(0x6a9ed6, 22, 30); fill.position.set(-6,4,-4); scene.add(fill);
  const hotel = new THREE.Group(); scene.add(hotel);
  const mat = (color, metalness=0, roughness=.7) => new THREE.MeshStandardMaterial({color, metalness, roughness});
  const stone = mat(0xb8b4ad), dark = mat(0x26384a,.35,.35), glass = new THREE.MeshStandardMaterial({color:0x5d91aa,metalness:.55,roughness:.18}), gold=mat(0xc6a36b,.55,.35), white=mat(0xe6e0d5);
  function block(w,h,d,x,y,z,m){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;hotel.add(mesh);return mesh;}
  // Main hotel mass and upper glass band
  block(7,2.4,3.6,0,1.2,0,stone);
  block(7.1,.95,3.68,0,2.86,0,glass);
  block(7.25,.16,3.82,0,2.35,0,gold);
  block(2.0,3.6,3.9,-2.65,1.8,.08,dark);
  block(2.0,.16,4.0,-2.65,3.62,.08,gold);
  // Entry canopy and columns
  block(7.8,.22,1.25,0,.9,2.15,dark);
  for(let x=-3.2;x<=3.21;x+=1.6) block(.12,1.55,.12,x,.1,2.65,gold);
  // Window grid on front facade
  for(let x=-2.85;x<=2.86;x+=.72) for(let y=1.35;y<=2.0;y+=.48) block(.48,.27,.035,x,y,1.84,glass);
  // Side wing, roof detail, sign panel
  block(2.3,2.8,3.5,3.55,1.4,-.1,white);
  block(1.4,.45,.12,-2.65,3.1,2.09,gold);
  // Ground plinth
  block(9.5,.18,5.8,0,-.12,0,mat(0x58606a));
  // Stylized trees and path
  for(let i=0;i<5;i++){let x=-5+i*2.5;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.65,8),gold);trunk.position.set(x,.3,-2.8);hotel.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.42,1),mat(0x547b68));crown.position.set(x,.85,-2.8);hotel.add(crown);}
  const floor=new THREE.GridHelper(24,24,0x8b9aaa,0x42566b);floor.position.y=-.23;scene.add(floor);
  const orbit={x:0,y:0,down:false,px:0,py:0};
  renderer.domElement.addEventListener("pointerdown",e=>{orbit.down=true;orbit.px=e.clientX;orbit.py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener("pointerup",()=>orbit.down=false);
  renderer.domElement.addEventListener("pointermove",e=>{if(!orbit.down)return;orbit.y+=(e.clientX-orbit.px)*.008;orbit.x+=(e.clientY-orbit.py)*.004;orbit.x=Math.max(-.25,Math.min(.45,orbit.x));orbit.px=e.clientX;orbit.py=e.clientY;});
  renderer.domElement.addEventListener("wheel",e=>{camera.position.multiplyScalar(e.deltaY>0?1.06:.94);camera.position.clampLength(8,24);},{passive:true});
  let auto=0;
  function animate(){requestAnimationFrame(animate);auto+=.002;hotel.rotation.y=orbit.y+(orbit.down?0:Math.sin(auto)*.08);hotel.rotation.x=orbit.x;renderer.render(scene,camera);}
  animate();
  new ResizeObserver(()=>{camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight);}).observe(mount);
}
create3DHotel();
