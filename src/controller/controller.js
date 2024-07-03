const crate = require('../data/crate.json');
const floater = require('../data/floater.json');
const barrier = require('../data/barrier.json');
const blocking = require('../data/blocking.json');
const materials = require('../data/material.json');

exports.getTotalCost = async (req, res) => {
    try {
        const { ilength, iwidth, iheight } = getLWHfromReqBody(req.body);
        const ift3 = calculateFt3(ilength, iwidth, iheight);
        const inputDimensions = { ilength, iwidth, iheight, ift3 };

        

        const complexityMap = extractFeatureMap(req.body.complexity);
       // ////console.log(complexityMap, 'complexityMap');

        const componentsMap = extractComponentsMap(req.body.components);
        ////console.log(componentsMap, 'componentsMap');

        const component = "Crate";

            const componentObject = getObjectByKey(component, crate);
            const basicObject = { componentObject, materials };
            const objectMap = getBasicStructuredList(basicObject);

            const { olength, owidth, oheight } = getOLWHfromData(ilength, iwidth, iheight, objectMap);
            const oft3 = calculateFt3(olength, owidth, oheight);
            const outputDimensions = { olength, owidth, oheight, oft3 };

            const listAfterCalculatingWidth = calculateWidth(objectMap, inputDimensions, outputDimensions);
            const listAfterCalculatingLength = calculateLength(listAfterCalculatingWidth, inputDimensions, outputDimensions);
            const listAfterCalculatingQuantity = calculateQuantity(listAfterCalculatingLength, inputDimensions, outputDimensions);
            const listAfterCalculatingQtyUom = calculateQtyUomList(listAfterCalculatingQuantity, inputDimensions, outputDimensions);
            const listAfterCalculatingCost = calculateCost(listAfterCalculatingQtyUom, inputDimensions, outputDimensions);




        res.status(200).json({
            inputDimensions: inputDimensions,
            outputDimensions: outputDimensions,
            listAfterCalculatingCost: listAfterCalculatingCost
        });
    } catch (error) {
        console.error('Error fetching Total Cost:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'An error occurred while fetching Total Cost.',
            error: error.message
        });
    }
};



function getLWHfromReqBody(event) {
    const { length, width, height } = event.dimensions;

    // Ensure dimensions are provided and are valid numbers
    if (!length || !width || !height || isNaN(length) || isNaN(width) || isNaN(height)) {
        throw new Error('Invalid dimensions provided. Please provide valid length, width, and height.');
    }

    const ilength = length;
    const iwidth = width;
    const iheight = height;

    return { ilength, iwidth, iheight };
}

function getOLWHfromData(ilength, iwidth, iheight, objectMap) {
    // Ensure dimensions are provided and are valid numbers
    if (!ilength || !iwidth || !iheight || isNaN(ilength) || isNaN(iwidth) || isNaN(iheight)) {
        throw new Error('Invalid dimensions provided. Please provide valid ilength, iwidth, and iheight.');
    }
    const il1 = findItemsInMaterialList('Thickness', 'Crate', 'End Panels', 'PLY, 3/8', objectMap);
    const il2 = findItemsInMaterialList('Thickness', 'Crate', 'Cleat, Thru-Edge', 'LBR, 1X4', objectMap);
    const iw1 = findItemsInMaterialList('Thickness', 'Crate', 'Side Panels', 'PLY, 3/8',objectMap);
    const iw2 = findItemsInMaterialList('Thickness', 'Crate', 'Cleat, Thru-Edge', 'LBR, 1X4', objectMap);
    const ih1 = findItemsInMaterialList('Thickness', 'Crate', 'Skid', 'LBR, 4X4', objectMap);
    const ih2 = findItemsInMaterialList('Thickness', 'Crate', 'Floorboard', 'LBR, 2X10', objectMap);
    const ih3 = findItemsInMaterialList('Thickness', 'Crate', 'Top Panel', 'PLY, 3/8', objectMap);
    const ih4 = findItemsInMaterialList('Thickness', 'Crate', 'Cleat, Thru-Edge', 'LBR, 1X4', objectMap);

    const olength = ilength + ((il1 + il2) * 2) ?? 0;
    const owidth = iwidth + ((iw1 + iw2) * 2) ?? 0;
    const oheight = (iheight + ih1 + ih2 + ih3 + ih4) ?? 0;

    return { olength, owidth, oheight };
}

function extractFeatureMap(features) {
    const featureMap = {};

    // Check if features is defined and is an array before iterating
    if (features && Array.isArray(features)) {
        features.forEach(feature => {
            featureMap[feature.title] = feature.isActive === 1; // Convert isActive to boolean
        });
    }

    return featureMap;
}

function extractComponentsMap(components) {
    const componentsMap = {};

    Object.keys(components).forEach(category => {
        components[category].forEach(component => {
            componentsMap[component.title] = component.isActive === 1; // Convert isActive to boolean
        });
    });

    return componentsMap;
}

function getObjectByKey(key, object) {
    //Get the entire material object based on Material
    //Get the entire Crate or any other component from the entire list of components
    return object[key] || null;
  }

