// Arrange actual runtime screenshots; no generated UI or replacement character art.
import sharp from 'sharp';
const dir='docs/validation/breeding-polish';
async function board(name,cells,width,height,columns,cellWidth,cellHeight){const header=60;const layers=[];for(let i=0;i<cells.length;i++){const [file,label,crop]=cells[i];let src=sharp(`${dir}/${file}.jpg`);if(crop)src=src.extract(crop);const image=await src.resize(cellWidth,cellHeight-36,{fit:'contain',background:'#10252b'}).jpeg({quality:92}).toBuffer();const x=(i%columns)*cellWidth,y=header+Math.floor(i/columns)*cellHeight;layers.push({input:image,left:x,top:y+36});layers.push({input:Buffer.from(`<svg width="${cellWidth}" height="36"><rect width="100%" height="100%" fill="#10252b"/><text x="16" y="25" font-size="21" font-family="Georgia" fill="#f3dfb1">${label}</text></svg>`),left:x,top:y});}layers.push({input:Buffer.from(`<svg width="${width}" height="${header}"><rect width="100%" height="100%" fill="#10252b"/><text x="20" y="36" font-size="27" font-family="Georgia" fill="#f3dfb1">Actual in-game screenshots · isolated test save</text></svg>`),left:0,top:0});await sharp({create:{width,height:height+header,channels:3,background:'#10252b'}}).composite(layers).jpeg({quality:94}).toFile(`${dir}/${name}.jpg`);}
await board('desktop-review-a',[
 ['inspect-overview-1440-900','1 · Inspect'],['change-1440-900','2 · Change Parent'],['support-1440-900','3 · Support Items'],['inheritance-stats-1440-900','4 · Inheritance']
],1600,1072,2,800,536);
await board('desktop-review-b',[
 ['pair-1440-900','5 · Pair Options',{left:455,top:0,width:530,height:900}],['chance-1440-900','6 · Chance Details',{left:435,top:0,width:570,height:900}],['review-1440-900','7 · Review Attempt',{left:435,top:0,width:570,height:900}],['ledger-attempts-1440-900','8 · Breeding Ledger',{left:460,top:0,width:520,height:900}]
],2200,936,4,550,936);
await board('phone-review',[
 ['change-selected-parent-390-844','Change Parent'],['inheritance-stats-390-844','Inheritance'],['review-390-844','Review Attempt'],['ledger-attempts-390-844','Breeding Ledger']
],1560,880,4,390,880);
console.log('Built three review sheets from actual runtime captures.');
