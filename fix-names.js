const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/revetements.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Stone names
const stone = {
  "KN04": "Latte Marble", "MK13": "Imperial White", "MK14": "Griogio Marquina",
  "MK15": "Raw Travertine", "NE11": "Grey Scoria", "NE28": "Andesite",
  "NE29": "Multicolored", "NE31": "Statuary White", "NE32": "Statuary Gold",
  "NE70": "Onyx Gold", "NE71": "Lombarda Nero", "NE72": "Arabesque",
  "NF97": "Armani Gris", "NF98": "Armani Nero", "NF99": "Lombarda Grigio",
  "NG01": "Lombarda Bianco", "NG02": "Spotted Grey", "NG04": "Crema",
  "NG05": "Crema Scura", "NG31": "Polished White", "NH09": "Twilight Basalt",
  "NH10": "Terrazzo Mixed Blue", "NH11": "Light Etruscan Grey",
  "NH34": "Grey Raw Granite", "NH35": "Beige Raw Granite",
  "NH38": "Pietra di Cardoso Nero", "NH39": "Pietra di Cardoso Grigio",
  "NH40": "Terrazzo Grey", "NH41": "Terrazzo Beige", "NH42": "Lunar Basalt",
  "NH43": "Terrazzo Mixed Black", "NH45": "Tundra", "NH46": "Etruscan Grey",
  "NH47": "Opal Beige", "NH48": "Opal White", "U50": "Nero Marquina"
};

// Color names
const color = {
  "J3": "Ultra White", "J4": "Lacquered White", "J5": "Lacquered Black",
  "K1": "Black Mat", "K4": "Khaki", "K5": "Cement Grey", "K6": "Light Grey",
  "K7": "Cream Grey", "L2": "Chilli Red", "L3": "Tangerine",
  "M0": "Sun Flower Yellow", "M10": "Oat Milk", "M4": "Pale Blue",
  "M5": "Vibrant Green", "M6": "Steel Blue", "M7": "Sand Beach",
  "M8": "Bright Yellow", "M9": "Midnight Blue", "N3": "Porcelain",
  "NE53": "Peach", "NE54": "Clean Mint", "NE55": "Caffe Latte",
  "NE56": "Egg White", "NE77": "Eggshell", "NE78": "Cord",
  "NE79": "Elephant Grey", "NE80": "Graphite", "NE81": "Charcoal Black",
  "NE82": "Fossil Grey", "NE83": "Jade Green", "NF01": "Himalaya Salt",
  "NF02": "Antique Rose", "NF03": "Blush Rose", "NF04": "Bordeaux Red",
  "NF05": "Green Lawn", "NF06": "Blues", "NF07": "Pink Flamingo",
  "NF08": "Dark Grey", "NF09": "Cacao", "NF10": "Cloud Grey",
  "NF11": "Light Cloud Grey", "NF13": "Deep Green", "NF14": "Deep Blue",
  "NF15": "Cream White", "NF16": "Beige", "NH02": "White Flour",
  "NH05": "Pistachio Green", "NH06": "Rose Sand", "NH08": "Forest Green",
  "NH21": "Soft Green", "NH22": "Warm Gray", "NH23": "Pale Canary",
  "NH24": "Deep Ocean", "NH25": "Ice White", "NH26": "Grayed Beige",
  "NH27": "White Fog", "NH28": "Dry Branch", "NH29": "Bird Nest",
  "NH91": "Dark Grey Stripes", "NH92": "Light Grey Stripes",
  "NH93": "Off White Stripes", "O4": "Turquoise Blue", "O6": "Azure Blue",
  "O8": "Indigo Blue", "RM01": "Linen White", "RM02": "Pearl Grey",
  "RM03": "Lead Grey", "RM04": "Brown Chocolate", "RM06": "Anthracite Grey",
  "RM07": "Iced Blue", "RM08": "Limoncello", "RM09": "Ocean Blue",
  "RM10": "Delicate White", "RM11": "Silk White", "RM12": "Marshmallow",
  "RM13": "Alabaster", "RM14": "Mushroom", "RM15": "Lilac Blue",
  "RM16": "Honey Mustard", "RM19": "Olive Green", "RM20": "Sage Green",
  "RM21": "Army Green", "RM23": "Royal Blue", "RM25": "Pink Sand",
  "RM26": "Creamy White", "RM27": "Lunar Surface", "RM28": "Asphalt Grey",
  "RM29": "Onyx", "RM30": "Pastel Olive Green"
};