function getObjectByMaterial(material, componentObject) {
    const foundObject = componentObject.find(obj => obj.Material === material);
    return foundObject || null;
  }

  function calculateFt3(length, width, height) {
    const ft3 = 0;
    if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
       return parseFloat(((length * width * height) / 1728).toFixed(2));
    }
    return ft3;
}

/*function calculateQtyUom(quantity, length, nomW, nomT, width, uom, scrap) {
    let qtyUom = 0;
    if (uom === 'BF') {
        qtyUom = (quantity * length * nomW * nomT / 144) * (1 + scrap);
    } else if (uom === 'SF') {
        qtyUom = (quantity * length * width / 144) * (1 + scrap);
    } else if (uom === 'EA') {
        qtyUom = quantity;
    }
    return parseFloat(qtyUom.toFixed(2));
}*/

function calculateQtyUomList(listAfterCalculatingQuantity) {
    listAfterCalculatingQuantity.forEach(item => {
        let qtyUom = 0;
        if (item.UOM === 'BF') {
            qtyUom = (item.Quantity * item.Length * item.NomW * item.NomT / 144) * (1 + item.Scrap);
        } else if (item.UOM === 'SF') {
            qtyUom = (item.Quantity * item.Length * item.Width / 144) * (1 + item.Scrap);
        } else if (item.UOM === 'EA') {
            qtyUom = item.Quantity;
        }
        item.qtyUom = parseFloat(qtyUom.toFixed(2));
    });

    return listAfterCalculatingQuantity;
}

function calculateCost(listAfterCalculatingQtyUom) {
    listAfterCalculatingQtyUom.forEach(item => {
        let totalCost = 0;
        totalCost = item.qtyUom * item.perUom ?? 0;
        item.totalCost = parseFloat(totalCost.toFixed(2));
    });

    return listAfterCalculatingQtyUom;
}




function getBasicStructuredList(obj) {
    let priceObject = [];
    try {
        const componentObj = obj.componentObject;
        const materialObjectMap = obj.materials;        
        componentObj.forEach(component => {
            const materialKey = component.Material;
            const materialObject = materialObjectMap[materialKey];

            if (materialObject) {
                let newObject = {
                    Title: component.Title,
                    Description: component.Description,
                    Material: component.Material,
                    Thickness: materialObject.ActT || 0,
                    Scrap: materialObject.SCRAP || 0,
                    UOM: component.UOM,
                    perUom: materialObject.UNIT_PRICE || 0,
                    NomW: materialObject.NomW || 0,
                    NomT: materialObject.NomT || 0,
                    ActW: materialObject.ActW || 0
                };

                // Conditionally assign Width if component.Width is "MatList"
                if (component.Width === "MatList") {
                    newObject.Width = materialObject.ActW;
                }else if(component.Width === 0.0){
                    newObject.Width = 0;
                }else{
                    newObject.Width = component.Width;
                }

                if(component.Length === 0.0){
                    newObject.Length = 0;
                }else{
                    newObject.Length = component.Length;
                }

                newObject.Quantity = component.Quantity;

                priceObject.push(newObject);
            }
        });
    } catch (error) {
        console.error('Error in getObjectsList:', error);
    }
    return priceObject;
}

const findItemsInMaterialList = (part, title, description, material, basicList) => {
    console.log(part, 'PART');
    console.log(title, 'TITLE');
    console.log(description, 'DESCRIPTION');
    console.log(material, 'MATERIAL');
    const item = basicList.find(component => 
        component.Title === title && 
        component.Description === description && 
        component.Material === material
    );
    return item ? item[part] : 0;
};

const calculateWidth = (objectMap, inputDimensions, outputDimensions) => {
    const { ilength, iwidth, iheight, ift3 } = inputDimensions;
    const { olength, owidth, oheight, oft3 } = outputDimensions;

    objectMap.forEach(item => {
        if (typeof item.Width === 'string') {
            let formula = item.Width
                .replace(/ilength/g, ilength)
                .replace(/iwidth/g, iwidth)
                .replace(/iheight/g, iheight)
                .replace(/ift3/g, ift3)
                .replace(/olength/g, olength)
                .replace(/owidth/g, owidth)
                .replace(/oheight/g, oheight)
                .replace(/oft3/g, oft3);
            formula = formula.replace(/findItemsInMaterialList\(([^)]+)\)/g, (_, args) => {
                const parsedArgs = args.match(/'([^']+)'|"([^"]+)"|([^,]+)/g).map(arg => arg.trim().replace(/^['"]|['"]$/g, ''));
                const part = parsedArgs[0];
                const title = parsedArgs[1];
                const description = parsedArgs[2];
                const material = parsedArgs.slice(3,5).join(', ').trim();
                const result = findItemsInMaterialList(part, title, description, material, objectMap);
                return result;
            });
            try {
                const calculate = new Function('objectMap', `return ${formula}`);
                item.Width = calculate(objectMap);
            } catch (e) {
                console.error(`Error evaluating formula for item: ${item.Title} ${item.Description} ${item.Material}`, e);
                item.Width = null; // or handle the error as needed
            }
        }
    });

    return objectMap;
};

