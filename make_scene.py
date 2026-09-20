import json,random,math
random.seed(9)
o=[]
def box(n,p,s,c,**kw):o.append(dict(name=n,position=p,size=s,color=c,**kw))
box('island',[0,-.26,0],[13,.5,10.5],'#17283c')
box('road',[0,.015,0],[12.85,.06,10.35],'#233b50',roughness=.19,metalness=.4)
box('pavement',[0,.15,-1.3],[9.4,.3,6.7],'#8b9b9f')
for x in range(-9,10):
 for z in range(-8,5):box('paver',[x*.48,.315,z*.48-1.1],[.46,.02,.46],'#a0aaa8')
box('floor',[0,.38,-1.8],[7.3,.12,4.7],'#c8c7b0')
box('back',[0,1.9,-4.1],[7.4,3.1,.15],'#c0c6b7')
box('left',[-3.65,1.9,-1.8],[.14,3.1,4.7],'#a2b2b2')
# right glass wall
for z in [-3.5,-2.2,-.9]:
 box('sideglass',[3.65,1.8,z],[.06,2.7,1.25],'#a6d6d6',glass=True)
 box('mullion',[3.7,1.85,z+.64],[.09,3.05,.07],'#3b676b')
# front shop glazing, door centered at x=.45
for x,w in [(-2.55,2.15),(2.7,1.75)]:
 box('window',[x,1.8,.58],[w,2.7,.035],'#a8d8d5',glass=True)
for x in [-3.65,-1.45,1.8,3.65]:box('frame',[x,1.85,.65],[.085,3.05,.095],'#547778')
for x in [-.62,.98]:
 name='DoorLeft' if x<0 else 'DoorRight'
 box(name,[x,1.77,.67],[1.53,2.65,.055],'#b5e2df',glass=True,door=True)
 for dx in [-.77,.77]:box(name+'Frame',[x+dx,1.77,.7],[.055,2.7,.08],'#7b9f9d',parent=name)
 box(name+'Handle',[x+(.55 if x<0 else -.55),1.68,.77],[.045,.48,.045],'#e0e3d5',parent=name)
 box(name+'Stripe',[x,1.36,.72],[1.5,.10,.02],'#e6d7a2',parent=name)
box('doortrack',[.18,3.15,.68],[3.35,.14,.17],'#294f58')
box('roof',[0,3.49,-1.8],[7.9,.22,5.1],'#688e91')
box('roofInset',[0,3.61,-1.8],[7.48,.04,4.7],'#304e5c')
for x in [-3.85,3.85]:box('roofRim',[x,3.72,-1.8],[.15,.3,5.05],'#426d79')
box('rearRim',[0,3.72,-4.25],[7.8,.3,.16],'#426d79')
box('fascia',[0,3.18,.85],[7.85,.53,.28],'#f2e6b5',emissive=.7)
box('tealStripe',[0,2.95,1],[7.86,.09,.06],'#3bb8aa',emissive=.2)
box('amberStripe',[0,3.42,1],[7.86,.06,.06],'#eda95d',emissive=.4)
box('awning',[0,2.86,.96],[8.05,.12,.58],'#326d78')
# shelving packed goods
colors=['#ca5c48','#e5bf67','#538f87','#e2d8b7','#6984a7','#a85d59']
for sx,sz,width in [(-2.4,-2.8,1.5),(-.35,-2.8,1.5),(1.8,-2.8,1.5),(-2.6,-.7,1.25),(1.95,-.9,1.25)]:
 box('shelfback',[sx,1.3,sz-.25],[width,1.8,.1],'#d6d5c1')
 for y in [.55,1.05,1.55,2.05]:
  box('shelf',[sx,y,sz],[width,.055,.65],'#e0dfce')
  box('priceRail',[sx,y+.025,sz+.34],[width,.06,.03],'#d2a861')
  for k in range(7):
   h=random.uniform(.22,.35)
   box('goods',[sx-width/2+.12+k*(width-.2)/7,y+h/2+.04,sz+.05],[.12,h,.21],random.choice(colors))
box('counter',[-2.6,.88,-.05],[1.4,1,.6],'#9ca891')
box('countertop',[-2.6,1.42,-.05],[1.55,.07,.72],'#e9dfc4')
box('register',[-2.5,1.6,-.08],[.38,.3,.25],'#263d43')
for x in [-2.3,0,2.3]:box('ceilingLight',[x,3.31,-2],[1.5,.04,.16],'#fff0ca',emissive=3)
# vending machine left outside
box('vending',[-4.12,1.25,-.1],[.7,1.85,.83],'#5ea8ad')
box('vendingLit',[-4.12,1.46,.325],[.57,1.1,.02],'#ddf2de',emissive=.5)
for y in [1.16,1.47,1.78]:
 for x in [-4.3,-4.1,-3.92]:box('can',[x,y,.35],[.11,.19,.03],random.choice(colors))
box('vendingSlot',[-4.12,.63,.33],[.4,.17,.03],'#193039')
box('doormat',[.2,.35,1.12],[2.9,.045,.66],'#3b666e')
# road details front = positive z
for x in [-4.5,-3.6,-2.7,-1.8,-.9,0,.9]:box('crosswalk',[x,.065,3.7],[.52,.016,1.8],'#d3d9d2')
for z in [-3.8,-2,-.2,1.6,3.4]:box('roadmark',[5.55,.065,z],[.10,.015,.85],'#d1d9d6')
for x in [-4,-2,0,2,4]:
 box('drain',[x,.33,1.94],[.65,.018,.2],'#304754')
 for k in range(7):box('drainSlot',[x-.27+k*.085,.341,1.94],[.025,.008,.18],'#111f30')
for z in [2.8,3.3,3.8,4.3]:box('railPost',[3.65,.62,z],[.06,1.1,.06],'#bbc7bf')
box('rail',[3.65,.97,3.55],[.065,.06,1.65],'#cbd4c8')
box('pole',[4.35,2.6,-3.75],[.12,5.2,.12],'#546e7c')
box('lampArm',[3.85,5.13,-3.75],[1.1,.08,.1],'#546e7c')
box('lamp',[3.35,5.06,-3.75],[.42,.08,.3],'#f3e7c5',emissive=3)
box('signalPole',[4.8,1.38,2.1],[.08,2.7,.08],'#5a7780')
box('signal',[4.8,2.6,2.1],[.28,.7,.22],'#172e42')
for y,c in [(2.82,'#dd7370'),(2.6,'#6c7259'),(2.38,'#81e4c0')]:box('signalLight',[4.8,y,2.225],[.11,.12,.025],c,emissive=1)
json.dump(o,open('dist/scene.json','w'))
