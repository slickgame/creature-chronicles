import {mkdirSync,copyFileSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='public/images/ui/nursery-scenic-a',input=process.argv[2];
if(!input)throw new Error('Pass the original generated PNG directory.');
const assets={
 'eggs/feline':'exec-718117f2-2cbc-407d-9604-d3e1033f77d1.png',
 'eggs/canine':'exec-6fe6254e-42b3-49ca-af9b-2d1eae6e89d5.png',
 'eggs/bovine':'exec-ca52e5dd-f545-4564-b964-2e575cfa7834.png',
 'eggs/lapine':'exec-7af98356-fca2-4f4e-9dc8-46692237f590.png',
 'eggs/equine':'exec-09d656e5-6e68-4189-a715-fe47dee72273.png',
 room:'exec-b72c2e3c-6ebd-4f35-b8df-69be83d8cb1a.png',
 cradle:'exec-aff332c3-f718-435c-8ba5-f385c36cd73f.png',
 'approved-concept':'exec-d919a5d2-705d-4ae2-b672-1eaa9f28cdfe.png'
};
mkdirSync(root+'/eggs',{recursive:true});mkdirSync(root+'/source',{recursive:true});
const manifest=[];
for(const [name,file]of Object.entries(assets)){
 const path=input+'/'+file,source=root+'/source/'+name.replaceAll('/','-')+'.png';copyFileSync(path,source);
 const image=sharp(path),metadata=await image.metadata();
 if((name.startsWith('eggs/')||name==='cradle')&&!metadata.hasAlpha)throw new Error(name+' must retain alpha');
 await image.resize({width:name==='room'||name==='approved-concept'?1680:name==='cradle'?1100:640,withoutEnlargement:true}).webp({quality:92,alphaQuality:100}).toFile(root+'/'+name+'.webp');
 manifest.push({name,source,sha256:createHash('sha256').update(readFileSync(path)).digest('hex'),alpha:metadata.hasAlpha});
}
writeFileSync(root+'/manifest.json',JSON.stringify({generator:'Built-in image generation; original PNGs preserved. WebP encoding only.',assets:manifest},null,2)+'\n');
console.log('Prepared '+manifest.length+' nursery assets.');
