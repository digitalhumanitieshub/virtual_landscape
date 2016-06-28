// Copyright 2016 Digital Humanities Hub and Andrew Thomas.
// Coded June 2016 by Andrew Thomas.
// A demo of building an interactive 3D digital landscape in a web-browser.

var scene,camera;
var sky,ground;
var spheres=[];
var oscl=130;
var spsizes=[oscl,70,70,70,70,70,70,70,70,70];
var spx=[],spy=[],spz=[];
var moonrot=0,bounciness=0.3,spud=0,spoffs=[],mscl=1,moony=oscl;
var yaw=-Math.PI/2,pitch=0,roll=0,vel=0,upvel=0,spin=0;
var cx=0,cy=1.5,cz=15; // The position of the camera (just set up for simple first person viewing)
var lx,ly,lz,la=100;    // The point the camera looks at and how far it is from the camera
var havegamepad=false,gpindex=-99,imagesloaded=0;
var sounds=[],backnoise,crow,sheep,lamb;
var keys=[0,0,0,0,0,0,0];
var checkGP;

function init()
{
  var webglEl=document.getElementById('sphere');
  var width=window.innerWidth,height=window.innerHeight;
  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0xdd8888,0.0015);
  camera=new THREE.PerspectiveCamera(90,(width*stereoaspect)/height,0.1,2000);
  renderer.setPixelRatio(pxratio);
  renderer.setSize(width,height);
  effect.setSize(width,height);
  setspherepositions();
  addgeometry();
  addlights();
  addsoundeffects();
  camera.position.set(cx,cy,cz);
  webglEl.appendChild(renderer.domElement);
  window.addEventListener('resize',onWindowResize,false);
  document.onkeydown=checkkeydown;
  document.onkeyup=checkkeyup;
  renderer.domElement.addEventListener('dblclick',onDoubleClick);
  window.addEventListener("gamepadconnected", function(e)
  {
    gpindex=e.gamepad.index;
    havegamepad=true;
  });
  window.addEventListener("gamepaddisconnected", function(e)
  {
    havegamepad=false;
  });
  checkGP=window.setInterval(function()
  {
    if(!havegamepad)
    {
      var gp=navigator.getGamepads();
      if(typeof gp!='undefined')
      {
        for(var c=0;c<gp.length;c++)
        {
          if(typeof gp[c]!='undefined')
          {
            if(gp[c].timestamp!=0)
            {
              gpindex=c;
              havegamepad=true;
            }
          }
        }
      }
    }
  },500);
  render();
}

function addsoundeffects()
{
  var c;
  backnoise=new Audio('background.mp3');
  backnoise.addEventListener('ended',function()
  {
    this.currentTime=0;
    this.play();
  },false);
  backnoise.play();
  crow=new Audio('crow.mp3');
  sheep=new Audio('sheep.mp3');
  lamb=new Audio('lamb.mp3');
  for(c=0;c<10;c++) sounds[c]=new Audio('sp_'+c+'.mp3');
  sounds[10]=new Audio('bangow.mp3');
}

function setspherepositions()
{
  var c,a=0,r;
  spx[0]=0;
  spy[0]=280;
  spz[0]=0;
  spx[1]=0;
  spy[1]=280;
  spz[1]=0;
  for(c=0;c<8;c++) spsizes[c+2]+=Math.random()*spsizes[c+2]/2;
  for(c=0;c<8;c++)
  {
    if(a==0)
    {
      r=850;
      a=1;
    }
    else
    {
      r=500;
      a=0;
    }
    spx[c+2]=r*Math.cos((2*Math.PI/8)*c);
    spy[c+2]=spsizes[c+2]+10+(Math.random()*spsizes[c+2])+spsizes[c+2];
    spz[c+2]=r*Math.sin((2*Math.PI/8)*c);
  }
}

function addgeometry()
{
  var c,t;
  var matl=new THREE.MeshBasicMaterial({map: THREE.ImageUtils.loadTexture('lakeback.jpg')});
  sky=new THREE.Mesh(new THREE.SphereGeometry(1000,32,32,0,2*Math.PI,0,Math.PI/2),matl);
  sky.material.side=THREE.BackSide;
  sky.position.set(0,0,0);
  scene.add(sky);
  var grass=THREE.ImageUtils.loadTexture('grass.jpg');
  grass.wrapS=grass.wrapT=THREE.RepeatWrapping;
  grass.repeat.set(1000,1000);
  ground=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),
           new THREE.MeshPhongMaterial({
             map: grass}));
  ground.position.set(0,0,0);
  ground.rotateX(-Math.PI/2);
  scene.add(ground);
  for(c=0;c<10;c++)
  {
    t=THREE.ImageUtils.loadTexture('sphere_'+c+'.jpg');
    spheres[c]=new THREE.Mesh(new THREE.SphereGeometry(spsizes[c],30,30),
                 new THREE.MeshPhongMaterial({ map: t }));
    spheres[c].position.set(spx[c],spy[c],spz[c]);
    scene.add(spheres[c]);
  }
  landing=new THREE.Mesh(new THREE.PlaneGeometry(20,20),
            new THREE.MeshPhongMaterial({
              map: THREE.ImageUtils.loadTexture('landing.jpg')}));
  landing.rotateX(-Math.PI/2);
  for(c=0;c<10;c++)
  {
    if(c!=1)
    {
      landing.position.set(spx[c],0.05,spz[c]);
      scene.add(landing.clone());
    }
  }
}