// Concrete + Metal + Textile + Glitter names
const other = {
  "NE24": "Raw Grey", "NE25": "Raw Taupe", "NE26": "Raw Dark",
  "NH12": "Terracotta Stucco", "NH13": "Storm Cloud Stucco",
  "NH14": "Ivory Glow Stucco", "NH33": "Off White Cement",
  "NH49": "Snowflake Stucco", "NH50": "Cashmere Stucco",
  "NH51": "White Stucco", "NH52": "Silver Mist Stucco",
  "NH53": "Cashmere Glow Stucco", "NH54": "Grey Cement",
  "U19": "Cement Grey", "U20": "Cement Dark", "U21": "Cement Taupe",
  "W7": "Red Brick",
  "AL07": "Gold Black", "AL09": "Gold Antique", "AU01": "Aurora",
  "AU02": "Aurora stripes", "KI01": "Chromed Metal", "ND01": "Silver Blue",
  "ND02": "Stripes Gold", "ND03": "Stripes Light Silver",
  "ND04": "Stripes Medium Silver", "ND05": "Stripes Dark Silver",
  "ND07": "Dots Anthracite", "NE47": "Soft Gold", "NE48": "Dark Copper",
  "NE49": "Dark Silver", "NE51": "Champagne Silver",
  "NG28": "Golden Dark Brown", "NG29": "Golden Light Brown",
  "NH20": "Roseate", "NH36": "Bronze Patina", "NH37": "Anthracite Patina",
  "NH60": "Copper", "NH61": "Silvered Glow", "NH62": "Bronze Mat",
  "NH63": "Striped Silver", "Q1": "Mat Aluminium", "Q2": "Hard Silver",
  "Q3": "Hard Gold", "Q50": "Hard Graphite", "U10": "Black Iron",
  "W6": "Corten", "Z2": "Black Laser",
  "AL11": "Silver Metal Weaving", "AL13": "Gold Metal Weaving",
  "AL15": "Yellow Gold", "AL17": "Sand Gold", "MA12": "White Warp",
  "MA16": "White Waves", "MK18": "Beige Waves", "NE13": "Shimmery Gold",
  "NE37": "Silver & Brown Lined", "NE38": "Silver And Grey Lined",
  "NE40": "Truffle", "NE41": "Grigio", "NE42": "Cashmere",
  "NE43": "Cream", "NE73": "Mika Dark", "NE74": "Mika Light",
  "NG07": "Woven Beige", "NG09": "Woven Brown",
  "NG10": "Mini Chevron Grey", "NG11": "Mini Chevron Beige",
  "NG20": "Edgy Cream", "NG23": "Lozenge White",
  "NH17": "Ground Beige Linen", "NH18": "Natural Linen",
  "NH19": "Beige Linen", "NH59": "Light Brown Linen",
  "ST02": "Might Beige Mesh", "T12": "Mocha Mesh",
  "X51": "Coal Black", "X52": "Togo white", "A1": "Brown Wenge",
  "LP01": "Cognac", "LP02": "Ash", "LP03": "Indigo", "LP04": "Graphite",
  "LP05": "Toffee", "LP06": "Pearl grey", "LP07": "Ivory",
  "LP08": "Blush rose", "LP09": "Eclipse", "LP10": "Lagoon",
  "J7": "Sparkling White", "R10": "Copper Disco",
  "R11": "Midnight Blue Disco", "R12": "Green Disco", "R13": "Pink Disco",
  "R14": "Green Mixed", "R15": "Navy Blue", "R16": "Mocha",
  "R17": "Butter", "R18": "Salmon", "R19": "Champagne",
  "R5": "Gold Disco", "R6": "Yellow Disco", "R7": "Silver Disco",
  "R8": "Red Disco", "R9": "Black Disco"
};

const allNames = { ...stone, ...color, ...other };

let updated = 0;
let notFound = 0;
data.forEach(item => {
  if (allNames[item.id]) {
    if (item.nom === item.id) updated++;
    item.nom = allNames[item.id];
  } else if (item.nom === item.id) {
    notFound++;
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Updated names:', updated);
console.log('Still missing (wood, waiting for agent):', notFound);
console.log('Total items:', data.length);

// Verify
const stillMissing = data.filter(d => d.nom === d.id);
console.log('Refs still with ID as name:', stillMissing.length);