const calculateLength = (objectMap, inputDimensions, outputDimensions) => {
    const { ilength, iwidth, iheight, ift3 } = inputDimensions;
    const { olength, owidth, oheight, oft3 } = outputDimensions;

    objectMap.forEach(item => {
        if (typeof item.Length === 'string') {
            // Evaluate the formula
            let formula = item.Length
                .replace(/ilength/g, ilength)
                .replace(/iwidth/g, iwidth)
                .replace(/iheight/g, iheight)
                .replace(/ift3/g, ift3)
                .replace(/olength/g, olength)
                .replace(/owidth/g, owidth)
                .replace(/oheight/g, oheight)
                .replace(/oft3/g, oft3);

            // Debug: Log the intermediate formula before evaluation
            //console.log(`Original formula for length of ${item.Description}: ${item.Length}`);
            //console.log(`Replaced formula: ${formula}`);

            // Evaluate dynamic findItemsInMaterialList calls within the formula
            formula = formula.replace(/findItemsInMaterialList\(([^)]+)\)/g, (_, args) => {
                // Split and trim the args considering commas within the material string
                const parsedArgs = args.match(/'([^']+)'|"([^"]+)"|([^,]+)/g).map(arg => arg.trim().replace(/^['"]|['"]$/g, ''));

                let part = parsedArgs[0];
                let title = parsedArgs[1];
                let description, material;

                // Check if description contains commas
                if (parsedArgs.length >= 5 && parsedArgs[2].includes('Cleat')) {
                    description = parsedArgs.slice(2, 4).join(', ').trim();
                    material = parsedArgs.slice(4,6).join(', ').trim();
                } else {
                    description = parsedArgs[2];
                    material = parsedArgs.slice(3,5).join(', ').trim();
                }

                //console.log('Part:', part, ', Title:', title, ', Desc:', description, ', Material:', material);
                const result = findItemsInMaterialList(part, title, description, material, objectMap);
                //console.log(`Evaluating findItemsInMaterialList(${part}, ${title}, ${description}, ${material}): ${result}`);
                return result;
            });

            // Debug: Log the final formula to be evaluated
            console.log(`Final formula to evaluate: ${formula}`);

            // Calculate the final length
            try {
                // Use Function constructor to create a function with objectMap in its scope
                const calculate = new Function('objectMap', `return ${formula}`);
                item.Length = calculate(objectMap);
                console.log('Length : ',item.Length)
            } catch (e) {
                console.error(`Error evaluating formula for item: ${item.Title} ${item.Description} ${item.Material}`, e);
                item.Length = null; // or handle the error as needed
            }
        }
    });

    return objectMap;
};

const calculateQuantity = (objectMap, inputDimensions, outputDimensions) => {
    const { ilength, iwidth, iheight, ift3 } = inputDimensions;
    const { olength, owidth, oheight, oft3 } = outputDimensions;

    return objectMap.map(item => {
        if (typeof item.Quantity === 'string') {
            let formula = item.Quantity;

            // Replace variables in formula with actual values
            formula = formula
                .replace(/ilength/g, ilength)
                .replace(/iwidth/g, iwidth)
                .replace(/iheight/g, iheight)
                .replace(/ift3/g, ift3)
                .replace(/olength/g, olength)
                .replace(/owidth/g, owidth)
                .replace(/oheight/g, oheight)
                .replace(/oft3/g, oft3);

            // Evaluate dynamic findItemsInMaterialList calls within the formula
            formula = formula.replace(/findItemsInMaterialList\(([^)]+)\)/g, (_, args) => {
                // Split and trim the args considering commas within the material string
                const parsedArgs = args.match(/'([^']+)'|"([^"]+)"|([^,]+)/g).map(arg => arg.trim().replace(/^['"]|['"]$/g, ''));

                let part = parsedArgs[0];
                let title = parsedArgs[1];
                let description, material;

                // Check if description contains commas
                if (parsedArgs.length >= 5 && parsedArgs[2].includes('Cleat')) {
                    description = parsedArgs.slice(2, 4).join(', ').trim();
                    material = parsedArgs.slice(4, 6).join(', ').trim();
                } else {
                    description = parsedArgs[2];
                    material = parsedArgs.slice(3, 5).join(', ').trim();
                }

                const result = findItemsInMaterialList(part, title, description, material, objectMap);
                return result;
            });

            try {
                // Use Function constructor to create a function with objectMap in its scope
                const calculate = new Function('objectMap', `return ${formula}`);
                item.Quantity = calculate(objectMap);
            } catch (e) {
                console.error(`Error evaluating formula for Quantity of item: ${item.Title} ${item.Description} ${item.Material}`, e);
                item.Quantity = null; // or handle the error as needed
            }
        }

        return item;
    });
};

function isInt(value) {
    // Check if the value is a number and it is an integer
    return typeof value === 'number' && Number.isInteger(value);
}
