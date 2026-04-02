const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/data/revetements.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const wood1 = {
  "A4": "Orangey Wenge","AA01": "Beige Oak","AA02": "Rustic Oak","AA04": "Rich Oak",
  "AA05": "Honey Oak","AA06": "Smoky Oak","AA08": "Brown Orangey Oak",
  "AA09": "Gravel Grey Oak","AA12": "Brown Line Oak","AA14": "Original Oak",
  "AA15": "Grey Line Oak","AA17": "Beige Line Oak","AB02": "Creamy",
  "AB03": "Khaki Oak","AB05": "Blue Ebony","AB06": "Turquoise","AB07": "Dark Blue",
  "AC01": "White Lined","AC04": "Plain White","AF02": "Beige Pine",
  "AF03": "Line Beige Pine","AF05": "Orangey Pine","AF06": "Brown Pine",
  "AF07": "Pale Pine","AF08": "Walnut Oak","AF09": "Yellow Pine",
  "AF10": "Hazelnut Cream","AG01": "White Cream Ash","AG02": "Yellow Ash",
  "AG07": "White Line Ash","AG10": "Honey Teak","AG11": "Beige Ash",
  "AG13": "Pale Oak","AG14": "Cream Golden Oak","AG15": "Golden Oak",
  "AG16": "Cream Golden Ash","AG17": "Golden Ash","AG18": "Line Pine",
  "AG20": "Cream Pine","AL08": "Yellow Bao","AL10": "Beige Bao",
  "AL12": "Walnut Bao","AL14": "Traditional Oak","AL23": "Beige Cherry",
  "AL24": "Bleach Ash","AL25": "Brown Walnut","AL26": "Beige Brown Ash",
  "AL28": "Bleach Oak","AL29": "Pale White Oak","AL30": "Sand Cherry",
  "AT02": "Brown Cherry","AT03": "Beige Brown Oak","AT04": "Orangey Teak",
  "AT05": "Honey Walnut","AT06": "Black Sheen Teak","AZ07": "Walnut Ash",
  "B1": "Honey Maple","B3": "Natural Maple","B4": "Weathered Oak",
  "B5": "Golden Beech","B50": "Crème","B6": "Cashew Beech",
  "B8": "Heritage Oak","B9": "Roast Coffee","CT01": "Traditional Maple",
  "CT02": "Aged Walnut","CT05": "Nut Honey","CT06": "Nutmeg",
  "CT08": "Andean Walnut","CT09": "Maple Syrup","CT10": "Honey Limba",
  "CT100": "White Ash","CT101": "Waved Oak","CT102": "Pale Sheen Cedar",
  "CT11": "Honey Pine","CT13": "Pale Grey Maple","CT14": "Aged Pale Teak",
  "CT15": "Almond Teak","CT16": "Chess Oak","CT17": "Cream Ash",
  "CT18": "White Birch","CT19": "Gold Pale Birch","CT20": "Gold Beige Birch",
  "CT21": "Cream Orangey Birch","CT22": "Honey Birch",
  "CT24": "Brown Orangey Birch","CT25": "Aged Birch","CT26": "Bordeaux Birch",
  "CT28": "Beige Birch","CT29": "Brown Birch","CT33": "Basic Birch",
  "CT35": "Aged Golden Pine","CT36": "Pecan Acacia","CT37": "Cream Brown Ash",
  "CT41": "Yellow Noce","CT42": "Sheen Noce","CT43": "Orangey Noce",
  "CT44": "Rosewood","CT45": "Beige Palm Tree","CT46": "Beige Sycamore",
  "CT48": "Yellow Lined Pine","CT53": "Deep Beige Cherry","CT54": "Honey Fir",
  "CT55": "Deep Brown Oak","CT56": "Brown Palm Tree","CT58": "Faded Grey",
  "CT59": "Deep Classic Brown","CT60": "Brown Fir","CT61": "Deep Brown Ebony",
  "CT62": "Deep Beige Oak","CT66": "Rich Brown Ebony","CT68": "Brown Ebony",
  "CT69": "Cream Brown","CT70": "Yellow Sycamore","CT71": "Classic Honey Oak",
  "CT74": "Classic White Oak","CT75": "Basic Honey Oak","CT76": "Whitewashed Oak",
  "CT77": "Oak Barrel","CT78": "Basic Yellow Oak","CT79": "Pale Grey Oak",
  "CT80": "Antic Walnut","CT82": "Bumpy Oak","CT84": "Birch plywood",
  "CT87": "Honey Noce","CT88": "Brown Acacia","CT89": "Red Orangey Oak",
  "CT90": "White Grey Oak","CT91": "Vanilla Oak","CT92": "Sand Oak",
  "CT93": "Beige Acacia","CT94": "Deep Beige Ash","CT95": "Ivory Ash",
  "CT96": "Lined Almond Ash","CT97": "Almond Palm Tree","CT98": "Honey Ash",
  "CT99": "Sheen Honey Oak","D1": "Classic Walnut","D4": "Zebrano",
  "E4": "English Walnut","E50": "Brownish Oak","F4": "Bucolic Oak",
  "F5": "Structured Oak","F6": "Western Oak"
};

