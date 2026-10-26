from PIL import Image, ImageOps, ImageEnhance
import numpy as np
from pathlib import Path
import math
ROOT=Path(__file__).resolve().parent
src=Image.open(ROOT/'assets/branding/vira_original_inalterada.jpg').convert('RGB')
a=np.asarray(src).astype(np.float32)
# Remove somente o fundo preto; conserva os pixels originais da marca nas zonas opacas.
mx=a.max(axis=2)
alpha=np.clip((mx-3.0)/24.0,0.0,1.0)
# Atenua ruido JPEG fora da arte.
alpha[mx<5]=0
arr=np.zeros((a.shape[0],a.shape[1],4),dtype=np.uint8)
arr[:,:,:3]=a.astype(np.uint8)
arr[:,:,3]=np.rint(alpha*255).astype(np.uint8)
img=Image.fromarray(arr,'RGBA')
img.save(ROOT/'assets/branding/vira_logo_transparente.png', optimize=True)
# Particionamento não altera pixels da logo. Permite motion graphics por camadas.
sections={'simbolo':(0,0,1536,880),'nome':(0,880,1536,1170),'slogan':(0,1170,1536,1536)}
for name,box in sections.items():
  layer=Image.new('RGBA',img.size,(0,0,0,0));layer.paste(img.crop(box),box[:2]);
  layer.save(ROOT/f'assets/branding/vira_{name}.png',optimize=True)
# Tela 800x800. Camadas sobrepostas em coordenadas originais, animadas sem retocar a logo.
W=800; H=800
original_bbox=(162,165,1362,1325)
clip=tuple(original_bbox)
base_layers={name: Image.open(ROOT/f'assets/branding/vira_{name}.png').crop(clip).resize((W,H),Image.Resampling.LANCZOS) for name in sections}
N=72; FPS=24
frames=[]
def smooth(x):
 x=max(0.,min(1.,x));return x*x*(3-2*x)
def paste_anim(canvas,img,opacity=1.,scale=1.,dy=0):
 if opacity<=0: return
 w=int(W*scale);h=int(H*scale)
 tile=img.resize((w,h), Image.Resampling.BICUBIC) if abs(scale-1)>1e-5 else img
 if opacity<1:
  tile=tile.copy();tile.putalpha(tile.getchannel('A').point(lambda p:round(p*opacity)))
 x=(W-w)//2; y=(H-h)//2+int(dy)
 canvas.alpha_composite(tile,(x,y))
for i in range(N):
 t=i/FPS
 canvas=Image.new('RGBA',(W,H),(0,0,0,0))
 p=smooth((t-.08)/.75)
 paste_anim(canvas,base_layers['simbolo'],p,0.88+.12*p,30*(1-p))
 q=smooth((t-.70)/.65)
 paste_anim(canvas,base_layers['nome'],q,1.0,38*(1-q))
 r=smooth((t-1.35)/.55)
 paste_anim(canvas,base_layers['slogan'],r,1.0,12*(1-r))
 frames.append(canvas)
# Ultimo frame = logo inteira, intacta na composicao, sem transparencia no fundo.
frames[-1]=Image.alpha_composite(Image.alpha_composite(base_layers['simbolo'].copy(),base_layers['nome']),base_layers['slogan'])
frames[-1].save(ROOT/'assets/branding/vira_intro_final_frame.png',optimize=True)
# WebP transparente (para visualizacao rapida) e APNG sem fundo (compatibilidade ampla).
frames[0].save(ROOT/'assets/branding/vira_intro_transparente.webp',format='WEBP',save_all=True,append_images=frames[1:],duration=int(1000/FPS),loop=0,lossless=True,method=3)
frames[0].save(ROOT/'assets/branding/vira_intro_transparente.apng',format='PNG',save_all=True,append_images=frames[1:],duration=int(1000/FPS),loop=0,optimize=False,disposal=2,blend=1)
# Preview em fundo preto, apenas para conferencia. Arquivos mestres anteriores transparentes.
preview=Image.new('RGB',(800,800),'#060609');preview.paste(frames[-1],mask=frames[-1].getchannel('A'))
preview.save(ROOT/'assets/branding/vira_previa_fundo_escuro.png')
print('Gerados:',*[str(p.relative_to(ROOT))+' '+str(p.stat().st_size//1024)+'KB' for p in (ROOT/'assets/branding').glob('*')],sep='\n')