function addlights()
{
  var c;
  var light=new THREE.PointLight(0x303030);
  light.position.set(0,10,0);
  scene.add(light);
  for(c=0;c<10;c++)
  {
    light.position.set(spx[c],spy[c]*0.5,spz[c]);
    scene.add(light.clone());
  }
}

function setcamerapos()
{
  if(cy<1.6)
  {
    vel*=0.9;
    spin*=0.7;
  }
  else
  {
    vel*=0.98;
    spin*=0.9;
  }
  cx+=vel*Math.cos(yaw);
  cy+=upvel;
  cz+=vel*Math.sin(yaw);
  if(cy<1.5)
  {
    if(upvel<0) upvel*=-bounciness;
    cy=1.5;
  }
  if(Math.abs(vel)>0.6 && upvel<0 && spin<0.001) upvel*=0.2;
  upvel-=0.01;
  camera.position.set(cx,cy,cz);
  lx=cx+la*Math.cos(yaw+spin);
  ly=cy+la*Math.sin(pitch+spin);
  lz=cz+la*Math.sin(yaw+spin);
  if(cy>1.6) camera.up=new THREE.Vector3(Math.sin(-(roll+spin)*vel),1,0);
  else camera.up=new THREE.Vector3(0,1,0);
  camera.lookAt(new THREE.Vector3(lx,ly,lz));
}

function updatescene()
{
  var c,d=1,q=0;
  // Rotate the earth
  spheres[0].rotation.y=spheres[0].rotation.y+0.02;
  // Rotate the moon
  moonrot+=Math.PI/300;
  if(moonrot>(2*Math.PI)) moonrot-=2*Math.PI;
  spx[1]=675*Math.cos(-moonrot);
  spz[1]=675*Math.sin(-moonrot);
  spy[1]=moony+(moony*Math.sin(moonrot))+spsizes[1];
  spheres[1].position.set(spx[1],spy[1],spz[1]);
  spheres[1].rotation.y+=0.03;
  // Rotate, scale, move the other spheres
  spoffs[0]=0;
  spoffs[1]=0;
  mscl=(Math.sin(spud/2)+2)/2;
  spheres[0].scale.x=mscl;
  spheres[0].scale.y=mscl;
  spheres[0].scale.z=mscl;
  spsizes[0]=oscl*mscl;
  for(c=2;c<10;c++)
  {
    if(c%2==0) spoffs[c]=spsizes[c]*Math.sin(spud);
    else       spoffs[c]=spsizes[c]*Math.cos(spud);
    spheres[c].position.set(spx[c],spy[c]+spoffs[c],spz[c]);
    spheres[c].rotation.y+=0.01*d;
    d*=-1;
  }
  spud+=Math.PI/200;
  if(spud>(2*Math.PI)) spud-=2*Math.PI;
  restoreyaw();
  // We'll play some animal sounds in the background. Using a random number
  // to start playing makes it sound less predictable and so more natural.
  if(Math.random()<0.0002) crow.play();
  if(Math.random()<0.0005) sheep.play();
  if(Math.random()<0.001) lamb.play();
}

function restoreyaw()
{
  // If left unchecked the yaw can overflow so we keep it in check
  if(yaw>(2*Math.PI))
  {
    while(yaw>(2*Math.PI)) yaw-=2*Math.PI;
  }
  else if(yaw<(-2*Math.PI))
  {
    while(yaw<(-2*Math.PI)) yaw+=2*Math.PI;
  }
}

function checkskycollision()
{
  // Just a very simple way of dealing with collisions in the sky
  // to stop us getting out of the scene. It doesn't calculate the
  // reflection vector, rather it stops horizontal motion and makes
  // you drop if you were going upwards. Simple and quick.
  var d=Math.sqrt(cx*cx+cy*cy+cz*cz);
  if(d>950)
  {
    upvel=-1;
    var a=949.9/d;
    cx*=a;
    cy*=a;
    cz*=a;
    sounds[10].play();
    vel=0;
  }
}