const wood2 = {
  "F7": "Castagno Caducci","G0": "Line Oak","G6": "Patina",
  "H10": "Slats Patina","H4": "Hardwood Panel","H5": "Silverblack",
  "H50": "Chevron Oak","I10": "Mario Grey Oak","I14": "Legno",
  "I9": "Soft Pale Oak","J14": "Rich White","J17": "Off White",
  "J18": "Anthracite Grey","J2": "Rich Black","MA10": "Pearl",
  "MA14": "Black Night","NE45": "Cool Mint","NE46": "Tan Grey",
  "NE57": "Sandy","NE61": "Cream Grey Oak","NE62": "Brown Hazelwood",
  "NE63": "Pale Hazelwood","NE64": "Beige Hazelwood",
  "NE65": "Brown Lined Hazelwood","NE66": "Brown Lined Cream",
  "NE68": "Freijo Laurel","NF17": "Crispy White","NF18": "Crispy Light Grey",
  "NF19": "Crispy Beige","NF20": "Crispy Grey","NF21": "Ecru",
  "NF22": "Sable Grey","NF23": "Dove Grey","NF24": "Winter Breeze",
  "NF25": "Twilight","NF26": "Noir","NF27": "American Oak",
  "NF28": "Greyish Oak","NF29": "Cream Oak","NF30": "Fawn Oak",
  "NF31": "Butter Oak","NF32": "Almond Oak","NF33": "Brownie Oak",
  "NF34": "Tan Oak","NF35": "Praliné Oak","NF36": "Biscuit Oak",
  "NF37": "Gianduia Oak","NF38": "Straw Oak","NF39": "Red Oak",
  "NF40": "Classic Oak","NF41": "Cinnamon Oak","NF42": "Bleached Oak",
  "NF43": "Bleached Bronze Oak","NF44": "Bleached Grey Oak",
  "NF45": "Bleached Golden Oak","NF46": "Rich Eiche","NF47": "Caramel Eiche",
  "NF48": "Yellow Eiche","NF49": "Brown Eiche","NF50": "Castagno Eiche",
  "NF51": "Red Eiche","NF53": "Ivory Oak","NF54": "Metropolis Oak",
  "NF55": "Brown Teak","NF56": "Black Teak","NF57": "Beige Faded Oak",
  "NF58": "Faded Oak","NF59": "Brown Faded Oak","NF60": "Black Faded Oak",
  "NF61": "Honey Comb","NF62": "Hay Ash","NF63": "Nut Ash",
  "NF64": "White Sycamore","NF65": "Hard Gravel Oak","NF66": "Hard Oak",
  "NF70": "Toasted Oak","NF71": "Tulip Dark","NF72": "Beige Beech",
  "NF73": "Desert Rose","NF74": "Grey Beech","NF76": "Blond Beech",
  "NF77": "Almond Beech","NF78": "Oaky","NF79": "Honey Beech",
  "NF83": "Driftwood Brown","NF85": "Clean Oak","NF86": "Pale Smooth Oak",
  "NF87": "Pampas Oak","NF88": "Smooth Oak","NF89": "Blond Ash",
  "NF90": "Sand Ash","NF91": "Faded Ash","NF95": "Bronzed Ash",
  "NH15": "Smokey Green","NH16": "Foggy Forest","NH55": "Mocha Mist",
  "NH56": "Vanilla Cream","NH57": "Charcoal Blue","NH58": "Midnight Grey",
  "NH64": "Pale Oak","NH65": "Ashen Oak","NH66": "Wheat Oak",
  "NH67": "Blond Oak","NH68": "Royal Walnut","NH69": "Chocolate Walnut",
  "NH70": "Timber Split","NH71": "Split Wood","NH72": "Timeless Walnut",
  "NH73": "Warm Walnut","NH74": "Eucalyptus Grove","NH75": "Eucalyptus",
  "NH76": "Rich Walnut","NH77": "Honey Walnut","NH78": "Zambezi Teak",
  "NH79": "African Teak","NH80": "Sand Oak","NH81": "Dyed Oak",
  "NH83": "Golden Elm","NH84": "Pale Elm","NH85": "Pecan Pine",
  "NH86": "Almond Pine","WI01": "Small-grain cork","WI02": "Large-grain cork"
};

const allWood = { ...wood1, ...wood2 };

let updated = 0;
data.forEach(item => {
  if (allWood[item.id] && item.nom === item.id) {
    item.nom = allWood[item.id];
    updated++;
  }
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

const stillMissing = data.filter(d => d.nom === d.id);
console.log('Wood names updated:', updated);
console.log('Still missing real name:', stillMissing.length);
if (stillMissing.length > 0) {
  console.log('Missing refs:', stillMissing.map(d => d.id).join(', '));
}