function checkspherecollision()
{
  // Just a simple way of responding to us colliding with a sphere. If we wanted proper
  // realism we'd do the vector maths correctly, but this should hopefully be accurate
  // enough and reduce the processing time required a little.
  var c,d,dx,dy,dz,dd,da;
  for(c=0;c<10;c++)
  {
    d=Math.sqrt(((spx[c]-cx)*(spx[c]-cx))+(((spy[c]+spoffs[c])-cy)*((spy[c]+spoffs[c])-cy))+((spz[c]-cz)*(spz[c]-cz)));
    if(d<(spsizes[c]+2))
    {
      // Move the camera to the boundary of the sphere.
      var dx=cx-spx[c];
      dy=cy-(spy[c]+spoffs[c]);
      var dz=cz-spz[c];
      var dd=Math.sqrt(dx*dx+dy*dy+dz*dz);
      var da=(spsizes[c]+2)/dd;
      cx=spx[c]+(dx*da);
      cy=spy[c]+spoffs[c]+(dy*da);
      cz=spz[c]+(dz*da);
      // Now we calculate the reflection angles (plan XZ only,
      // as spin and upvel changes will do the rest).
      var ca=Math.atan2(dz,dx);
      var a=(ca+1000)-(yaw+1000);
      yaw+=a*-2;
      // And adjust the velocities for a bit more fun
      vel*=Math.random()*10;
      if(upvel>0) upvel*=-(Math.random()*2);
      else if(upvel<0) upvel*=Math.random()*2;
      spin=(Math.random()-0.5)*30;
      sounds[c].play();
    }
  }
}

function render()
{
  requestAnimationFrame(render);
  checkcontrols();
  checkskycollision();
  checkspherecollision();
  updatescene();
  setcamerapos();
  effect.render(scene,camera);
}

function onWindowResize()
{
  camera.aspect=(window.innerWidth*stereoaspect)/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  effect.setSize(window.innerWidth,window.innerHeight);
}

function onDoubleClick()
{
  if(isFullScreen()==true)
  {
    exitFullScreen();
    full=false;
  }
  else
  {
    requestFullScreen(this);
    full=true;
  }
}

function checkcontrols()
{
  var sf=false;
  if(havegamepad==true) // Use the gamepad if one is connected
  {
    var gamepads=navigator.getGamepads();
    var pad=gamepads[gpindex];
    if(pad.buttons[1].pressed) sf=true; // In case the gamepad only has one joystick control
    if(sf==false)
    {
      if(Math.abs(pad.axes[0])>0.02) yaw+=mapvalue(pad.axes[0],-1,1,-Math.PI/100,Math.PI/100);
      if(Math.abs(pad.axes[0])>0.02) roll=mapvalue(pad.axes[0],-1,1,-Math.PI/50,Math.PI/50);
      else roll=0;
      if(Math.abs(pad.axes[1])>0.02) vel-=pad.axes[1]*0.02;
    }
    else
    {
      if(Math.abs(pad.axes[1])>0.02) pitch=mapvalue(pad.axes[1],1,-1,-Math.PI/3,Math.PI/3);
    }
    if(pad.axes.length>2 && sf==false)
    {
      pitch=mapvalue(pad.axes[5],1,-1,-Math.PI/3,Math.PI/3);
    }
    if(pad.buttons[2].pressed || pad.buttons[4].pressed || pad.buttons[5].pressed || pad.buttons[6].pressed || pad.buttons[7].pressed)
      upvel+=0.0105;
  }
  else // Fall back to keyboard if no gamepad connected
  {
    if(keys[0]==1) vel+=0.02;
    if(keys[1]==1) vel-=0.02;
    if(keys[2]==1) yaw-=Math.PI/100;
    if(keys[3]==1) yaw+=Math.PI/100;
    if(keys[4]==1) upvel+=0.0105;
    if(keys[5]==1 && pitch<(Math.PI/3)) pitch+=(Math.PI/30);
    if(keys[6]==1 && pitch>(-Math.PI/3)) pitch-=(Math.PI/30);
  }
}

function checkkeydown(e)
{a
  switch(e.keyCode)
  {
    case 38:  keys[0]=1; // UP
              break;
    case 40:  keys[1]=1; // DOWN
              break;
    case 37:  keys[2]=1; // LEFT
              break;
    case 39:  keys[3]=1; // RIGHT
              break;
    case 32:  keys[4]=1; // SPACE
              break;
    case 81:  keys[5]=1; // Q
              break;
    case 65:  keys[6]=1; // A
              break;
  }
}

function checkkeyup(e)
{
  switch(e.keyCode)
  {
    case 38:  keys[0]=0; // UP
              break;
    case 40:  keys[1]=0; // DOWN
              break;
    case 37:  keys[2]=0; // LEFT
              break;
    case 39:  keys[3]=0; // RIGHT
              break;
    case 32:  keys[4]=0; // SPACE
              break;
    case 81:  keys[5]=0; // Q
              break;
    case 65:  keys[6]=0; // A
              break;
  }
}

function mapvalue(num,smin,smax,emin,emax)
{
  return (((num-smin)/(smax-smin))*(emax-emin))+emin;
}

